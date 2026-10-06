type Value = string | Map<string, number> | Set<string>;

export class FakeRedis {
  private readonly store = new Map<string, Value>();

  async get(key: string): Promise<string | null> {
    const value = this.store.get(key);
    return typeof value === 'string' ? value : null;
  }

  async set(key: string, value: string, ...args: (string | number)[]) {
    if (args.includes('NX') && this.store.has(key)) {
      return null;
    }
    this.store.set(key, value);
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    return this.store.has(key) ? 1 : 0;
  }

  async eval(_script: string, _keys: number, key: string, token: string) {
    if (this.store.get(key) === token) {
      this.store.delete(key);
      return 1;
    }
    return 0;
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    this.zset(key).set(member, Number(score));
    return 1;
  }

  async zrem(key: string, member: string): Promise<number> {
    return this.zset(key).delete(member) ? 1 : 0;
  }

  async zrangebyscore(
    key: string,
    min: string | number,
    max: string | number,
    ...args: (string | number)[]
  ): Promise<string[]> {
    const low = min === '-inf' ? -Infinity : Number(min);
    const high = max === '+inf' ? Infinity : Number(max);
    const limit = args[0] === 'LIMIT' ? Number(args[2]) : Infinity;
    return [...this.zset(key).entries()]
      .filter(([, score]) => score >= low && score <= high)
      .sort((a, b) => a[1] - b[1])
      .slice(0, limit)
      .map(([member]) => member);
  }

  zscore(key: string, member: string): number | undefined {
    return this.zset(key).get(member);
  }

  async sadd(key: string, member: string): Promise<number> {
    this.members(key).add(member);
    return 1;
  }

  async srem(key: string, member: string): Promise<number> {
    return this.members(key).delete(member) ? 1 : 0;
  }

  async smembers(key: string): Promise<string[]> {
    return [...this.members(key)];
  }

  multi() {
    const ops: (() => Promise<unknown>)[] = [];
    const chain = {
      set: (...args: Parameters<FakeRedis['set']>) =>
        push(() => this.set(...args)),
      zadd: (...args: Parameters<FakeRedis['zadd']>) =>
        push(() => this.zadd(...args)),
      zrem: (...args: Parameters<FakeRedis['zrem']>) =>
        push(() => this.zrem(...args)),
      sadd: (...args: Parameters<FakeRedis['sadd']>) =>
        push(() => this.sadd(...args)),
      exec: async () => {
        const results: [null, unknown][] = [];
        for (const op of ops) {
          results.push([null, await op()]);
        }
        return results;
      },
    };
    const push = (op: () => Promise<unknown>) => {
      ops.push(op);
      return chain;
    };
    return chain;
  }

  private zset(key: string): Map<string, number> {
    if (!this.store.has(key)) {
      this.store.set(key, new Map());
    }
    return this.store.get(key) as Map<string, number>;
  }

  private members(key: string): Set<string> {
    if (!this.store.has(key)) {
      this.store.set(key, new Set());
    }
    return this.store.get(key) as Set<string>;
  }
}
