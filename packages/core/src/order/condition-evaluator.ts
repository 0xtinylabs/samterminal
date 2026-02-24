/**
 * Condition Evaluator
 *
 * Evaluates conditions against token data snapshots.
 * Supports single conditions, nested groups, AND/OR logic,
 * and various comparison operators including 'between' and 'change'.
 */

import type {
  Condition,
  ConditionGroup,
  SingleCondition,
  OrderConditionOperator,
  ConditionField,
  TokenDataSnapshot,
  ConditionEvaluationResult,
  ConditionDetail,
} from './types.js';
import { isConditionGroup, isSingleCondition } from './types.js';

/**
 * Cache entry for tracking previous values (used for 'change' operator)
 */
interface CacheEntry {
  value: number;
  timestamp: number;
}

/**
 * Configuration for ConditionEvaluator
 */
export interface ConditionEvaluatorConfig {
  /** Cache TTL for previous values in milliseconds (default: 5 minutes) */
  cacheTtl?: number;
  /** Whether to collect detailed results (default: true) */
  collectDetails?: boolean;
}

/**
 * Condition Evaluator Class
 *
 * Evaluates complex condition trees against token data.
 *
 * @example
 * ```typescript
 * const evaluator = new ConditionEvaluator();
 *
 * const condition: ConditionGroup = {
 *   operator: 'OR',
 *   conditions: [
 *     { field: 'price', operator: 'lt', value: 3000 },
 *     {
 *       operator: 'AND',
 *       conditions: [
 *         { field: 'mcap', operator: 'gt', value: 500_000_000_000 },
 *         { field: 'volume24h', operator: 'gt', value: 10_000_000_000 }
 *       ]
 *     }
 *   ]
 * };
 *
 * const result = evaluator.evaluate(condition, tokenData);
 * console.log(result.met); // true or false
 * ```
 */
export class ConditionEvaluator {
  private previousValues: Map<string, CacheEntry> = new Map();
  private config: Required<ConditionEvaluatorConfig>;

  constructor(config: ConditionEvaluatorConfig = {}) {
    this.config = {
      cacheTtl: config.cacheTtl ?? 5 * 60 * 1000, // 5 minutes
      collectDetails: config.collectDetails ?? true,
    };
  }

  /**
   * Evaluate a condition or condition group against token data
   */
  evaluate(
    condition: Condition,
    data: TokenDataSnapshot,
    tokenKey?: string,
  ): ConditionEvaluationResult {
    const details: ConditionDetail[] = [];
    const met = this.evaluateCondition(condition, data, details, tokenKey);

    return {
      met,
      details: this.config.collectDetails ? details : [],
      evaluatedAt: new Date(),
    };
  }

  /**
   * Evaluate a condition (recursive for groups)
   */
  private evaluateCondition(
    condition: Condition,
    data: TokenDataSnapshot,
    details: ConditionDetail[],
    tokenKey?: string,
  ): boolean {
    if (isConditionGroup(condition)) {
      return this.evaluateGroup(condition, data, details, tokenKey);
    }

    if (isSingleCondition(condition)) {
      return this.evaluateSingle(condition, data, details, tokenKey);
    }

    // Unknown condition type
    return false;
  }

  /**
   * Evaluate a condition group (AND/OR logic)
   */
  private evaluateGroup(
    group: ConditionGroup,
    data: TokenDataSnapshot,
    details: ConditionDetail[],
    tokenKey?: string,
  ): boolean {
    const results = group.conditions.map((c) =>
      this.evaluateCondition(c, data, details, tokenKey),
    );

    if (group.operator === 'AND') {
      return results.every((r) => r);
    } else {
      return results.some((r) => r);
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateSingle(
    condition: SingleCondition,
    data: TokenDataSnapshot,
    details: ConditionDetail[],
    tokenKey?: string,
  ): boolean {
    const actualValue = this.getFieldValue(data, condition.field);
    const met = this.compareValues(
      condition.operator,
      actualValue,
      condition.value,
      condition.field,
      tokenKey,
    );

    if (this.config.collectDetails) {
      details.push({
        condition,
        met,
        actualValue,
        expectedValue: condition.value,
      });
    }

    return met;
  }

  /**
   * Get field value from token data
   */
  private getFieldValue(data: TokenDataSnapshot, field: ConditionField): number | undefined {
    switch (field) {
      case 'price':
        return data.price;
      case 'priceChange1h':
        return data.priceChange1h;
      case 'priceChange24h':
        return data.priceChange24h;
      case 'priceChange7d':
        return data.priceChange7d;
      case 'mcap':
        return data.mcap;
      case 'fdv':
        return data.fdv;
      case 'volume24h':
        return data.volume24h;
      case 'volumeChange24h':
        return data.volumeChange24h;
      case 'liquidity':
        return data.liquidity;
      case 'holders':
        return data.holders;
      case 'tokenAge':
        return data.tokenAge;
      case 'txCount24h':
        return data.txCount24h;
      case 'buyCount24h':
        return data.buyCount24h;
      case 'sellCount24h':
        return data.sellCount24h;
      case 'buyPressure':
        return data.buyPressure;
      case 'sellPressure':
        return data.sellPressure;
      default:
        return undefined;
    }
  }

  /**
   * Compare values using the specified operator
   */
  private compareValues(
    operator: OrderConditionOperator,
    actual: number | undefined,
    expected: number | [number, number],
    field: ConditionField,
    tokenKey?: string,
  ): boolean {
    // Handle undefined actual value
    if (actual === undefined || actual === null) {
      return false;
    }

    switch (operator) {
      case 'eq':
        return actual === expected;

      case 'neq':
        return actual !== expected;

      case 'gt':
        return typeof expected === 'number' && actual > expected;

      case 'gte':
        return typeof expected === 'number' && actual >= expected;

      case 'lt':
        return typeof expected === 'number' && actual < expected;

      case 'lte':
        return typeof expected === 'number' && actual <= expected;

      case 'between':
        if (Array.isArray(expected) && expected.length === 2) {
          const [min, max] = expected;
          return actual >= min && actual <= max;
        }
        return false;

      case 'change':
        return this.evaluateChange(actual, expected, field, tokenKey);

      default:
        return false;
    }
  }

  /**
   * Evaluate 'change' operator - compares with previous value
   *
   * @param actual Current value
   * @param expected Expected change percentage (e.g., -10 for -10% drop)
   * @param field The field being compared
   * @param tokenKey Unique key for the token (used for caching)
   */
  private evaluateChange(
    actual: number,
    expected: number | [number, number],
    field: ConditionField,
    tokenKey?: string,
  ): boolean {
    if (typeof expected !== 'number') {
      return false;
    }

    const cacheKey = tokenKey ? `${tokenKey}:${field}` : field;
    const cached = this.previousValues.get(cacheKey);
    const now = Date.now();

    // Update cache with current value
    this.previousValues.set(cacheKey, { value: actual, timestamp: now });

    // If no previous value or cache expired, can't compare
    if (!cached || now - cached.timestamp > this.config.cacheTtl) {
      return false;
    }

    // Calculate percentage change
    const previousValue = cached.value;
    if (previousValue === 0) {
      return false;
    }

    const changePercent = ((actual - previousValue) / previousValue) * 100;

    // If expected is negative, check if change dropped by at least that much
    // If expected is positive, check if change increased by at least that much
    if (expected < 0) {
      return changePercent <= expected;
    } else {
      return changePercent >= expected;
    }
  }

  /**
   * Clear the previous values cache
   */
  clearCache(): void {
    this.previousValues.clear();
  }

  /**
   * Clear expired entries from cache
   */
  cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.previousValues.entries()) {
      if (now - entry.timestamp > this.config.cacheTtl) {
        this.previousValues.delete(key);
      }
    }
  }

  /**
   * Set a previous value manually (useful for testing or initialization)
   */
  setPreviousValue(tokenKey: string, field: ConditionField, value: number): void {
    const cacheKey = `${tokenKey}:${field}`;
    this.previousValues.set(cacheKey, { value, timestamp: Date.now() });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; oldestEntry: number | null } {
    let oldest: number | null = null;
    for (const entry of this.previousValues.values()) {
      if (oldest === null || entry.timestamp < oldest) {
        oldest = entry.timestamp;
      }
    }
    return {
      size: this.previousValues.size,
      oldestEntry: oldest,
    };
  }
}

/**
 * Create a simple condition
 */
export function condition(
  field: ConditionField,
  operator: OrderConditionOperator,
  value: number | [number, number],
): SingleCondition {
  return { field, operator, value };
}

/**
 * Create an AND condition group
 */
export function and(...conditions: Condition[]): ConditionGroup {
  return { operator: 'AND', conditions };
}

/**
 * Create an OR condition group
 */
export function or(...conditions: Condition[]): ConditionGroup {
  return { operator: 'OR', conditions };
}

/**
 * Shorthand condition builders
 */
export const conditions = {
  /** Price is less than value */
  priceLt: (value: number): SingleCondition =>
    condition('price', 'lt', value),

  /** Price is greater than value */
  priceGt: (value: number): SingleCondition =>
    condition('price', 'gt', value),

  /** Price is between min and max */
  priceBetween: (min: number, max: number): SingleCondition =>
    condition('price', 'between', [min, max]),

  /** Market cap is less than value */
  mcapLt: (value: number): SingleCondition =>
    condition('mcap', 'lt', value),

  /** Market cap is greater than value */
  mcapGt: (value: number): SingleCondition =>
    condition('mcap', 'gt', value),

  /** Volume 24h is greater than value */
  volumeGt: (value: number): SingleCondition =>
    condition('volume24h', 'gt', value),

  /** Volume 24h is less than value */
  volumeLt: (value: number): SingleCondition =>
    condition('volume24h', 'lt', value),

  /** Liquidity is greater than value */
  liquidityGt: (value: number): SingleCondition =>
    condition('liquidity', 'gt', value),

  /** Liquidity is less than value */
  liquidityLt: (value: number): SingleCondition =>
    condition('liquidity', 'lt', value),

  /** Token age is less than seconds */
  tokenAgeLt: (seconds: number): SingleCondition =>
    condition('tokenAge', 'lt', seconds),

  /** Token age is greater than seconds */
  tokenAgeGt: (seconds: number): SingleCondition =>
    condition('tokenAge', 'gt', seconds),

  /** Buy pressure is greater than percentage */
  buyPressureGt: (percent: number): SingleCondition =>
    condition('buyPressure', 'gt', percent),

  /** Sell pressure is greater than percentage */
  sellPressureGt: (percent: number): SingleCondition =>
    condition('sellPressure', 'gt', percent),

  /** Holders count is greater than value */
  holdersGt: (value: number): SingleCondition =>
    condition('holders', 'gt', value),

  /** Price changed by at least percentage since last check */
  priceChange: (percent: number): SingleCondition =>
    condition('price', 'change', percent),

  /** 24h price change is less than percentage */
  priceChange24hLt: (percent: number): SingleCondition =>
    condition('priceChange24h', 'lt', percent),

  /** 24h price change is greater than percentage */
  priceChange24hGt: (percent: number): SingleCondition =>
    condition('priceChange24h', 'gt', percent),
};
