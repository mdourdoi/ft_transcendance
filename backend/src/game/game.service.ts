import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Redis } from 'ioredis';
import {
  BOT_LEVELS,
  BOT_PLAYER_ID,
  BOT_PLAYER_INDEX,
  DEFAULT_BOT_LEVEL,
} from '../bots/bots.constants.js';
import { chooseTurn } from '../bots/calculator/choose-play.js';
import { ErrorCode } from '../common/error-codes.js';
import { acquireLock, releaseLock } from '../common/redis-lock.js';
import {
  Match,
  MatchEndReason,
  MatchStatus,
  QueueMode,
} from '../generated/prisma/client.js';
import { MatchesService } from '../matches/matches.service.js';
import { REDIS_CLIENT } from '../redis/redis.constants.js';
import {
  card,
  drawGameCards,
  encodeReplay,
  Game,
  GameError,
  packMove,
  Play,
  Position,
  PositionProps,
} from './domain/index.js';
import {
  CardView,
  GameEndReason,
  GameSession,
  GameStateView,
} from './types/game-session.interface.js';

export const PLAYER_CLOCK_MS = 10 * 60 * 1000;
export const JOIN_TIMEOUT_MS = 30000;
export const DISCONNECT_FORFEIT_MS = 30000;

const SESSION_TTL_SECONDS = 24 * 3600;
const ORPHAN_GRACE_MS = JOIN_TIMEOUT_MS + 60000;
const DUE_BATCH_SIZE = 100;
const DEADLINES_KEY = 'game:deadlines';
const UNRECORDED_KEY = 'game:unrecorded';
const LOCK_TTL_MS = 2000;
const LOCK_RETRY_MS = 25;
const LOCK_MAX_ATTEMPTS = 40;

export interface JoinResult {
  session: GameSession;
  started: boolean;
}

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly matchesService: MatchesService,
  ) {}

  async createSession(
    match: Match,
    botLevel: number = DEFAULT_BOT_LEVEL,
  ): Promise<GameSession> {
    const game = Game.start(drawGameCards()).toSnapshot();
    const session: GameSession = {
      matchId: match.id,
      mode: match.mode,
      playerIds: [match.playerOneId, match.playerTwoId ?? BOT_PLAYER_ID],
      botLevel: match.mode === QueueMode.BOT ? botLevel : null,
      status: 'WAITING',
      joined: [false, match.mode === QueueMode.BOT],
      joinDeadline: Date.now() + JOIN_TIMEOUT_MS,
      disconnectDeadlines: [null, null],
      clocks: [PLAYER_CLOCK_MS, PLAYER_CLOCK_MS],
      turnStartedAt: null,
      game,
      cards: [...game.hands[0], ...game.hands[1], game.neutral],
      moves: [],
      winnerId: null,
      endReason: null,
    };
    const created = await this.redis.set(
      this.sessionKey(match.id),
      JSON.stringify(session),
      'EX',
      SESSION_TTL_SECONDS,
      'NX',
    );
    if (created !== 'OK') {
      return (await this.load(match.id)) ?? session;
    }
    await this.redis.zadd(
      DEADLINES_KEY,
      session.joinDeadline,
      String(match.id),
    );
    return session;
  }

  async join(
    matchId: number,
    userId: number,
    onSeated: () => Promise<void> = async () => {},
  ): Promise<JoinResult> {
    if (!(await this.load(matchId))) {
      const match = await this.matchesService.findById(matchId);
      if (!match) {
        throw new WsException(ErrorCode.MATCH_NOT_FOUND);
      }
      if (match.playerOneId !== userId && match.playerTwoId !== userId) {
        throw new WsException(ErrorCode.NOT_IN_MATCH);
      }
      if (match.status !== MatchStatus.ACTIVE) {
        throw new WsException(ErrorCode.MATCH_NOT_ACTIVE);
      }
      await this.createSession(match);
    }

    return this.withLock(matchId, async () => {
      const session = await this.requireSession(matchId);
      const index = this.playerIndex(session, userId);
      await onSeated();
      let started = false;
      if (session.status === 'WAITING') {
        session.joined[index] = true;
        if (session.joined[0] && session.joined[1]) {
          session.status = 'PLAYING';
          session.turnStartedAt = Date.now();
          started = true;
        }
        await this.save(session);
      } else if (
        session.status === 'PLAYING' &&
        session.disconnectDeadlines[index] !== null
      ) {
        session.disconnectDeadlines[index] = null;
        await this.save(session);
      }
      return { session, started };
    });
  }

  find(matchId: number): Promise<GameSession | null> {
    return this.load(matchId);
  }

  async markDisconnected(
    matchId: number,
    userId: number,
    isPresent: () => Promise<boolean> = async () => false,
  ): Promise<GameSession | null> {
    return this.withLock(matchId, async () => {
      const session = await this.load(matchId);
      if (!session || session.status === 'OVER') {
        return null;
      }
      const index = session.playerIds.indexOf(userId);
      if (index === -1 || (await isPresent())) {
        return null;
      }
      if (session.status === 'WAITING') {
        session.joined[index] = false;
      } else {
        session.disconnectDeadlines[index] = Date.now() + DISCONNECT_FORFEIT_MS;
      }
      await this.save(session);
      return session;
    });
  }

  play(
    matchId: number,
    userId: number,
    cardName: string,
    from: PositionProps,
    to: PositionProps,
  ): Promise<GameSession> {
    return this.applyTurn(
      matchId,
      userId,
      (game) =>
        game.play(
          Play.create({
            card: cardName,
            from: Position.create(from),
            to: Position.create(to),
          }),
        ),
      () => packMove(cardName, from, to),
    );
  }

  pass(
    matchId: number,
    userId: number,
    cardName: string,
  ): Promise<GameSession> {
    return this.applyTurn(
      matchId,
      userId,
      (game) => game.pass(cardName),
      () => packMove(cardName),
    );
  }

  async playBotTurn(session: GameSession): Promise<GameSession | null> {
    if (
      session.mode !== QueueMode.BOT ||
      session.status !== 'PLAYING' ||
      session.game.currentPlayer !== BOT_PLAYER_INDEX
    ) {
      return null;
    }
    const botId = session.playerIds[BOT_PLAYER_INDEX];
    const level = BOT_LEVELS[(session.botLevel ?? DEFAULT_BOT_LEVEL) - 1];
    const { card, play } = chooseTurn(Game.restore(session.game), level);
    if (!play) {
      return this.pass(session.matchId, botId, card);
    }
    return this.play(
      session.matchId,
      botId,
      play.card,
      { row: play.from.row, col: play.from.col },
      { row: play.to.row, col: play.to.col },
    );
  }

  async resign(matchId: number, userId: number): Promise<GameSession> {
    const session = await this.withLock(matchId, async () => {
      const current = await this.requireSession(matchId);
      const index = this.playerIndex(current, userId);
      this.assertNotOver(current);
      if (current.status === 'WAITING') {
        return this.end(current, null, 'CANCELLED');
      }
      this.stopClock(current, Date.now());
      return this.end(current, this.otherIndex(index), 'RESIGNATION');
    });
    await this.recordResult(session);
    return session;
  }

  async abandonForUser(userId: number): Promise<GameSession[]> {
    const ids = await this.redis.zrangebyscore(DEADLINES_KEY, '-inf', '+inf');
    const ended: GameSession[] = [];
    for (const id of ids.map(Number)) {
      const candidate = await this.load(id);
      if (!candidate?.playerIds.includes(userId)) {
        continue;
      }
      const session = await this.withLock(id, async () => {
        const current = await this.load(id);
        if (!current || current.status === 'OVER') {
          return null;
        }
        this.stopClock(current, Date.now());
        const over = await this.end(current, null, 'CANCELLED');
        await this.redis.srem(UNRECORDED_KEY, String(id));
        return over;
      });
      if (session) {
        ended.push(session);
      }
    }
    return ended;
  }

  async expireDue(now = Date.now()): Promise<GameSession[]> {
    const ids = await this.redis.zrangebyscore(
      DEADLINES_KEY,
      '-inf',
      now,
      'LIMIT',
      0,
      DUE_BATCH_SIZE,
    );
    const ended: GameSession[] = [];
    for (const id of ids.map(Number)) {
      try {
        const session = await this.withLock(id, () => this.expire(id, now));
        if (session) {
          ended.push(session);
          await this.recordResult(session);
        }
      } catch (error) {
        this.logger.warn(
          `could not expire match ${id}: ${(error as Error).message}`,
        );
      }
    }
    return ended;
  }

  async retryUnrecorded(): Promise<void> {
    const ids = await this.redis.smembers(UNRECORDED_KEY);
    for (const id of ids.map(Number)) {
      const session = await this.load(id);
      if (!session || session.status !== 'OVER') {
        await this.redis.srem(UNRECORDED_KEY, String(id));
        continue;
      }
      await this.recordResult(session);
    }
  }

  async cancelOrphans(now = Date.now()): Promise<void> {
    const matches = await this.matchesService.findActiveCreatedBefore(
      new Date(now - ORPHAN_GRACE_MS),
    );
    for (const match of matches) {
      if (await this.redis.exists(this.sessionKey(match.id))) {
        continue;
      }
      await this.matchesService.cancelMatch(match.id);
      this.logger.warn(`cancelled orphan match ${match.id}`);
    }
  }

  toView(session: GameSession): GameStateView {
    const game = Game.restore(session.game);
    return {
      matchId: session.matchId,
      mode: session.mode,
      status: session.status,
      playerIds: session.playerIds,
      board: session.game.board,
      hands: [
        session.game.hands[0].map((name) => this.cardView(name)),
        session.game.hands[1].map((name) => this.cardView(name)),
      ],
      neutral: this.cardView(session.game.neutral),
      currentPlayer: session.game.currentPlayer,
      turn: session.game.turn,
      clocks: session.clocks,
      turnStartedAt: session.turnStartedAt,
      legalMoves:
        session.status === 'PLAYING'
          ? game.legalMoves().map((play) => ({
              card: play.card,
              from: { row: play.from.row, col: play.from.col },
              to: { row: play.to.row, col: play.to.col },
            }))
          : [],
      winnerId: session.winnerId,
      endReason: session.endReason,
    };
  }

  private async expire(
    matchId: number,
    now: number,
  ): Promise<GameSession | null> {
    const session = await this.load(matchId);
    if (!session) {
      await this.redis.zrem(DEADLINES_KEY, String(matchId));
      return null;
    }
    if (session.status === 'OVER') {
      await this.redis.zrem(DEADLINES_KEY, String(matchId));
      return null;
    }
    if (session.status === 'WAITING' && now >= session.joinDeadline) {
      return this.end(session, null, 'CANCELLED');
    }
    if (session.status === 'PLAYING') {
      const current = session.game.currentPlayer;
      if (now >= this.clockDeadline(session)) {
        session.clocks[current] = 0;
        session.turnStartedAt = now;
        return this.end(session, this.otherIndex(current), 'TIMEOUT');
      }
      const gone = session.disconnectDeadlines.map(
        (deadline) => deadline !== null && now >= deadline,
      );
      if (gone[0] && gone[1]) {
        this.stopClock(session, now);
        return this.end(session, null, 'CANCELLED');
      }
      if (gone[0] || gone[1]) {
        this.stopClock(session, now);
        return this.end(
          session,
          this.otherIndex(gone.indexOf(true)),
          'DISCONNECTION',
        );
      }
    }
    await this.save(session);
    return null;
  }

  private async applyTurn(
    matchId: number,
    userId: number,
    turn: (game: Game) => Game,
    move: () => number,
  ): Promise<GameSession> {
    const session = await this.withLock(matchId, async () => {
      const current = await this.requireSession(matchId);
      const index = this.playerIndex(current, userId);
      this.assertNotOver(current);
      if (current.status === 'WAITING') {
        throw new WsException(ErrorCode.GAME_NOT_STARTED);
      }
      if (current.game.currentPlayer !== index) {
        throw new WsException(ErrorCode.NOT_YOUR_TURN);
      }

      const now = Date.now();
      if (now >= this.clockDeadline(current)) {
        current.clocks[index] = 0;
        current.turnStartedAt = now;
        return this.end(current, this.otherIndex(index), 'TIMEOUT');
      }

      let next: Game;
      try {
        next = turn(Game.restore(current.game));
      } catch (error) {
        if (error instanceof GameError) {
          throw new WsException(error.code);
        }
        throw error;
      }

      this.stopClock(current, now);
      current.game = next.toSnapshot();
      current.moves.push(move());
      if (next.winner !== null && next.victory !== null) {
        return this.end(current, next.winner, next.victory);
      }
      await this.save(current);
      return current;
    });
    await this.recordResult(session);
    return session;
  }

  private stopClock(session: GameSession, now: number): void {
    if (session.turnStartedAt === null) {
      return;
    }
    const current = session.game.currentPlayer;
    session.clocks[current] = Math.max(
      0,
      session.clocks[current] - (now - session.turnStartedAt),
    );
    session.turnStartedAt = now;
  }

  private clockDeadline(session: GameSession): number {
    return (
      (session.turnStartedAt ?? Date.now()) +
      session.clocks[session.game.currentPlayer]
    );
  }

  private nextDeadline(session: GameSession): number | null {
    if (session.status === 'WAITING') {
      return session.joinDeadline;
    }
    if (session.status === 'OVER') {
      return null;
    }
    const deadlines = session.disconnectDeadlines.filter(
      (deadline): deadline is number => deadline !== null,
    );
    return Math.min(this.clockDeadline(session), ...deadlines);
  }

  private async end(
    session: GameSession,
    winnerIndex: number | null,
    reason: GameEndReason,
  ): Promise<GameSession> {
    session.status = 'OVER';
    session.winnerId =
      winnerIndex === null ? null : session.playerIds[winnerIndex];
    session.endReason = reason;
    session.disconnectDeadlines = [null, null];
    await this.save(session);
    return session;
  }

  private async recordResult(session: GameSession): Promise<void> {
    if (session.status !== 'OVER') {
      return;
    }
    try {
      if (session.winnerId === null) {
        if (!(await this.matchesService.cancelMatch(session.matchId))) {
          throw new ConflictException(ErrorCode.MATCH_NOT_ACTIVE);
        }
      } else {
        await this.matchesService.finishMatch(
          session.matchId,
          session.winnerId === BOT_PLAYER_ID ? null : session.winnerId,
          session.endReason as MatchEndReason,
          encodeReplay(session.cards, session.moves),
        );
      }
      await this.redis.srem(UNRECORDED_KEY, String(session.matchId));
    } catch (error) {
      if (error instanceof ConflictException) {
        this.logger.error(
          `result of match ${session.matchId} conflicts with the database: ${error.message}`,
        );
        await this.redis.srem(UNRECORDED_KEY, String(session.matchId));
        return;
      }
      this.logger.warn(
        `could not record result of match ${session.matchId}, will retry: ${(error as Error).message}`,
      );
    }
  }

  private playerIndex(session: GameSession, userId: number): number {
    const index = session.playerIds.indexOf(userId);
    if (index === -1) {
      throw new WsException(ErrorCode.NOT_IN_MATCH);
    }
    return index;
  }

  private otherIndex(index: number): number {
    return index === 0 ? 1 : 0;
  }

  private assertNotOver(session: GameSession): void {
    if (session.status === 'OVER') {
      throw new WsException(ErrorCode.GAME_OVER);
    }
  }

  private cardView(name: string): CardView {
    const c = card(name);
    return {
      name: c.name,
      color: c.color,
      moves: c.moves.map(([row, col]) => [row, col]),
    };
  }

  private async requireSession(matchId: number): Promise<GameSession> {
    const session = await this.load(matchId);
    if (!session) {
      throw new WsException(ErrorCode.MATCH_NOT_FOUND);
    }
    return session;
  }

  private async load(matchId: number): Promise<GameSession | null> {
    const raw = await this.redis.get(this.sessionKey(matchId));
    return raw ? (JSON.parse(raw) as GameSession) : null;
  }

  private async save(session: GameSession): Promise<void> {
    const id = String(session.matchId);
    const deadline = this.nextDeadline(session);
    const tx = this.redis
      .multi()
      .set(
        this.sessionKey(session.matchId),
        JSON.stringify(session),
        'EX',
        SESSION_TTL_SECONDS,
      );
    if (deadline === null) {
      tx.zrem(DEADLINES_KEY, id).sadd(UNRECORDED_KEY, id);
    } else {
      tx.zadd(DEADLINES_KEY, deadline, id);
    }
    await tx.exec();
  }

  private async withLock<T>(matchId: number, fn: () => Promise<T>): Promise<T> {
    const key = `game:lock:${matchId}`;
    for (let attempt = 0; attempt < LOCK_MAX_ATTEMPTS; attempt++) {
      const token = await acquireLock(this.redis, key, LOCK_TTL_MS);
      if (token) {
        try {
          return await fn();
        } finally {
          await releaseLock(this.redis, key, token);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, LOCK_RETRY_MS));
    }
    throw new WsException(ErrorCode.GAME_BUSY);
  }

  private sessionKey(matchId: number): string {
    return `game:session:${matchId}`;
  }
}
