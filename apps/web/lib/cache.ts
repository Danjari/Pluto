// apps/web/lib/cache.ts
type Entry<T> = { v: T; expireAt: number };

export class TTLCache<T = unknown> {
  private map = new Map<string, Entry<T>>();
  constructor(private defaultTtlMs = 60_000) {}
  get(key: string): T | undefined {
    const e = this.map.get(key);
    if (!e) return;
    if (Date.now() > e.expireAt) {
      this.map.delete(key);
      return;
    }
    return e.v;
  }
  set(key: string, value: T, ttlMs = this.defaultTtlMs) {
    this.map.set(key, { v: value, expireAt: Date.now() + ttlMs });
  }
}

export const cache = new TTLCache<any>(5 * 60_000); // default 5 minutes
