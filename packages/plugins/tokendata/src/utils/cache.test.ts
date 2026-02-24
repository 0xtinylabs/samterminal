/**
 * Cache utility tests
 */


import { Cache, createCacheKey } from './cache.js';

describe('Cache', () => {
  let cache: Cache<string>;

  beforeEach(() => {
    jest.useFakeTimers();
    cache = new Cache<string>(1000); // 1 second default TTL
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create cache with default TTL', () => {
      const defaultCache = new Cache<number>();
      expect(defaultCache).toBeInstanceOf(Cache);
    });

    it('should create cache with custom TTL', () => {
      const customCache = new Cache<number>(5000);
      expect(customCache).toBeInstanceOf(Cache);
    });
  });

  describe('set and get', () => {
    it('should store and retrieve a value', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent key', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should overwrite existing value', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
    });

    it('should use custom TTL when provided', () => {
      cache.set('key1', 'value1', 500);

      jest.advanceTimersByTime(400);
      expect(cache.get('key1')).toBe('value1');

      jest.advanceTimersByTime(200);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should expire after default TTL', () => {
      cache.set('key1', 'value1');

      jest.advanceTimersByTime(900);
      expect(cache.get('key1')).toBe('value1');

      jest.advanceTimersByTime(200);
      expect(cache.get('key1')).toBeUndefined();
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

    it('should delete expired key when checking', () => {
      cache.set('key1', 'value1');
      jest.advanceTimersByTime(1100);
      cache.has('key1');
      expect(cache.size).toBe(0);
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
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.size).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      cache.set('key1', 'value1', 500);
      cache.set('key2', 'value2', 1500);
      cache.set('key3', 'value3', 2000);

      jest.advanceTimersByTime(1000);

      const removed = cache.cleanup();

      expect(removed).toBe(1); // key1 should be removed
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
    });

    it('should return 0 when no entries expired', () => {
      cache.set('key1', 'value1', 5000);
      cache.set('key2', 'value2', 5000);

      jest.advanceTimersByTime(1000);

      expect(cache.cleanup()).toBe(0);
    });

    it('should return 0 for empty cache', () => {
      expect(cache.cleanup()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return 0 for empty cache', () => {
      expect(cache.size).toBe(0);
    });

    it('should return correct count', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.size).toBe(3);
    });

    it('should not count expired entries until accessed', () => {
      cache.set('key1', 'value1', 500);
      cache.set('key2', 'value2', 2000);

      jest.advanceTimersByTime(1000);

      // Size still shows 2 because expired entries aren't removed until accessed
      expect(cache.size).toBe(2);

      // Access expired key to trigger removal
      cache.get('key1');
      expect(cache.size).toBe(1);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      cache.set('key1', 'cached_value');

      const factory = jest.fn().mockResolvedValue('new_value');
      const result = await cache.getOrSet('key1', factory);

      expect(result).toBe('cached_value');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result if not exists', async () => {
      const factory = jest.fn().mockResolvedValue('factory_value');
      const result = await cache.getOrSet('key1', factory);

      expect(result).toBe('factory_value');
      expect(factory).toHaveBeenCalledTimes(1);
      expect(cache.get('key1')).toBe('factory_value');
    });

    it('should call factory if cached value expired', async () => {
      cache.set('key1', 'old_value', 500);
      jest.advanceTimersByTime(600);

      const factory = jest.fn().mockResolvedValue('new_value');
      const result = await cache.getOrSet('key1', factory);

      expect(result).toBe('new_value');
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('should use custom TTL for new values', async () => {
      const factory = jest.fn().mockResolvedValue('value');
      await cache.getOrSet('key1', factory, 2000);

      jest.advanceTimersByTime(1500);
      expect(cache.get('key1')).toBe('value');

      jest.advanceTimersByTime(600);
      expect(cache.get('key1')).toBeUndefined();
    });
  });
});

describe('createCacheKey', () => {
  it('should create key from prefix and params', () => {
    const key = createCacheKey('price', { address: '0x123', chainId: 'base' });
    expect(key).toBe('price:address=0x123&chainId=base');
  });

  it('should sort params alphabetically', () => {
    const key = createCacheKey('test', { z: '3', a: '1', m: '2' });
    expect(key).toBe('test:a=1&m=2&z=3');
  });

  it('should filter out undefined values', () => {
    const key = createCacheKey('test', { a: '1', b: undefined, c: '3' });
    expect(key).toBe('test:a=1&c=3');
  });

  it('should handle empty params', () => {
    const key = createCacheKey('empty', {});
    expect(key).toBe('empty:');
  });

  it('should convert non-string values to strings', () => {
    const key = createCacheKey('test', { num: 123, bool: true });
    expect(key).toBe('test:bool=true&num=123');
  });

  it('should handle special characters in values', () => {
    const key = createCacheKey('test', { query: 'hello world' });
    expect(key).toBe('test:query=hello world');
  });
});
