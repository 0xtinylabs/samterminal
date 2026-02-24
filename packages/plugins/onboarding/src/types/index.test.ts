/**
 * Types utility functions tests
 */


import {
  generateId,
  calculateProgress,
  isValidEmail,
  isValidWalletAddress,
  isValidPhone,
} from './index.js';

describe('Types Utility Functions', () => {
  describe('generateId', () => {
    it('should generate a non-empty string', () => {
      const id = generateId();
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });

    it('should contain a hyphen', () => {
      const id = generateId();
      expect(id).toContain('-');
    });

    it('should have proper format (timestamp-random)', () => {
      const id = generateId();
      const parts = id.split('-');
      expect(parts.length).toBe(2);
      expect(parts[0].length).toBeGreaterThan(0);
      expect(parts[1].length).toBeGreaterThan(0);
    });
  });

  describe('calculateProgress', () => {
    it('should return 0 for no completed steps', () => {
      const result = calculateProgress([], [], 5);
      expect(result).toBe(0);
    });

    it('should return 100 for all completed steps', () => {
      const result = calculateProgress(['step1', 'step2', 'step3'], [], 3);
      expect(result).toBe(100);
    });

    it('should count skipped steps in progress', () => {
      const result = calculateProgress(['step1'], ['step2'], 4);
      expect(result).toBe(50);
    });

    it('should return 100 when totalSteps is 0', () => {
      const result = calculateProgress([], [], 0);
      expect(result).toBe(100);
    });

    it('should round percentage to integer', () => {
      const result = calculateProgress(['step1'], [], 3);
      expect(result).toBe(33); // 33.33 rounded
    });

    it('should handle partial completion', () => {
      const result = calculateProgress(['step1', 'step2'], ['step3'], 5);
      expect(result).toBe(60);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
    });
  });

  describe('isValidWalletAddress', () => {
    it('should return true for valid EVM addresses', () => {
      expect(isValidWalletAddress('0x1234567890123456789012345678901234567890')).toBe(true);
      expect(isValidWalletAddress('0xABCDEF1234567890abcdef1234567890ABCDEF12')).toBe(true);
    });

    it('should return false for invalid addresses', () => {
      expect(isValidWalletAddress('')).toBe(false);
      expect(isValidWalletAddress('0x123')).toBe(false); // Too short
      expect(isValidWalletAddress('1234567890123456789012345678901234567890')).toBe(false); // No 0x
      expect(isValidWalletAddress('0x12345678901234567890123456789012345678901')).toBe(false); // Too long
      expect(isValidWalletAddress('0xGGGG567890123456789012345678901234567890')).toBe(false); // Invalid chars
    });
  });

  describe('isValidPhone', () => {
    it('should return true for valid phone numbers', () => {
      expect(isValidPhone('+12025551234')).toBe(true);
      expect(isValidPhone('+905551234567')).toBe(true);
      expect(isValidPhone('12025551234')).toBe(true);
      expect(isValidPhone('+1 202 555 1234')).toBe(true); // With spaces
      expect(isValidPhone('+1-202-555-1234')).toBe(true); // With dashes
      expect(isValidPhone('+1 (202) 555-1234')).toBe(true); // With parentheses
    });

    it('should return false for invalid phone numbers', () => {
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone('abc123')).toBe(false);
      expect(isValidPhone('12345')).toBe(false); // Too short
      expect(isValidPhone('+012345678901234567890')).toBe(false); // Too long
      expect(isValidPhone('+0123456')).toBe(false); // Starts with 0 after +
    });
  });
});
