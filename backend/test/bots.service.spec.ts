import 'reflect-metadata';
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { HttpException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { BotsService } from '../src/bots/bots.service.js';
import { Game } from '../src/game/domain/index.js';
import { GameService } from '../src/game/game.service.js';
import { GameSession } from '../src/game/types/game-session.interface.js';
import { MatchesService } from '../src/matches/matches.service.js';
import { QueueService } from '../src/queue/queue.service.js';
import { FakeRedis } from './support/fake-redis.js';

const ALICE = 1;
const BOT = 0;
const MATCH_ID = 42;

class FakeMatches {
  active = new Set<number>();
  created: { mode: string; playerOneId: number; playerTwoId: null }[] = [];
  finished: { winnerId: number | null; endReason: string }[] = [];

  async findActiveForUser(userId: number) {
    return this.active.has(userId) ? { id: MATCH_ID } : null;
  }

  async createMatch(mode: string, playerOneId: number, playerTwoId: null) {
    this.created.push({ mode, playerOneId, playerTwoId });
    return this.match();
  }

  async findById(id: number) {
    return id === MATCH_ID && this.created.length > 0 ? this.match() : null;
  }

  async finishMatch(
    matchId: number,
    winnerId: number | null,
    endReason: string,
  ) {
    this.finished.push({ winnerId, endReason });
  }

  async cancelMatch() {
    return true;
  }

  private match() {
    return {
      id: MATCH_ID,
      mode: 'BOT',
      status: 'ACTIVE',
      playerOneId: ALICE,
      playerTwoId: null,
    };
  }
}

class FakeQueue {
  left: number[] = [];

  async leaveAllModes(userId: number) {
    this.left.push(userId);
  }
}

describe('BotsService', () => {
  let matches: FakeMatches;
  let queue: FakeQueue;
  let game: GameService;
  let service: BotsService;

  beforeEach(() => {
    matches = new FakeMatches();
    queue = new FakeQueue();
    game = new GameService(
      new FakeRedis() as unknown as Redis,
      matches as unknown as MatchesService,
    );
    service = new BotsService(
      matches as unknown as MatchesService,
      game,
      queue as unknown as QueueService,
    );
  });

  async function playAsAlice(session: GameSession): Promise<GameSession> {
    const play = Game.restore(session.game).legalMoves()[0];
    return game.play(
      MATCH_ID,
      ALICE,
      play.card,
      { row: play.from.row, col: play.from.col },
      { row: play.to.row, col: play.to.col },
    );
  }

  it('creates a match without opponent where the bot is already seated', async () => {
    const result = await service.startMatch(ALICE);

    assert.deepEqual(result, { matchId: MATCH_ID, mode: 'BOT' });
    assert.deepEqual(matches.created, [
      { mode: 'BOT', playerOneId: ALICE, playerTwoId: null },
    ]);
    assert.deepEqual(queue.left, [ALICE]);
    const session = await game.find(MATCH_ID);
    assert.deepEqual(session?.playerIds, [ALICE, BOT]);
    assert.deepEqual(session?.joined, [false, true]);
  });

  it('plays at the strongest level unless told otherwise', async () => {
    await service.startMatch(ALICE);

    assert.equal((await game.find(MATCH_ID))?.botLevel, 4);
  });

  it('remembers the level chosen by the player', async () => {
    await service.startMatch(ALICE, 2);

    const { session } = await game.join(MATCH_ID, ALICE);

    assert.equal(session.botLevel, 2);
  });

  it('starts the game as soon as the player joins', async () => {
    await service.startMatch(ALICE);

    const { started } = await game.join(MATCH_ID, ALICE);

    assert.equal(started, true);
  });

  it('refuses a player who is already in a match', async () => {
    matches.active.add(ALICE);

    await assert.rejects(
      service.startMatch(ALICE),
      (error) =>
        error instanceof HttpException && error.message === 'ALREADY_IN_MATCH',
    );
    assert.equal(matches.created.length, 0);
  });

  it('records a win without winner when the player resigns', async () => {
    await service.startMatch(ALICE);
    await game.join(MATCH_ID, ALICE);

    const session = await game.resign(MATCH_ID, ALICE);

    assert.equal(session.winnerId, BOT);
    assert.deepEqual(matches.finished, [
      { winnerId: null, endReason: 'RESIGNATION' },
    ]);
  });

  it('answers for the bot on its turn', async () => {
    await service.startMatch(ALICE);
    let { session } = await game.join(MATCH_ID, ALICE);
    if (session.playerIds[session.game.currentPlayer] === ALICE) {
      session = await playAsAlice(session);
    }
    const turn = session.game.turn;

    const answer = await game.playBotTurn(session);

    assert.equal(answer?.game.turn, turn + 1);
    assert.equal(answer?.playerIds[answer.game.currentPlayer], ALICE);
    assert.equal((await game.find(MATCH_ID))?.game.turn, turn + 1);
  });

  it('stays idle on the player turn', async () => {
    await service.startMatch(ALICE);
    let { session } = await game.join(MATCH_ID, ALICE);
    if (session.playerIds[session.game.currentPlayer] === BOT) {
      session = (await game.playBotTurn(session)) as GameSession;
    }

    assert.equal(await game.playBotTurn(session), null);
  });

  it('stays idle before the game starts', async () => {
    await service.startMatch(ALICE);
    const session = (await game.find(MATCH_ID)) as GameSession;

    assert.equal(await game.playBotTurn(session), null);
  });

  it('never answers outside of the bot mode', async () => {
    await service.startMatch(ALICE);
    const { session } = await game.join(MATCH_ID, ALICE);

    assert.equal(
      await game.playBotTurn({ ...session, mode: 'UNRANKED' }),
      null,
    );
  });
});
