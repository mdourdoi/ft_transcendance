import 'reflect-metadata';
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { HttpException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Redis } from 'ioredis';
import { FriendshipsService } from '../src/friendships/friendships.service.js';
import { GameInvitesService } from '../src/game-invites/game-invites.service.js';
import { GameService } from '../src/game/game.service.js';
import { MatchesService } from '../src/matches/matches.service.js';
import { QueueService } from '../src/queue/queue.service.js';
import { UsersService } from '../src/users/users.service.js';
import { FakeRedis } from './support/fake-redis.js';

const ALICE = 1;
const BOB = 2;
const STRANGER = 3;
const MATCH_ID = 42;

class FakeFriendships {
  async areFriends(a: number, b: number) {
    return [a, b].sort().join() === [ALICE, BOB].join();
  }
}

class FakeUsers {
  async findById(id: number) {
    return { id, username: `user${id}`, avatarUrl: 'default.png' };
  }
}

class FakeMatches {
  active = new Set<number>();
  created: { mode: string; playerOneId: number; playerTwoId: number }[] = [];

  async findActiveForUser(userId: number) {
    return this.active.has(userId) ? { id: MATCH_ID } : null;
  }

  async createMatch(mode: string, playerOneId: number, playerTwoId: number) {
    this.created.push({ mode, playerOneId, playerTwoId });
    return { id: MATCH_ID, mode, playerOneId, playerTwoId };
  }
}

class FakeGame {
  sessions: number[] = [];

  async createSession(match: { id: number }) {
    this.sessions.push(match.id);
  }
}

class FakeQueue {
  left: number[] = [];

  async leaveAllModes(userId: number) {
    this.left.push(userId);
  }
}

class FakeEmitter {
  events: { name: string; payload: Record<string, unknown> }[] = [];

  emit(name: string, payload: Record<string, unknown>) {
    this.events.push({ name, payload });
    return true;
  }
}

async function errorCode(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    assert.ok(error instanceof HttpException);
    return error.message;
  }
  assert.fail('expected the call to be rejected');
}

describe('GameInvitesService', () => {
  let matches: FakeMatches;
  let game: FakeGame;
  let queue: FakeQueue;
  let emitter: FakeEmitter;
  let service: GameInvitesService;

  beforeEach(() => {
    matches = new FakeMatches();
    game = new FakeGame();
    queue = new FakeQueue();
    emitter = new FakeEmitter();
    service = new GameInvitesService(
      new FakeRedis() as unknown as Redis,
      new FakeFriendships() as unknown as FriendshipsService,
      new FakeUsers() as unknown as UsersService,
      matches as unknown as MatchesService,
      game as unknown as GameService,
      queue as unknown as QueueService,
      emitter as unknown as EventEmitter2,
    );
  });

  it('notifies a friend of the invite', async () => {
    const { expiresAt } = await service.send(ALICE, BOB);

    assert.ok(expiresAt > Date.now());
    assert.equal(emitter.events.length, 1);
    assert.equal(emitter.events[0].name, 'gameInvite.sent');
    assert.equal(emitter.events[0].payload.targetId, BOB);
    assert.deepEqual(emitter.events[0].payload.from, {
      id: ALICE,
      username: 'user1',
      avatarUrl: 'default.png',
    });
  });

  it('rejects an invite to someone who is not a friend', async () => {
    assert.equal(await errorCode(service.send(ALICE, STRANGER)), 'NOT_FRIENDS');
    assert.equal(emitter.events.length, 0);
  });

  it('rejects an invite to oneself', async () => {
    assert.equal(await errorCode(service.send(ALICE, ALICE)), 'NOT_FRIENDS');
  });

  it('rejects an invite sent while in a match', async () => {
    matches.active.add(ALICE);
    assert.equal(await errorCode(service.send(ALICE, BOB)), 'ALREADY_IN_MATCH');
  });

  it('rejects a second invite to the same friend', async () => {
    await service.send(ALICE, BOB);
    assert.equal(
      await errorCode(service.send(ALICE, BOB)),
      'GAME_INVITE_ALREADY_SENT',
    );
  });

  it('creates an unranked match when the invite is accepted', async () => {
    await service.send(ALICE, BOB);
    const result = await service.accept(BOB, ALICE);

    assert.deepEqual(result, { matchId: MATCH_ID, opponentId: ALICE });
    assert.deepEqual(matches.created, [
      { mode: 'UNRANKED', playerOneId: ALICE, playerTwoId: BOB },
    ]);
    assert.deepEqual(game.sessions, [MATCH_ID]);
    assert.deepEqual(queue.left, [ALICE, BOB]);
    assert.deepEqual(emitter.events[1], {
      name: 'gameInvite.accepted',
      payload: { targetId: ALICE, matchId: MATCH_ID, opponentId: BOB },
    });
  });

  it('rejects accepting an invite that was never sent', async () => {
    assert.equal(
      await errorCode(service.accept(BOB, ALICE)),
      'GAME_INVITE_NOT_FOUND',
    );
  });

  it('rejects accepting the same invite twice', async () => {
    await service.send(ALICE, BOB);
    await service.accept(BOB, ALICE);
    assert.equal(
      await errorCode(service.accept(BOB, ALICE)),
      'GAME_INVITE_NOT_FOUND',
    );
  });

  it('rejects accepting when a player is already in a match', async () => {
    await service.send(ALICE, BOB);
    matches.active.add(ALICE);
    assert.equal(
      await errorCode(service.accept(BOB, ALICE)),
      'ALREADY_IN_MATCH',
    );
    assert.equal(matches.created.length, 0);
  });

  it('removes a declined invite and notifies the sender', async () => {
    await service.send(ALICE, BOB);
    await service.decline(BOB, ALICE);

    assert.deepEqual(emitter.events[1], {
      name: 'gameInvite.declined',
      payload: { targetId: ALICE, userId: BOB },
    });
    assert.equal(
      await errorCode(service.accept(BOB, ALICE)),
      'GAME_INVITE_NOT_FOUND',
    );
  });

  it('removes a cancelled invite and notifies the friend', async () => {
    await service.send(ALICE, BOB);
    await service.cancel(ALICE, BOB);

    assert.deepEqual(emitter.events[1], {
      name: 'gameInvite.cancelled',
      payload: { targetId: BOB, userId: ALICE },
    });
    assert.equal(
      await errorCode(service.accept(BOB, ALICE)),
      'GAME_INVITE_NOT_FOUND',
    );
  });
});
