/**
 * Validation utilities
 */

import type { ValidationResult } from '../types/index.js';

/**
 * Create a successful validation result
 */
export function validResult(): ValidationResult {
  return { valid: true };
}

/**
 * Create a failed validation result
 */
export function invalidResult(errors: string[]): ValidationResult {
  return { valid: false, errors };
}

/**
 * Check if value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Check if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Check if value is a non-negative number
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}

/**
 * Check if value is a valid integer
 */
export function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

/**
 * Check if value is an object (not null, not array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if value is a non-empty array
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Check if value is a valid Ethereum address
 */
export function isEthereumAddress(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

/**
 * Check if value is a valid transaction hash (EVM)
 */
export function isTransactionHash(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

/**
 * Check if value is a valid URL
 */
export function isValidUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try {
    new URL(value);
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Check if value is a valid email
 */
export function isValidEmail(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Validator builder for chaining validations
 */
export class Validator {
  private errors: string[] = [];
  private value: unknown;
  private fieldName: string;

  constructor(value: unknown, fieldName: string) {
    this.value = value;
    this.fieldName = fieldName;
  }

  required(): this {
    if (!isDefined(this.value)) {
      this.errors.push(`${this.fieldName} is required`);
    }
    return this;
  }

  string(): this {
    if (isDefined(this.value) && typeof this.value !== 'string') {
      this.errors.push(`${this.fieldName} must be a string`);
    }
    return this;
  }

  number(): this {
    if (isDefined(this.value) && typeof this.value !== 'number') {
      this.errors.push(`${this.fieldName} must be a number`);
    }
    return this;
  }

  boolean(): this {
    if (isDefined(this.value) && typeof this.value !== 'boolean') {
      this.errors.push(`${this.fieldName} must be a boolean`);
    }
    return this;
  }

  array(): this {
    if (isDefined(this.value) && !Array.isArray(this.value)) {
      this.errors.push(`${this.fieldName} must be an array`);
    }
    return this;
  }

  object(): this {
    if (isDefined(this.value) && !isObject(this.value)) {
      this.errors.push(`${this.fieldName} must be an object`);
    }
    return this;
  }

  min(min: number): this {
    if (typeof this.value === 'number' && this.value < min) {
      this.errors.push(`${this.fieldName} must be at least ${min}`);
    }
    if (typeof this.value === 'string' && this.value.length < min) {
      this.errors.push(`${this.fieldName} must be at least ${min} characters`);
    }
    if (Array.isArray(this.value) && this.value.length < min) {
      this.errors.push(`${this.fieldName} must have at least ${min} items`);
    }
    return this;
  }

  max(max: number): this {
    if (typeof this.value === 'number' && this.value > max) {
      this.errors.push(`${this.fieldName} must be at most ${max}`);
    }
    if (typeof this.value === 'string' && this.value.length > max) {
      this.errors.push(`${this.fieldName} must be at most ${max} characters`);
    }
    if (Array.isArray(this.value) && this.value.length > max) {
      this.errors.push(`${this.fieldName} must have at most ${max} items`);
    }
    return this;
  }

  pattern(regex: RegExp, message?: string): this {
    if (typeof this.value === 'string' && !regex.test(this.value)) {
      this.errors.push(message ?? `${this.fieldName} has invalid format`);
    }
    return this;
  }

  custom(fn: (value: unknown) => boolean, message: string): this {
    if (isDefined(this.value) && !fn(this.value)) {
      this.errors.push(message);
    }
    return this;
  }

  getErrors(): string[] {
    return [...this.errors];
  }

  isValid(): boolean {
    return this.errors.length === 0;
  }

  getResult(): ValidationResult {
    return this.isValid() ? validResult() : invalidResult(this.errors);
  }
}

/**
 * Create a validator for a value
 */
export function validate(value: unknown, fieldName: string): Validator {
  return new Validator(value, fieldName);
}

/**
 * Combine multiple validation results
 */
export function combineValidations(...results: ValidationResult[]): ValidationResult {
  const errors: string[] = [];

  for (const result of results) {
    if (!result.valid && result.errors) {
      errors.push(...result.errors);
    }
  }

  return errors.length === 0 ? validResult() : invalidResult(errors);
}
