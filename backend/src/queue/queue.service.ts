import { Inject, Injectable } from '@nestjs/common';
import { QueueMode } from '../generated/prisma/client.js';
import { Redis } from 'ioredis';
import { acquireLock, releaseLock } from '../common/redis-lock.js';
import { REDIS_CLIENT } from '../redis/redis.constants.js';
import { QueueEntry } from './types/queue-entry.interface.js';

const UNRANKED_LIST_KEY = 'queue:unranked:list';
const RANKED_ZSET_KEY = 'queue:ranked:zset';
const ENTRY_TTL_SECONDS = 3600;
const MATCHMAKING_LOCK_TTL_MS = 10000;
const REQUEUE_SCRIPT = `
if redis.call("exists", KEYS[1], KEYS[2]) > 0 then return 0 end
redis.call("set", KEYS[1], ARGV[1], "EX", ARGV[2])
if ARGV[3] == "RANKED" then
  redis.call("zadd", KEYS[3], ARGV[4], ARGV[5])
else
  redis.call("lpush", KEYS[3], ARGV[5])
end
return 1`;

@Injectable()
export class QueueService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async join(mode: QueueMode, entry: QueueEntry): Promise<void> {
    await this.leaveAllModes(entry.userId);
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
    } else {
      tx.rpush(UNRANKED_LIST_KEY, String(entry.userId));
    }
    await tx.exec();
  }

  async requeue(mode: QueueMode, entry: QueueEntry): Promise<boolean> {
    const otherMode =
      mode === QueueMode.RANKED ? QueueMode.UNRANKED : QueueMode.RANKED;
    const requeued = await this.redis.eval(
      REQUEUE_SCRIPT,
      3,
      this.entryKey(mode, entry.userId),
      this.entryKey(otherMode, entry.userId),
      mode === QueueMode.RANKED ? RANKED_ZSET_KEY : UNRANKED_LIST_KEY,
      JSON.stringify(entry),
      ENTRY_TTL_SECONDS,
      mode,
      entry.rating,
      entry.userId,
    );
    return requeued === 1;
  }

  async discard(mode: QueueMode, entry: QueueEntry): Promise<void> {
    const current = await this.getEntry(mode, entry.userId);
    if (current?.socketId === entry.socketId) {
      await this.leave(mode, entry.userId);
    }
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

  acquireMatchmakingLock(mode: QueueMode): Promise<string | null> {
    return acquireLock(this.redis, this.lockKey(mode), MATCHMAKING_LOCK_TTL_MS);
  }

  releaseMatchmakingLock(mode: QueueMode, token: string): Promise<void> {
    return releaseLock(this.redis, this.lockKey(mode), token);
  }

  private entryKey(mode: QueueMode, userId: number): string {
    return `queue:entry:${mode}:${userId}`;
  }

  private lockKey(mode: QueueMode): string {
    return `queue:lock:${mode}`;
  }
}
