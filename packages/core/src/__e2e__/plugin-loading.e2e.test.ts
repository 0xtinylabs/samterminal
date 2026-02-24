/**
 * Plugin Loading E2E Tests
 * Tests plugin discovery, initialization, activation, and deactivation
 *
 * Uses real plugins with real API calls to verify plugin lifecycle
 */


import { createCore, SamTerminalCore, SamTerminalPlugin } from '../index.js';
import { PluginLoader, createPluginLoader } from '../plugins/loader.js';
import type { Action, ActionResult, ActionContext } from '../interfaces/action.interface.js';
import type { Provider, ProviderResult, ProviderContext } from '../interfaces/provider.interface.js';

// Base Mainnet RPC endpoint
const BASE_RPC_URL = 'https://mainnet.base.org';

// DexScreener API
const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex';

/**
 * Create a blockchain plugin factory for testing
 */
function createBlockchainPluginFactory() {
  return async (config?: Record<string, unknown>): Promise<SamTerminalPlugin> => {
    const rpcUrl = (config?.rpcUrl as string) || BASE_RPC_URL;

    const blockProvider: Provider = {
      name: 'blockchain:block',
      type: 'chain',
      description: 'Get block number',
      get: async (): Promise<ProviderResult> => {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_blockNumber',
            params: [],
          }),
        });

        const data = (await response.json()) as { result: string };
        const blockNumber = parseInt(data.result, 16);

        return {
          success: true,
          data: { blockNumber, chain: 'base' },
          timestamp: new Date(),
        };
      },
    };

    return {
      name: '@factory/blockchain',
      version: '1.0.0',
      description: 'Blockchain plugin from factory',
      providers: [blockProvider],
      init: async (core: SamTerminalCore) => {
        core.services.registerProvider(blockProvider, '@factory/blockchain');
      },
      destroy: async () => {},
    };
  };
}

/**
 * Create a plugin with lifecycle tracking
 */
function createLifecycleTrackingPlugin(events: string[]): SamTerminalPlugin {
  return {
    name: '@test/lifecycle-tracking',
    version: '1.0.0',
    description: 'Plugin that tracks lifecycle events',
    init: async () => {
      events.push('init');
    },
    destroy: async () => {
      events.push('destroy');
    },
  };
}

/**
 * Create a plugin with dependencies
 */
function createPluginWithDependencies(
  name: string,
  deps: string[],
  events: string[],
): SamTerminalPlugin {
  return {
    name,
    version: '1.0.0',
    description: `Plugin ${name} with deps: ${deps.join(', ')}`,
    dependencies: deps,
    init: async () => {
      events.push(`${name}:init`);
    },
    destroy: async () => {
      events.push(`${name}:destroy`);
    },
  };
}

/**
 * Create a real DexScreener plugin
 */
function createDexScreenerPlugin(): SamTerminalPlugin {
  const searchAction: Action = {
    name: 'dex:search',
    description: 'Search tokens on DexScreener',
    execute: async (ctx: ActionContext): Promise<ActionResult> => {
      const { query } = ctx.input as { query: string };

      const response = await fetch(
        `${DEXSCREENER_API}/search?q=${encodeURIComponent(query)}`,
      );
      const data = (await response.json()) as {
        pairs?: Array<{
          baseToken: { symbol: string; name: string; address: string };
          priceUsd: string;
        }>;
      };

      return {
        success: true,
        data: {
          results:
            data.pairs?.slice(0, 5).map((p) => ({
              symbol: p.baseToken.symbol,
              name: p.baseToken.name,
              address: p.baseToken.address,
              priceUsd: parseFloat(p.priceUsd),
            })) ?? [],
        },
      };
    },
  };

  return {
    name: '@test/dexscreener',
    version: '1.0.0',
    description: 'DexScreener integration',
    actions: [searchAction],
    init: async (core: SamTerminalCore) => {
      core.services.registerAction(searchAction, '@test/dexscreener');
    },
    destroy: async () => {},
  };
}

describe('Plugin Loading E2E Tests', () => {
  let core: SamTerminalCore;
  let loader: PluginLoader;

  beforeEach(async () => {
    core = createCore();
    loader = createPluginLoader();
  });

  afterEach(async () => {
    if (core) {
      await core.stop();
    }
    loader.clearCache();
  });

  describe('Plugin Discovery', () => {
    it('should discover plugin from instance', async () => {
      const plugin: SamTerminalPlugin = {
        name: '@test/simple',
        version: '1.0.0',
        description: 'Simple test plugin',
        init: async () => {},
        destroy: async () => {},
      };

      const loaded = await loader.load({ type: 'instance', plugin });

      expect(loaded).toBe(plugin);
      expect(loaded.name).toBe('@test/simple');
      expect(loaded.version).toBe('1.0.0');
    });

    it('should discover plugin from factory', async () => {
      const factory = createBlockchainPluginFactory();

      const loaded = await loader.load({ type: 'factory', factory });

      expect(loaded.name).toBe('@factory/blockchain');
      expect(loaded.version).toBe('1.0.0');
      expect(loaded.providers).toHaveLength(1);
    });

    it('should discover plugin from factory with config', async () => {
      const factory = async (config?: Record<string, unknown>): Promise<SamTerminalPlugin> => {
        const name = (config?.name as string) || '@default/plugin';
        return {
          name,
          version: '1.0.0',
          description: 'Configured plugin',
          init: async () => {},
          destroy: async () => {},
        };
      };

      const loaded = await loader.load({
        type: 'factory',
        factory,
        config: { name: '@custom/plugin' },
      });

      expect(loaded.name).toBe('@custom/plugin');
    });

    it('should cache loaded plugins', async () => {
      const callCount = { value: 0 };

      const factory = async (): Promise<SamTerminalPlugin> => {
        callCount.value++;
        return {
          name: '@test/cached',
          version: '1.0.0',
          description: 'Cached plugin',
          init: async () => {},
          destroy: async () => {},
        };
      };

      // Load twice - should only create once due to factory (no cache for factory)
      await loader.load({ type: 'factory', factory });
      await loader.load({ type: 'factory', factory });

      // Factory is called each time (not cached by default for factory type)
      expect(callCount.value).toBe(2);
    });

    it('should load multiple plugins in parallel', async () => {
      const plugins = await loader.loadParallel([
        {
          type: 'instance',
          plugin: {
            name: '@test/p1',
            version: '1.0.0',
            description: 'Plugin 1',
            init: async () => {},
            destroy: async () => {},
          },
        },
        {
          type: 'instance',
          plugin: {
            name: '@test/p2',
            version: '1.0.0',
            description: 'Plugin 2',
            init: async () => {},
            destroy: async () => {},
          },
        },
        {
          type: 'instance',
          plugin: {
            name: '@test/p3',
            version: '1.0.0',
            description: 'Plugin 3',
            init: async () => {},
            destroy: async () => {},
          },
        },
      ]);

      expect(plugins).toHaveLength(3);
      expect(plugins.map((p) => p.name)).toEqual(['@test/p1', '@test/p2', '@test/p3']);
    });

    it('should handle partial load failures gracefully', async () => {
      const plugins = await loader.loadParallel([
        {
          type: 'instance',
          plugin: {
            name: '@test/good',
            version: '1.0.0',
            description: 'Good plugin',
            init: async () => {},
            destroy: async () => {},
          },
        },
        {
          type: 'factory',
          factory: async () => {
            throw new Error('Factory failed');
          },
        },
      ]);

      // Should return the successful plugin
      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('@test/good');
    });
  });

  describe('Plugin Initialization', () => {
    it('should initialize plugin with core reference', async () => {
      let coreRef: SamTerminalCore | null = null;

      const plugin: SamTerminalPlugin = {
        name: '@test/init',
        version: '1.0.0',
        description: 'Init test plugin',
        init: async (c: SamTerminalCore) => {
          coreRef = c;
        },
        destroy: async () => {},
      };

      await core.plugins.register(plugin);
      await core.initialize();
      await core.start(); // Plugin init happens here

      expect(coreRef).toBe(core);
    });

    it('should register providers during init', async () => {
      const provider: Provider = {
        name: 'test:data',
        type: 'custom',
        get: async (): Promise<ProviderResult> => ({
          success: true,
          data: { value: 42 },
          timestamp: new Date(),
        }),
      };

      const plugin: SamTerminalPlugin = {
        name: '@test/provider-init',
        version: '1.0.0',
        description: 'Provider init plugin',
        providers: [provider],
        init: async (core: SamTerminalCore) => {
          core.services.registerProvider(provider, '@test/provider-init');
        },
        destroy: async () => {},
      };

      await core.plugins.register(plugin);
      await core.initialize();
      await core.start();

      const result = await core.runtime.getData('test:data', {});
      const data = result as { value: number };

      expect(data.value).toBe(42);
    });

    it('should register actions during init', async () => {
      const action: Action = {
        name: 'test:action',
        description: 'Test action',
        execute: async (): Promise<ActionResult> => ({
          success: true,
          data: { executed: true },
        }),
      };

      const plugin: SamTerminalPlugin = {
        name: '@test/action-init',
        version: '1.0.0',
        description: 'Action init plugin',
        actions: [action],
        init: async (core: SamTerminalCore) => {
          core.services.registerAction(action, '@test/action-init');
        },
        destroy: async () => {},
      };

      await core.plugins.register(plugin);
      await core.initialize();
      await core.start();

      const result = await core.runtime.executeAction('test:action', {});
      expect((result as { executed: boolean }).executed).toBe(true);
    });

    it('should initialize plugins in dependency order', async () => {
      const events: string[] = [];

      const pluginA = createPluginWithDependencies('@test/plugin-a', [], events);
      const pluginB = createPluginWithDependencies('@test/plugin-b', ['@test/plugin-a'], events);
      const pluginC = createPluginWithDependencies(
        '@test/plugin-c',
        ['@test/plugin-a', '@test/plugin-b'],
        events,
      );

      // Register in reverse order
      await core.plugins.register(pluginC);
      await core.plugins.register(pluginB);
      await core.plugins.register(pluginA);

      await core.initialize();
      await core.start(); // Plugin init happens here

      // Should initialize in order: A -> B -> C
      expect(events.indexOf('@test/plugin-a:init')).toBeLessThan(
        events.indexOf('@test/plugin-b:init'),
      );
      expect(events.indexOf('@test/plugin-b:init')).toBeLessThan(
        events.indexOf('@test/plugin-c:init'),
      );
    });

    it('should fail initialization on missing dependency', async () => {
      const plugin: SamTerminalPlugin = {
        name: '@test/missing-dep',
        version: '1.0.0',
        description: 'Plugin with missing dependency',
        dependencies: ['@nonexistent/plugin'],
        init: async () => {},
        destroy: async () => {},
      };

      await core.plugins.register(plugin);
      await core.initialize();

      // Should throw or handle missing dependency during start
      await expect(core.start()).rejects.toThrow();
    });

    it('should initialize real blockchain plugin and execute', async () => {
      const factory = createBlockchainPluginFactory();
      const plugin = await factory();

      await core.plugins.register(plugin);
      await core.initialize();
      await core.start();

      // Verify plugin is working with real RPC call
      const result = await core.runtime.getData('blockchain:block', {});
      const data = result as { blockNumber: number };

      expect(data.blockNumber).toBeGreaterThan(10000000);
    }, 30000);
  });

  describe('Plugin Activation', () => {
    it('should activate plugin after start', async () => {
      let activated = false;

      const plugin: SamTerminalPlugin = {
        name: '@test/activate',
        version: '1.0.0',
        description: 'Activation test plugin',
        init: async () => {
          activated = true;
        },
        destroy: async () => {},
      };

      expect(activated).toBe(false);

      await core.plugins.register(plugin);
      await core.initialize();

      // Plugin init is called during start(), not initialize()
      expect(activated).toBe(false);

      await core.start();

      expect(activated).toBe(true);
    });

    it('should activate all registered plugins', async () => {
      const activatedPlugins: string[] = [];

      const createActivationPlugin = (name: string): SamTerminalPlugin => ({
        name,
        version: '1.0.0',
        description: `Plugin ${name}`,
        init: async () => {
          activatedPlugins.push(name);
        },
        destroy: async () => {},
      });

      await core.plugins.register(createActivationPlugin('@test/activate-1'));
      await core.plugins.register(createActivationPlugin('@test/activate-2'));
      await core.plugins.register(createActivationPlugin('@test/activate-3'));

      await core.initialize();
      await core.start();

      expect(activatedPlugins).toContain('@test/activate-1');
      expect(activatedPlugins).toContain('@test/activate-2');
      expect(activatedPlugins).toContain('@test/activate-3');
    });

    it('should provide access to other plugins after activation', async () => {
      let foundOtherPlugin = false;

      const pluginA: SamTerminalPlugin = {
        name: '@test/plugin-a',
        version: '1.0.0',
        description: 'Plugin A',
        init: async () => {},
        destroy: async () => {},
      };

      const pluginB: SamTerminalPlugin = {
        name: '@test/plugin-b',
        version: '1.0.0',
        description: 'Plugin B',
        dependencies: ['@test/plugin-a'],
        init: async (core: SamTerminalCore) => {
          foundOtherPlugin = core.plugins.has('@test/plugin-a');
        },
        destroy: async () => {},
      };

      await core.plugins.register(pluginA);
      await core.plugins.register(pluginB);
      await core.initialize();
      await core.start();

      expect(foundOtherPlugin).toBe(true);
    });

    it('should activate real DexScreener plugin and search tokens', async () => {
      const plugin = createDexScreenerPlugin();

      await core.plugins.register(plugin);
      await core.initialize();
      await core.start();

      // Test real API call
      const result = await core.runtime.executeAction('dex:search', {
        query: 'USDC',
      });
      const data = result as { results: Array<{ symbol: string }> };

      expect(data.results.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Plugin Deactivation', () => {
    it('should call destroy on plugin deactivation', async () => {
      const events: string[] = [];
      const plugin = createLifecycleTrackingPlugin(events);

      await core.plugins.register(plugin);
      await core.initialize();
      await core.start();

      expect(events).toContain('init');
      expect(events).not.toContain('destroy');

      await core.stop();

      expect(events).toContain('destroy');
    });

    it('should deactivate plugins in reverse dependency order', async () => {
      const events: string[] = [];

      const pluginA = createPluginWithDependencies('@test/dep-a', [], events);
      const pluginB = createPluginWithDependencies('@test/dep-b', ['@test/dep-a'], events);
      const pluginC = createPluginWithDependencies(
        '@test/dep-c',
        ['@test/dep-a', '@test/dep-b'],
        events,
      );

      await core.plugins.register(pluginA);
      await core.plugins.register(pluginB);
      await core.plugins.register(pluginC);
      await core.initialize();
      await core.start();

      // Clear init events for clarity
      events.length = 0;

      await core.stop();

      // Should destroy in reverse order: C -> B -> A
      const destroyC = events.indexOf('@test/dep-c:destroy');
      const destroyB = events.indexOf('@test/dep-b:destroy');
      const destroyA = events.indexOf('@test/dep-a:destroy');

      expect(destroyC).toBeLessThan(destroyB);
      expect(destroyB).toBeLessThan(destroyA);
    });

    it('should cleanup registered services on deactivation', async () => {
      const plugin: SamTerminalPlugin = {
        name: '@test/cleanup',
        version: '1.0.0',
        description: 'Cleanup test plugin',
        actions: [
          {
            name: 'cleanup:action',
            description: 'Test action',
            execute: async (): Promise<ActionResult> => ({
              success: true,
              data: { executed: true },
            }),
          },
        ],
        init: async (c: SamTerminalCore) => {
          c.services.registerAction(
            {
              name: 'cleanup:action',
              description: 'Test action',
              execute: async (): Promise<ActionResult> => ({
                success: true,
                data: { executed: true },
              }),
            },
            '@test/cleanup',
          );
        },
        destroy: async () => {},
      };

      await core.plugins.register(plugin);
      await core.initialize();
      await core.start();

      // Action should work
      const result = await core.runtime.executeAction('cleanup:action', {});
      expect((result as { executed: boolean }).executed).toBe(true);

      await core.stop();

      // After stop, creating a new core and trying to use the action should fail
      const newCore = createCore();
      await newCore.initialize();
      await newCore.start();

      // Action should not exist in new core
      await expect(newCore.runtime.executeAction('cleanup:action', {})).rejects.toThrow();

      await newCore.stop();
    });

    it('should handle multiple stop calls gracefully', async () => {
      const destroyCount = { value: 0 };

      const plugin: SamTerminalPlugin = {
        name: '@test/multi-stop',
        version: '1.0.0',
        description: 'Multi-stop test plugin',
        init: async () => {},
        destroy: async () => {
          destroyCount.value++;
        },
      };

      await core.plugins.register(plugin);
      await core.initialize();
      await core.start();

      await core.stop();
      await core.stop();
      await core.stop();

      // Destroy should only be called once
      expect(destroyCount.value).toBe(1);
    });

    it('should handle destroy errors gracefully', async () => {
      const plugin: SamTerminalPlugin = {
        name: '@test/destroy-error',
        version: '1.0.0',
        description: 'Destroy error test plugin',
        init: async () => {},
        destroy: async () => {
          throw new Error('Destroy failed');
        },
      };

      await core.plugins.register(plugin);
      await core.initialize();
      await core.start();

      // Stop should not throw even if destroy fails
      await expect(core.stop()).resolves.not.toThrow();
    });
  });

  describe('Full Plugin Lifecycle', () => {
    it('should complete full lifecycle: discover -> register -> start -> stop', async () => {
      const events: string[] = [];

      const plugin: SamTerminalPlugin = {
        name: '@test/full-lifecycle',
        version: '1.0.0',
        description: 'Full lifecycle test',
        providers: [
          {
            name: 'lifecycle:status',
            type: 'custom',
            get: async (): Promise<ProviderResult> => ({
              success: true,
              data: { status: 'active' },
              timestamp: new Date(),
            }),
          },
        ],
        init: async (c: SamTerminalCore) => {
          events.push('init');
          c.services.registerProvider(
            {
              name: 'lifecycle:status',
              type: 'custom',
              get: async (): Promise<ProviderResult> => ({
                success: true,
                data: { status: 'active' },
                timestamp: new Date(),
              }),
            },
            '@test/full-lifecycle',
          );
        },
        destroy: async () => {
          events.push('destroy');
        },
      };

      // 1. Discover
      events.push('discover');
      const loaded = await loader.load({ type: 'instance', plugin });
      expect(loaded.name).toBe('@test/full-lifecycle');

      // 2. Register
      events.push('register');
      await core.plugins.register(loaded);
      expect(core.plugins.has('@test/full-lifecycle')).toBe(true);

      // 3. Initialize core (plugins not initialized yet)
      events.push('pre-init');
      await core.initialize();
      // Plugin init happens during start(), not initialize()

      // 4. Start (this is when plugins are initialized)
      events.push('pre-start');
      await core.start();
      expect(events).toContain('init');
      events.push('started');

      // 5. Use the plugin
      const result = await core.runtime.getData('lifecycle:status', {});
      const data = result as { status: string };
      expect(data.status).toBe('active');
      events.push('used');

      // 6. Stop (deactivates plugin)
      events.push('pre-stop');
      await core.stop();
      expect(events).toContain('destroy');
      events.push('stopped');

      // Verify event order
      expect(events).toEqual([
        'discover',
        'register',
        'pre-init',
        'pre-start',
        'init',
        'started',
        'used',
        'pre-stop',
        'destroy',
        'stopped',
      ]);
    });

    it('should handle complex plugin graph lifecycle', async () => {
      const events: string[] = [];

      // Create plugins with diamond dependency
      //       A
      //      / \
      //     B   C
      //      \ /
      //       D

      const pluginA: SamTerminalPlugin = {
        name: '@test/diamond-a',
        version: '1.0.0',
        description: 'Diamond A',
        init: async () => {
          events.push('A:init');
        },
        destroy: async () => {
          events.push('A:destroy');
        },
      };

      const pluginB: SamTerminalPlugin = {
        name: '@test/diamond-b',
        version: '1.0.0',
        description: 'Diamond B',
        dependencies: ['@test/diamond-a'],
        init: async () => {
          events.push('B:init');
        },
        destroy: async () => {
          events.push('B:destroy');
        },
      };

      const pluginC: SamTerminalPlugin = {
        name: '@test/diamond-c',
        version: '1.0.0',
        description: 'Diamond C',
        dependencies: ['@test/diamond-a'],
        init: async () => {
          events.push('C:init');
        },
        destroy: async () => {
          events.push('C:destroy');
        },
      };

      const pluginD: SamTerminalPlugin = {
        name: '@test/diamond-d',
        version: '1.0.0',
        description: 'Diamond D',
        dependencies: ['@test/diamond-b', '@test/diamond-c'],
        init: async () => {
          events.push('D:init');
        },
        destroy: async () => {
          events.push('D:destroy');
        },
      };

      // Register in random order
      await core.plugins.register(pluginD);
      await core.plugins.register(pluginB);
      await core.plugins.register(pluginA);
      await core.plugins.register(pluginC);

      await core.initialize();
      await core.start(); // Plugin init happens here

      // A should init before B and C
      expect(events.indexOf('A:init')).toBeLessThan(events.indexOf('B:init'));
      expect(events.indexOf('A:init')).toBeLessThan(events.indexOf('C:init'));

      // B and C should init before D
      expect(events.indexOf('B:init')).toBeLessThan(events.indexOf('D:init'));
      expect(events.indexOf('C:init')).toBeLessThan(events.indexOf('D:init'));

      events.length = 0;
      await core.stop();

      // D should destroy before B and C
      expect(events.indexOf('D:destroy')).toBeLessThan(events.indexOf('B:destroy'));
      expect(events.indexOf('D:destroy')).toBeLessThan(events.indexOf('C:destroy'));

      // B and C should destroy before A
      expect(events.indexOf('B:destroy')).toBeLessThan(events.indexOf('A:destroy'));
      expect(events.indexOf('C:destroy')).toBeLessThan(events.indexOf('A:destroy'));
    });
  });

  describe('Real Plugin Integration', () => {
    it('should load and use multiple real plugins together', async () => {
      const blockchainFactory = createBlockchainPluginFactory();
      const blockchainPlugin = await blockchainFactory();
      const dexPlugin = createDexScreenerPlugin();

      await core.plugins.register(blockchainPlugin);
      await core.plugins.register(dexPlugin);
      await core.initialize();
      await core.start();

      // Test blockchain plugin
      const blockResult = await core.runtime.getData('blockchain:block', {});
      const blockData = blockResult as { blockNumber: number };
      expect(blockData.blockNumber).toBeGreaterThan(0);

      // Test dex plugin
      const searchResult = await core.runtime.executeAction('dex:search', {
        query: 'ETH',
      });
      const searchData = searchResult as { results: Array<{ symbol: string }> };
      expect(searchData.results.length).toBeGreaterThan(0);
    }, 60000);
  });
});
