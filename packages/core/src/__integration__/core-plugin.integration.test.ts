/**
 * Core + Plugin Integration Tests
 * Tests for Runtime, Flow Engine, and Hooks System integration with plugins
 */


import { PluginRegistry, createPluginRegistry } from '../plugins/registry.js';
import { ServiceRegistryImpl, createServiceRegistry, Executor, createExecutor } from '../runtime/executor.js';
import { HooksService, createHooksService } from '../hooks/service.js';
import { FlowEngineImpl, createFlowEngine } from '../flow/engine.js';
import type { SamTerminalPlugin } from '../interfaces/plugin.interface.js';
import type { Action, ActionContext, ActionResult } from '../interfaces/action.interface.js';
import type { Provider, ProviderContext, ProviderResult } from '../interfaces/provider.interface.js';
import type { Evaluator, EvaluatorContext } from '../interfaces/evaluator.interface.js';
import type { Hook } from '../interfaces/hook.interface.js';
import type { SamTerminalCore } from '../interfaces/core.interface.js';
import type { FlowNode, ActionNodeData, ConditionNodeData } from '../types/index.js';
import { uuid } from '../utils/id.js';

/**
 * Create a flow node helper
 */
function createNode(
  type: FlowNode['type'],
  name: string,
  data: FlowNode['data'],
): FlowNode {
  return {
    id: uuid(),
    type,
    name,
    position: { x: 0, y: 0 },
    data,
  };
}

/**
 * Create edge helper
 */
function createEdge(source: string, target: string, options: Record<string, unknown> = {}) {
  return { id: uuid(), source, target, ...options };
}

describe('Core + Plugin Integration Tests', () => {
  let registry: PluginRegistry;
  let services: ServiceRegistryImpl;
  let hooks: HooksService;
  let flowEngine: FlowEngineImpl;
  let executor: Executor;
  let mockCore: SamTerminalCore;

  beforeEach(() => {
    registry = createPluginRegistry();
    services = createServiceRegistry();
    hooks = createHooksService();
    flowEngine = createFlowEngine();
    executor = createExecutor(services);

    mockCore = {
      config: {},
      services,
      hooks,
      flow: flowEngine,
      runtime: {
        executeAction: async (name: string, input: unknown) => {
          const action = services.getAction(name);
          if (!action) {
            return { success: false, error: `Action not found: ${name}` };
          }
          return action.execute({
            pluginName: name.split(':')[0] ?? 'test',
            agentId: uuid(),
            input,
          });
        },
        getData: async (name: string, query: unknown) => {
          return executor.getData(name, query);
        },
      },
    } as unknown as SamTerminalCore;

    flowEngine.setCore(mockCore);
  });

  afterEach(() => {
    registry.clear();
    services.clear();
    hooks.clear();
    flowEngine.clear();
  });

  describe('Runtime + Plugin Tests', () => {
    it('should register and execute plugin actions through runtime', async () => {
      let executionCount = 0;

      const plugin: SamTerminalPlugin = {
        name: 'counter-plugin',
        version: '1.0.0',
        description: 'Counter plugin',
        actions: [
          {
            name: 'counter:increment',
            execute: async () => {
              executionCount++;
              return { success: true, data: { count: executionCount } };
            },
          },
        ],
        init: async () => {
          services.registerAction(
            {
              name: 'counter:increment',
              execute: async () => {
                executionCount++;
                return { success: true, data: { count: executionCount } };
              },
            },
            'counter-plugin',
          );
        },
      };

      registry.register(plugin);
      await plugin.init(mockCore);

      const result1 = await executor.executeAction('counter:increment', {});
      const result2 = await executor.executeAction('counter:increment', {});
      const result3 = await executor.executeAction('counter:increment', {});

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);
      expect(executionCount).toBe(3);
    });

    it('should handle action validation', async () => {
      const validatingAction: Action = {
        name: 'validated:action',
        validate: (input: unknown) => {
          const data = input as { value?: number };
          if (typeof data?.value !== 'number') {
            return { valid: false, errors: ['value must be a number'] };
          }
          if (data.value < 0) {
            return { valid: false, errors: ['value must be non-negative'] };
          }
          return { valid: true };
        },
        execute: async (ctx) => {
          return { success: true, data: { doubled: ((ctx.input as { value: number }).value) * 2 } };
        },
      };

      services.registerAction(validatingAction, 'test');

      // Valid input
      const validResult = await executor.executeAction('validated:action', { value: 5 });
      expect(validResult.success).toBe(true);
      expect((validResult.data as { doubled: number }).doubled).toBe(10);

      // Invalid input - not a number
      const invalidResult = await executor.executeAction('validated:action', { value: 'hello' });
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error).toContain('value must be a number');

      // Invalid input - negative
      const negativeResult = await executor.executeAction('validated:action', { value: -5 });
      expect(negativeResult.success).toBe(false);
      expect(negativeResult.error).toContain('non-negative');
    });

    it('should support action retry on failure', async () => {
      let attempts = 0;

      const flakeyAction: Action = {
        name: 'flakey:action',
        execute: async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Temporary failure');
          }
          return { success: true, data: { attempts } };
        },
      };

      services.registerAction(flakeyAction, 'test');

      const result = await executor.executeAction('flakey:action', {}, { retry: true, maxRetries: 5 });

      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    });

    it('should register and query plugin providers through runtime', async () => {
      const stateProvider: Provider = {
        name: 'state:current',
        type: 'custom',
        get: async (ctx) => {
          const { key } = ctx.query as { key: string };
          const state: Record<string, unknown> = {
            count: 42,
            name: 'test',
            active: true,
          };
          return {
            success: true,
            data: { value: state[key] },
            timestamp: new Date(),
          };
        },
      };

      services.registerProvider(stateProvider, 'state-plugin');

      const countResult = await executor.getData('state:current', { key: 'count' });
      const nameResult = await executor.getData('state:current', { key: 'name' });

      expect(countResult.success).toBe(true);
      expect((countResult.data as { value: number }).value).toBe(42);
      expect(nameResult.success).toBe(true);
      expect((nameResult.data as { value: string }).value).toBe('test');
    });

    it('should register and use plugin evaluators', async () => {
      const rangeEvaluator: Evaluator = {
        name: 'math:inRange',
        evaluate: async (ctx: EvaluatorContext) => {
          const { min, max } = ctx.condition as { min: number; max: number };
          const value = ctx.data as number;
          return value >= min && value <= max;
        },
      };

      services.registerEvaluator(rangeEvaluator, 'math-plugin');

      const inRange = await executor.evaluate('math:inRange', { min: 0, max: 100 }, 50);
      const outOfRange = await executor.evaluate('math:inRange', { min: 0, max: 100 }, 150);

      expect(inRange).toBe(true);
      expect(outOfRange).toBe(false);
    });

    it('should handle concurrent action executions', async () => {
      const results: number[] = [];
      let counter = 0;

      const asyncAction: Action = {
        name: 'async:action',
        execute: async (ctx) => {
          const delay = (ctx.input as { delay: number }).delay;
          const myNumber = ++counter;
          await new Promise((resolve) => setTimeout(resolve, delay));
          results.push(myNumber);
          return { success: true, data: { number: myNumber } };
        },
      };

      services.registerAction(asyncAction, 'async-plugin');

      // Execute concurrently with different delays
      const promises = [
        executor.executeAction('async:action', { delay: 30 }),
        executor.executeAction('async:action', { delay: 10 }),
        executor.executeAction('async:action', { delay: 20 }),
      ];

      await Promise.all(promises);

      // Results should be in order of completion (2, 3, 1)
      expect(results).toEqual([2, 3, 1]);
    });
  });

  describe('Flow Engine + Plugin Tests', () => {
    it('should execute flow with plugin actions', async () => {
      const log: string[] = [];

      const logAction: Action = {
        name: 'logger:log',
        execute: async (ctx) => {
          const message = (ctx.input as { message: string }).message;
          log.push(message);
          return { success: true, data: { logged: message } };
        },
      };

      services.registerAction(logAction, 'logger-plugin');

      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const logNode1 = createNode('action', 'Log 1', {
        pluginName: 'logger',
        actionName: 'log',
        params: { message: 'First' },
      } as ActionNodeData);

      const logNode2 = createNode('action', 'Log 2', {
        pluginName: 'logger',
        actionName: 'log',
        params: { message: 'Second' },
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'Logging Flow',
        nodes: [triggerNode, logNode1, logNode2],
        edges: [
          createEdge(triggerNode.id, logNode1.id),
          createEdge(logNode1.id, logNode2.id),
        ],
      });

      const context = await flowEngine.execute(flow.id);

      expect(context.status).toBe('completed');
      expect(log).toEqual(['First', 'Second']);
    });

    it('should use plugin data in flow conditions', async () => {
      const checkProvider: Provider = {
        name: 'checker:status',
        type: 'custom',
        get: async (ctx) => {
          const { type } = ctx.query as { type: string };
          return {
            success: true,
            data: { enabled: type === 'premium' },
            timestamp: new Date(),
          };
        },
      };

      const premiumAction: Action = {
        name: 'checker:premium',
        execute: async () => ({ success: true, data: { feature: 'premium' } }),
      };

      const basicAction: Action = {
        name: 'checker:basic',
        execute: async () => ({ success: true, data: { feature: 'basic' } }),
      };

      services.registerProvider(checkProvider, 'checker-plugin');
      services.registerAction(premiumAction, 'checker-plugin');
      services.registerAction(basicAction, 'checker-plugin');

      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const conditionNode = createNode('condition', 'Check Premium', {
        conditions: [{ field: 'isPremium', operator: 'eq', value: true }],
        operator: 'and',
      } as ConditionNodeData);

      const premiumNode = createNode('action', 'Premium Feature', {
        pluginName: 'checker',
        actionName: 'premium',
        params: {},
      } as ActionNodeData);

      const basicNode = createNode('action', 'Basic Feature', {
        pluginName: 'checker',
        actionName: 'basic',
        params: {},
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'Premium Check Flow',
        nodes: [triggerNode, conditionNode, premiumNode, basicNode],
        edges: [
          createEdge(triggerNode.id, conditionNode.id),
          createEdge(conditionNode.id, premiumNode.id, { sourceHandle: 'true' }),
          createEdge(conditionNode.id, basicNode.id, { sourceHandle: 'false' }),
        ],
      });

      // Premium user
      const premiumContext = await flowEngine.execute(flow.id, { isPremium: true });
      expect(premiumContext.nodeResults[premiumNode.id]).toBeDefined();
      expect(premiumContext.nodeResults[basicNode.id]).toBeUndefined();

      // Basic user
      const basicContext = await flowEngine.execute(flow.id, { isPremium: false });
      expect(basicContext.nodeResults[premiumNode.id]).toBeUndefined();
      expect(basicContext.nodeResults[basicNode.id]).toBeDefined();
    });

    it('should chain plugin actions in complex flow', async () => {
      const operations: string[] = [];

      const fetchAction: Action = {
        name: 'data:fetch',
        execute: async (ctx) => {
          operations.push('fetch');
          return { success: true, data: { items: [1, 2, 3] } };
        },
      };

      const transformAction: Action = {
        name: 'data:transform',
        execute: async (ctx) => {
          operations.push('transform');
          const items = (ctx.input as { items: number[] }).items ?? [];
          return { success: true, data: { items: items.map((x) => x * 2) } };
        },
      };

      const saveAction: Action = {
        name: 'data:save',
        execute: async (ctx) => {
          operations.push('save');
          return { success: true, data: { saved: true } };
        },
      };

      services.registerAction(fetchAction, 'data-plugin');
      services.registerAction(transformAction, 'data-plugin');
      services.registerAction(saveAction, 'data-plugin');

      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const fetchNode = createNode('action', 'Fetch', {
        pluginName: 'data',
        actionName: 'fetch',
        params: {},
      } as ActionNodeData);

      const transformNode = createNode('action', 'Transform', {
        pluginName: 'data',
        actionName: 'transform',
        params: { items: '{{_lastOutput.data.items}}' },
      } as ActionNodeData);

      const saveNode = createNode('action', 'Save', {
        pluginName: 'data',
        actionName: 'save',
        params: {},
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'Data Pipeline',
        nodes: [triggerNode, fetchNode, transformNode, saveNode],
        edges: [
          createEdge(triggerNode.id, fetchNode.id),
          createEdge(fetchNode.id, transformNode.id),
          createEdge(transformNode.id, saveNode.id),
        ],
      });

      await flowEngine.execute(flow.id);

      expect(operations).toEqual(['fetch', 'transform', 'save']);
    });
  });

  describe('Hooks System + Plugin Tests', () => {
    it('should register plugin hooks during initialization', async () => {
      const hookCalls: string[] = [];

      const plugin: SamTerminalPlugin = {
        name: 'hook-plugin',
        version: '1.0.0',
        description: 'Plugin with hooks',
        hooks: [
          {
            name: 'on-init',
            event: 'system:ready',
            handler: async () => {
              hookCalls.push('system:ready');
            },
          },
        ],
        init: async () => {
          hooks.register(
            {
              name: 'on-init',
              event: 'system:ready',
              handler: async () => {
                hookCalls.push('system:ready');
              },
            },
            'hook-plugin',
          );
        },
      };

      registry.register(plugin);
      await plugin.init(mockCore);

      // Emit system:ready
      await hooks.emit('system:ready', {});

      expect(hookCalls).toContain('system:ready');
    });

    it('should execute hooks in priority order', async () => {
      const executionOrder: number[] = [];

      hooks.register(
        {
          name: 'low-priority',
          event: 'custom:test',
          priority: 1,
          handler: async () => {
            executionOrder.push(1);
          },
        },
        'plugin-a',
      );

      hooks.register(
        {
          name: 'high-priority',
          event: 'custom:test',
          priority: 10,
          handler: async () => {
            executionOrder.push(10);
          },
        },
        'plugin-b',
      );

      hooks.register(
        {
          name: 'medium-priority',
          event: 'custom:test',
          priority: 5,
          handler: async () => {
            executionOrder.push(5);
          },
        },
        'plugin-c',
      );

      await hooks.emit('custom:test', {});

      // Higher priority executes first
      expect(executionOrder).toEqual([10, 5, 1]);
    });

    it('should handle one-time hooks', async () => {
      let callCount = 0;

      hooks.once('custom:once', async () => {
        callCount++;
      });

      await hooks.emit('custom:once', {});
      await hooks.emit('custom:once', {});
      await hooks.emit('custom:once', {});

      expect(callCount).toBe(1);
    });

    it('should unregister hooks when plugin is destroyed', async () => {
      let callCount = 0;

      const plugin: SamTerminalPlugin = {
        name: 'destroyable-plugin',
        version: '1.0.0',
        description: 'Plugin that gets destroyed',
        init: async () => {
          // Register hook with pluginName for proper tracking
          hooks.register(
            {
              name: 'plugin-hook',
              event: 'custom:event',
              handler: async () => {
                callCount++;
              },
            },
            'destroyable-plugin',
          );
        },
        destroy: async () => {
          hooks.unregisterPlugin('destroyable-plugin');
        },
      };

      await plugin.init(mockCore);

      // Hook should work
      await hooks.emit('custom:event', {});
      expect(callCount).toBe(1);

      // Destroy plugin
      if (plugin.destroy) {
        await plugin.destroy();
      }

      // Hook should be unregistered
      const hookCount = hooks.getTotalHookCount();
      expect(hookCount).toBe(0);

      // Verify hook no longer fires
      await hooks.emit('custom:event', {});
      expect(callCount).toBe(1); // Still 1, not 2
    });

    it('should pass payload data to hooks', async () => {
      let receivedData: unknown;

      hooks.on('custom:data', async (payload) => {
        receivedData = payload.data;
      });

      await hooks.emit('custom:data', { message: 'hello', count: 42 });

      expect(receivedData).toEqual({ message: 'hello', count: 42 });
    });

    it('should stop on error when configured', async () => {
      const executedHooks: string[] = [];

      hooks.register(
        {
          name: 'first',
          event: 'custom:stop-on-error',
          priority: 10,
          handler: async () => {
            executedHooks.push('first');
          },
        },
        'test',
      );

      hooks.register(
        {
          name: 'failing',
          event: 'custom:stop-on-error',
          priority: 5,
          handler: async () => {
            throw new Error('Hook failed');
          },
        },
        'test',
      );

      hooks.register(
        {
          name: 'last',
          event: 'custom:stop-on-error',
          priority: 1,
          handler: async () => {
            executedHooks.push('last');
          },
        },
        'test',
      );

      await hooks.emit('custom:stop-on-error', {}, { stopOnError: true });

      expect(executedHooks).toEqual(['first']);
      expect(executedHooks).not.toContain('last');
    });

    it('should continue on error when not configured to stop', async () => {
      const executedHooks: string[] = [];

      hooks.register(
        {
          name: 'first',
          event: 'custom:continue-on-error',
          priority: 10,
          handler: async () => {
            executedHooks.push('first');
          },
        },
        'test',
      );

      hooks.register(
        {
          name: 'failing',
          event: 'custom:continue-on-error',
          priority: 5,
          handler: async () => {
            executedHooks.push('failing');
            throw new Error('Hook failed');
          },
        },
        'test',
      );

      hooks.register(
        {
          name: 'last',
          event: 'custom:continue-on-error',
          priority: 1,
          handler: async () => {
            executedHooks.push('last');
          },
        },
        'test',
      );

      const results = await hooks.emit('custom:continue-on-error', {}, { stopOnError: false });

      expect(executedHooks).toEqual(['first', 'failing', 'last']);
      expect(results.some((r) => !r.success)).toBe(true);
    });

    it('should track hook execution results', async () => {
      hooks.on('custom:tracked', async () => {
        // Success
      });

      hooks.on('custom:tracked', async () => {
        throw new Error('Failed hook');
      });

      const results = await hooks.emit('custom:tracked', {});

      expect(results.length).toBe(2);
      expect(results.filter((r) => r.success).length).toBe(1);
      expect(results.filter((r) => !r.success).length).toBe(1);
      expect(results.every((r) => typeof r.duration === 'number')).toBe(true);
    });
  });

  describe('Full Integration Scenarios', () => {
    it('should handle complete plugin lifecycle with flow execution', async () => {
      const events: string[] = [];

      // Create a plugin that uses actions, providers, and hooks
      const fullPlugin: SamTerminalPlugin = {
        name: 'full-plugin',
        version: '1.0.0',
        description: 'Full featured plugin',
        actions: [
          {
            name: 'full:action',
            execute: async (ctx) => {
              events.push('action:executed');
              await hooks.emit('full:action:complete', { input: ctx.input });
              return { success: true, data: { result: 'done' } };
            },
          },
        ],
        providers: [
          {
            name: 'full:data',
            type: 'custom',
            get: async () => {
              events.push('provider:queried');
              return { success: true, data: { value: 100 }, timestamp: new Date() };
            },
          },
        ],
        init: async () => {
          events.push('plugin:init');

          services.registerAction(
            {
              name: 'full:action',
              execute: async (ctx) => {
                events.push('action:executed');
                await hooks.emit('full:action:complete', { input: ctx.input });
                return { success: true, data: { result: 'done' } };
              },
            },
            'full-plugin',
          );

          services.registerProvider(
            {
              name: 'full:data',
              type: 'custom',
              get: async () => {
                events.push('provider:queried');
                return { success: true, data: { value: 100 }, timestamp: new Date() };
              },
            },
            'full-plugin',
          );

          hooks.on(
            'full:action:complete',
            async () => {
              events.push('hook:triggered');
            },
            { name: 'full-action-hook' },
          );
        },
        destroy: async () => {
          events.push('plugin:destroy');
          services.unregisterPlugin('full-plugin');
          hooks.unregisterPlugin('full-plugin');
        },
      };

      // Register and initialize
      registry.register(fullPlugin);
      await fullPlugin.init(mockCore);
      expect(events).toContain('plugin:init');

      // Execute action
      await executor.executeAction('full:action', { test: true });
      expect(events).toContain('action:executed');
      expect(events).toContain('hook:triggered');

      // Query provider
      await executor.getData('full:data', {});
      expect(events).toContain('provider:queried');

      // Destroy plugin
      if (fullPlugin.destroy) {
        await fullPlugin.destroy();
      }
      expect(events).toContain('plugin:destroy');

      // Verify cleanup
      expect(services.getStats().actions).toBe(0);
      expect(services.getStats().providers).toBe(0);
    });

    it('should coordinate multiple plugins in a flow', async () => {
      const results: string[] = [];

      // Plugin A - Data source
      const sourceAction: Action = {
        name: 'source:fetch',
        execute: async () => {
          results.push('fetch');
          return { success: true, data: { items: ['a', 'b', 'c'] } };
        },
      };

      // Plugin B - Transformer
      const transformAction: Action = {
        name: 'transform:process',
        execute: async (ctx) => {
          results.push('transform');
          const items = (ctx.input as { items: string[] }).items ?? [];
          return { success: true, data: { items: items.map((x) => x.toUpperCase()) } };
        },
      };

      // Plugin C - Output
      const outputAction: Action = {
        name: 'output:store',
        execute: async (ctx) => {
          results.push('store');
          return { success: true, data: { stored: true } };
        },
      };

      services.registerAction(sourceAction, 'source-plugin');
      services.registerAction(transformAction, 'transform-plugin');
      services.registerAction(outputAction, 'output-plugin');

      // Create coordinating flow
      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const fetchNode = createNode('action', 'Fetch', {
        pluginName: 'source',
        actionName: 'fetch',
        params: {},
      } as ActionNodeData);

      const transformNode = createNode('action', 'Transform', {
        pluginName: 'transform',
        actionName: 'process',
        params: { items: '{{_lastOutput.data.items}}' },
      } as ActionNodeData);

      const storeNode = createNode('action', 'Store', {
        pluginName: 'output',
        actionName: 'store',
        params: {},
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'Multi-Plugin Pipeline',
        nodes: [triggerNode, fetchNode, transformNode, storeNode],
        edges: [
          createEdge(triggerNode.id, fetchNode.id),
          createEdge(fetchNode.id, transformNode.id),
          createEdge(transformNode.id, storeNode.id),
        ],
      });

      const context = await flowEngine.execute(flow.id);

      expect(context.status).toBe('completed');
      expect(results).toEqual(['fetch', 'transform', 'store']);
    });

    it('should handle error propagation across plugins', async () => {
      const errors: string[] = [];

      // Error-prone action
      const errorAction: Action = {
        name: 'risky:operation',
        execute: async () => {
          throw new Error('Operation failed');
        },
      };

      // Error handler action
      const handlerAction: Action = {
        name: 'handler:recover',
        execute: async (ctx) => {
          errors.push(`Handled: ${JSON.stringify(ctx.input)}`);
          return { success: true, data: { recovered: true } };
        },
      };

      services.registerAction(errorAction, 'risky-plugin');
      services.registerAction(handlerAction, 'handler-plugin');

      // Hook for error tracking
      hooks.on('action:error', async (payload) => {
        errors.push(`Hook caught: ${(payload.data as { error: string }).error}`);
      });

      // Execute action directly - should fail
      const result = await executor.executeAction('risky:operation', {});
      expect(result.success).toBe(false);
    });

    it('should maintain plugin state consistency under load', async () => {
      let counter = 0;
      const increments: number[] = [];

      const incrementAction: Action = {
        name: 'counter:increment',
        execute: async () => {
          const current = ++counter;
          increments.push(current);
          return { success: true, data: { count: current } };
        },
      };

      services.registerAction(incrementAction, 'counter-plugin');

      // Execute many concurrent actions
      const promises = Array.from({ length: 100 }, () =>
        executor.executeAction('counter:increment', {}),
      );

      await Promise.all(promises);

      expect(counter).toBe(100);
      expect(increments.length).toBe(100);
      // All values should be unique
      expect(new Set(increments).size).toBe(100);
    });
  });
});
