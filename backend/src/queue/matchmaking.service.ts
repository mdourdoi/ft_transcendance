import { Injectable } from '@nestjs/common';
import { QueueMode } from '@prisma/client';
import { MatchesService } from '../matches/matches.service';
import { QueueService } from './queue.service';
import { QueueEntry } from './types/queue-entry.interface';

const BASE_RATING_RANGE = 50;
const RATING_RANGE_PER_SECOND = 20;
const MAX_RATING_RANGE = 1000;

export interface FormedMatch {
  matchId: number;
  mode: QueueMode;
  players: [QueueEntry, QueueEntry];
}

@Injectable()
export class MatchmakingService {
  constructor(
    private readonly queueService: QueueService,
    private readonly matchesService: MatchesService,
  ) {}

  async tick(): Promise<FormedMatch[]> {
    const [unranked, ranked] = await Promise.all([
      this.matchUnranked(),
      this.matchRanked(),
    ]);
    return [...unranked, ...ranked];
  }

  private async matchUnranked(): Promise<FormedMatch[]> {
    if (!(await this.queueService.acquireMatchmakingLock(QueueMode.UNRANKED))) {
      return [];
    }

    const entries = await this.loadEntries(
      QueueMode.UNRANKED,
      await this.queueService.getUnrankedQueue(),
    );

    const matches: FormedMatch[] = [];
    while (entries.length >= 2) {
      const playerA = entries.shift() as QueueEntry;
      const playerB = entries.shift() as QueueEntry;
      matches.push(await this.formMatch(QueueMode.UNRANKED, playerA, playerB));
    }

    return matches;
  }

  private async matchRanked(): Promise<FormedMatch[]> {
    if (!(await this.queueService.acquireMatchmakingLock(QueueMode.RANKED))) {
      return [];
    }

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
      matches.push(await this.formMatch(QueueMode.RANKED, player, opponent));
    }

    return matches;
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
  ): Promise<FormedMatch> {
    await Promise.all([
      this.queueService.leave(mode, playerA.userId),
      this.queueService.leave(mode, playerB.userId),
    ]);
    const match = await this.matchesService.createMatch(
      mode,
      playerA.userId,
      playerB.userId,
    );
    return { matchId: match.id, mode, players: [playerA, playerB] };
  }
}
