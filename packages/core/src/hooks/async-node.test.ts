/**
 * Async Node tests
 */


import {
  createAsyncNode,
  executeAsyncNode,
  cancelAsyncNode,
  AsyncOperationRunner,
  createAsyncOperation,
  createAsyncOperationRunner,
} from './async-node.js';
import type { AsyncNode, AsyncOperation } from '../types/index.js';

// Console is mocked in jest.setup.mjs

describe('createAsyncNode', () => {
  it('should create async node with pending status', () => {
    const operation = jest.fn().mockResolvedValue('result');
    const node = createAsyncNode('test-node', operation);

    expect(node.id).toBeDefined();
    expect(node.name).toBe('test-node');
    expect(node.status).toBe('pending');
    expect(node.operation).toBe(operation);
  });
});

describe('executeAsyncNode', () => {
  it('should execute node and return result', async () => {
    const operation = jest.fn().mockResolvedValue('test-result');
    const node = createAsyncNode('test-node', operation);

    const result = await executeAsyncNode(node);

    expect(result).toBe('test-result');
    expect(node.status).toBe('completed');
    expect(node.result).toBe('test-result');
    expect(node.startedAt).toBeInstanceOf(Date);
    expect(node.completedAt).toBeInstanceOf(Date);
  });

  it('should throw if node is not in pending status', async () => {
    const operation = jest.fn().mockResolvedValue('result');
    const node = createAsyncNode('test-node', operation);
    node.status = 'running';

    await expect(executeAsyncNode(node)).rejects.toThrow('Cannot execute node in status: running');
  });

  it('should set status to running during execution', async () => {
    let capturedStatus: string | undefined;
    const operation = jest.fn().mockImplementation(async () => {
      // Capture status during execution by checking node
      return new Promise((resolve) => setTimeout(() => resolve('result'), 10));
    });
    const node = createAsyncNode('test-node', operation);

    const executePromise = executeAsyncNode(node);

    // Wait a tick to allow execution to start
    await new Promise((resolve) => setTimeout(resolve, 0));
    capturedStatus = node.status;

    await executePromise;

    expect(capturedStatus).toBe('running');
  });

  it('should handle execution errors', async () => {
    const error = new Error('Test error');
    const operation = jest.fn().mockRejectedValue(error);
    const node = createAsyncNode('test-node', operation);

    await expect(executeAsyncNode(node)).rejects.toThrow('Test error');
    expect(node.status).toBe('failed');
    expect(node.error).toBe(error);
    expect(node.completedAt).toBeInstanceOf(Date);
  });

  it('should convert non-Error to Error', async () => {
    const operation = jest.fn().mockRejectedValue('string error');
    const node = createAsyncNode('test-node', operation);

    await expect(executeAsyncNode(node)).rejects.toThrow('string error');
    expect(node.error).toBeInstanceOf(Error);
  });
});

describe('cancelAsyncNode', () => {
  it('should cancel pending node', () => {
    const node = createAsyncNode('test-node', jest.fn());

    const result = cancelAsyncNode(node);

    expect(result).toBe(true);
    expect(node.status).toBe('cancelled');
    expect(node.completedAt).toBeInstanceOf(Date);
  });

  it('should cancel running node', () => {
    const node = createAsyncNode('test-node', jest.fn());
    node.status = 'running';

    const result = cancelAsyncNode(node);

    expect(result).toBe(true);
    expect(node.status).toBe('cancelled');
  });

  it('should not cancel completed node', () => {
    const node = createAsyncNode('test-node', jest.fn());
    node.status = 'completed';

    const result = cancelAsyncNode(node);

    expect(result).toBe(false);
    expect(node.status).toBe('completed');
  });

  it('should not cancel failed node', () => {
    const node = createAsyncNode('test-node', jest.fn());
    node.status = 'failed';

    const result = cancelAsyncNode(node);

    expect(result).toBe(false);
    expect(node.status).toBe('failed');
  });
});

describe('AsyncOperationRunner', () => {
  let runner: AsyncOperationRunner;

  beforeEach(() => {
    runner = new AsyncOperationRunner();
  });

  afterEach(() => {
    runner.clear();
  });

  describe('register', () => {
    it('should register an operation', () => {
      const operation = createAsyncOperation({
        name: 'test-op',
        execute: jest.fn().mockResolvedValue('result'),
      });

      runner.register(operation);

      // Operation should be retrievable by runById
      expect(() => runner.runById(operation.id)).not.toThrow();
    });
  });

  describe('run', () => {
    it('should run operation and return result', async () => {
      const operation = createAsyncOperation({
        name: 'test-op',
        execute: jest.fn().mockResolvedValue('test-result'),
      });

      const result = await runner.run(operation);

      expect(result).toBe('test-result');
    });

    it('should call onSuccess callback on success', async () => {
      const onSuccess = jest.fn();
      const operation = createAsyncOperation({
        name: 'test-op',
        execute: jest.fn().mockResolvedValue('result'),
        onSuccess,
      });

      await runner.run(operation);

      expect(onSuccess).toHaveBeenCalledWith('result');
    });

    it('should call onError callback on failure', async () => {
      const onError = jest.fn();
      const error = new Error('Test error');
      const operation = createAsyncOperation({
        name: 'test-op',
        execute: jest.fn().mockRejectedValue(error),
        onError,
      });

      await expect(runner.run(operation)).rejects.toThrow('Test error');
      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should call onFinally callback always', async () => {
      const onFinally = jest.fn();
      const operation = createAsyncOperation({
        name: 'test-op',
        execute: jest.fn().mockResolvedValue('result'),
        onFinally,
      });

      await runner.run(operation);

      expect(onFinally).toHaveBeenCalled();
    });

    it('should call onFinally on failure', async () => {
      const onFinally = jest.fn();
      const operation = createAsyncOperation({
        name: 'test-op',
        execute: jest.fn().mockRejectedValue(new Error('fail')),
        onFinally,
      });

      await expect(runner.run(operation)).rejects.toThrow();
      expect(onFinally).toHaveBeenCalled();
    });

    it('should timeout long operations', async () => {
      const operation = createAsyncOperation({
        name: 'slow-op',
        execute: jest.fn().mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve('result'), 500)),
        ),
        timeout: 50,
      });

      await expect(runner.run(operation)).rejects.toThrow('Operation "slow-op" timed out');
    });

    it('should retry on failure when configured', async () => {
      const execute = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const operation = createAsyncOperation({
        name: 'retry-op',
        execute,
        retryConfig: { maxAttempts: 3, delayMs: 10 },
      });

      const result = await runner.run(operation);

      expect(result).toBe('success');
      expect(execute).toHaveBeenCalledTimes(3);
    });

    it('should convert non-Error rejections to Error', async () => {
      const onError = jest.fn();
      const operation = createAsyncOperation({
        name: 'test-op',
        execute: jest.fn().mockRejectedValue('string error'),
        onError,
      });

      await expect(runner.run(operation)).rejects.toThrow('string error');
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('runById', () => {
    it('should run registered operation by id', async () => {
      const operation = createAsyncOperation({
        name: 'test-op',
        execute: jest.fn().mockResolvedValue('result'),
      });
      runner.register(operation);

      const result = await runner.runById(operation.id);

      expect(result).toBe('result');
    });

    it('should throw for unregistered operation', async () => {
      await expect(runner.runById('unknown-id')).rejects.toThrow('Operation not found: unknown-id');
    });

    it('should return existing promise if operation is already running', async () => {
      let resolveExecute: (value: string) => void;
      const execute = jest.fn().mockImplementation(
        () => new Promise((resolve) => { resolveExecute = resolve; }),
      );
      const operation = createAsyncOperation({
        name: 'test-op',
        execute,
      });
      runner.register(operation);

      const promise1 = runner.runById(operation.id);
      const promise2 = runner.runById(operation.id);

      expect(execute).toHaveBeenCalledTimes(1);

      resolveExecute!('result');
      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toBe('result');
      expect(result2).toBe('result');
    });
  });

  describe('runParallel', () => {
    it('should run operations in parallel', async () => {
      const operations = [
        createAsyncOperation({ name: 'op1', execute: jest.fn().mockResolvedValue('result1') }),
        createAsyncOperation({ name: 'op2', execute: jest.fn().mockResolvedValue('result2') }),
        createAsyncOperation({ name: 'op3', execute: jest.fn().mockResolvedValue('result3') }),
      ];

      const results = await runner.runParallel(operations);

      expect(results).toEqual(['result1', 'result2', 'result3']);
    });

    it('should fail if any operation fails', async () => {
      const operations = [
        createAsyncOperation({ name: 'op1', execute: jest.fn().mockResolvedValue('result1') }),
        createAsyncOperation({ name: 'op2', execute: jest.fn().mockRejectedValue(new Error('fail')) }),
      ];

      await expect(runner.runParallel(operations)).rejects.toThrow('fail');
    });
  });

  describe('runSequence', () => {
    it('should run operations in sequence', async () => {
      const executionOrder: number[] = [];
      const operations = [
        createAsyncOperation({
          name: 'op1',
          execute: jest.fn().mockImplementation(async () => {
            executionOrder.push(1);
            return 'result1';
          }),
        }),
        createAsyncOperation({
          name: 'op2',
          execute: jest.fn().mockImplementation(async () => {
            executionOrder.push(2);
            return 'result2';
          }),
        }),
      ];

      const results = await runner.runSequence(operations);

      expect(results).toEqual(['result1', 'result2']);
      expect(executionOrder).toEqual([1, 2]);
    });

    it('should stop on first failure', async () => {
      const op2Execute = jest.fn();
      const operations = [
        createAsyncOperation({
          name: 'op1',
          execute: jest.fn().mockRejectedValue(new Error('fail')),
        }),
        createAsyncOperation({
          name: 'op2',
          execute: op2Execute,
        }),
      ];

      await expect(runner.runSequence(operations)).rejects.toThrow('fail');
      expect(op2Execute).not.toHaveBeenCalled();
    });
  });

  describe('runWithConcurrency', () => {
    it('should run all operations', async () => {
      const executedOps: string[] = [];

      const createOp = (name: string) =>
        createAsyncOperation({
          name,
          execute: jest.fn().mockImplementation(async () => {
            executedOps.push(name);
            await new Promise((resolve) => setTimeout(resolve, 5));
            return name;
          }),
        });

      const operations = [
        createOp('op1'),
        createOp('op2'),
        createOp('op3'),
        createOp('op4'),
        createOp('op5'),
      ];

      await runner.runWithConcurrency(operations, 2);

      expect(executedOps).toHaveLength(5);
      expect(executedOps).toContain('op1');
      expect(executedOps).toContain('op5');
    });

    it('should return all results', async () => {
      const operations = [
        createAsyncOperation({ name: 'op1', execute: jest.fn().mockResolvedValue('r1') }),
        createAsyncOperation({ name: 'op2', execute: jest.fn().mockResolvedValue('r2') }),
        createAsyncOperation({ name: 'op3', execute: jest.fn().mockResolvedValue('r3') }),
      ];

      const results = await runner.runWithConcurrency(operations, 2);

      expect(results).toHaveLength(3);
      expect(results).toContain('r1');
      expect(results).toContain('r2');
      expect(results).toContain('r3');
    });
  });

  describe('clear', () => {
    it('should clear all registered operations', () => {
      const operation = createAsyncOperation({
        name: 'test-op',
        execute: jest.fn().mockResolvedValue('result'),
      });
      runner.register(operation);
      runner.clear();

      expect(() => runner.runById(operation.id)).rejects.toThrow('Operation not found');
    });
  });
});

describe('createAsyncOperation', () => {
  it('should create operation with id', () => {
    const operation = createAsyncOperation({
      name: 'test-op',
      execute: jest.fn(),
    });

    expect(operation.id).toBeDefined();
    expect(operation.name).toBe('test-op');
    expect(operation.execute).toBeDefined();
  });

  it('should include optional callbacks', () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onFinally = jest.fn();

    const operation = createAsyncOperation({
      name: 'test-op',
      execute: jest.fn(),
      onSuccess,
      onError,
      onFinally,
      timeout: 5000,
      retryConfig: { maxAttempts: 3, delayMs: 100 },
    });

    expect(operation.onSuccess).toBe(onSuccess);
    expect(operation.onError).toBe(onError);
    expect(operation.onFinally).toBe(onFinally);
    expect(operation.timeout).toBe(5000);
    expect(operation.retryConfig).toEqual({ maxAttempts: 3, delayMs: 100 });
  });
});

describe('createAsyncOperationRunner', () => {
  it('should create a new AsyncOperationRunner instance', () => {
    const runner = createAsyncOperationRunner();
    expect(runner).toBeInstanceOf(AsyncOperationRunner);
  });
});
