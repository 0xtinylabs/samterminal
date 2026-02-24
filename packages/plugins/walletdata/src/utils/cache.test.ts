/**
 * Cache tests
 */


import { Cache, createCacheKey } from './cache.js';

describe('Cache', () => {
  let cache: Cache<string>;

  beforeEach(() => {
    jest.useFakeTimers();
    cache = new Cache<string>(1000); // 1 second TTL
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create cache with default TTL', () => {
      const defaultCache = new Cache<string>();
      expect(defaultCache).toBeInstanceOf(Cache);
    });

    it('should create cache with custom TTL', () => {
      const customCache = new Cache<string>(5000);
      expect(customCache).toBeInstanceOf(Cache);
    });
  });

  describe('set and get', () => {
    it('should store and retrieve value', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent key', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should use custom TTL when provided', () => {
      cache.set('key1', 'value1', 5000);
      jest.advanceTimersByTime(3000);
      expect(cache.get('key1')).toBe('value1');
    });

    it('should expire after TTL', () => {
      cache.set('key1', 'value1');
      jest.advanceTimersByTime(1100); // Advance past TTL
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should overwrite existing value', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired key', () => {
      cache.set('key1', 'value1');
      jest.advanceTimersByTime(1100);
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete existing key', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should return false for non-existent key', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.size).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      cache.set('key1', 'value1', 500);
      cache.set('key2', 'value2', 2000);
      jest.advanceTimersByTime(700);
      const removed = cache.cleanup();
      expect(removed).toBe(1);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
    });

    it('should return 0 when nothing expired', () => {
      cache.set('key1', 'value1', 5000);
      const removed = cache.cleanup();
      expect(removed).toBe(0);
    });
  });

  describe('size', () => {
    it('should return number of entries', () => {
      expect(cache.size).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.size).toBe(1);
      cache.set('key2', 'value2');
      expect(cache.size).toBe(2);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      cache.set('key1', 'cached');
      const factory = jest.fn().mockResolvedValue('fresh');
      const result = await cache.getOrSet('key1', factory);
      expect(result).toBe('cached');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result if not exists', async () => {
      const factory = jest.fn().mockResolvedValue('fresh');
      const result = await cache.getOrSet('key1', factory);
      expect(result).toBe('fresh');
      expect(factory).toHaveBeenCalledTimes(1);
      expect(cache.get('key1')).toBe('fresh');
    });

    it('should use custom TTL for factory result', async () => {
      const factory = jest.fn().mockResolvedValue('fresh');
      await cache.getOrSet('key1', factory, 5000);
      jest.advanceTimersByTime(3000);
      expect(cache.get('key1')).toBe('fresh');
    });
  });
});

describe('createCacheKey', () => {
  it('should create key with prefix and params', () => {
    const key = createCacheKey('test', { a: 1, b: 'two' });
    expect(key).toBe('test:a=1&b=two');
  });

  it('should sort params alphabetically', () => {
    const key = createCacheKey('test', { z: 'last', a: 'first', m: 'middle' });
    expect(key).toBe('test:a=first&m=middle&z=last');
  });

  it('should filter out undefined values', () => {
    const key = createCacheKey('test', { a: 1, b: undefined, c: 3 });
    expect(key).toBe('test:a=1&c=3');
  });

  it('should handle empty params', () => {
    const key = createCacheKey('test', {});
    expect(key).toBe('test:');
  });

  it('should handle boolean values', () => {
    const key = createCacheKey('test', { flag: true, other: false });
    expect(key).toBe('test:flag=true&other=false');
  });
});
