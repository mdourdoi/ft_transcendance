import { Injectable, Logger } from '@nestjs/common';
import { GameService } from '../game/game.service.js';
import { QueueMode } from '../generated/prisma/client.js';
import { MatchesService } from '../matches/matches.service.js';
import { QueueService } from './queue.service.js';
import { QueueEntry } from './types/queue-entry.interface.js';

const BASE_RATING_RANGE = 50;
const RATING_RANGE_PER_SECOND = 20;
const MAX_RATING_RANGE = 1000;

export type SocketProbe = (socketId: string) => Promise<boolean>;

export interface FormedMatch {
  matchId: number;
  mode: QueueMode;
  players: [QueueEntry, QueueEntry];
}

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly matchesService: MatchesService,
    private readonly gameService: GameService,
  ) {}

  async tick(isConnected: SocketProbe): Promise<FormedMatch[]> {
    const [unranked, ranked] = await Promise.all([
      this.matchUnranked(isConnected),
      this.matchRanked(isConnected),
    ]);
    return [...unranked, ...ranked];
  }

  private async withLock(
    mode: QueueMode,
    fn: () => Promise<FormedMatch[]>,
  ): Promise<FormedMatch[]> {
    const token = await this.queueService.acquireMatchmakingLock(mode);
    if (!token) {
      return [];
    }
    try {
      return await fn();
    } finally {
      await this.queueService.releaseMatchmakingLock(mode, token);
    }
  }

  private matchUnranked(isConnected: SocketProbe): Promise<FormedMatch[]> {
    return this.withLock(QueueMode.UNRANKED, async () => {
      const entries = await this.loadEntries(
        QueueMode.UNRANKED,
        await this.queueService.getUnrankedQueue(),
      );

      const matches: FormedMatch[] = [];
      while (entries.length >= 2) {
        const playerA = entries.shift() as QueueEntry;
        const playerB = entries.shift() as QueueEntry;
        const match = await this.formMatch(
          QueueMode.UNRANKED,
          playerA,
          playerB,
          isConnected,
        );
        if (match) {
          matches.push(match);
        }
      }

      return matches;
    });
  }

  private matchRanked(isConnected: SocketProbe): Promise<FormedMatch[]> {
    return this.withLock(QueueMode.RANKED, async () => {
      const entries = await this.loadEntries(
        QueueMode.RANKED,
        await this.queueService.getRankedQueue(),
      );
      entries.sort((a, b) => a.joinedAt - b.joinedAt);

      const matchedUserIds = new Set<number>();
      const matches: FormedMatch[] = [];

      for (const player of entries) {
        if (matchedUserIds.has(player.userId)) {
          continue;
        }

        const opponent = this.findClosestOpponent(
          player,
          entries,
          matchedUserIds,
        );
        if (!opponent) {
          continue;
        }

        matchedUserIds.add(player.userId);
        matchedUserIds.add(opponent.userId);
        const match = await this.formMatch(
          QueueMode.RANKED,
          player,
          opponent,
          isConnected,
        );
        if (match) {
          matches.push(match);
        }
      }

      return matches;
    });
  }

  private findClosestOpponent(
    player: QueueEntry,
    candidates: QueueEntry[],
    matchedUserIds: Set<number>,
  ): QueueEntry | null {
    const waitSeconds = (Date.now() - player.joinedAt) / 1000;
    const range = Math.min(
      MAX_RATING_RANGE,
      BASE_RATING_RANGE + waitSeconds * RATING_RANGE_PER_SECOND,
    );

    let closest: QueueEntry | null = null;
    let closestDiff = Infinity;

    for (const candidate of candidates) {
      if (
        candidate.userId === player.userId ||
        matchedUserIds.has(candidate.userId)
      ) {
        continue;
      }
      const diff = Math.abs(candidate.rating - player.rating);
      if (diff <= range && diff < closestDiff) {
        closest = candidate;
        closestDiff = diff;
      }
    }

    return closest;
  }

  private async loadEntries(
    mode: QueueMode,
    userIds: number[],
  ): Promise<QueueEntry[]> {
    const entries = await Promise.all(
      userIds.map((userId) => this.queueService.getEntry(mode, userId)),
    );
    return entries.filter((entry): entry is QueueEntry => entry !== null);
  }

  private async formMatch(
    mode: QueueMode,
    playerA: QueueEntry,
    playerB: QueueEntry,
    isConnected: SocketProbe,
  ): Promise<FormedMatch | null> {
    const claimedA = await this.queueService.leave(mode, playerA.userId);
    const claimedB = await this.queueService.leave(mode, playerB.userId);
    if (!claimedA || !claimedB) {
      await this.release(
        mode,
        [playerA, playerB].filter((_, i) => [claimedA, claimedB][i]),
        isConnected,
      );
      return null;
    }

    let matchId: number;
    try {
      const match = await this.matchesService.createMatch(
        mode,
        playerA.userId,
        playerB.userId,
      );
      matchId = match.id;
      await this.gameService.createSession(match).catch((error: Error) => {
        this.logger.warn(
          `could not create game session for match ${match.id}: ${error.message}`,
        );
      });
    } catch (error) {
      this.logger.error(
        `could not create ${mode} match: ${(error as Error).message}`,
      );
      await this.release(mode, [playerA, playerB], isConnected);
      return null;
    }
    return { matchId, mode, players: [playerA, playerB] };
  }

  private async release(
    mode: QueueMode,
    entries: QueueEntry[],
    isConnected: SocketProbe,
  ): Promise<void> {
    for (const entry of entries) {
      if (!(await this.queueService.requeue(mode, entry))) {
        continue;
      }
      if (!(await isConnected(entry.socketId))) {
        await this.queueService.discard(mode, entry);
      }
    }
  }
}
