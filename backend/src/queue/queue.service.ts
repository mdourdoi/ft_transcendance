import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { QueueMode } from '../generated/prisma/client.js';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants.js';
import { QueueEntry } from './types/queue-entry.interface.js';

const UNRANKED_LIST_KEY = 'queue:unranked:list';
const RANKED_ZSET_KEY = 'queue:ranked:zset';
const ENTRY_TTL_SECONDS = 3600;
const MATCHMAKING_LOCK_TTL_MS = 10000;
const RELEASE_LOCK_SCRIPT = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`;

@Injectable()
export class QueueService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async join(mode: QueueMode, entry: QueueEntry): Promise<void> {
    await this.leaveAllModes(entry.userId);
    await this.enqueue(mode, entry, false);
  }

  requeue(mode: QueueMode, entry: QueueEntry): Promise<void> {
    return this.enqueue(mode, entry, true);
  }

  async leave(mode: QueueMode, userId: number): Promise<boolean> {
    const tx = this.redis.multi().del(this.entryKey(mode, userId));
    if (mode === QueueMode.RANKED) {
      tx.zrem(RANKED_ZSET_KEY, String(userId));
    } else {
      tx.lrem(UNRANKED_LIST_KEY, 0, String(userId));
    }
    const results = await tx.exec();
    const removed = results?.[1]?.[1];
    return typeof removed === 'number' && removed > 0;
  }

  async leaveAllModes(userId: number): Promise<void> {
    await this.leave(QueueMode.RANKED, userId);
    await this.leave(QueueMode.UNRANKED, userId);
  }

  async getEntry(mode: QueueMode, userId: number): Promise<QueueEntry | null> {
    const raw = await this.redis.get(this.entryKey(mode, userId));
    return raw ? (JSON.parse(raw) as QueueEntry) : null;
  }

  async getUnrankedQueue(): Promise<number[]> {
    const ids = await this.redis.lrange(UNRANKED_LIST_KEY, 0, -1);
    return ids.map(Number);
  }

  async getRankedQueue(): Promise<number[]> {
    const ids = await this.redis.zrange(RANKED_ZSET_KEY, 0, -1);
    return ids.map(Number);
  }

  async acquireMatchmakingLock(mode: QueueMode): Promise<string | null> {
    const token = randomUUID();
    const result = await this.redis.set(
      this.lockKey(mode),
      token,
      'PX',
      MATCHMAKING_LOCK_TTL_MS,
      'NX',
    );
    return result === 'OK' ? token : null;
  }

  async releaseMatchmakingLock(mode: QueueMode, token: string): Promise<void> {
    await this.redis.eval(RELEASE_LOCK_SCRIPT, 1, this.lockKey(mode), token);
  }

  private async enqueue(
    mode: QueueMode,
    entry: QueueEntry,
    front: boolean,
  ): Promise<void> {
    const tx = this.redis
      .multi()
      .set(
        this.entryKey(mode, entry.userId),
        JSON.stringify(entry),
        'EX',
        ENTRY_TTL_SECONDS,
      );
    if (mode === QueueMode.RANKED) {
      tx.zadd(RANKED_ZSET_KEY, entry.rating, String(entry.userId));
    } else if (front) {
      tx.lpush(UNRANKED_LIST_KEY, String(entry.userId));
    } else {
      tx.rpush(UNRANKED_LIST_KEY, String(entry.userId));
    }
    await tx.exec();
  }

  private entryKey(mode: QueueMode, userId: number): string {
    return `queue:entry:${mode}:${userId}`;
  }

  private lockKey(mode: QueueMode): string {
    return `queue:lock:${mode}`;
  }
}
