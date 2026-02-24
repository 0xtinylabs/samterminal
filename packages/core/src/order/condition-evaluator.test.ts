/**
 * ConditionEvaluator Tests
 */
import {
  ConditionEvaluator,
  condition,
  and,
  or,
  conditions,
} from './condition-evaluator.js';
import type {
  TokenDataSnapshot,
  ConditionGroup,
  SingleCondition,
} from './types.js';

describe('ConditionEvaluator', () => {
  let evaluator: ConditionEvaluator;

  const mockTokenData: TokenDataSnapshot = {
    price: 3000,
    priceChange1h: -2.5,
    priceChange24h: 5.2,
    priceChange7d: 12.8,
    mcap: 390_000_000_000,
    fdv: 450_000_000_000,
    volume24h: 12_400_000_000,
    volumeChange24h: 45.2,
    liquidity: 50_000_000,
    holders: 125_000,
    tokenAge: 86400,
    txCount24h: 50_000,
    buyCount24h: 32_500,
    sellCount24h: 17_500,
    buyPressure: 65,
    sellPressure: 35,
  };

  beforeEach(() => {
    evaluator = new ConditionEvaluator();
  });

  describe('Single Conditions', () => {
    it('should evaluate eq operator', () => {
      const cond = condition('price', 'eq', 3000);
      const result = evaluator.evaluate(cond, mockTokenData);
      expect(result.met).toBe(true);

      const cond2 = condition('price', 'eq', 2999);
      const result2 = evaluator.evaluate(cond2, mockTokenData);
      expect(result2.met).toBe(false);
    });

    it('should evaluate neq operator', () => {
      const cond = condition('price', 'neq', 2999);
      const result = evaluator.evaluate(cond, mockTokenData);
      expect(result.met).toBe(true);
    });

    it('should evaluate gt operator', () => {
      const cond = condition('price', 'gt', 2999);
      const result = evaluator.evaluate(cond, mockTokenData);
      expect(result.met).toBe(true);

      const cond2 = condition('price', 'gt', 3000);
      const result2 = evaluator.evaluate(cond2, mockTokenData);
      expect(result2.met).toBe(false);
    });

    it('should evaluate gte operator', () => {
      const cond = condition('price', 'gte', 3000);
      const result = evaluator.evaluate(cond, mockTokenData);
      expect(result.met).toBe(true);
    });

    it('should evaluate lt operator', () => {
      const cond = condition('price', 'lt', 3001);
      const result = evaluator.evaluate(cond, mockTokenData);
      expect(result.met).toBe(true);

      const cond2 = condition('price', 'lt', 3000);
      const result2 = evaluator.evaluate(cond2, mockTokenData);
      expect(result2.met).toBe(false);
    });

    it('should evaluate lte operator', () => {
      const cond = condition('price', 'lte', 3000);
      const result = evaluator.evaluate(cond, mockTokenData);
      expect(result.met).toBe(true);
    });

    it('should evaluate between operator', () => {
      const cond = condition('price', 'between', [2900, 3100]);
      const result = evaluator.evaluate(cond, mockTokenData);
      expect(result.met).toBe(true);

      const cond2 = condition('price', 'between', [3001, 3100]);
      const result2 = evaluator.evaluate(cond2, mockTokenData);
      expect(result2.met).toBe(false);

      // Edge cases - inclusive
      const cond3 = condition('price', 'between', [3000, 3100]);
      const result3 = evaluator.evaluate(cond3, mockTokenData);
      expect(result3.met).toBe(true);
    });

    it('should handle undefined field values', () => {
      const dataWithUndefined: TokenDataSnapshot = {
        price: 3000,
      };

      const cond = condition('mcap', 'gt', 100);
      const result = evaluator.evaluate(cond, dataWithUndefined);
      expect(result.met).toBe(false);
    });
  });

  describe('Condition Groups', () => {
    it('should evaluate AND group - all true', () => {
      const group = and(
        condition('price', 'gte', 2900),
        condition('mcap', 'gt', 300_000_000_000),
        condition('volume24h', 'gt', 10_000_000_000),
      );

      const result = evaluator.evaluate(group, mockTokenData);
      expect(result.met).toBe(true);
    });

    it('should evaluate AND group - one false', () => {
      const group = and(
        condition('price', 'gte', 2900),
        condition('mcap', 'gt', 500_000_000_000), // False: 390B < 500B
        condition('volume24h', 'gt', 10_000_000_000),
      );

      const result = evaluator.evaluate(group, mockTokenData);
      expect(result.met).toBe(false);
    });

    it('should evaluate OR group - one true', () => {
      const group = or(
        condition('price', 'lt', 2000), // False
        condition('mcap', 'gt', 300_000_000_000), // True
      );

      const result = evaluator.evaluate(group, mockTokenData);
      expect(result.met).toBe(true);
    });

    it('should evaluate OR group - all false', () => {
      const group = or(
        condition('price', 'lt', 2000),
        condition('mcap', 'gt', 500_000_000_000),
      );

      const result = evaluator.evaluate(group, mockTokenData);
      expect(result.met).toBe(false);
    });
  });

  describe('Nested Condition Groups', () => {
    it('should evaluate complex nested conditions: (price < 3000) OR (mcap > 350B AND volume > 10B)', () => {
      const complexCondition: ConditionGroup = {
        operator: 'OR',
        conditions: [
          { field: 'price', operator: 'lt', value: 3000 }, // False: 3000 is not < 3000
          {
            operator: 'AND',
            conditions: [
              { field: 'mcap', operator: 'gt', value: 350_000_000_000 }, // True: 390B > 350B
              { field: 'volume24h', operator: 'gt', value: 10_000_000_000 }, // True: 12.4B > 10B
            ],
          },
        ],
      };

      const result = evaluator.evaluate(complexCondition, mockTokenData);
      expect(result.met).toBe(true);
    });

    it('should evaluate deeply nested conditions', () => {
      const deepNested: ConditionGroup = {
        operator: 'AND',
        conditions: [
          {
            operator: 'OR',
            conditions: [
              { field: 'price', operator: 'lt', value: 2500 }, // False
              { field: 'price', operator: 'gt', value: 2900 }, // True
            ],
          },
          {
            operator: 'OR',
            conditions: [
              { field: 'buyPressure', operator: 'gt', value: 60 }, // True: 65 > 60
              { field: 'holders', operator: 'gt', value: 200_000 }, // False
            ],
          },
        ],
      };

      const result = evaluator.evaluate(deepNested, mockTokenData);
      expect(result.met).toBe(true);
    });
  });

  describe('Change Operator', () => {
    it('should detect negative price change', () => {
      const tokenKey = 'test-token';
      const cond = condition('price', 'change', -10);

      // First call: no previous value, should return false
      const result1 = evaluator.evaluate(cond, { price: 3000 }, tokenKey);
      expect(result1.met).toBe(false);

      // Second call: price dropped 15%, should return true (dropped more than -10%)
      const result2 = evaluator.evaluate(cond, { price: 2550 }, tokenKey);
      expect(result2.met).toBe(true);
    });

    it('should detect positive price change', () => {
      const tokenKey = 'test-token-2';
      const cond = condition('price', 'change', 5);

      // First call
      evaluator.evaluate(cond, { price: 3000 }, tokenKey);

      // Second call: price increased 10%
      const result = evaluator.evaluate(cond, { price: 3300 }, tokenKey);
      expect(result.met).toBe(true);
    });

    it('should not trigger if change is insufficient', () => {
      const tokenKey = 'test-token-3';
      const cond = condition('price', 'change', -10);

      // First call
      evaluator.evaluate(cond, { price: 3000 }, tokenKey);

      // Second call: price dropped only 5%
      const result = evaluator.evaluate(cond, { price: 2850 }, tokenKey);
      expect(result.met).toBe(false);
    });
  });

  describe('Shorthand Condition Builders', () => {
    it('should create priceLt condition', () => {
      const cond = conditions.priceLt(3100);
      const result = evaluator.evaluate(cond, mockTokenData);
      expect(result.met).toBe(true);
    });

    it('should create priceGt condition', () => {
      const cond = conditions.priceGt(2900);
      const result = evaluator.evaluate(cond, mockTokenData);
      expect(result.met).toBe(true);
    });

    it('should create priceBetween condition', () => {
      const cond = conditions.priceBetween(2900, 3100);
      const result = evaluator.evaluate(cond, mockTokenData);
      expect(result.met).toBe(true);
    });

    it('should create mcapGt condition', () => {
      const cond = conditions.mcapGt(300_000_000_000);
      const result = evaluator.evaluate(cond, mockTokenData);
      expect(result.met).toBe(true);
    });

    it('should create volumeGt condition', () => {
      const cond = conditions.volumeGt(10_000_000_000);
      const result = evaluator.evaluate(cond, mockTokenData);
      expect(result.met).toBe(true);
    });

    it('should create liquidityGt condition', () => {
      const cond = conditions.liquidityGt(40_000_000);
      const result = evaluator.evaluate(cond, mockTokenData);
      expect(result.met).toBe(true);
    });

    it('should create tokenAgeLt condition', () => {
      const cond = conditions.tokenAgeLt(90_000);
      const result = evaluator.evaluate(cond, mockTokenData);
      expect(result.met).toBe(true);
    });

    it('should create buyPressureGt condition', () => {
      const cond = conditions.buyPressureGt(60);
      const result = evaluator.evaluate(cond, mockTokenData);
      expect(result.met).toBe(true);
    });

    it('should create holdersGt condition', () => {
      const cond = conditions.holdersGt(100_000);
      const result = evaluator.evaluate(cond, mockTokenData);
      expect(result.met).toBe(true);
    });

    it('should create priceChange24hLt condition', () => {
      const cond = conditions.priceChange24hLt(10);
      const result = evaluator.evaluate(cond, mockTokenData);
      expect(result.met).toBe(true); // 5.2 < 10
    });
  });

  describe('Evaluation Details', () => {
    it('should collect evaluation details', () => {
      const group = and(
        condition('price', 'gte', 2900),
        condition('mcap', 'gt', 300_000_000_000),
      );

      const result = evaluator.evaluate(group, mockTokenData);
      expect(result.details).toHaveLength(2);
      expect(result.details[0].met).toBe(true);
      expect(result.details[0].actualValue).toBe(3000);
      expect(result.details[1].met).toBe(true);
      expect(result.details[1].actualValue).toBe(390_000_000_000);
    });

    it('should skip details collection when disabled', () => {
      const evaluatorNoDetails = new ConditionEvaluator({ collectDetails: false });
      const cond = condition('price', 'gt', 2900);
      const result = evaluatorNoDetails.evaluate(cond, mockTokenData);

      expect(result.met).toBe(true);
      expect(result.details).toHaveLength(0);
    });

    it('should include evaluatedAt timestamp', () => {
      const cond = condition('price', 'gt', 2900);
      const before = new Date();
      const result = evaluator.evaluate(cond, mockTokenData);
      const after = new Date();

      expect(result.evaluatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.evaluatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      const tokenKey = 'cache-test';
      evaluator.setPreviousValue(tokenKey, 'price', 3000);

      const stats1 = evaluator.getCacheStats();
      expect(stats1.size).toBe(1);

      evaluator.clearCache();

      const stats2 = evaluator.getCacheStats();
      expect(stats2.size).toBe(0);
    });

    it('should set and use previous values', () => {
      const tokenKey = 'manual-cache';
      const cond = condition('price', 'change', -10);

      // Set previous value manually
      evaluator.setPreviousValue(tokenKey, 'price', 3000);

      // Now evaluate with new value (2700 = -10% from 3000)
      const result = evaluator.evaluate(cond, { price: 2700 }, tokenKey);
      expect(result.met).toBe(true);
    });

    it('should report cache stats', () => {
      evaluator.setPreviousValue('token1', 'price', 100);
      evaluator.setPreviousValue('token2', 'price', 200);

      const stats = evaluator.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.oldestEntry).not.toBeNull();
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle stop-loss condition', () => {
      const stopLoss = condition('price', 'lte', 2800);
      const tokenData: TokenDataSnapshot = { price: 2750 };

      const result = evaluator.evaluate(stopLoss, tokenData);
      expect(result.met).toBe(true);
    });

    it('should handle take-profit condition', () => {
      const takeProfit = condition('price', 'gte', 5000);
      const tokenData: TokenDataSnapshot = { price: 5100 };

      const result = evaluator.evaluate(takeProfit, tokenData);
      expect(result.met).toBe(true);
    });

    it('should handle smart entry conditions', () => {
      const smartEntry = and(
        conditions.tokenAgeLt(604800), // < 7 days
        conditions.liquidityGt(100_000),
        conditions.holdersGt(100),
        conditions.buyPressureGt(60),
      );

      const newToken: TokenDataSnapshot = {
        price: 0.001,
        tokenAge: 259200, // 3 days
        liquidity: 150_000,
        holders: 250,
        buyPressure: 72,
        sellPressure: 28,
      };

      const result = evaluator.evaluate(smartEntry, newToken);
      expect(result.met).toBe(true);
    });

    it('should handle dual protection (stop-loss OR take-profit)', () => {
      const dualProtection = or(
        conditions.priceLt(2800), // Stop-loss
        conditions.priceGt(5000), // Take-profit
      );

      // Normal price - neither triggered
      const normalResult = evaluator.evaluate(dualProtection, { price: 3500 });
      expect(normalResult.met).toBe(false);

      // Stop-loss triggered
      const slResult = evaluator.evaluate(dualProtection, { price: 2700 });
      expect(slResult.met).toBe(true);

      // Take-profit triggered
      const tpResult = evaluator.evaluate(dualProtection, { price: 5200 });
      expect(tpResult.met).toBe(true);
    });

    it('should handle volume crash detection', () => {
      const volumeCrash = or(
        conditions.priceLt(2800),
        condition('volumeChange24h', 'lt', -50),
        conditions.liquidityLt(10_000_000),
      );

      // Volume crashed 60%
      const crashData: TokenDataSnapshot = {
        price: 3200,
        volumeChange24h: -60,
        liquidity: 45_000_000,
      };

      const result = evaluator.evaluate(volumeCrash, crashData);
      expect(result.met).toBe(true);
    });
  });
});
