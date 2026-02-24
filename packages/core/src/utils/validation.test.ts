
import {
  validResult,
  invalidResult,
  isDefined,
  isNonEmptyString,
  isPositiveNumber,
  isNonNegativeNumber,
  isInteger,
  isObject,
  isNonEmptyArray,
  isEthereumAddress,

  isTransactionHash,
  isValidUrl,
  isValidEmail,
  Validator,
  validate,
  combineValidations,
} from './validation.js';

describe('validation utils', () => {
  describe('validResult', () => {
    it('should return valid result', () => {
      const result = validResult();
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
  });

  describe('invalidResult', () => {
    it('should return invalid result with errors', () => {
      const errors = ['Error 1', 'Error 2'];
      const result = invalidResult(errors);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(errors);
    });

    it('should return invalid result with empty errors', () => {
      const result = invalidResult([]);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([]);
    });
  });

  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined('')).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined([])).toBe(true);
      expect(isDefined({})).toBe(true);
    });

    it('should return false for null and undefined', () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('  hello  ')).toBe(true);
      expect(isNonEmptyString('0')).toBe(true);
    });

    it('should return false for empty or whitespace strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString('\t\n')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString([])).toBe(false);
      expect(isNonEmptyString({})).toBe(false);
    });
  });

  describe('isPositiveNumber', () => {
    it('should return true for positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(0.1)).toBe(true);
      expect(isPositiveNumber(Number.MAX_VALUE)).toBe(true);
    });

    it('should return false for zero and negative numbers', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber(-0.1)).toBe(false);
    });

    it('should return false for NaN and non-numbers', () => {
      expect(isPositiveNumber(NaN)).toBe(false);
      expect(isPositiveNumber('1')).toBe(false);
      expect(isPositiveNumber(null)).toBe(false);
    });
  });

  describe('isNonNegativeNumber', () => {
    it('should return true for zero and positive numbers', () => {
      expect(isNonNegativeNumber(0)).toBe(true);
      expect(isNonNegativeNumber(1)).toBe(true);
      expect(isNonNegativeNumber(0.1)).toBe(true);
    });

    it('should return false for negative numbers', () => {
      expect(isNonNegativeNumber(-1)).toBe(false);
      expect(isNonNegativeNumber(-0.1)).toBe(false);
    });

    it('should return false for NaN and non-numbers', () => {
      expect(isNonNegativeNumber(NaN)).toBe(false);
      expect(isNonNegativeNumber('0')).toBe(false);
    });
  });

  describe('isInteger', () => {
    it('should return true for integers', () => {
      expect(isInteger(0)).toBe(true);
      expect(isInteger(1)).toBe(true);
      expect(isInteger(-1)).toBe(true);
      expect(isInteger(Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    it('should return false for non-integers', () => {
      expect(isInteger(0.1)).toBe(false);
      expect(isInteger(1.5)).toBe(false);
      expect(isInteger(NaN)).toBe(false);
      expect(isInteger(Infinity)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isInteger('1')).toBe(false);
      expect(isInteger(null)).toBe(false);
    });
  });

  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
      expect(isObject(Object.create(null))).toBe(true);
    });

    it('should return false for null', () => {
      expect(isObject(null)).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(isObject([])).toBe(false);
      expect(isObject([1, 2, 3])).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject(undefined)).toBe(false);
    });
  });

  describe('isNonEmptyArray', () => {
    it('should return true for non-empty arrays', () => {
      expect(isNonEmptyArray([1])).toBe(true);
      expect(isNonEmptyArray([1, 2, 3])).toBe(true);
      expect(isNonEmptyArray([null])).toBe(true);
    });

    it('should return false for empty arrays', () => {
      expect(isNonEmptyArray([])).toBe(false);
    });

    it('should return false for non-arrays', () => {
      expect(isNonEmptyArray(null)).toBe(false);
      expect(isNonEmptyArray(undefined)).toBe(false);
      expect(isNonEmptyArray('array')).toBe(false);
      expect(isNonEmptyArray({ length: 1 })).toBe(false);
    });
  });

  describe('isEthereumAddress', () => {
    it('should return true for valid Ethereum addresses', () => {
      expect(isEthereumAddress('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')).toBe(true);
      expect(isEthereumAddress('0x0000000000000000000000000000000000000000')).toBe(true);
      expect(isEthereumAddress('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')).toBe(true);
    });

    it('should return false for invalid Ethereum addresses', () => {
      expect(isEthereumAddress('0x123')).toBe(false);
      expect(isEthereumAddress('f39Fd6e51aad88F6F4ce6aB8827279cffFb92266')).toBe(false);
      expect(isEthereumAddress('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb9226')).toBe(false);
      expect(isEthereumAddress('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb922667')).toBe(false);
      expect(isEthereumAddress('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isEthereumAddress(null)).toBe(false);
      expect(isEthereumAddress(123)).toBe(false);
    });
  });

  describe('isTransactionHash', () => {
    it('should return true for valid transaction hashes', () => {
      expect(isTransactionHash('0x' + 'a'.repeat(64))).toBe(true);
      expect(isTransactionHash('0x' + '0'.repeat(64))).toBe(true);
      expect(isTransactionHash('0x' + 'F'.repeat(64))).toBe(true);
    });

    it('should return false for invalid transaction hashes', () => {
      expect(isTransactionHash('0x' + 'a'.repeat(63))).toBe(false);
      expect(isTransactionHash('0x' + 'a'.repeat(65))).toBe(false);
      expect(isTransactionHash('a'.repeat(64))).toBe(false);
      expect(isTransactionHash('0x' + 'g'.repeat(64))).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isTransactionHash(null)).toBe(false);
      expect(isTransactionHash(123)).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=value')).toBe(true);
      expect(isValidUrl('ftp://ftp.example.com')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isValidUrl(null)).toBe(false);
      expect(isValidUrl(123)).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('spaces in@email.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(123)).toBe(false);
    });
  });

  describe('Validator class', () => {
    describe('required', () => {
      it('should add error for undefined values', () => {
        const validator = new Validator(undefined, 'field');
        validator.required();
        expect(validator.isValid()).toBe(false);
        expect(validator.getErrors()).toContain('field is required');
      });

      it('should add error for null values', () => {
        const validator = new Validator(null, 'field');
        validator.required();
        expect(validator.isValid()).toBe(false);
      });

      it('should pass for defined values', () => {
        const validator = new Validator('value', 'field');
        validator.required();
        expect(validator.isValid()).toBe(true);
      });

      it('should pass for falsy but defined values', () => {
        expect(new Validator(0, 'field').required().isValid()).toBe(true);
        expect(new Validator('', 'field').required().isValid()).toBe(true);
        expect(new Validator(false, 'field').required().isValid()).toBe(true);
      });
    });

    describe('string', () => {
      it('should add error for non-string values', () => {
        const validator = new Validator(123, 'field');
        validator.string();
        expect(validator.isValid()).toBe(false);
        expect(validator.getErrors()).toContain('field must be a string');
      });

      it('should pass for string values', () => {
        const validator = new Validator('value', 'field');
        validator.string();
        expect(validator.isValid()).toBe(true);
      });

      it('should skip validation for undefined', () => {
        const validator = new Validator(undefined, 'field');
        validator.string();
        expect(validator.isValid()).toBe(true);
      });
    });

    describe('number', () => {
      it('should add error for non-number values', () => {
        const validator = new Validator('123', 'field');
        validator.number();
        expect(validator.isValid()).toBe(false);
        expect(validator.getErrors()).toContain('field must be a number');
      });

      it('should pass for number values', () => {
        const validator = new Validator(123, 'field');
        validator.number();
        expect(validator.isValid()).toBe(true);
      });
    });

    describe('boolean', () => {
      it('should add error for non-boolean values', () => {
        const validator = new Validator('true', 'field');
        validator.boolean();
        expect(validator.isValid()).toBe(false);
        expect(validator.getErrors()).toContain('field must be a boolean');
      });

      it('should pass for boolean values', () => {
        expect(new Validator(true, 'field').boolean().isValid()).toBe(true);
        expect(new Validator(false, 'field').boolean().isValid()).toBe(true);
      });
    });

    describe('array', () => {
      it('should add error for non-array values', () => {
        const validator = new Validator({}, 'field');
        validator.array();
        expect(validator.isValid()).toBe(false);
        expect(validator.getErrors()).toContain('field must be an array');
      });

      it('should pass for array values', () => {
        const validator = new Validator([], 'field');
        validator.array();
        expect(validator.isValid()).toBe(true);
      });
    });

    describe('object', () => {
      it('should add error for non-object values', () => {
        const validator = new Validator([], 'field');
        validator.object();
        expect(validator.isValid()).toBe(false);
        expect(validator.getErrors()).toContain('field must be an object');
      });

      it('should pass for object values', () => {
        const validator = new Validator({}, 'field');
        validator.object();
        expect(validator.isValid()).toBe(true);
      });
    });

    describe('min', () => {
      it('should validate minimum for numbers', () => {
        expect(new Validator(5, 'field').min(3).isValid()).toBe(true);
        expect(new Validator(3, 'field').min(3).isValid()).toBe(true);
        expect(new Validator(2, 'field').min(3).isValid()).toBe(false);
      });

      it('should validate minimum length for strings', () => {
        expect(new Validator('hello', 'field').min(3).isValid()).toBe(true);
        expect(new Validator('hi', 'field').min(3).isValid()).toBe(false);
      });

      it('should validate minimum length for arrays', () => {
        expect(new Validator([1, 2, 3], 'field').min(2).isValid()).toBe(true);
        expect(new Validator([1], 'field').min(2).isValid()).toBe(false);
      });
    });

    describe('max', () => {
      it('should validate maximum for numbers', () => {
        expect(new Validator(5, 'field').max(10).isValid()).toBe(true);
        expect(new Validator(10, 'field').max(10).isValid()).toBe(true);
        expect(new Validator(11, 'field').max(10).isValid()).toBe(false);
      });

      it('should validate maximum length for strings', () => {
        expect(new Validator('hi', 'field').max(5).isValid()).toBe(true);
        expect(new Validator('hello world', 'field').max(5).isValid()).toBe(false);
      });

      it('should validate maximum length for arrays', () => {
        expect(new Validator([1, 2], 'field').max(3).isValid()).toBe(true);
        expect(new Validator([1, 2, 3, 4], 'field').max(3).isValid()).toBe(false);
      });
    });

    describe('pattern', () => {
      it('should validate pattern for strings', () => {
        expect(new Validator('ABC123', 'field').pattern(/^[A-Z0-9]+$/).isValid()).toBe(true);
        expect(new Validator('abc', 'field').pattern(/^[A-Z]+$/).isValid()).toBe(false);
      });

      it('should use custom error message', () => {
        const validator = new Validator('abc', 'field');
        validator.pattern(/^[A-Z]+$/, 'Must be uppercase');
        expect(validator.getErrors()).toContain('Must be uppercase');
      });
    });

    describe('custom', () => {
      it('should run custom validation function', () => {
        const isEven = (v: unknown) => typeof v === 'number' && v % 2 === 0;
        expect(new Validator(4, 'field').custom(isEven, 'Must be even').isValid()).toBe(true);
        expect(new Validator(3, 'field').custom(isEven, 'Must be even').isValid()).toBe(false);
      });
    });

    describe('chaining', () => {
      it('should support method chaining', () => {
        const validator = new Validator('hello', 'field')
          .required()
          .string()
          .min(3)
          .max(10);

        expect(validator.isValid()).toBe(true);
      });

      it('should collect multiple errors', () => {
        const validator = new Validator('', 'field')
          .required()
          .string()
          .min(3);

        expect(validator.isValid()).toBe(false);
        expect(validator.getErrors().length).toBeGreaterThan(0);
      });
    });

    describe('getResult', () => {
      it('should return valid result for valid validation', () => {
        const result = new Validator('hello', 'field').required().string().getResult();
        expect(result.valid).toBe(true);
      });

      it('should return invalid result with errors', () => {
        const result = new Validator(undefined, 'field').required().getResult();
        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
      });
    });
  });

  describe('validate helper', () => {
    it('should create a validator instance', () => {
      const validator = validate('value', 'field');
      expect(validator).toBeInstanceOf(Validator);
    });

    it('should allow chaining from helper', () => {
      const result = validate('hello', 'field').required().string().getResult();
      expect(result.valid).toBe(true);
    });
  });

  describe('combineValidations', () => {
    it('should return valid for all valid results', () => {
      const result = combineValidations(
        validResult(),
        validResult(),
        validResult(),
      );
      expect(result.valid).toBe(true);
    });

    it('should return invalid if any result is invalid', () => {
      const result = combineValidations(
        validResult(),
        invalidResult(['Error 1']),
        validResult(),
      );
      expect(result.valid).toBe(false);
    });

    it('should combine all errors', () => {
      const result = combineValidations(
        invalidResult(['Error 1']),
        invalidResult(['Error 2', 'Error 3']),
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['Error 1', 'Error 2', 'Error 3']);
    });

    it('should handle empty results', () => {
      const result = combineValidations();
      expect(result.valid).toBe(true);
    });
  });
});
