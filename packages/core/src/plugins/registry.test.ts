
import { PluginRegistry, createPluginRegistry } from './registry.js';
import type { SamTerminalPlugin } from '../interfaces/plugin.interface.js';

/**
 * Create a mock plugin for testing
 */
function createMockPlugin(
  name: string,
  options: {
    version?: string;
    dependencies?: string[];
    actions?: Array<{ name: string; description: string; handler: () => Promise<unknown> }>;
    providers?: Array<{ name: string; description: string; get: () => Promise<unknown> }>;
    evaluators?: Array<{ name: string; description: string; evaluate: () => Promise<boolean> }>;
    hooks?: Array<{ name: string; event: string; handler: () => Promise<void> }>;
    chainConfig?: { supportedChains: string[] };
  } = {},
): SamTerminalPlugin {
  return {
    name,
    version: options.version ?? '1.0.0',
    description: `Mock plugin: ${name}`,
    dependencies: options.dependencies ?? [],
    actions: options.actions ?? [
      {
        name: `${name}-action`,
        description: 'Test action',
        handler: jest.fn().mockResolvedValue({ success: true }),
      },
    ],
    providers: options.providers ?? [
      {
        name: `${name}-provider`,
        description: 'Test provider',
        get: jest.fn().mockResolvedValue({ data: {} }),
      },
    ],
    evaluators: options.evaluators,
    hooks: options.hooks,
    chainConfig: options.chainConfig,
    init: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
  } as SamTerminalPlugin;
}

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = createPluginRegistry();
  });

  describe('register', () => {
    it('should register a valid plugin', () => {
      const plugin = createMockPlugin('test-plugin');

      registry.register(plugin);

      expect(registry.has('test-plugin')).toBe(true);
      expect(registry.size).toBe(1);
    });

    it('should throw on duplicate registration', () => {
      const plugin = createMockPlugin('test-plugin');

      registry.register(plugin);

      expect(() => registry.register(plugin)).toThrow(/already registered/);
    });

    it('should allow custom name via options', () => {
      const plugin = createMockPlugin('original-name');

      registry.register(plugin, { name: 'custom-name' });

      expect(registry.has('custom-name')).toBe(true);
      expect(registry.has('original-name')).toBe(false);
    });

    it('should validate plugin has name', () => {
      const plugin = { version: '1.0.0', init: jest.fn() } as unknown as SamTerminalPlugin;

      expect(() => registry.register(plugin)).toThrow(/must have a name/);
    });

    it('should validate plugin has version', () => {
      const plugin = { name: 'test', init: jest.fn() } as unknown as SamTerminalPlugin;

      expect(() => registry.register(plugin)).toThrow(/must have a version/);
    });

    it('should validate plugin has init method', () => {
      const plugin = { name: 'test', version: '1.0.0' } as unknown as SamTerminalPlugin;

      expect(() => registry.register(plugin)).toThrow(/must have an init method/);
    });

    it('should validate unique action names within plugin', () => {
      const plugin = createMockPlugin('test', {
        actions: [
          { name: 'duplicate', description: 'a', handler: jest.fn() },
          { name: 'duplicate', description: 'b', handler: jest.fn() },
        ],
      });

      expect(() => registry.register(plugin)).toThrow(/Duplicate action name/);
    });

    it('should validate unique provider names within plugin', () => {
      const plugin = createMockPlugin('test', {
        providers: [
          { name: 'duplicate', description: 'a', get: jest.fn() },
          { name: 'duplicate', description: 'b', get: jest.fn() },
        ],
      });

      expect(() => registry.register(plugin)).toThrow(/Duplicate provider name/);
    });

    it('should set initial state to registered', () => {
      const plugin = createMockPlugin('test-plugin');

      registry.register(plugin);

      const state = registry.getState('test-plugin');
      expect(state?.status).toBe('registered');
    });

    it('should capture plugin capabilities', () => {
      const plugin = createMockPlugin('test-plugin', {
        actions: [{ name: 'action1', description: 'a', handler: jest.fn() }],
        providers: [{ name: 'provider1', description: 'p', get: jest.fn() }],
        chainConfig: { supportedChains: ['ethereum', 'base'] },
      });

      registry.register(plugin);

      const state = registry.getState('test-plugin');
      expect(state?.capabilities.actions).toContain('action1');
      expect(state?.capabilities.providers).toContain('provider1');
      expect(state?.capabilities.chains).toEqual(['ethereum', 'base']);
    });
  });

  describe('unregister', () => {
    it('should unregister existing plugin', () => {
      const plugin = createMockPlugin('test-plugin');
      registry.register(plugin);

      const result = registry.unregister('test-plugin');

      expect(result).toBe(true);
      expect(registry.has('test-plugin')).toBe(false);
    });

    it('should return false for non-existent plugin', () => {
      const result = registry.unregister('non-existent');

      expect(result).toBe(false);
    });

    it('should throw if other plugins depend on it', () => {
      registry.register(createMockPlugin('plugin-a'));
      registry.register(createMockPlugin('plugin-b', { dependencies: ['plugin-a'] }));

      expect(() => registry.unregister('plugin-a')).toThrow(/plugins depend on it/);
    });

    it('should invalidate load order cache', () => {
      registry.register(createMockPlugin('plugin-a'));
      registry.register(createMockPlugin('plugin-b'));

      // Get load order to populate cache
      const order1 = registry.getLoadOrder();
      expect(order1).toHaveLength(2);

      registry.unregister('plugin-b');

      const order2 = registry.getLoadOrder();
      expect(order2).toHaveLength(1);
    });
  });

  describe('get', () => {
    it('should return registered plugin', () => {
      const plugin = createMockPlugin('test-plugin');
      registry.register(plugin);

      const retrieved = registry.get('test-plugin');

      expect(retrieved).toBe(plugin);
    });

    it('should return undefined for non-existent plugin', () => {
      expect(registry.get('non-existent')).toBeUndefined();
    });
  });

  describe('getState', () => {
    it('should return plugin state', () => {
      const plugin = createMockPlugin('test-plugin');
      registry.register(plugin);

      const state = registry.getState('test-plugin');

      expect(state).toBeDefined();
      expect(state?.status).toBe('registered');
      expect(state?.metadata.name).toBe('test-plugin');
      expect(state?.metadata.version).toBe('1.0.0');
    });

    it('should return undefined for non-existent plugin', () => {
      expect(registry.getState('non-existent')).toBeUndefined();
    });
  });

  describe('updateStatus', () => {
    it('should update plugin status', () => {
      const plugin = createMockPlugin('test-plugin');
      registry.register(plugin);

      registry.updateStatus('test-plugin', 'active');

      const state = registry.getState('test-plugin');
      expect(state?.status).toBe('active');
    });

    it('should set loadedAt when status is active', () => {
      const plugin = createMockPlugin('test-plugin');
      registry.register(plugin);

      registry.updateStatus('test-plugin', 'active');

      const state = registry.getState('test-plugin');
      expect(state?.loadedAt).toBeInstanceOf(Date);
    });

    it('should set error when provided', () => {
      const plugin = createMockPlugin('test-plugin');
      const error = new Error('Init failed');
      registry.register(plugin);

      registry.updateStatus('test-plugin', 'error', error);

      const state = registry.getState('test-plugin');
      expect(state?.status).toBe('error');
      expect(state?.error).toBe(error);
    });

    it('should do nothing for non-existent plugin', () => {
      // Should not throw
      registry.updateStatus('non-existent', 'active');
    });
  });

  describe('has', () => {
    it('should return true for registered plugin', () => {
      registry.register(createMockPlugin('test-plugin'));
      expect(registry.has('test-plugin')).toBe(true);
    });

    it('should return false for non-registered plugin', () => {
      expect(registry.has('non-existent')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return all registered plugins', () => {
      const plugin1 = createMockPlugin('plugin-1');
      const plugin2 = createMockPlugin('plugin-2');

      registry.register(plugin1);
      registry.register(plugin2);

      const all = registry.getAll();

      expect(all).toHaveLength(2);
      expect(all).toContain(plugin1);
      expect(all).toContain(plugin2);
    });

    it('should return empty array when no plugins', () => {
      expect(registry.getAll()).toEqual([]);
    });
  });

  describe('getNames', () => {
    it('should return all plugin names', () => {
      registry.register(createMockPlugin('plugin-a'));
      registry.register(createMockPlugin('plugin-b'));

      const names = registry.getNames();

      expect(names).toHaveLength(2);
      expect(names).toContain('plugin-a');
      expect(names).toContain('plugin-b');
    });
  });

  describe('getLoadOrder', () => {
    it('should return plugins in topological order', () => {
      // Register out of dependency order
      registry.register(createMockPlugin('plugin-c', { dependencies: ['plugin-b'] }));
      registry.register(createMockPlugin('plugin-a'));
      registry.register(createMockPlugin('plugin-b', { dependencies: ['plugin-a'] }));

      const order = registry.getLoadOrder();

      expect(order.indexOf('plugin-a')).toBeLessThan(order.indexOf('plugin-b'));
      expect(order.indexOf('plugin-b')).toBeLessThan(order.indexOf('plugin-c'));
    });

    it('should detect circular dependencies', () => {
      registry.register(createMockPlugin('plugin-a', { dependencies: ['plugin-b'] }));
      registry.register(createMockPlugin('plugin-b', { dependencies: ['plugin-a'] }));

      expect(() => registry.getLoadOrder()).toThrow(/Circular dependency/);
    });

    it('should cache load order', () => {
      registry.register(createMockPlugin('plugin-a'));

      const order1 = registry.getLoadOrder();
      const order2 = registry.getLoadOrder();

      // Should be same reference (cached)
      expect(order1).toEqual(order2);
    });

    it('should respect priority ordering', () => {
      registry.register(createMockPlugin('low-priority'), { priority: 1 });
      registry.register(createMockPlugin('high-priority'), { priority: 10 });
      registry.register(createMockPlugin('medium-priority'), { priority: 5 });

      const order = registry.getLoadOrder();

      expect(order.indexOf('high-priority')).toBeLessThan(order.indexOf('medium-priority'));
      expect(order.indexOf('medium-priority')).toBeLessThan(order.indexOf('low-priority'));
    });

    it('should handle plugins with no dependencies', () => {
      registry.register(createMockPlugin('plugin-a'));
      registry.register(createMockPlugin('plugin-b'));
      registry.register(createMockPlugin('plugin-c'));

      const order = registry.getLoadOrder();

      expect(order).toHaveLength(3);
    });

    it('should skip missing dependencies in sort', () => {
      registry.register(createMockPlugin('plugin-a', { dependencies: ['missing'] }));

      // Should not throw, just skips missing dependency
      const order = registry.getLoadOrder();
      expect(order).toContain('plugin-a');
    });
  });

  describe('getDependents', () => {
    it('should return plugins that depend on given plugin', () => {
      registry.register(createMockPlugin('plugin-a'));
      registry.register(createMockPlugin('plugin-b', { dependencies: ['plugin-a'] }));
      registry.register(createMockPlugin('plugin-c', { dependencies: ['plugin-a'] }));
      registry.register(createMockPlugin('plugin-d'));

      const dependents = registry.getDependents('plugin-a');

      expect(dependents).toHaveLength(2);
      expect(dependents).toContain('plugin-b');
      expect(dependents).toContain('plugin-c');
    });

    it('should return empty array for plugin with no dependents', () => {
      registry.register(createMockPlugin('plugin-a'));

      const dependents = registry.getDependents('plugin-a');

      expect(dependents).toEqual([]);
    });
  });

  describe('getMissingDependencies', () => {
    it('should return missing dependencies', () => {
      registry.register(createMockPlugin('plugin-a', { dependencies: ['missing-1', 'missing-2'] }));

      const missing = registry.getMissingDependencies('plugin-a');

      expect(missing).toHaveLength(2);
      expect(missing).toContain('missing-1');
      expect(missing).toContain('missing-2');
    });

    it('should return empty array when all dependencies present', () => {
      registry.register(createMockPlugin('plugin-a'));
      registry.register(createMockPlugin('plugin-b', { dependencies: ['plugin-a'] }));

      const missing = registry.getMissingDependencies('plugin-b');

      expect(missing).toEqual([]);
    });

    it('should return empty array for non-existent plugin', () => {
      const missing = registry.getMissingDependencies('non-existent');
      expect(missing).toEqual([]);
    });
  });

  describe('areDependenciesSatisfied', () => {
    it('should return true when all dependencies present', () => {
      registry.register(createMockPlugin('plugin-a'));
      registry.register(createMockPlugin('plugin-b', { dependencies: ['plugin-a'] }));

      expect(registry.areDependenciesSatisfied('plugin-b')).toBe(true);
    });

    it('should return false when dependencies missing', () => {
      registry.register(createMockPlugin('plugin-a', { dependencies: ['missing'] }));

      expect(registry.areDependenciesSatisfied('plugin-a')).toBe(false);
    });

    it('should return true for plugin with no dependencies', () => {
      registry.register(createMockPlugin('plugin-a'));

      expect(registry.areDependenciesSatisfied('plugin-a')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all plugins', () => {
      registry.register(createMockPlugin('plugin-a'));
      registry.register(createMockPlugin('plugin-b'));

      registry.clear();

      expect(registry.size).toBe(0);
      expect(registry.getAll()).toEqual([]);
    });
  });

  describe('size', () => {
    it('should return number of registered plugins', () => {
      expect(registry.size).toBe(0);

      registry.register(createMockPlugin('plugin-a'));
      expect(registry.size).toBe(1);

      registry.register(createMockPlugin('plugin-b'));
      expect(registry.size).toBe(2);
    });
  });
});

describe('createPluginRegistry', () => {
  it('should create a new PluginRegistry instance', () => {
    const registry = createPluginRegistry();
    expect(registry).toBeInstanceOf(PluginRegistry);
  });
});
