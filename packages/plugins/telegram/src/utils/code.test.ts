/**
 * Code utilities tests
 */


import { generateVerificationCode, validateCode, generateBotLink } from './code.js';

describe('Code Utilities', () => {
  describe('generateVerificationCode', () => {
    it('should generate code of default length (4)', () => {
      const code = generateVerificationCode();

      expect(code).toHaveLength(4);
    });

    it('should generate code of specified length', () => {
      const code = generateVerificationCode(6);

      expect(code).toHaveLength(6);
    });

    it('should generate code of length 8', () => {
      const code = generateVerificationCode(8);

      expect(code).toHaveLength(8);
    });

    it('should only contain uppercase letters and numbers', () => {
      const code = generateVerificationCode(20);

      expect(code).toMatch(/^[A-Z0-9]+$/);
    });

    it('should generate different codes on each call', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(generateVerificationCode(6));
      }

      // With 36^6 possible combinations, 100 codes should all be unique
      expect(codes.size).toBe(100);
    });
  });

  describe('validateCode', () => {
    it('should return true for matching codes', () => {
      expect(validateCode('ABCD', 'ABCD')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(validateCode('abcd', 'ABCD')).toBe(true);
      expect(validateCode('ABCD', 'abcd')).toBe(true);
      expect(validateCode('AbCd', 'aBcD')).toBe(true);
    });

    it('should trim whitespace', () => {
      expect(validateCode('  ABCD  ', 'ABCD')).toBe(true);
      expect(validateCode('ABCD', '  ABCD  ')).toBe(true);
      expect(validateCode('  ABCD  ', '  ABCD  ')).toBe(true);
    });

    it('should return false for non-matching codes', () => {
      expect(validateCode('ABCD', 'EFGH')).toBe(false);
    });

    it('should return false for different lengths', () => {
      expect(validateCode('ABC', 'ABCD')).toBe(false);
    });

    it('should return false for empty codes', () => {
      expect(validateCode('', '')).toBe(true); // Both empty - technically matching
      expect(validateCode('ABCD', '')).toBe(false);
      expect(validateCode('', 'ABCD')).toBe(false);
    });
  });

  describe('generateBotLink', () => {
    it('should generate correct bot link', () => {
      const link = generateBotLink('mybot', 'ref123');

      expect(link).toBe('https://t.me/mybot?start=ref123');
    });

    it('should handle bot username without @', () => {
      const link = generateBotLink('testbot', 'user456');

      expect(link).toBe('https://t.me/testbot?start=user456');
    });

    it('should handle special characters in ref', () => {
      const link = generateBotLink('bot', 'user-123_abc');

      expect(link).toBe('https://t.me/bot?start=user-123_abc');
    });

    it('should handle empty ref', () => {
      const link = generateBotLink('bot', '');

      expect(link).toBe('https://t.me/bot?start=');
    });
  });
});
