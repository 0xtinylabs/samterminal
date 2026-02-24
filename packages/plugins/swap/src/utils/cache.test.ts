/**
 * Cache utility tests
 */


import { Cache, createCacheKey } from './cache.js';

describe('Cache', () => {
  let cache: Cache<string>;

  beforeEach(() => {
    cache = new Cache<string>(1000); // 1 second TTL
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create cache with default TTL', () => {
      const defaultCache = new Cache<string>();
      expect(defaultCache).toBeDefined();
    });

    it('should create cache with custom TTL', () => {
      const customCache = new Cache<string>(5000);
      expect(customCache).toBeDefined();
    });
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should overwrite existing values', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
    });

    it('should store different types of values', () => {
      const numberCache = new Cache<number>();
      numberCache.set('num', 42);
      expect(numberCache.get('num')).toBe(42);

      const objectCache = new Cache<{ a: number }>();
      objectCache.set('obj', { a: 1 });
      expect(objectCache.get('obj')).toEqual({ a: 1 });
    });
  });

  describe('TTL expiration', () => {
    it('should return value before TTL expires', () => {
      cache.set('key1', 'value1');
      jest.advanceTimersByTime(500); // 500ms < 1000ms TTL
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined after TTL expires', () => {
      cache.set('key1', 'value1');
      jest.advanceTimersByTime(1001); // > 1000ms TTL
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should use custom TTL when provided', () => {
      cache.set('key1', 'value1', 500); // 500ms TTL
      jest.advanceTimersByTime(400);
      expect(cache.get('key1')).toBe('value1');
      jest.advanceTimersByTime(200);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should delete expired entries on access', () => {
      cache.set('key1', 'value1');
      jest.advanceTimersByTime(1001);
      cache.get('key1'); // This should delete the entry
      expect(cache.size).toBe(0);
    });
  });

  describe('has', () => {
    it('should return true for existing valid keys', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired keys', () => {
      cache.set('key1', 'value1');
      jest.advanceTimersByTime(1001);
      expect(cache.has('key1')).toBe(false);
    });

    it('should delete expired entries when checking', () => {
      cache.set('key1', 'value1');
      jest.advanceTimersByTime(1001);
      cache.has('key1');
      expect(cache.size).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete existing keys', () => {
      cache.set('key1', 'value1');
      const result = cache.delete('key1');
      expect(result).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should return false for non-existent keys', () => {
      const result = cache.delete('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      expect(cache.size).toBe(3);

      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
    });
  });

  describe('size', () => {
    it('should return correct size', () => {
      expect(cache.size).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.size).toBe(1);
      cache.set('key2', 'value2');
      expect(cache.size).toBe(2);
    });

    it('should count expired entries until accessed', () => {
      cache.set('key1', 'value1');
      jest.advanceTimersByTime(1001);
      // Size still shows 1 until the entry is accessed
      expect(cache.size).toBe(1);
      cache.get('key1'); // Access cleans up
      expect(cache.size).toBe(0);
    });
  });
});

describe('createCacheKey', () => {
  it('should create key with prefix and params', () => {
    const key = createCacheKey('quote', { a: 1, b: 'test' });
    expect(key).toBe('quote:a=1&b=test');
  });

  it('should sort params alphabetically', () => {
    const key = createCacheKey('price', { z: 1, a: 2, m: 3 });
    expect(key).toBe('price:a=2&m=3&z=1');
  });

  it('should filter undefined values', () => {
    const key = createCacheKey('swap', { a: 1, b: undefined, c: 3 });
    expect(key).toBe('swap:a=1&c=3');
  });

  it('should handle empty params', () => {
    const key = createCacheKey('empty', {});
    expect(key).toBe('empty:');
  });

  it('should handle various value types', () => {
    const key = createCacheKey('mixed', {
      string: 'hello',
      number: 42,
      boolean: true,
      bigint: BigInt(123),
    });
    expect(key).toContain('string=hello');
    expect(key).toContain('number=42');
    expect(key).toContain('boolean=true');
    expect(key).toContain('bigint=123');
  });

  it('should create consistent keys for same params', () => {
    const key1 = createCacheKey('test', { a: 1, b: 2 });
    const key2 = createCacheKey('test', { b: 2, a: 1 });
    expect(key1).toBe(key2);
  });

  it('should create different keys for different prefixes', () => {
    const key1 = createCacheKey('quote', { a: 1 });
    const key2 = createCacheKey('price', { a: 1 });
    expect(key1).not.toBe(key2);
  });
});
