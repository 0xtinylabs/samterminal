/**
 * Executor tests
 */


import {
  ServiceRegistryImpl,
  Executor,
  createServiceRegistry,
  createExecutor,
} from './executor.js';
import type { Action } from '../interfaces/action.interface.js';
import type { Provider } from '../interfaces/provider.interface.js';
import type { Evaluator } from '../interfaces/evaluator.interface.js';

describe('ServiceRegistryImpl', () => {
  let registry: ServiceRegistryImpl;

  beforeEach(() => {
    registry = new ServiceRegistryImpl();
  });

  describe('registerAction', () => {
    it('should register action', () => {
      const action: Action = {
        name: 'test:action',
        description: 'Test action',
        execute: jest.fn(),
      };

      registry.registerAction(action, 'test-plugin');

      expect(registry.getAction('test:action')).toBe(action);
    });

    it('should overwrite existing action', () => {
      const action1: Action = {
        name: 'test:action',
        description: 'First',
        execute: jest.fn(),
      };
      const action2: Action = {
        name: 'test:action',
        description: 'Second',
        execute: jest.fn(),
      };

      registry.registerAction(action1, 'plugin1');
      registry.registerAction(action2, 'plugin2');

      expect(registry.getAction('test:action')?.description).toBe('Second');
    });
  });

  describe('registerProvider', () => {
    it('should register provider', () => {
      const provider: Provider = {
        name: 'test:provider',
        description: 'Test provider',
        get: jest.fn(),
      };

      registry.registerProvider(provider, 'test-plugin');

      expect(registry.getProvider('test:provider')).toBe(provider);
    });
  });

  describe('registerEvaluator', () => {
    it('should register evaluator', () => {
      const evaluator: Evaluator = {
        name: 'test:evaluator',
        description: 'Test evaluator',
        evaluate: jest.fn(),
      };

      registry.registerEvaluator(evaluator, 'test-plugin');

      expect(registry.getEvaluator('test:evaluator')).toBe(evaluator);
    });
  });

  describe('getAction', () => {
    it('should return undefined for unknown action', () => {
      expect(registry.getAction('unknown')).toBeUndefined();
    });
  });

  describe('getProvider', () => {
    it('should return undefined for unknown provider', () => {
      expect(registry.getProvider('unknown')).toBeUndefined();
    });
  });

  describe('getEvaluator', () => {
    it('should return undefined for unknown evaluator', () => {
      expect(registry.getEvaluator('unknown')).toBeUndefined();
    });
  });

  describe('getAllActions', () => {
    it('should return all actions', () => {
      const action1: Action = { name: 'a1', description: 'A1', execute: jest.fn() };
      const action2: Action = { name: 'a2', description: 'A2', execute: jest.fn() };

      registry.registerAction(action1, 'plugin');
      registry.registerAction(action2, 'plugin');

      const all = registry.getAllActions();

      expect(all.size).toBe(2);
      expect(all.get('a1')).toBe(action1);
    });
  });

  describe('getAllProviders', () => {
    it('should return all providers', () => {
      const provider: Provider = { name: 'p1', description: 'P1', get: jest.fn() };
      registry.registerProvider(provider, 'plugin');

      const all = registry.getAllProviders();

      expect(all.size).toBe(1);
    });
  });

  describe('getAllEvaluators', () => {
    it('should return all evaluators', () => {
      const evaluator: Evaluator = {
        name: 'e1',
        description: 'E1',
        evaluate: jest.fn(),
      };
      registry.registerEvaluator(evaluator, 'plugin');

      const all = registry.getAllEvaluators();

      expect(all.size).toBe(1);
    });
  });

  describe('unregisterPlugin', () => {
    it('should remove all services for plugin', () => {
      const action: Action = { name: 'a1', description: 'A1', execute: jest.fn() };
      const provider: Provider = { name: 'p1', description: 'P1', get: jest.fn() };
      const evaluator: Evaluator = {
        name: 'e1',
        description: 'E1',
        evaluate: jest.fn(),
      };

      registry.registerAction(action, 'my-plugin');
      registry.registerProvider(provider, 'my-plugin');
      registry.registerEvaluator(evaluator, 'my-plugin');
      registry.registerAction(
        { name: 'a2', description: 'A2', execute: jest.fn() },
        'other-plugin'
      );

      registry.unregisterPlugin('my-plugin');

      expect(registry.getAction('a1')).toBeUndefined();
      expect(registry.getProvider('p1')).toBeUndefined();
      expect(registry.getEvaluator('e1')).toBeUndefined();
      expect(registry.getAction('a2')).toBeDefined();
    });
  });

  describe('clear', () => {
    it('should clear all services', () => {
      registry.registerAction(
        { name: 'a1', description: 'A1', execute: jest.fn() },
        'plugin'
      );
      registry.registerProvider(
        { name: 'p1', description: 'P1', get: jest.fn() },
        'plugin'
      );

      registry.clear();

      expect(registry.getAllActions().size).toBe(0);
      expect(registry.getAllProviders().size).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return counts', () => {
      registry.registerAction(
        { name: 'a1', description: 'A1', execute: jest.fn() },
        'plugin'
      );
      registry.registerProvider(
        { name: 'p1', description: 'P1', get: jest.fn() },
        'plugin'
      );
      registry.registerEvaluator(
        { name: 'e1', description: 'E1', evaluate: jest.fn() },
        'plugin'
      );

      const stats = registry.getStats();

      expect(stats.actions).toBe(1);
      expect(stats.providers).toBe(1);
      expect(stats.evaluators).toBe(1);
    });
  });
});

describe('Executor', () => {
  let registry: ServiceRegistryImpl;
  let executor: Executor;

  beforeEach(() => {
    registry = new ServiceRegistryImpl();
    executor = new Executor(registry);
  });

  describe('executeAction', () => {
    it('should return error for unknown action', async () => {
      const result = await executor.executeAction('unknown', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Action not found');
    });

    it('should execute action', async () => {
      const action: Action = {
        name: 'test:action',
        description: 'Test',
        execute: jest.fn().mockResolvedValue({ success: true, data: { value: 42 } }),
      };
      registry.registerAction(action, 'test');

      const result = await executor.executeAction('test:action', { input: 'data' });

      expect(result.success).toBe(true);
      expect(action.execute).toHaveBeenCalled();
    });

    it('should pass context to action', async () => {
      const action: Action = {
        name: 'test:action',
        description: 'Test',
        execute: jest.fn().mockResolvedValue({ success: true }),
      };
      registry.registerAction(action, 'test');

      await executor.executeAction('test:action', { data: 'test' });

      const context = (action.execute as any).mock.calls[0][0];
      expect(context.input).toEqual({ data: 'test' });
      expect(context.pluginName).toBe('test');
    });

    it('should validate input if validator exists', async () => {
      const action: Action = {
        name: 'test:action',
        description: 'Test',
        execute: jest.fn(),
        validate: jest.fn().mockReturnValue({ valid: false, errors: ['Invalid'] }),
      };
      registry.registerAction(action, 'test');

      const result = await executor.executeAction('test:action', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
      expect(action.execute).not.toHaveBeenCalled();
    });

    it('should pass validation and execute', async () => {
      const action: Action = {
        name: 'test:action',
        description: 'Test',
        execute: jest.fn().mockResolvedValue({ success: true }),
        validate: jest.fn().mockReturnValue({ valid: true }),
      };
      registry.registerAction(action, 'test');

      const result = await executor.executeAction('test:action', {});

      expect(result.success).toBe(true);
    });

    it('should handle execution errors', async () => {
      const action: Action = {
        name: 'test:action',
        description: 'Test',
        execute: jest.fn().mockRejectedValue(new Error('Execution failed')),
      };
      registry.registerAction(action, 'test');

      const result = await executor.executeAction('test:action', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Execution failed');
    });

    it('should retry on failure when configured', async () => {
      const action: Action = {
        name: 'test:action',
        description: 'Test',
        execute: jest
          .fn()
          .mockRejectedValueOnce(new Error('Fail 1'))
          .mockRejectedValueOnce(new Error('Fail 2'))
          .mockResolvedValue({ success: true }),
      };
      registry.registerAction(action, 'test');

      const result = await executor.executeAction('test:action', {}, {
        retry: true,
        maxRetries: 3,
      });

      expect(result.success).toBe(true);
      expect(action.execute).toHaveBeenCalledTimes(3);
    });
  });

  describe('getData', () => {
    it('should return error for unknown provider', async () => {
      const result = await executor.getData('unknown', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Provider not found');
    });

    it('should get data from provider', async () => {
      const provider: Provider = {
        name: 'test:provider',
        description: 'Test',
        get: jest.fn().mockResolvedValue({
          success: true,
          data: { value: 'data' },
          timestamp: new Date(),
        }),
      };
      registry.registerProvider(provider, 'test');

      const result = await executor.getData('test:provider', { query: 'test' });

      expect(result.success).toBe(true);
    });

    it('should handle provider errors', async () => {
      const provider: Provider = {
        name: 'test:provider',
        description: 'Test',
        get: jest.fn().mockRejectedValue(new Error('Provider error')),
      };
      registry.registerProvider(provider, 'test');

      const result = await executor.getData('test:provider', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Provider error');
    });
  });

  describe('evaluate', () => {
    it('should throw for unknown evaluator', async () => {
      await expect(executor.evaluate('unknown', {}, {})).rejects.toThrow(
        'Evaluator not found'
      );
    });

    it('should evaluate condition', async () => {
      const evaluator: Evaluator = {
        name: 'test:evaluator',
        description: 'Test',
        evaluate: jest.fn().mockResolvedValue(true),
      };
      registry.registerEvaluator(evaluator, 'test');

      const result = await executor.evaluate(
        'test:evaluator',
        { condition: 'test' },
        { data: 'test' }
      );

      expect(result).toBe(true);
    });
  });

  describe('getAvailableActions', () => {
    it('should return action names', () => {
      registry.registerAction(
        { name: 'a1', description: 'A1', execute: jest.fn() },
        'plugin'
      );
      registry.registerAction(
        { name: 'a2', description: 'A2', execute: jest.fn() },
        'plugin'
      );

      const actions = executor.getAvailableActions();

      expect(actions).toContain('a1');
      expect(actions).toContain('a2');
    });
  });

  describe('getAvailableProviders', () => {
    it('should return provider names', () => {
      registry.registerProvider(
        { name: 'p1', description: 'P1', get: jest.fn() },
        'plugin'
      );

      const providers = executor.getAvailableProviders();

      expect(providers).toContain('p1');
    });
  });

  describe('getAvailableEvaluators', () => {
    it('should return evaluator names', () => {
      registry.registerEvaluator(
        { name: 'e1', description: 'E1', evaluate: jest.fn() },
        'plugin'
      );

      const evaluators = executor.getAvailableEvaluators();

      expect(evaluators).toContain('e1');
    });
  });
});

describe('createServiceRegistry', () => {
  it('should create a new ServiceRegistryImpl', () => {
    const registry = createServiceRegistry();
    expect(registry).toBeInstanceOf(ServiceRegistryImpl);
  });
});

describe('createExecutor', () => {
  it('should create a new Executor', () => {
    const registry = createServiceRegistry();
    const executor = createExecutor(registry);
    expect(executor).toBeInstanceOf(Executor);
  });
});
