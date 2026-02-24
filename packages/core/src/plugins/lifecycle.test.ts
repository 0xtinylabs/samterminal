/**
 * Plugin Lifecycle tests
 */


import { PluginLifecycle, createPluginLifecycle } from './lifecycle.js';
import { PluginRegistry } from './registry.js';
import { PluginLoader } from './loader.js';
import type { SamTerminalPlugin } from '../interfaces/plugin.interface.js';
import type { SamTerminalCore } from '../interfaces/core.interface.js';

describe('PluginLifecycle', () => {
  let lifecycle: PluginLifecycle;
  let mockCore: SamTerminalCore;

  const createMockPlugin = (
    name: string,
    deps: string[] = []
  ): SamTerminalPlugin => ({
    name,
    version: '1.0.0',
    dependencies: deps,
    init: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
    actions: [],
    providers: [],
    evaluators: [],
    hooks: [],
    chains: [],
  });

  beforeEach(() => {
    lifecycle = new PluginLifecycle();
    mockCore = {
      services: {
        registerAction: jest.fn(),
        registerProvider: jest.fn(),
        registerEvaluator: jest.fn(),
        unregisterPlugin: jest.fn(),
      },
      hooks: {
        register: jest.fn(),
        unregisterPlugin: jest.fn(),
      },
      chains: {
        register: jest.fn(),
      },
    } as unknown as SamTerminalCore;

    lifecycle.setCore(mockCore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setCore', () => {
    it('should set core reference', () => {
      const newLifecycle = new PluginLifecycle();
      expect(() => newLifecycle.setCore(mockCore)).not.toThrow();
    });
  });

  describe('getRegistry', () => {
    it('should return the registry', () => {
      const registry = lifecycle.getRegistry();
      expect(registry).toBeInstanceOf(PluginRegistry);
    });
  });

  describe('getLoader', () => {
    it('should return the loader', () => {
      const loader = lifecycle.getLoader();
      expect(loader).toBeInstanceOf(PluginLoader);
    });
  });

  describe('loadPlugin', () => {
    it('should load and register plugin', async () => {
      const plugin = createMockPlugin('test-plugin');

      const loaded = await lifecycle.loadPlugin({
        type: 'instance',
        plugin,
      });

      expect(loaded).toBe(plugin);
      expect(lifecycle.getRegistry().has('test-plugin')).toBe(true);
    });
  });

  describe('initPlugin', () => {
    it('should throw if core not set', async () => {
      const newLifecycle = new PluginLifecycle();
      const plugin = createMockPlugin('test');
      newLifecycle.getRegistry().register(plugin);

      await expect(newLifecycle.initPlugin('test')).rejects.toThrow('Core not set');
    });

    it('should throw if plugin not found', async () => {
      await expect(lifecycle.initPlugin('nonexistent')).rejects.toThrow(
        'Plugin "nonexistent" not found'
      );
    });

    it('should initialize plugin', async () => {
      const plugin = createMockPlugin('test-plugin');
      lifecycle.getRegistry().register(plugin);

      await lifecycle.initPlugin('test-plugin');

      expect(plugin.init).toHaveBeenCalledWith(mockCore);
      expect(lifecycle.isActive('test-plugin')).toBe(true);
    });

    it('should not re-initialize already active plugin', async () => {
      const plugin = createMockPlugin('test-plugin');
      lifecycle.getRegistry().register(plugin);

      await lifecycle.initPlugin('test-plugin');
      await lifecycle.initPlugin('test-plugin');

      expect(plugin.init).toHaveBeenCalledTimes(1);
    });

    it('should initialize dependencies first', async () => {
      const plugin1 = createMockPlugin('plugin1');
      const plugin2 = createMockPlugin('plugin2', ['plugin1']);

      lifecycle.getRegistry().register(plugin1);
      lifecycle.getRegistry().register(plugin2);

      await lifecycle.initPlugin('plugin2');

      expect(plugin1.init).toHaveBeenCalled();
      expect(plugin2.init).toHaveBeenCalled();
    });

    it('should throw if dependencies are missing', async () => {
      const plugin = createMockPlugin('plugin', ['missing-dep']);
      lifecycle.getRegistry().register(plugin);

      await expect(lifecycle.initPlugin('plugin')).rejects.toThrow(
        'missing dependencies'
      );
    });

    it('should emit lifecycle events', async () => {
      const handler = jest.fn();
      lifecycle.onLifecycle(handler);

      const plugin = createMockPlugin('test-plugin');
      lifecycle.getRegistry().register(plugin);

      await lifecycle.initPlugin('test-plugin');

      expect(handler).toHaveBeenCalledWith('beforeInit', plugin, undefined);
      expect(handler).toHaveBeenCalledWith('afterInit', plugin, undefined);
    });

    it('should emit error event on failure', async () => {
      const handler = jest.fn();
      lifecycle.onLifecycle(handler);

      const plugin = createMockPlugin('test-plugin');
      (plugin.init as any).mockRejectedValue(new Error('Init failed'));
      lifecycle.getRegistry().register(plugin);

      await expect(lifecycle.initPlugin('test-plugin')).rejects.toThrow('Init failed');

      expect(handler).toHaveBeenCalledWith(
        'error',
        plugin,
        expect.any(Error)
      );
    });
  });

  describe('initAll', () => {
    it('should throw if core not set', async () => {
      const newLifecycle = new PluginLifecycle();
      await expect(newLifecycle.initAll()).rejects.toThrow('Core not set');
    });

    it('should initialize all plugins in order', async () => {
      const plugin1 = createMockPlugin('plugin1');
      const plugin2 = createMockPlugin('plugin2', ['plugin1']);

      lifecycle.getRegistry().register(plugin1);
      lifecycle.getRegistry().register(plugin2);

      await lifecycle.initAll();

      expect(lifecycle.isActive('plugin1')).toBe(true);
      expect(lifecycle.isActive('plugin2')).toBe(true);
    });
  });

  describe('destroyPlugin', () => {
    it('should not throw for nonexistent plugin', async () => {
      await expect(lifecycle.destroyPlugin('nonexistent')).resolves.not.toThrow();
    });

    it('should not destroy inactive plugin', async () => {
      const plugin = createMockPlugin('test-plugin');
      lifecycle.getRegistry().register(plugin);

      await lifecycle.destroyPlugin('test-plugin');
      expect(plugin.destroy).not.toHaveBeenCalled();
    });

    it('should destroy active plugin', async () => {
      const plugin = createMockPlugin('test-plugin');
      lifecycle.getRegistry().register(plugin);
      await lifecycle.initPlugin('test-plugin');

      await lifecycle.destroyPlugin('test-plugin');

      expect(plugin.destroy).toHaveBeenCalled();
      expect(lifecycle.isActive('test-plugin')).toBe(false);
    });

    it('should throw if active dependents exist', async () => {
      const plugin1 = createMockPlugin('plugin1');
      const plugin2 = createMockPlugin('plugin2', ['plugin1']);

      lifecycle.getRegistry().register(plugin1);
      lifecycle.getRegistry().register(plugin2);
      await lifecycle.initAll();

      await expect(lifecycle.destroyPlugin('plugin1')).rejects.toThrow(
        'active plugins depend on it'
      );
    });

    it('should unregister plugin services', async () => {
      const plugin = createMockPlugin('test-plugin');
      lifecycle.getRegistry().register(plugin);
      await lifecycle.initPlugin('test-plugin');

      await lifecycle.destroyPlugin('test-plugin');

      expect(mockCore.services.unregisterPlugin).toHaveBeenCalledWith('test-plugin');
      expect(mockCore.hooks.unregisterPlugin).toHaveBeenCalledWith('test-plugin');
    });

    it('should emit lifecycle events', async () => {
      const handler = jest.fn();
      const plugin = createMockPlugin('test-plugin');
      lifecycle.getRegistry().register(plugin);
      await lifecycle.initPlugin('test-plugin');

      lifecycle.onLifecycle(handler);
      await lifecycle.destroyPlugin('test-plugin');

      expect(handler).toHaveBeenCalledWith('beforeDestroy', plugin, undefined);
      expect(handler).toHaveBeenCalledWith('afterDestroy', plugin, undefined);
    });
  });

  describe('destroyAll', () => {
    it('should destroy all plugins in reverse order', async () => {
      const plugin1 = createMockPlugin('plugin1');
      const plugin2 = createMockPlugin('plugin2', ['plugin1']);

      lifecycle.getRegistry().register(plugin1);
      lifecycle.getRegistry().register(plugin2);
      await lifecycle.initAll();

      await lifecycle.destroyAll();

      expect(plugin2.destroy).toHaveBeenCalled();
      expect(plugin1.destroy).toHaveBeenCalled();
    });

    it('should continue even if one plugin fails', async () => {
      const plugin1 = createMockPlugin('plugin1');
      const plugin2 = createMockPlugin('plugin2');
      (plugin2.destroy as any).mockRejectedValue(new Error('Destroy failed'));

      lifecycle.getRegistry().register(plugin1);
      lifecycle.getRegistry().register(plugin2);
      await lifecycle.initAll();

      // Should not throw
      await lifecycle.destroyAll();

      expect(plugin1.destroy).toHaveBeenCalled();
    });
  });

  describe('reloadPlugin', () => {
    it('should destroy and re-init plugin', async () => {
      const plugin = createMockPlugin('test-plugin');
      lifecycle.getRegistry().register(plugin);
      await lifecycle.initPlugin('test-plugin');

      await lifecycle.reloadPlugin('test-plugin');

      expect(plugin.destroy).toHaveBeenCalled();
      expect(plugin.init).toHaveBeenCalledTimes(2);
    });
  });

  describe('getStatus', () => {
    it('should return undefined for unknown plugin', () => {
      expect(lifecycle.getStatus('unknown')).toBeUndefined();
    });

    it('should return plugin status', async () => {
      const plugin = createMockPlugin('test-plugin');
      lifecycle.getRegistry().register(plugin);

      // After registration, status is 'registered'
      expect(lifecycle.getStatus('test-plugin')).toBe('registered');

      await lifecycle.initPlugin('test-plugin');
      expect(lifecycle.getStatus('test-plugin')).toBe('active');
    });
  });

  describe('isActive', () => {
    it('should return false for unknown plugin', () => {
      expect(lifecycle.isActive('unknown')).toBe(false);
    });

    it('should return true for active plugin', async () => {
      const plugin = createMockPlugin('test-plugin');
      lifecycle.getRegistry().register(plugin);
      await lifecycle.initPlugin('test-plugin');

      expect(lifecycle.isActive('test-plugin')).toBe(true);
    });
  });

  describe('onLifecycle', () => {
    it('should register handler and return unsubscribe function', () => {
      const handler = jest.fn();
      const unsubscribe = lifecycle.onLifecycle(handler);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  describe('clear', () => {
    it('should destroy all and clear registry', async () => {
      const plugin = createMockPlugin('test-plugin');
      lifecycle.getRegistry().register(plugin);
      await lifecycle.initPlugin('test-plugin');

      await lifecycle.clear();

      expect(lifecycle.getRegistry().has('test-plugin')).toBe(false);
    });
  });
});

describe('createPluginLifecycle', () => {
  it('should create a new PluginLifecycle instance', () => {
    const lifecycle = createPluginLifecycle();
    expect(lifecycle).toBeInstanceOf(PluginLifecycle);
  });

  it('should accept custom registry and loader', () => {
    const registry = new PluginRegistry();
    const loader = new PluginLoader();
    const lifecycle = createPluginLifecycle(registry, loader);

    expect(lifecycle.getRegistry()).toBe(registry);
    expect(lifecycle.getLoader()).toBe(loader);
  });
});
