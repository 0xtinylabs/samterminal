
import {
  DEFAULT_RETRY_CONFIG,
  calculateRetryDelay,
  sleep,
  retry,
  retryIf,
  withRetry,
  retryWithTimeout,
} from './retry.js';

describe('retry utils', () => {
  describe('DEFAULT_RETRY_CONFIG', () => {
    it('should have expected default values', () => {
      expect(DEFAULT_RETRY_CONFIG).toEqual({
        maxAttempts: 3,
        delayMs: 1000,
        backoffMultiplier: 2,
        maxDelayMs: 30000,
      });
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate delay with exponential backoff', () => {
      const config = { maxAttempts: 5, delayMs: 1000, backoffMultiplier: 2 };

      expect(calculateRetryDelay(1, config)).toBe(1000);
      expect(calculateRetryDelay(2, config)).toBe(2000);
      expect(calculateRetryDelay(3, config)).toBe(4000);
      expect(calculateRetryDelay(4, config)).toBe(8000);
    });

    it('should respect maxDelayMs cap', () => {
      const config = { maxAttempts: 5, delayMs: 1000, backoffMultiplier: 2, maxDelayMs: 5000 };

      expect(calculateRetryDelay(1, config)).toBe(1000);
      expect(calculateRetryDelay(2, config)).toBe(2000);
      expect(calculateRetryDelay(3, config)).toBe(4000);
      expect(calculateRetryDelay(4, config)).toBe(5000); // Capped
      expect(calculateRetryDelay(5, config)).toBe(5000); // Capped
    });

    it('should handle missing backoffMultiplier', () => {
      const config = { maxAttempts: 3, delayMs: 1000 };

      expect(calculateRetryDelay(1, config)).toBe(1000);
      expect(calculateRetryDelay(2, config)).toBe(1000);
      expect(calculateRetryDelay(3, config)).toBe(1000);
    });

    it('should handle missing maxDelayMs', () => {
      const config = { maxAttempts: 5, delayMs: 1000, backoffMultiplier: 10 };

      expect(calculateRetryDelay(1, config)).toBe(1000);
      expect(calculateRetryDelay(2, config)).toBe(10000);
      expect(calculateRetryDelay(3, config)).toBe(100000);
    });
  });

  describe('sleep', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should resolve after specified time', async () => {
      const promise = sleep(1000);

      jest.advanceTimersByTime(999);
      expect(jest.getTimerCount()).toBe(1);

      jest.advanceTimersByTime(1);
      await promise;
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should resolve immediately for 0ms', async () => {
      const promise = sleep(0);
      jest.advanceTimersByTime(0);
      await promise;
    });
  });

  // Use real timers with minimal delays for these tests to avoid complexity
  describe('retry', () => {
    it('should return result on first success', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await retry(fn, { maxAttempts: 3, delayMs: 1 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockResolvedValueOnce('success');

      const result = await retry(fn, { maxAttempts: 3, delayMs: 1, backoffMultiplier: 1 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max attempts', async () => {
      const error = new Error('Persistent failure');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(
        retry(fn, { maxAttempts: 3, delayMs: 1, backoffMultiplier: 1 }),
      ).rejects.toThrow('Persistent failure');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should use custom retry config', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce('success');

      const result = await retry(fn, {
        maxAttempts: 2,
        delayMs: 1,
        backoffMultiplier: 1,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should convert non-Error throws to Error', async () => {
      const fn = jest.fn().mockRejectedValue('string error');

      await expect(retry(fn, { maxAttempts: 1 })).rejects.toThrow('string error');
    });
  });

  describe('retryIf', () => {
    it('should retry only for matching errors', async () => {
      const retryableError = new Error('RETRYABLE');
      const nonRetryableError = new Error('NON_RETRYABLE');

      const fn = jest
        .fn()
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(nonRetryableError);

      const shouldRetry = (err: Error) => err.message === 'RETRYABLE';

      await expect(
        retryIf(fn, shouldRetry, { maxAttempts: 5, delayMs: 1, backoffMultiplier: 1 }),
      ).rejects.toThrow('NON_RETRYABLE');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should succeed after retryable errors', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('RETRYABLE'))
        .mockResolvedValueOnce('success');

      const shouldRetry = (err: Error) => err.message === 'RETRYABLE';

      const result = await retryIf(fn, shouldRetry, {
        maxAttempts: 3,
        delayMs: 1,
        backoffMultiplier: 1,
      });

      expect(result).toBe('success');
    });

    it('should not retry non-retryable errors even if attempts remain', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('NON_RETRYABLE'));

      const shouldRetry = () => false;

      await expect(
        retryIf(fn, shouldRetry, { maxAttempts: 5, delayMs: 1 }),
      ).rejects.toThrow('NON_RETRYABLE');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should stop retrying after max attempts even for retryable errors', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('RETRYABLE'));

      const shouldRetry = () => true;

      await expect(
        retryIf(fn, shouldRetry, { maxAttempts: 2, delayMs: 1, backoffMultiplier: 1 }),
      ).rejects.toThrow('RETRYABLE');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('withRetry', () => {
    it('should wrap function with retry logic', async () => {
      const originalFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce('success');

      const wrappedFn = withRetry(originalFn, { maxAttempts: 3, delayMs: 1, backoffMultiplier: 1 });

      const result = await wrappedFn();

      expect(result).toBe('success');
      expect(originalFn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments to wrapped function', async () => {
      const originalFn = jest.fn().mockResolvedValue('result');

      const wrappedFn = withRetry(originalFn, { maxAttempts: 1 });
      await wrappedFn('arg1', 'arg2');

      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should use custom config', async () => {
      const originalFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce('success');

      const wrappedFn = withRetry(originalFn, { maxAttempts: 2, delayMs: 1 });

      await wrappedFn();
      expect(originalFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('retryWithTimeout', () => {
    it('should succeed within timeout', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce('success');

      const result = await retryWithTimeout(fn, 5000, {
        maxAttempts: 3,
        delayMs: 1,
        backoffMultiplier: 1,
      });

      expect(result).toBe('success');
    });

    it('should timeout when operation takes too long', async () => {
      // Use a function that will take longer than the timeout
      const fn = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        throw new Error('Fail');
      });

      await expect(
        retryWithTimeout(fn, 50, { maxAttempts: 10, delayMs: 1 }),
      ).rejects.toThrow('Operation timed out');
    });
  });
});
