import { Inject, Injectable } from '@nestjs/common';
import { QueueMode } from '@prisma/client';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { QueueEntry } from './types/queue-entry.interface';

const UNRANKED_LIST_KEY = 'queue:unranked:list';
const RANKED_ZSET_KEY = 'queue:ranked:zset';
const ENTRY_TTL_SECONDS = 3600;

@Injectable()
export class QueueService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async join(mode: QueueMode, entry: QueueEntry): Promise<void> {
    await this.leaveAllModes(entry.userId);
    await this.redis.set(
      this.entryKey(mode, entry.userId),
      JSON.stringify(entry),
      'EX',
      ENTRY_TTL_SECONDS,
    );
    if (mode === QueueMode.RANKED) {
      await this.redis.zadd(
        RANKED_ZSET_KEY,
        entry.rating,
        String(entry.userId),
      );
    } else {
      await this.redis.rpush(UNRANKED_LIST_KEY, String(entry.userId));
    }
  }

  async leave(mode: QueueMode, userId: number): Promise<void> {
    await this.redis.del(this.entryKey(mode, userId));
    if (mode === QueueMode.RANKED) {
      await this.redis.zrem(RANKED_ZSET_KEY, String(userId));
    } else {
      await this.redis.lrem(UNRANKED_LIST_KEY, 0, String(userId));
    }
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

  async acquireMatchmakingLock(mode: QueueMode): Promise<boolean> {
    const result = await this.redis.set(
      `queue:lock:${mode}`,
      '1',
      'PX',
      1000,
      'NX',
    );
    return result === 'OK';
  }

  private entryKey(mode: QueueMode, userId: number): string {
    return `queue:entry:${mode}:${userId}`;
  }
}
