import 'reflect-metadata';
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import { WsException } from '@nestjs/websockets';
import { Redis } from 'ioredis';
import {
  DISCONNECT_FORFEIT_MS,
  GameService,
  JOIN_TIMEOUT_MS,
  PLAYER_CLOCK_MS,
} from '../src/game/game.service.js';
import { decodeReplay } from '../src/game/domain/index.js';
import { GameSession } from '../src/game/types/game-session.interface.js';
import { MatchesService } from '../src/matches/matches.service.js';
import { FakeRedis } from './support/fake-redis.js';

const MATCH_ID = 7;
const PLAYER_ONE = 1;
const PLAYER_TWO = 2;

class FakeMatches {
  finished: { matchId: number; winnerId: number; endReason: string }[] = [];
  cancelled: number[] = [];
  replays: Uint8Array[] = [];
  failing = false;

  async findById(id: number) {
    return id === MATCH_ID ? match() : null;
  }

  async finishMatch(
    matchId: number,
    winnerId: number,
    endReason: string,
    replay: Uint8Array,
  ) {
    if (this.failing) {
      throw new Error('database down');
    }
    this.replays.push(replay);
    this.finished.push({ matchId, winnerId, endReason });
  }

  async cancelMatch(matchId: number) {
    this.cancelled.push(matchId);
    return true;
  }
}

function match() {
  return {
    id: MATCH_ID,
    mode: 'UNRANKED',
    status: 'ACTIVE',
    playerOneId: PLAYER_ONE,
    playerTwoId: PLAYER_TWO,
  } as never;
}

function errorCode(error: unknown): string {
  assert.ok(error instanceof WsException);
  return error.getError() as string;
}

describe('GameService', () => {
  let redis: FakeRedis;
  let matches: FakeMatches;
  let service: GameService;

  beforeEach(() => {
    mock.timers.enable({ apis: ['Date'], now: 1_000_000 });
    redis = new FakeRedis();
    matches = new FakeMatches();
    service = new GameService(
      redis as unknown as Redis,
      matches as unknown as MatchesService,
    );
  });

  afterEach(() => {
    mock.timers.reset();
  });

  async function startedGame(): Promise<GameSession> {
    await service.createSession(match());
    await service.join(MATCH_ID, PLAYER_ONE);
    const { session } = await service.join(MATCH_ID, PLAYER_TWO);
    return session;
  }

  function currentUser(session: GameSession): number {
    return session.playerIds[session.game.currentPlayer];
  }

  function otherUser(session: GameSession): number {
    return session.playerIds[session.game.currentPlayer === 0 ? 1 : 0];
  }

  async function playFirstMove(session: GameSession): Promise<GameSession> {
    const move = service.toView(session).legalMoves[0];
    return service.play(
      MATCH_ID,
      currentUser(session),
      move.card,
      move.from,
      move.to,
    );
  }

  it('waits for both players before starting', async () => {
    await service.createSession(match());
    const first = await service.join(MATCH_ID, PLAYER_ONE);

    assert.equal(first.started, false);
    assert.equal(first.session.status, 'WAITING');
    assert.deepEqual(service.toView(first.session).legalMoves, []);
    await assert.rejects(
      () => service.pass(MATCH_ID, PLAYER_ONE, first.session.game.neutral),
      (error) => errorCode(error) === 'GAME_NOT_STARTED',
    );

    const second = await service.join(MATCH_ID, PLAYER_TWO);
    assert.equal(second.started, true);
    assert.equal(second.session.status, 'PLAYING');
    assert.equal(second.session.turnStartedAt, Date.now());
  });

  it('rejects players outside the match', async () => {
    await service.createSession(match());

    await assert.rejects(
      () => service.join(MATCH_ID, 99),
      (error) => errorCode(error) === 'NOT_IN_MATCH',
    );
  });

  it('creates the session on join when matchmaking could not', async () => {
    const { session } = await service.join(MATCH_ID, PLAYER_ONE);

    assert.equal(session.status, 'WAITING');
    assert.deepEqual(session.joined, [true, false]);
  });

  it('only lets the current player move', async () => {
    const session = await startedGame();
    const move = service.toView(session).legalMoves[0];

    await assert.rejects(
      () =>
        service.play(
          MATCH_ID,
          otherUser(session),
          move.card,
          move.from,
          move.to,
        ),
      (error) => errorCode(error) === 'NOT_YOUR_TURN',
    );
  });

  it('charges the elapsed time to the player who moved', async () => {
    const session = await startedGame();
    const mover = session.game.currentPlayer;

    mock.timers.tick(15_000);
    const next = await playFirstMove(session);

    assert.equal(next.clocks[mover], PLAYER_CLOCK_MS - 15_000);
    assert.equal(next.clocks[mover === 0 ? 1 : 0], PLAYER_CLOCK_MS);
    assert.equal(next.turnStartedAt, Date.now());
    assert.notEqual(next.game.currentPlayer, mover);
  });

  it('serialises concurrent moves', async () => {
    const session = await startedGame();
    const move = service.toView(session).legalMoves[0];
    const user = currentUser(session);

    const results = await Promise.allSettled([
      service.play(MATCH_ID, user, move.card, move.from, move.to),
      service.play(MATCH_ID, user, move.card, move.from, move.to),
    ]);

    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    const rejected = results.find((r) => r.status === 'rejected');
    assert.equal(errorCode(rejected?.reason), 'NOT_YOUR_TURN');
  });

  it('ends the game when a player runs out of time', async () => {
    const session = await startedGame();
    const loser = currentUser(session);
    const winner = otherUser(session);

    mock.timers.tick(PLAYER_CLOCK_MS - 1);
    assert.deepEqual(await service.expireDue(), []);

    mock.timers.tick(1);
    const [ended] = await service.expireDue();

    assert.equal(ended.status, 'OVER');
    assert.equal(ended.endReason, 'TIMEOUT');
    assert.equal(ended.winnerId, winner);
    assert.equal(ended.clocks[ended.playerIds.indexOf(loser)], 0);
    assert.deepEqual(matches.finished, [
      { matchId: MATCH_ID, winnerId: winner, endReason: 'TIMEOUT' },
    ]);
    assert.equal(redis.zscore('game:deadlines', String(MATCH_ID)), undefined);
  });

  it('records the opening cards and every move played', async () => {
    const session = await startedGame();
    const opening = session.game;
    const first = service.toView(session).legalMoves[0];
    const afterFirst = await playFirstMove(session);
    const second = service.toView(afterFirst).legalMoves[0];
    const afterSecond = await playFirstMove(afterFirst);

    await service.resign(MATCH_ID, currentUser(afterSecond));

    assert.equal(matches.replays[0].length, 5 + 2 * 2);
    assert.deepEqual(decodeReplay(matches.replays[0]), {
      hands: opening.hands,
      neutral: opening.neutral,
      moves: [first, second],
    });
  });

  it('loses on time when moving after the clock ran out', async () => {
    const session = await startedGame();
    const winner = otherUser(session);

    mock.timers.tick(PLAYER_CLOCK_MS);
    const ended = await playFirstMove(session);

    assert.equal(ended.endReason, 'TIMEOUT');
    assert.equal(ended.winnerId, winner);
  });

  it('cancels the match when a player never joins', async () => {
    await service.createSession(match());
    await service.join(MATCH_ID, PLAYER_ONE);

    mock.timers.tick(JOIN_TIMEOUT_MS);
    const [ended] = await service.expireDue();

    assert.equal(ended.status, 'OVER');
    assert.equal(ended.endReason, 'CANCELLED');
    assert.equal(ended.winnerId, null);
    assert.deepEqual(matches.cancelled, [MATCH_ID]);
  });

  it('cancels instead of resigning before the game starts', async () => {
    await service.createSession(match());

    const ended = await service.resign(MATCH_ID, PLAYER_TWO);

    assert.equal(ended.endReason, 'CANCELLED');
    assert.deepEqual(matches.cancelled, [MATCH_ID]);
    assert.deepEqual(matches.finished, []);
  });

  it('gives the win to the opponent of the resigning player', async () => {
    await startedGame();

    const ended = await service.resign(MATCH_ID, PLAYER_ONE);

    assert.equal(ended.winnerId, PLAYER_TWO);
    assert.equal(ended.endReason, 'RESIGNATION');
    await assert.rejects(
      () => service.resign(MATCH_ID, PLAYER_TWO),
      (error) => errorCode(error) === 'GAME_OVER',
    );
  });

  it('forfeits a player who stays disconnected', async () => {
    await startedGame();

    await service.markDisconnected(MATCH_ID, PLAYER_ONE);
    mock.timers.tick(DISCONNECT_FORFEIT_MS);
    const [ended] = await service.expireDue();

    assert.equal(ended.endReason, 'DISCONNECTION');
    assert.equal(ended.winnerId, PLAYER_TWO);
  });

  it('keeps the game going when the player comes back in time', async () => {
    await startedGame();

    await service.markDisconnected(MATCH_ID, PLAYER_ONE);
    mock.timers.tick(DISCONNECT_FORFEIT_MS - 1);
    await service.join(MATCH_ID, PLAYER_ONE);
    mock.timers.tick(1);

    assert.deepEqual(await service.expireDue(), []);
    assert.equal((await service.find(MATCH_ID))?.status, 'PLAYING');
  });

  it('ignores a disconnection when the player is still present', async () => {
    await startedGame();

    const marked = await service.markDisconnected(
      MATCH_ID,
      PLAYER_ONE,
      async () => true,
    );
    mock.timers.tick(DISCONNECT_FORFEIT_MS);

    assert.equal(marked, null);
    assert.deepEqual(await service.expireDue(), []);
    assert.equal((await service.find(MATCH_ID))?.status, 'PLAYING');
  });

  it('cancels the match when both players stay disconnected', async () => {
    await startedGame();

    await service.markDisconnected(MATCH_ID, PLAYER_TWO);
    await service.markDisconnected(MATCH_ID, PLAYER_ONE);
    mock.timers.tick(DISCONNECT_FORFEIT_MS);
    const [ended] = await service.expireDue();

    assert.equal(ended.endReason, 'CANCELLED');
    assert.equal(ended.winnerId, null);
    assert.deepEqual(matches.cancelled, [MATCH_ID]);
    assert.deepEqual(matches.finished, []);
  });

  it('does not record an ended game again when its deadline lingers', async () => {
    await startedGame();
    await service.resign(MATCH_ID, PLAYER_ONE);
    await redis.zadd('game:deadlines', 0, String(MATCH_ID));

    assert.deepEqual(await service.expireDue(), []);
    assert.deepEqual(await redis.smembers('game:unrecorded'), []);
    assert.equal(redis.zscore('game:deadlines', String(MATCH_ID)), undefined);
  });

  it('frees the seat of a player who leaves before the start', async () => {
    await service.createSession(match());
    await service.join(MATCH_ID, PLAYER_ONE);

    await service.markDisconnected(MATCH_ID, PLAYER_ONE);
    const { started, session } = await service.join(MATCH_ID, PLAYER_TWO);

    assert.equal(started, false);
    assert.deepEqual(session.joined, [false, true]);
  });

  it('cancels the running game of a deleted player without recording it', async () => {
    await startedGame();

    const ended = await service.abandonForUser(PLAYER_ONE);

    assert.equal(ended.length, 1);
    assert.equal(ended[0].status, 'OVER');
    assert.equal(ended[0].winnerId, null);
    assert.equal(ended[0].endReason, 'CANCELLED');
    assert.deepEqual(await redis.smembers('game:unrecorded'), []);
    assert.equal(redis.zscore('game:deadlines', String(MATCH_ID)), undefined);
    assert.deepEqual(matches.cancelled, []);
    assert.deepEqual(matches.finished, []);
  });

  it('leaves the games of other players alone when a user is deleted', async () => {
    const session = await startedGame();

    assert.deepEqual(await service.abandonForUser(99), []);
    assert.equal((await service.find(MATCH_ID))?.status, session.status);
  });

  it('retries recording a result until the database accepts it', async () => {
    await startedGame();
    matches.failing = true;

    await service.resign(MATCH_ID, PLAYER_ONE);
    assert.deepEqual(await redis.smembers('game:unrecorded'), [
      String(MATCH_ID),
    ]);

    matches.failing = false;
    await service.retryUnrecorded();

    assert.deepEqual(await redis.smembers('game:unrecorded'), []);
    assert.deepEqual(matches.finished, [
      { matchId: MATCH_ID, winnerId: PLAYER_TWO, endReason: 'RESIGNATION' },
    ]);
  });
});
