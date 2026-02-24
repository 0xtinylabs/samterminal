/**
 * Base Plugin tests
 */


import { BasePlugin, createPlugin } from './base-plugin.js';
import type { SamTerminalCore } from '../interfaces/core.interface.js';
import type { Action } from '../interfaces/action.interface.js';
import type { Provider } from '../interfaces/provider.interface.js';

// Concrete implementation for testing
class TestPlugin extends BasePlugin {
  readonly name = 'test-plugin';
  readonly version = '1.0.0';
  readonly description = 'Test plugin';

  public initCalled = false;
  public destroyCalled = false;
  public shouldThrowOnInit = false;
  public shouldThrowOnDestroy = false;

  protected async onInit(): Promise<void> {
    if (this.shouldThrowOnInit) {
      throw new Error('Init error');
    }
    this.initCalled = true;
  }

  protected async onDestroy(): Promise<void> {
    if (this.shouldThrowOnDestroy) {
      throw new Error('Destroy error');
    }
    this.destroyCalled = true;
  }

  // Expose protected methods for testing
  public testGetCore() {
    return this.getCore();
  }

  public testIsInitialized() {
    return this.isInitialized();
  }

  public testRegisterAction(action: Action) {
    this.registerAction(action);
  }

  public testRegisterProvider(provider: Provider) {
    this.registerProvider(provider);
  }
}

describe('BasePlugin', () => {
  let plugin: TestPlugin;
  let mockCore: SamTerminalCore;

  beforeEach(() => {
    plugin = new TestPlugin();
    mockCore = {
      runtime: {
        executeAction: jest.fn().mockResolvedValue({ success: true }),
        getData: jest.fn().mockResolvedValue({ success: true }),
      },
      hooks: {
        emit: jest.fn().mockResolvedValue([]),
      },
    } as unknown as SamTerminalCore;
  });

  describe('init', () => {
    it('should set core reference', async () => {
      await plugin.init(mockCore);
      expect(plugin.testIsInitialized()).toBe(true);
    });

    it('should call onInit', async () => {
      await plugin.init(mockCore);
      expect(plugin.initCalled).toBe(true);
    });

    it('should throw and propagate error from onInit', async () => {
      plugin.shouldThrowOnInit = true;
      await expect(plugin.init(mockCore)).rejects.toThrow('Init error');
    });
  });

  describe('destroy', () => {
    it('should call onDestroy', async () => {
      await plugin.init(mockCore);
      await plugin.destroy();
      expect(plugin.destroyCalled).toBe(true);
    });

    it('should clear core reference', async () => {
      await plugin.init(mockCore);
      await plugin.destroy();
      expect(plugin.testIsInitialized()).toBe(false);
    });

    it('should throw and propagate error from onDestroy', async () => {
      await plugin.init(mockCore);
      plugin.shouldThrowOnDestroy = true;
      await expect(plugin.destroy()).rejects.toThrow('Destroy error');
    });
  });

  describe('getCore', () => {
    it('should throw if not initialized', () => {
      expect(() => plugin.testGetCore()).toThrow('Plugin test-plugin is not initialized');
    });

    it('should return core after init', async () => {
      await plugin.init(mockCore);
      expect(plugin.testGetCore()).toBe(mockCore);
    });
  });

  describe('isInitialized', () => {
    it('should return false before init', () => {
      expect(plugin.testIsInitialized()).toBe(false);
    });

    it('should return true after init', async () => {
      await plugin.init(mockCore);
      expect(plugin.testIsInitialized()).toBe(true);
    });
  });

  describe('registerAction', () => {
    it('should add action to actions array', () => {
      const action: Action = {
        name: 'test-action',
        description: 'Test',
        execute: jest.fn(),
      };

      plugin.testRegisterAction(action);
      expect(plugin.actions).toContain(action);
    });

    it('should create actions array if not exists', () => {
      expect(plugin.actions).toBeUndefined();

      const action: Action = {
        name: 'test-action',
        description: 'Test',
        execute: jest.fn(),
      };

      plugin.testRegisterAction(action);
      expect(plugin.actions).toHaveLength(1);
    });
  });

  describe('registerProvider', () => {
    it('should add provider to providers array', () => {
      const provider: Provider = {
        name: 'test-provider',
        description: 'Test',
        get: jest.fn(),
      };

      plugin.testRegisterProvider(provider);
      expect(plugin.providers).toContain(provider);
    });
  });

  describe('getInfo', () => {
    it('should return plugin metadata', () => {
      const info = plugin.getInfo();

      expect(info.name).toBe('test-plugin');
      expect(info.version).toBe('1.0.0');
      expect(info.description).toBe('Test plugin');
    });
  });
});

describe('createPlugin', () => {
  it('should create a plugin with required properties', () => {
    const plugin = createPlugin({
      name: 'factory-plugin',
      version: '2.0.0',
    });

    expect(plugin.name).toBe('factory-plugin');
    expect(plugin.version).toBe('2.0.0');
  });

  it('should create a plugin with all optional properties', () => {
    const action: Action = {
      name: 'action1',
      description: 'Test',
      execute: jest.fn(),
    };

    const plugin = createPlugin({
      name: 'full-plugin',
      version: '1.0.0',
      description: 'Full plugin',
      author: 'Test Author',
      dependencies: ['dep1'],
      actions: [action],
    });

    expect(plugin.description).toBe('Full plugin');
    expect(plugin.author).toBe('Test Author');
    expect(plugin.dependencies).toEqual(['dep1']);
    expect(plugin.actions).toHaveLength(1);
  });

  it('should call custom init function', async () => {
    const initFn = jest.fn();
    const plugin = createPlugin({
      name: 'init-plugin',
      version: '1.0.0',
      init: initFn,
    });

    const mockCore = {} as SamTerminalCore;
    await plugin.init(mockCore);

    expect(initFn).toHaveBeenCalledWith(mockCore);
  });

  it('should call custom destroy function', async () => {
    const destroyFn = jest.fn();
    const plugin = createPlugin({
      name: 'destroy-plugin',
      version: '1.0.0',
      destroy: destroyFn,
    });

    await plugin.destroy();
    expect(destroyFn).toHaveBeenCalled();
  });

  it('should handle missing init and destroy gracefully', async () => {
    const plugin = createPlugin({
      name: 'simple-plugin',
      version: '1.0.0',
    });

    const mockCore = {} as SamTerminalCore;
    await expect(plugin.init(mockCore)).resolves.not.toThrow();
    await expect(plugin.destroy()).resolves.not.toThrow();
  });
});
