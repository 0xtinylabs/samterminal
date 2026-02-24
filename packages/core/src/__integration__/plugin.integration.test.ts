/**
 * Plugin Integration Tests
 * Tests for plugin loading, dependency resolution, and communication
 */


import { PluginRegistry, createPluginRegistry } from '../plugins/registry.js';
import { ServiceRegistryImpl, createServiceRegistry, Executor, createExecutor } from '../runtime/executor.js';
import { HooksService, createHooksService } from '../hooks/service.js';
import type { SamTerminalPlugin } from '../interfaces/plugin.interface.js';
import type { Action, ActionContext, ActionResult } from '../interfaces/action.interface.js';
import type { Provider, ProviderContext, ProviderResult } from '../interfaces/provider.interface.js';
import type { Hook } from '../interfaces/hook.interface.js';
import type { SamTerminalCore } from '../interfaces/core.interface.js';

/**
 * Helper to create a test plugin
 */
function createTestPlugin(
  name: string,
  options: {
    version?: string;
    dependencies?: string[];
    actions?: Action[];
    providers?: Provider[];
    hooks?: Hook[];
    initFn?: (core: SamTerminalCore) => Promise<void>;
    destroyFn?: () => Promise<void>;
  } = {},
): SamTerminalPlugin {
  return {
    name,
    version: options.version ?? '1.0.0',
    description: `Test plugin: ${name}`,
    dependencies: options.dependencies ?? [],
    actions: options.actions ?? [],
    providers: options.providers ?? [],
    hooks: options.hooks ?? [],
    init: options.initFn ?? jest.fn().mockResolvedValue(undefined),
    destroy: options.destroyFn ?? jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Create a test action
 */
function createTestAction(
  name: string,
  handler: (ctx: ActionContext) => Promise<ActionResult> = async () => ({ success: true }),
): Action {
  return {
    name,
    description: `Test action: ${name}`,
    execute: handler,
  };
}

/**
 * Create a test provider
 */
function createTestProvider(
  name: string,
  handler: (ctx: ProviderContext) => Promise<ProviderResult> = async () => ({
    success: true,
    data: {},
    timestamp: new Date(),
  }),
): Provider {
  return {
    name,
    type: 'custom',
    description: `Test provider: ${name}`,
    get: handler,
  };
}

describe('Plugin Integration Tests', () => {
  let registry: PluginRegistry;
  let services: ServiceRegistryImpl;
  let hooks: HooksService;
  let mockCore: SamTerminalCore;

  beforeEach(() => {
    registry = createPluginRegistry();
    services = createServiceRegistry();
    hooks = createHooksService();

    mockCore = {
      config: {},
      services,
      hooks,
      plugins: {
        register: jest.fn(),
        get: jest.fn(),
        getAll: () => registry.getAll(),
      },
      runtime: {
        executeAction: jest.fn(),
        getData: jest.fn(),
      },
    } as unknown as SamTerminalCore;
  });

  afterEach(() => {
    registry.clear();
    services.clear();
    hooks.clear();
  });

  describe('Multiple Plugins Loading', () => {
    it('should register multiple plugins', () => {
      const plugin1 = createTestPlugin('plugin-1');
      const plugin2 = createTestPlugin('plugin-2');
      const plugin3 = createTestPlugin('plugin-3');

      registry.register(plugin1);
      registry.register(plugin2);
      registry.register(plugin3);

      expect(registry.size).toBe(3);
      expect(registry.has('plugin-1')).toBe(true);
      expect(registry.has('plugin-2')).toBe(true);
      expect(registry.has('plugin-3')).toBe(true);
    });

    it('should initialize multiple plugins in correct order', async () => {
      const initOrder: string[] = [];

      const plugin1 = createTestPlugin('plugin-1', {
        initFn: async () => {
          initOrder.push('plugin-1');
        },
      });

      const plugin2 = createTestPlugin('plugin-2', {
        initFn: async () => {
          initOrder.push('plugin-2');
        },
      });

      const plugin3 = createTestPlugin('plugin-3', {
        initFn: async () => {
          initOrder.push('plugin-3');
        },
      });

      registry.register(plugin1);
      registry.register(plugin2);
      registry.register(plugin3);

      const loadOrder = registry.getLoadOrder();

      for (const name of loadOrder) {
        const plugin = registry.get(name);
        if (plugin) {
          await plugin.init(mockCore);
        }
      }

      expect(initOrder.length).toBe(3);
    });

    it('should prevent duplicate plugin registration', () => {
      const plugin1 = createTestPlugin('duplicate-plugin');
      const plugin2 = createTestPlugin('duplicate-plugin');

      registry.register(plugin1);

      expect(() => registry.register(plugin2)).toThrow('already registered');
    });

    it('should register actions and providers from multiple plugins', async () => {
      const action1 = createTestAction('plugin1:action');
      const action2 = createTestAction('plugin2:action');
      const provider1 = createTestProvider('plugin1:data');
      const provider2 = createTestProvider('plugin2:data');

      const plugin1 = createTestPlugin('plugin-1', {
        actions: [action1],
        providers: [provider1],
        initFn: async () => {
          services.registerAction(action1, 'plugin-1');
          services.registerProvider(provider1, 'plugin-1');
        },
      });

      const plugin2 = createTestPlugin('plugin-2', {
        actions: [action2],
        providers: [provider2],
        initFn: async () => {
          services.registerAction(action2, 'plugin-2');
          services.registerProvider(provider2, 'plugin-2');
        },
      });

      registry.register(plugin1);
      registry.register(plugin2);

      await plugin1.init(mockCore);
      await plugin2.init(mockCore);

      const stats = services.getStats();
      expect(stats.actions).toBe(2);
      expect(stats.providers).toBe(2);
    });

    it('should unregister plugin and its services', async () => {
      const action = createTestAction('plugin:action');
      const provider = createTestProvider('plugin:data');

      const plugin = createTestPlugin('removable-plugin', {
        actions: [action],
        providers: [provider],
        initFn: async () => {
          services.registerAction(action, 'removable-plugin');
          services.registerProvider(provider, 'removable-plugin');
        },
      });

      registry.register(plugin);
      await plugin.init(mockCore);

      expect(services.getStats().actions).toBe(1);
      expect(services.getStats().providers).toBe(1);

      services.unregisterPlugin('removable-plugin');
      registry.unregister('removable-plugin');

      expect(services.getStats().actions).toBe(0);
      expect(services.getStats().providers).toBe(0);
      expect(registry.has('removable-plugin')).toBe(false);
    });
  });

  describe('Plugin Dependency Resolution', () => {
    it('should resolve simple dependency chain', () => {
      const pluginA = createTestPlugin('plugin-a');
      const pluginB = createTestPlugin('plugin-b', { dependencies: ['plugin-a'] });
      const pluginC = createTestPlugin('plugin-c', { dependencies: ['plugin-b'] });

      // Register in wrong order
      registry.register(pluginC);
      registry.register(pluginA);
      registry.register(pluginB);

      const loadOrder = registry.getLoadOrder();

      // A should come before B, B should come before C
      const indexA = loadOrder.indexOf('plugin-a');
      const indexB = loadOrder.indexOf('plugin-b');
      const indexC = loadOrder.indexOf('plugin-c');

      expect(indexA).toBeLessThan(indexB);
      expect(indexB).toBeLessThan(indexC);
    });

    it('should resolve complex dependency graph', () => {
      // D depends on B and C
      // B depends on A
      // C depends on A
      const pluginA = createTestPlugin('plugin-a');
      const pluginB = createTestPlugin('plugin-b', { dependencies: ['plugin-a'] });
      const pluginC = createTestPlugin('plugin-c', { dependencies: ['plugin-a'] });
      const pluginD = createTestPlugin('plugin-d', { dependencies: ['plugin-b', 'plugin-c'] });

      registry.register(pluginD);
      registry.register(pluginC);
      registry.register(pluginB);
      registry.register(pluginA);

      const loadOrder = registry.getLoadOrder();

      const indexA = loadOrder.indexOf('plugin-a');
      const indexB = loadOrder.indexOf('plugin-b');
      const indexC = loadOrder.indexOf('plugin-c');
      const indexD = loadOrder.indexOf('plugin-d');

      // A must come first
      expect(indexA).toBeLessThan(indexB);
      expect(indexA).toBeLessThan(indexC);

      // D must come last
      expect(indexD).toBeGreaterThan(indexB);
      expect(indexD).toBeGreaterThan(indexC);
    });

    it('should detect circular dependencies', () => {
      const pluginX = createTestPlugin('plugin-x', { dependencies: ['plugin-y'] });
      const pluginY = createTestPlugin('plugin-y', { dependencies: ['plugin-x'] });

      registry.register(pluginX);
      registry.register(pluginY);

      expect(() => registry.getLoadOrder()).toThrow(/circular dependency/i);
    });

    it('should detect missing dependencies', () => {
      const plugin = createTestPlugin('dependent-plugin', {
        dependencies: ['non-existent-plugin'],
      });

      registry.register(plugin);

      const missing = registry.getMissingDependencies('dependent-plugin');
      expect(missing).toContain('non-existent-plugin');
      expect(registry.areDependenciesSatisfied('dependent-plugin')).toBe(false);
    });

    it('should prevent unregistering plugin with dependents', () => {
      const pluginA = createTestPlugin('plugin-a');
      const pluginB = createTestPlugin('plugin-b', { dependencies: ['plugin-a'] });

      registry.register(pluginA);
      registry.register(pluginB);

      expect(() => registry.unregister('plugin-a')).toThrow(/plugins depend on it/i);
    });

    it('should return dependents of a plugin', () => {
      const pluginA = createTestPlugin('plugin-a');
      const pluginB = createTestPlugin('plugin-b', { dependencies: ['plugin-a'] });
      const pluginC = createTestPlugin('plugin-c', { dependencies: ['plugin-a'] });

      registry.register(pluginA);
      registry.register(pluginB);
      registry.register(pluginC);

      const dependents = registry.getDependents('plugin-a');
      expect(dependents).toContain('plugin-b');
      expect(dependents).toContain('plugin-c');
      expect(dependents.length).toBe(2);
    });

    it('should handle plugins with priority', () => {
      const plugin1 = createTestPlugin('low-priority');
      const plugin2 = createTestPlugin('high-priority');

      registry.register(plugin1, { priority: 1 });
      registry.register(plugin2, { priority: 10 });

      const loadOrder = registry.getLoadOrder();

      // Higher priority should load first
      expect(loadOrder.indexOf('high-priority')).toBeLessThan(loadOrder.indexOf('low-priority'));
    });
  });

  describe('Plugin Communication', () => {
    it('should allow plugins to execute actions from other plugins', async () => {
      const sharedData: string[] = [];

      const action1 = createTestAction('plugin1:record', async (ctx) => {
        sharedData.push(`action1: ${ctx.input}`);
        return { success: true, data: sharedData };
      });

      const action2 = createTestAction('plugin2:record', async (ctx) => {
        sharedData.push(`action2: ${ctx.input}`);
        return { success: true, data: sharedData };
      });

      services.registerAction(action1, 'plugin-1');
      services.registerAction(action2, 'plugin-2');

      const executor = createExecutor(services);

      await executor.executeAction('plugin1:record', 'data1');
      await executor.executeAction('plugin2:record', 'data2');
      await executor.executeAction('plugin1:record', 'data3');

      expect(sharedData).toEqual(['action1: data1', 'action2: data2', 'action1: data3']);
    });

    it('should allow plugins to get data from other plugins', async () => {
      const provider1 = createTestProvider('plugin1:state', async () => ({
        success: true,
        data: { value: 'plugin1-data' },
        timestamp: new Date(),
      }));

      const provider2 = createTestProvider('plugin2:state', async () => ({
        success: true,
        data: { value: 'plugin2-data' },
        timestamp: new Date(),
      }));

      services.registerProvider(provider1, 'plugin-1');
      services.registerProvider(provider2, 'plugin-2');

      const executor = createExecutor(services);

      const result1 = await executor.getData('plugin1:state', {});
      const result2 = await executor.getData('plugin2:state', {});

      expect(result1.success).toBe(true);
      expect(result1.data).toEqual({ value: 'plugin1-data' });
      expect(result2.success).toBe(true);
      expect(result2.data).toEqual({ value: 'plugin2-data' });
    });

    it('should allow plugins to communicate via hooks', async () => {
      const messages: string[] = [];

      // Plugin 1 registers a hook listener
      hooks.on('custom:message', async (payload) => {
        messages.push(`received: ${(payload.data as { msg: string }).msg}`);
      });

      // Plugin 2 emits events
      await hooks.emit('custom:message', { msg: 'hello from plugin 2' });
      await hooks.emit('custom:message', { msg: 'another message' });

      expect(messages).toEqual(['received: hello from plugin 2', 'received: another message']);
    });

    it('should allow action chaining between plugins', async () => {
      const results: number[] = [];

      const addAction = createTestAction('math:add', async (ctx) => {
        const { value, amount } = ctx.input as { value: number; amount: number };
        const result = value + amount;
        results.push(result);
        return { success: true, data: { result } };
      });

      const multiplyAction = createTestAction('math:multiply', async (ctx) => {
        const { value, factor } = ctx.input as { value: number; factor: number };
        const result = value * factor;
        results.push(result);
        return { success: true, data: { result } };
      });

      services.registerAction(addAction, 'math-plugin');
      services.registerAction(multiplyAction, 'math-plugin');

      const executor = createExecutor(services);

      // Chain: start with 5, add 3, multiply by 2
      const r1 = await executor.executeAction('math:add', { value: 5, amount: 3 });
      const r2 = await executor.executeAction('math:multiply', {
        value: (r1.data as { result: number }).result,
        factor: 2,
      });

      expect(results).toEqual([8, 16]);
      expect((r2.data as { result: number }).result).toBe(16);
    });

    it('should handle cross-plugin provider data aggregation', async () => {
      const tokenProvider = createTestProvider('tokendata:price', async (ctx) => {
        const { symbol } = ctx.query as { symbol: string };
        const prices: Record<string, number> = { ETH: 2000, BTC: 40000 };
        return {
          success: true,
          data: { symbol, price: prices[symbol] ?? 0 },
          timestamp: new Date(),
        };
      });

      const walletProvider = createTestProvider('walletdata:balance', async (ctx) => {
        const { address } = ctx.query as { address: string };
        return {
          success: true,
          data: { address, balances: { ETH: 10, BTC: 0.5 } },
          timestamp: new Date(),
        };
      });

      const portfolioProvider = createTestProvider('portfolio:value', async () => {
        // Aggregate data from both providers
        const executor = createExecutor(services);

        const ethPrice = await executor.getData('tokendata:price', { symbol: 'ETH' });
        const btcPrice = await executor.getData('tokendata:price', { symbol: 'BTC' });
        const wallet = await executor.getData('walletdata:balance', {
          address: '0x123',
        });

        const balances = (wallet.data as { balances: Record<string, number> }).balances;
        const totalValue =
          balances.ETH * (ethPrice.data as { price: number }).price +
          balances.BTC * (btcPrice.data as { price: number }).price;

        return {
          success: true,
          data: { totalValue },
          timestamp: new Date(),
        };
      });

      services.registerProvider(tokenProvider, 'tokendata');
      services.registerProvider(walletProvider, 'walletdata');
      services.registerProvider(portfolioProvider, 'portfolio');

      const executor = createExecutor(services);
      const result = await executor.getData('portfolio:value', {});

      expect(result.success).toBe(true);
      expect((result.data as { totalValue: number }).totalValue).toBe(10 * 2000 + 0.5 * 40000); // 40000
    });
  });

  describe('Plugin Lifecycle', () => {
    it('should call init on all plugins in dependency order', async () => {
      const initCalls: string[] = [];

      const pluginA = createTestPlugin('plugin-a', {
        initFn: async () => {
          initCalls.push('a-init');
        },
      });

      const pluginB = createTestPlugin('plugin-b', {
        dependencies: ['plugin-a'],
        initFn: async () => {
          initCalls.push('b-init');
        },
      });

      registry.register(pluginA);
      registry.register(pluginB);

      const loadOrder = registry.getLoadOrder();
      for (const name of loadOrder) {
        const plugin = registry.get(name);
        if (plugin) {
          await plugin.init(mockCore);
          registry.updateStatus(name, 'active');
        }
      }

      expect(initCalls).toEqual(['a-init', 'b-init']);
      expect(registry.getState('plugin-a')?.status).toBe('active');
      expect(registry.getState('plugin-b')?.status).toBe('active');
    });

    it('should call destroy on all plugins in reverse order', async () => {
      const destroyCalls: string[] = [];

      const pluginA = createTestPlugin('plugin-a', {
        destroyFn: async () => {
          destroyCalls.push('a-destroy');
        },
      });

      const pluginB = createTestPlugin('plugin-b', {
        dependencies: ['plugin-a'],
        destroyFn: async () => {
          destroyCalls.push('b-destroy');
        },
      });

      registry.register(pluginA);
      registry.register(pluginB);

      // Initialize
      for (const name of registry.getLoadOrder()) {
        const plugin = registry.get(name);
        if (plugin) await plugin.init(mockCore);
      }

      // Destroy in reverse order
      const loadOrder = registry.getLoadOrder();
      for (let i = loadOrder.length - 1; i >= 0; i--) {
        const plugin = registry.get(loadOrder[i]);
        if (plugin?.destroy) {
          await plugin.destroy();
        }
      }

      expect(destroyCalls).toEqual(['b-destroy', 'a-destroy']);
    });

    it('should handle plugin init failure gracefully', async () => {
      const error = new Error('Init failed');

      const pluginA = createTestPlugin('plugin-a', {
        initFn: async () => {
          throw error;
        },
      });

      const pluginB = createTestPlugin('plugin-b');

      registry.register(pluginA);
      registry.register(pluginB);

      const loadOrder = registry.getLoadOrder();
      const initResults: { name: string; success: boolean; error?: Error }[] = [];

      for (const name of loadOrder) {
        const plugin = registry.get(name);
        if (plugin) {
          try {
            await plugin.init(mockCore);
            registry.updateStatus(name, 'active');
            initResults.push({ name, success: true });
          } catch (e) {
            registry.updateStatus(name, 'error', e as Error);
            initResults.push({ name, success: false, error: e as Error });
          }
        }
      }

      expect(initResults.find((r) => r.name === 'plugin-a')?.success).toBe(false);
      expect(registry.getState('plugin-a')?.status).toBe('error');
    });

    it('should track plugin status through lifecycle', async () => {
      const plugin = createTestPlugin('tracked-plugin');

      registry.register(plugin);
      expect(registry.getState('tracked-plugin')?.status).toBe('registered');

      await plugin.init(mockCore);
      registry.updateStatus('tracked-plugin', 'active');
      expect(registry.getState('tracked-plugin')?.status).toBe('active');
      expect(registry.getState('tracked-plugin')?.loadedAt).toBeDefined();

      if (plugin.destroy) await plugin.destroy();
      registry.updateStatus('tracked-plugin', 'destroyed' as any);
      expect(registry.getState('tracked-plugin')?.status).toBe('destroyed');
    });
  });

  describe('Service Discovery', () => {
    it('should list all available actions', () => {
      services.registerAction(createTestAction('plugin1:action1'), 'plugin-1');
      services.registerAction(createTestAction('plugin1:action2'), 'plugin-1');
      services.registerAction(createTestAction('plugin2:action1'), 'plugin-2');

      const executor = createExecutor(services);
      const actions = executor.getAvailableActions();

      expect(actions).toContain('plugin1:action1');
      expect(actions).toContain('plugin1:action2');
      expect(actions).toContain('plugin2:action1');
      expect(actions.length).toBe(3);
    });

    it('should list all available providers', () => {
      services.registerProvider(createTestProvider('plugin1:data'), 'plugin-1');
      services.registerProvider(createTestProvider('plugin2:data'), 'plugin-2');

      const executor = createExecutor(services);
      const providers = executor.getAvailableProviders();

      expect(providers).toContain('plugin1:data');
      expect(providers).toContain('plugin2:data');
      expect(providers.length).toBe(2);
    });

    it('should handle non-existent action gracefully', async () => {
      const executor = createExecutor(services);
      const result = await executor.executeAction('nonexistent:action', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle non-existent provider gracefully', async () => {
      const executor = createExecutor(services);
      const result = await executor.getData('nonexistent:provider', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});
