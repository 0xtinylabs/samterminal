/**
 * Simple in-memory cache with TTL support, auto-cleanup, and max size
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class Cache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private defaultTtl: number;
  private maxSize: number;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private inFlight: Map<string, Promise<T>> = new Map();

  constructor(defaultTtlMs: number = 30000, maxSize: number = 10000) {
    this.defaultTtl = defaultTtlMs;
    this.maxSize = maxSize;

    // Auto-cleanup every 60 seconds
    this.cleanupTimer = setInterval(() => this.cleanup(), 60000);
    // Allow the timer to not block process exit
    if (this.cleanupTimer && typeof this.cleanupTimer === 'object' && 'unref' in this.cleanupTimer) {
      this.cleanupTimer.unref();
    }
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    // Evict oldest entries if at max capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    const ttl = ttlMs ?? this.defaultTtl;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.inFlight.clear();
  }

  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  get size(): number {
    return this.cache.size;
  }

  /**
   * Get or set with factory function (singleflight pattern)
   * Prevents cache stampede by deduplicating concurrent requests
   */
  async getOrSet(key: string, factory: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Singleflight: if already fetching this key, return the existing promise
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing;
    }

    const promise = factory().then(
      (value) => {
        this.set(key, value, ttlMs);
        this.inFlight.delete(key);
        return value;
      },
      (error) => {
        this.inFlight.delete(key);
        throw error;
      },
    );

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Destroy the cache and stop auto-cleanup
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
    this.inFlight.clear();
  }
}

export function createCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${String(v)}`)
    .join('&');

  return `${prefix}:${sortedParams}`;
}
