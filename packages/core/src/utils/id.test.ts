
import {
  uuid,
  shortId,
  nanoId,
  prefixedId,
  isValidUuid,
  timestampId,
} from './id.js';

describe('id utils', () => {
  describe('uuid', () => {
    it('should generate valid UUID v4 format', () => {
      const id = uuid();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      // where y is one of 8, 9, a, or b
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const ids = new Set<string>();
      const count = 1000;

      for (let i = 0; i < count; i++) {
        ids.add(uuid());
      }

      expect(ids.size).toBe(count);
    });

    it('should have version 4 indicator', () => {
      const id = uuid();
      const versionChar = id.charAt(14);
      expect(versionChar).toBe('4');
    });

    it('should have correct variant bits', () => {
      const id = uuid();
      const variantChar = id.charAt(19);
      expect(['8', '9', 'a', 'b']).toContain(variantChar.toLowerCase());
    });
  });

  describe('shortId', () => {
    it('should generate 12-character hex string', () => {
      const id = shortId();

      expect(id).toHaveLength(12);
      expect(id).toMatch(/^[0-9a-f]{12}$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      const count = 1000;

      for (let i = 0; i < count; i++) {
        ids.add(shortId());
      }

      expect(ids.size).toBe(count);
    });
  });

  describe('nanoId', () => {
    it('should generate default 21-character ID', () => {
      const id = nanoId();

      expect(id).toHaveLength(21);
    });

    it('should generate custom-length ID', () => {
      expect(nanoId(10)).toHaveLength(10);
      expect(nanoId(32)).toHaveLength(32);
      expect(nanoId(1)).toHaveLength(1);
    });

    it('should use URL-safe alphabet', () => {
      const id = nanoId(100);
      const urlSafeRegex = /^[A-Za-z0-9_-]+$/;
      expect(id).toMatch(urlSafeRegex);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      const count = 1000;

      for (let i = 0; i < count; i++) {
        ids.add(nanoId());
      }

      expect(ids.size).toBe(count);
    });
  });

  describe('prefixedId', () => {
    it('should generate ID with prefix', () => {
      const id = prefixedId('user');

      expect(id).toMatch(/^user_[0-9a-f]{12}$/);
    });

    it('should use different prefixes', () => {
      const userId = prefixedId('user');
      const orderId = prefixedId('order');
      const txId = prefixedId('tx');

      expect(userId.startsWith('user_')).toBe(true);
      expect(orderId.startsWith('order_')).toBe(true);
      expect(txId.startsWith('tx_')).toBe(true);
    });

    it('should generate unique IDs with same prefix', () => {
      const ids = new Set<string>();
      const count = 100;

      for (let i = 0; i < count; i++) {
        ids.add(prefixedId('test'));
      }

      expect(ids.size).toBe(count);
    });
  });

  describe('isValidUuid', () => {
    it('should return true for valid UUID v4', () => {
      expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(false); // v1, not v4
      expect(isValidUuid(uuid())).toBe(true);
    });

    it('should return true for generated UUIDs', () => {
      for (let i = 0; i < 100; i++) {
        expect(isValidUuid(uuid())).toBe(true);
      }
    });

    it('should return false for invalid UUIDs', () => {
      expect(isValidUuid('')).toBe(false);
      expect(isValidUuid('not-a-uuid')).toBe(false);
      expect(isValidUuid('550e8400-e29b-41d4-a716')).toBe(false);
      expect(isValidUuid('550e8400-e29b-31d4-a716-446655440000')).toBe(false); // wrong version
      expect(isValidUuid('550e8400-e29b-41d4-c716-446655440000')).toBe(false); // wrong variant
      expect(isValidUuid('550e8400e29b41d4a716446655440000')).toBe(false); // no dashes
    });

    it('should be case insensitive', () => {
      expect(isValidUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
      expect(isValidUuid('550e8400-E29B-41d4-A716-446655440000')).toBe(true);
    });
  });

  describe('timestampId', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('should generate ID with timestamp and random part', () => {
      jest.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));

      const id = timestampId();
      const [timestamp, random] = id.split('-');

      expect(timestamp).toBeDefined();
      expect(random).toBeDefined();
      expect(random).toMatch(/^[0-9a-f]{8}$/);
    });

    it('should have different timestamps at different times', () => {
      jest.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
      const id1 = timestampId();

      jest.setSystemTime(new Date('2024-01-15T10:30:01.000Z'));
      const id2 = timestampId();

      const timestamp1 = id1.split('-')[0];
      const timestamp2 = id2.split('-')[0];

      expect(timestamp1).not.toBe(timestamp2);
    });

    it('should have unique random parts at same time', () => {
      jest.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));

      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(timestampId());
      }

      expect(ids.size).toBe(100);
    });

    afterEach(() => {
      jest.useRealTimers();
    });
  });
});
