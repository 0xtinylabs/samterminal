/**
 * Logic Point tests
 */


import {
  LogicPointManager,
  createLogicPointManager,
  createEntryPoint,
  createExitPoint,
  createDecisionPoint,
  createCheckpoint,
  type LogicPointContext,
  type LogicPointHandler,
} from './logic-point.js';
import type { LogicPointType } from '../types/index.js';

// Console is mocked in jest.setup.mjs
// Note: uuid is used as-is since the tests don't depend on specific ID values

describe('LogicPointManager', () => {
  let manager: LogicPointManager;

  beforeEach(() => {
    manager = new LogicPointManager();
    uuidCounter = 0;
  });

  afterEach(() => {
    manager.clear();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a logic point with required fields', () => {
      const handler: LogicPointHandler = jest.fn().mockResolvedValue({ output: 'result' });
      const point = manager.create({
        name: 'test-point',
        type: 'entry',
        handler,
      });

      expect(point.id).toBeDefined();
      expect(point.name).toBe('test-point');
      expect(point.type).toBe('entry');
      expect(point.config).toEqual({});
    });

    it('should create logic point with description', () => {
      const point = manager.create({
        name: 'test-point',
        description: 'A test point',
        type: 'action',
        handler: jest.fn().mockResolvedValue({ output: null }),
      });

      expect(point.description).toBe('A test point');
    });

    it('should create logic point with config', () => {
      const point = manager.create({
        name: 'test-point',
        type: 'action',
        handler: jest.fn().mockResolvedValue({ output: null }),
        config: { timeout: 5000, retryOnFailure: true, maxRetries: 3 },
      });

      expect(point.config.timeout).toBe(5000);
      expect(point.config.retryOnFailure).toBe(true);
      expect(point.config.maxRetries).toBe(3);
    });
  });

  describe('get', () => {
    it('should return logic point by id', () => {
      const handler: LogicPointHandler = jest.fn().mockResolvedValue({ output: null });
      const created = manager.create({
        name: 'test-point',
        type: 'entry',
        handler,
      });

      const point = manager.get(created.id);

      expect(point).toBeDefined();
      expect(point?.name).toBe('test-point');
    });

    it('should return undefined for unknown id', () => {
      const point = manager.get('unknown-id');
      expect(point).toBeUndefined();
    });
  });

  describe('getByName', () => {
    it('should return logic point by name', () => {
      manager.create({
        name: 'test-point',
        type: 'entry',
        handler: jest.fn().mockResolvedValue({ output: null }),
      });

      const point = manager.getByName('test-point');

      expect(point).toBeDefined();
      expect(point?.name).toBe('test-point');
    });

    it('should return undefined for unknown name', () => {
      const point = manager.getByName('unknown');
      expect(point).toBeUndefined();
    });
  });

  describe('execute', () => {
    it('should execute logic point handler', async () => {
      const handler: LogicPointHandler = jest.fn().mockResolvedValue({ output: 'result' });
      const point = manager.create({
        name: 'test-point',
        type: 'action',
        handler,
      });

      const result = await manager.execute(point.id, { input: 'test-input' });

      expect(handler).toHaveBeenCalledWith({ input: 'test-input' });
      expect(result.output).toBe('result');
    });

    it('should throw for unknown logic point', async () => {
      await expect(
        manager.execute('unknown-id', { input: null }),
      ).rejects.toThrow('Logic point not found: unknown-id');
    });

    it('should respect timeout configuration', async () => {
      const handler: LogicPointHandler = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ output: 'result' }), 500)),
      );
      const point = manager.create({
        name: 'slow-point',
        type: 'action',
        handler,
        config: { timeout: 50 },
      });

      await expect(
        manager.execute(point.id, { input: null }),
      ).rejects.toThrow('Logic point "slow-point" timed out');
    });

    it('should retry on failure when configured', async () => {
      const handler = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue({ output: 'success' });

      const point = manager.create({
        name: 'retry-point',
        type: 'action',
        handler,
        config: { retryOnFailure: true, maxRetries: 3 },
      });

      const result = await manager.execute(point.id, { input: null });

      expect(result.output).toBe('success');
      expect(handler).toHaveBeenCalledTimes(3);
    });

    it('should use fallback value on failure when configured', async () => {
      const handler: LogicPointHandler = jest.fn().mockRejectedValue(new Error('fail'));
      const point = manager.create({
        name: 'fallback-point',
        type: 'action',
        handler,
        config: { fallback: 'fallback-value' },
      });

      const result = await manager.execute(point.id, { input: null });

      expect(result.output).toBe('fallback-value');
    });

    it('should throw error when no fallback configured', async () => {
      const handler: LogicPointHandler = jest.fn().mockRejectedValue(new Error('fail'));
      const point = manager.create({
        name: 'no-fallback',
        type: 'action',
        handler,
      });

      await expect(
        manager.execute(point.id, { input: null }),
      ).rejects.toThrow('fail');
    });

    it('should pass metadata in context', async () => {
      const handler: LogicPointHandler = jest.fn().mockResolvedValue({ output: null });
      const point = manager.create({
        name: 'test-point',
        type: 'action',
        handler,
      });

      await manager.execute(point.id, {
        input: 'test',
        metadata: { key: 'value' },
      });

      expect(handler).toHaveBeenCalledWith({
        input: 'test',
        metadata: { key: 'value' },
      });
    });
  });

  describe('executeSequence', () => {
    it('should execute points in sequence', async () => {
      const executionOrder: number[] = [];

      const point1 = manager.create({
        name: 'point-1',
        type: 'action',
        handler: jest.fn().mockImplementation(async () => {
          executionOrder.push(1);
          return { output: 'output-1' };
        }),
      });

      const point2 = manager.create({
        name: 'point-2',
        type: 'action',
        handler: jest.fn().mockImplementation(async () => {
          executionOrder.push(2);
          return { output: 'output-2' };
        }),
      });

      const results = await manager.executeSequence(
        [point1.id, point2.id],
        { input: 'initial' },
      );

      expect(executionOrder).toEqual([1, 2]);
      expect(results).toHaveLength(2);
      expect(results[0].output).toBe('output-1');
      expect(results[1].output).toBe('output-2');
    });

    it('should pass output to next point as input', async () => {
      const handler2 = jest.fn().mockResolvedValue({ output: 'final' });

      const point1 = manager.create({
        name: 'point-1',
        type: 'action',
        handler: jest.fn().mockResolvedValue({ output: 'intermediate' }),
      });

      const point2 = manager.create({
        name: 'point-2',
        type: 'action',
        handler: handler2,
      });

      await manager.executeSequence([point1.id, point2.id], { input: 'initial' });

      expect(handler2).toHaveBeenCalledWith({
        input: 'intermediate',
        metadata: undefined,
      });
    });

    it('should stop execution when skip is true', async () => {
      const handler2 = jest.fn();

      const point1 = manager.create({
        name: 'point-1',
        type: 'action',
        handler: jest.fn().mockResolvedValue({ output: 'result', skip: true }),
      });

      const point2 = manager.create({
        name: 'point-2',
        type: 'action',
        handler: handler2,
      });

      const results = await manager.executeSequence(
        [point1.id, point2.id],
        { input: 'initial' },
      );

      expect(results).toHaveLength(1);
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should preserve metadata across sequence', async () => {
      const handler2 = jest.fn().mockResolvedValue({ output: 'final' });

      const point1 = manager.create({
        name: 'point-1',
        type: 'action',
        handler: jest.fn().mockResolvedValue({ output: 'intermediate' }),
      });

      const point2 = manager.create({
        name: 'point-2',
        type: 'action',
        handler: handler2,
      });

      await manager.executeSequence(
        [point1.id, point2.id],
        { input: 'initial', metadata: { key: 'value' } },
      );

      expect(handler2).toHaveBeenCalledWith({
        input: 'intermediate',
        metadata: { key: 'value' },
      });
    });
  });

  describe('executeDecision', () => {
    it('should execute decision and route to correct branch', async () => {
      const decisionHandler: LogicPointHandler = jest.fn().mockResolvedValue({ output: 'true' });
      const trueHandler: LogicPointHandler = jest.fn().mockResolvedValue({ output: 'true-result' });
      const falseHandler: LogicPointHandler = jest.fn().mockResolvedValue({ output: 'false-result' });

      const decisionPoint = manager.create({
        name: 'decision',
        type: 'decision',
        handler: decisionHandler,
      });

      const truePoint = manager.create({
        name: 'true-branch',
        type: 'action',
        handler: trueHandler,
      });

      const falsePoint = manager.create({
        name: 'false-branch',
        type: 'action',
        handler: falseHandler,
      });

      const result = await manager.executeDecision(
        decisionPoint.id,
        { input: 'test' },
        { true: truePoint.id, false: falsePoint.id },
      );

      expect(result.output).toBe('true-result');
      expect(trueHandler).toHaveBeenCalled();
      expect(falseHandler).not.toHaveBeenCalled();
    });

    it('should use default branch when no match', async () => {
      const decisionHandler: LogicPointHandler = jest.fn().mockResolvedValue({ output: 'unknown' });
      const defaultHandler: LogicPointHandler = jest.fn().mockResolvedValue({ output: 'default-result' });

      const decisionPoint = manager.create({
        name: 'decision',
        type: 'decision',
        handler: decisionHandler,
      });

      const defaultPoint = manager.create({
        name: 'default-branch',
        type: 'action',
        handler: defaultHandler,
      });

      const result = await manager.executeDecision(
        decisionPoint.id,
        { input: 'test' },
        { default: defaultPoint.id },
      );

      expect(result.output).toBe('default-result');
    });

    it('should throw when no matching branch and no default', async () => {
      const decisionHandler: LogicPointHandler = jest.fn().mockResolvedValue({ output: 'unknown' });

      const decisionPoint = manager.create({
        name: 'decision',
        type: 'decision',
        handler: decisionHandler,
      });

      await expect(
        manager.executeDecision(
          decisionPoint.id,
          { input: 'test' },
          { true: 'some-id' },
        ),
      ).rejects.toThrow('No branch found for decision result: unknown');
    });

    it('should pass decision result in metadata', async () => {
      const decisionHandler: LogicPointHandler = jest.fn().mockResolvedValue({ output: 'yes' });
      const branchHandler: LogicPointHandler = jest.fn().mockResolvedValue({ output: 'result' });

      const decisionPoint = manager.create({
        name: 'decision',
        type: 'decision',
        handler: decisionHandler,
      });

      const branchPoint = manager.create({
        name: 'branch',
        type: 'action',
        handler: branchHandler,
      });

      await manager.executeDecision(
        decisionPoint.id,
        { input: 'test', metadata: { existing: 'meta' } },
        { yes: branchPoint.id },
      );

      expect(branchHandler).toHaveBeenCalledWith({
        input: 'test',
        metadata: { existing: 'meta', decisionResult: 'yes' },
      });
    });
  });

  describe('remove', () => {
    it('should remove logic point by id', () => {
      const point = manager.create({
        name: 'test-point',
        type: 'entry',
        handler: jest.fn().mockResolvedValue({ output: null }),
      });

      const result = manager.remove(point.id);

      expect(result).toBe(true);
      expect(manager.get(point.id)).toBeUndefined();
    });

    it('should return false for unknown id', () => {
      const result = manager.remove('unknown-id');
      expect(result).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return all logic points', () => {
      manager.create({
        name: 'point-1',
        type: 'entry',
        handler: jest.fn().mockResolvedValue({ output: null }),
      });
      manager.create({
        name: 'point-2',
        type: 'exit',
        handler: jest.fn().mockResolvedValue({ output: null }),
      });

      const all = manager.getAll();

      expect(all).toHaveLength(2);
    });

    it('should return empty array when no points', () => {
      const all = manager.getAll();
      expect(all).toEqual([]);
    });
  });

  describe('getByType', () => {
    it('should return logic points by type', () => {
      manager.create({
        name: 'entry-1',
        type: 'entry',
        handler: jest.fn().mockResolvedValue({ output: null }),
      });
      manager.create({
        name: 'entry-2',
        type: 'entry',
        handler: jest.fn().mockResolvedValue({ output: null }),
      });
      manager.create({
        name: 'exit-1',
        type: 'exit',
        handler: jest.fn().mockResolvedValue({ output: null }),
      });

      const entries = manager.getByType('entry');

      expect(entries).toHaveLength(2);
      expect(entries.every((p) => p.type === 'entry')).toBe(true);
    });

    it('should return empty array for type with no points', () => {
      const decisions = manager.getByType('decision');
      expect(decisions).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should remove all logic points', () => {
      manager.create({
        name: 'point-1',
        type: 'entry',
        handler: jest.fn().mockResolvedValue({ output: null }),
      });
      manager.create({
        name: 'point-2',
        type: 'exit',
        handler: jest.fn().mockResolvedValue({ output: null }),
      });

      manager.clear();

      expect(manager.getAll()).toEqual([]);
      expect(manager.size).toBe(0);
    });
  });

  describe('size', () => {
    it('should return number of logic points', () => {
      expect(manager.size).toBe(0);

      manager.create({
        name: 'point-1',
        type: 'entry',
        handler: jest.fn().mockResolvedValue({ output: null }),
      });

      expect(manager.size).toBe(1);

      manager.create({
        name: 'point-2',
        type: 'exit',
        handler: jest.fn().mockResolvedValue({ output: null }),
      });

      expect(manager.size).toBe(2);
    });
  });
});

describe('createLogicPointManager', () => {
  it('should create a new LogicPointManager instance', () => {
    const manager = createLogicPointManager();
    expect(manager).toBeInstanceOf(LogicPointManager);
  });
});

describe('Helper functions', () => {
  let manager: LogicPointManager;

  beforeEach(() => {
    manager = new LogicPointManager();
  });

  describe('createEntryPoint', () => {
    it('should create entry type point', () => {
      const handler: LogicPointHandler = jest.fn().mockResolvedValue({ output: null });
      const point = createEntryPoint(manager, 'entry-point', handler);

      expect(point.type).toBe('entry');
      expect(point.name).toBe('entry-point');
    });
  });

  describe('createExitPoint', () => {
    it('should create exit type point', () => {
      const handler: LogicPointHandler = jest.fn().mockResolvedValue({ output: null });
      const point = createExitPoint(manager, 'exit-point', handler);

      expect(point.type).toBe('exit');
      expect(point.name).toBe('exit-point');
    });
  });

  describe('createDecisionPoint', () => {
    it('should create decision type point', () => {
      const handler: LogicPointHandler = jest.fn().mockResolvedValue({ output: null });
      const point = createDecisionPoint(manager, 'decision-point', handler);

      expect(point.type).toBe('decision');
      expect(point.name).toBe('decision-point');
    });
  });

  describe('createCheckpoint', () => {
    it('should create checkpoint type point', () => {
      const handler: LogicPointHandler = jest.fn().mockResolvedValue({ output: null });
      const point = createCheckpoint(manager, 'checkpoint', handler);

      expect(point.type).toBe('checkpoint');
      expect(point.name).toBe('checkpoint');
    });
  });
});
