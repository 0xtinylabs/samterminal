/**
 * Plugin Loader tests
 */


import { PluginLoader, createPluginLoader } from './loader.js';
import type { SamTerminalPlugin, PluginFactory } from '../interfaces/plugin.interface.js';

describe('PluginLoader', () => {
  let loader: PluginLoader;

  const createMockPlugin = (name: string): SamTerminalPlugin => ({
    name,
    version: '1.0.0',
    init: jest.fn(),
    destroy: jest.fn(),
  });

  beforeEach(() => {
    loader = new PluginLoader();
  });

  describe('load', () => {
    it('should load from instance source', async () => {
      const plugin = createMockPlugin('instance-plugin');

      const loaded = await loader.load({
        type: 'instance',
        plugin,
      });

      expect(loaded).toBe(plugin);
    });

    it('should load from factory source', async () => {
      const plugin = createMockPlugin('factory-plugin');
      const factory: PluginFactory = jest.fn().mockResolvedValue(plugin);

      const loaded = await loader.load({
        type: 'factory',
        factory,
        config: { key: 'value' },
      });

      expect(loaded).toBe(plugin);
      expect(factory).toHaveBeenCalledWith({ key: 'value' });
    });

    it('should throw for unknown source type', async () => {
      await expect(
        loader.load({ type: 'unknown' as any })
      ).rejects.toThrow('Unknown plugin source type');
    });
  });

  describe('loadFromFactory', () => {
    it('should call factory with config', async () => {
      const plugin = createMockPlugin('test');
      const factory = jest.fn().mockResolvedValue(plugin);

      await loader.loadFromFactory(factory, { option: true });

      expect(factory).toHaveBeenCalledWith({ option: true });
    });

    it('should validate returned plugin', async () => {
      const factory = jest.fn().mockResolvedValue({ invalid: true });

      await expect(loader.loadFromFactory(factory)).rejects.toThrow(
        'Plugin must have a valid name'
      );
    });

    it('should propagate factory errors', async () => {
      const factory = jest.fn().mockRejectedValue(new Error('Factory failed'));

      await expect(loader.loadFromFactory(factory)).rejects.toThrow('Factory failed');
    });
  });

  describe('validatePlugin', () => {
    it('should reject plugin without name', async () => {
      const factory = jest.fn().mockResolvedValue({
        version: '1.0.0',
        init: jest.fn(),
      });

      await expect(loader.loadFromFactory(factory)).rejects.toThrow(
        'Plugin must have a valid name'
      );
    });

    it('should reject plugin without version', async () => {
      const factory = jest.fn().mockResolvedValue({
        name: 'test',
        init: jest.fn(),
      });

      await expect(loader.loadFromFactory(factory)).rejects.toThrow(
        'Plugin must have a valid version'
      );
    });

    it('should reject plugin without init function', async () => {
      const factory = jest.fn().mockResolvedValue({
        name: 'test',
        version: '1.0.0',
      });

      await expect(loader.loadFromFactory(factory)).rejects.toThrow(
        'Plugin must have an init function'
      );
    });
  });

  describe('loadAll', () => {
    it('should load multiple plugins sequentially', async () => {
      const plugin1 = createMockPlugin('plugin1');
      const plugin2 = createMockPlugin('plugin2');

      const plugins = await loader.loadAll([
        { type: 'instance', plugin: plugin1 },
        { type: 'instance', plugin: plugin2 },
      ]);

      expect(plugins).toHaveLength(2);
      expect(plugins[0]).toBe(plugin1);
      expect(plugins[1]).toBe(plugin2);
    });
  });

  describe('loadParallel', () => {
    it('should load multiple plugins in parallel', async () => {
      const plugin1 = createMockPlugin('plugin1');
      const plugin2 = createMockPlugin('plugin2');

      const plugins = await loader.loadParallel([
        { type: 'instance', plugin: plugin1 },
        { type: 'instance', plugin: plugin2 },
      ]);

      expect(plugins).toHaveLength(2);
    });

    it('should continue loading even if some fail', async () => {
      const plugin1 = createMockPlugin('plugin1');
      const failingFactory = jest.fn().mockRejectedValue(new Error('Fail'));

      const plugins = await loader.loadParallel([
        { type: 'instance', plugin: plugin1 },
        { type: 'factory', factory: failingFactory },
      ]);

      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toBe(plugin1);
    });
  });

  describe('caching', () => {
    it('should cache size initially zero', () => {
      expect(loader.cacheSize).toBe(0);
    });

    it('should clear cache', () => {
      loader.clearCache();
      expect(loader.cacheSize).toBe(0);
    });

    it('should uncache specific entry', () => {
      // Note: This tests the method exists - actual caching tested with modules
      const result = loader.uncache('non-existent');
      expect(result).toBe(false);
    });
  });
});

describe('createPluginLoader', () => {
  it('should create a new PluginLoader instance', () => {
    const loader = createPluginLoader();
    expect(loader).toBeInstanceOf(PluginLoader);
  });
});

