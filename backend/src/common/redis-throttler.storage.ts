import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface.js';
import { Redis } from 'ioredis';

const INCREMENT_SCRIPT = `
local blockTtl = redis.call("pttl", KEYS[2])
if blockTtl > 0 then
  return {tonumber(ARGV[2]) + 1, redis.call("pttl", KEYS[1]), 1, blockTtl}
end
local hits = redis.call("incr", KEYS[1])
if hits == 1 then redis.call("pexpire", KEYS[1], ARGV[1]) end
local ttl = redis.call("pttl", KEYS[1])
if hits > tonumber(ARGV[2]) then
  redis.call("set", KEYS[2], "1", "PX", ARGV[3])
  redis.call("del", KEYS[1])
  return {hits, ttl, 1, tonumber(ARGV[3])}
end
return {hits, ttl, 0, 0}`;

const toSeconds = (ms: number) => Math.max(0, Math.ceil(ms / 1000));

export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const prefix = `throttle:${throttlerName}:${key}`;
    const [totalHits, timeToExpire, isBlocked, timeToBlockExpire] =
      (await this.redis.eval(
        INCREMENT_SCRIPT,
        2,
        `${prefix}:hits`,
        `${prefix}:block`,
        ttl,
        limit,
        blockDuration,
      )) as [number, number, number, number];
    return {
      totalHits,
      timeToExpire: toSeconds(timeToExpire),
      isBlocked: isBlocked === 1,
      timeToBlockExpire: toSeconds(timeToBlockExpire),
    };
  }
}
