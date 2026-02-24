/**
 * OnboardingPlugin tests
 */


import { OnboardingPlugin, createOnboardingPlugin } from './plugin.js';
import type { SamTerminalCore } from '@samterminal/core';

describe('OnboardingPlugin', () => {
  let plugin: OnboardingPlugin;
  let mockCore: SamTerminalCore;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCore = {
      services: {
        registerAction: jest.fn(),
        registerProvider: jest.fn(),
        unregisterPlugin: jest.fn(),
      },
      events: {
        emit: jest.fn(),
      },
    } as unknown as SamTerminalCore;
  });

  describe('constructor', () => {
    it('should create plugin with default config', () => {
      plugin = new OnboardingPlugin();

      expect(plugin.name).toBe('@samterminal/plugin-onboarding');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.description).toBe('User onboarding flows and profile management');
    });

    it('should use provided database adapter', () => {
      const mockDatabase = {
        createUser: jest.fn(),
        getUser: jest.fn(),
        listFlows: jest.fn().mockResolvedValue([]),
      };

      plugin = new OnboardingPlugin({
        database: mockDatabase as any,
        initDefaultFlow: false,
      });

      expect(plugin.getDatabase()).toBe(mockDatabase);
    });

    it('should create in-memory storage when no database provided', () => {
      plugin = new OnboardingPlugin({ initDefaultFlow: false });

      const db = plugin.getDatabase();
      expect(db).toBeDefined();
      expect(typeof db.createUser).toBe('function');
    });

    it('should accept custom config options', () => {
      plugin = new OnboardingPlugin({
        autoStart: false,
        allowSkipRequired: true,
        requireEmailVerification: true,
        requireWallet: true,
        sessionTimeout: 60000,
        maxRetries: 5,
        initDefaultFlow: false,
      });

      const config = plugin.getConfig();
      expect(config.autoStart).toBe(false);
      expect(config.allowSkipRequired).toBe(true);
      expect(config.requireEmailVerification).toBe(true);
      expect(config.requireWallet).toBe(true);
      expect(config.sessionTimeout).toBe(60000);
      expect(config.maxRetries).toBe(5);
    });

    it('should use default values for config', () => {
      plugin = new OnboardingPlugin({ initDefaultFlow: false });

      const config = plugin.getConfig();
      expect(config.autoStart).toBe(true);
      expect(config.allowSkipRequired).toBe(false);
      expect(config.requireEmailVerification).toBe(false);
      expect(config.requireWallet).toBe(false);
      expect(config.sessionTimeout).toBe(30 * 60 * 1000);
      expect(config.maxRetries).toBe(3);
    });
  });

  describe('init', () => {
    it('should register providers and actions', async () => {
      plugin = new OnboardingPlugin({ initDefaultFlow: false });
      await plugin.init(mockCore);

      expect(plugin.providers.length).toBe(3);
      expect(plugin.actions.length).toBe(4);

      expect(mockCore.services.registerProvider).toHaveBeenCalledTimes(3);
      expect(mockCore.services.registerAction).toHaveBeenCalledTimes(4);
    });

    it('should emit plugin:loaded event', async () => {
      plugin = new OnboardingPlugin({ initDefaultFlow: false });
      await plugin.init(mockCore);

      expect(mockCore.events.emit).toHaveBeenCalledWith('plugin:loaded', {
        plugin: '@samterminal/plugin-onboarding',
      });
    });

    it('should initialize default flow when option is true', async () => {
      plugin = new OnboardingPlugin({ initDefaultFlow: true });
      await plugin.init(mockCore);

      // Wait for async initialization
      await new Promise((resolve) => setTimeout(resolve, 10));

      const flowId = plugin.getDefaultFlowId();
      expect(flowId).toBeDefined();
    });
  });

  describe('destroy', () => {
    it('should unregister plugin and clear resources', async () => {
      plugin = new OnboardingPlugin({ initDefaultFlow: false });
      await plugin.init(mockCore);
      await plugin.destroy();

      expect(mockCore.services.unregisterPlugin).toHaveBeenCalledWith('@samterminal/plugin-onboarding');
      expect(mockCore.events.emit).toHaveBeenCalledWith('plugin:unloaded', {
        plugin: '@samterminal/plugin-onboarding',
      });
      expect(plugin.providers.length).toBe(0);
      expect(plugin.actions.length).toBe(0);
    });

    it('should handle destroy without init', async () => {
      plugin = new OnboardingPlugin({ initDefaultFlow: false });
      await expect(plugin.destroy()).resolves.toBeUndefined();
    });
  });

  describe('getDatabase', () => {
    it('should return database adapter', () => {
      plugin = new OnboardingPlugin({ initDefaultFlow: false });
      const db = plugin.getDatabase();

      expect(db).toBeDefined();
      expect(typeof db.createUser).toBe('function');
      expect(typeof db.getFlow).toBe('function');
    });
  });

  describe('getFlowEngine', () => {
    it('should return flow engine', () => {
      plugin = new OnboardingPlugin({ initDefaultFlow: false });
      const engine = plugin.getFlowEngine();

      expect(engine).toBeDefined();
      expect(typeof engine.startFlow).toBe('function');
      expect(typeof engine.completeStep).toBe('function');
    });
  });

  describe('getConfig', () => {
    it('should return a copy of config', () => {
      plugin = new OnboardingPlugin({
        autoStart: false,
        initDefaultFlow: false,
      });

      const config1 = plugin.getConfig();
      const config2 = plugin.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different objects
    });
  });

  describe('updateConfig', () => {
    it('should update config', () => {
      plugin = new OnboardingPlugin({ initDefaultFlow: false });

      plugin.updateConfig({
        autoStart: false,
        maxRetries: 10,
      });

      const config = plugin.getConfig();
      expect(config.autoStart).toBe(false);
      expect(config.maxRetries).toBe(10);
    });

    it('should recreate flow engine after config update', () => {
      plugin = new OnboardingPlugin({ initDefaultFlow: false });
      const oldEngine = plugin.getFlowEngine();

      plugin.updateConfig({ allowSkipRequired: true });

      const newEngine = plugin.getFlowEngine();
      expect(newEngine).not.toBe(oldEngine);
    });
  });

  describe('setDatabase', () => {
    it('should change database adapter', () => {
      plugin = new OnboardingPlugin({ initDefaultFlow: false });

      const mockDatabase = {
        createUser: jest.fn(),
        getUser: jest.fn(),
      } as any;

      plugin.setDatabase(mockDatabase);

      expect(plugin.getDatabase()).toBe(mockDatabase);
    });

    it('should recreate flow engine with new database', () => {
      plugin = new OnboardingPlugin({ initDefaultFlow: false });
      const oldEngine = plugin.getFlowEngine();

      plugin.setDatabase({} as any);

      const newEngine = plugin.getFlowEngine();
      expect(newEngine).not.toBe(oldEngine);
    });
  });

  describe('createFlow', () => {
    it('should create a custom flow', async () => {
      plugin = new OnboardingPlugin({ initDefaultFlow: false });

      const flow = await plugin.createFlow({
        name: 'Custom Flow',
        steps: [
          {
            id: 'custom-step',
            name: 'Custom Step',
            type: 'info',
            order: 1,
          },
        ],
        active: true,
      });

      expect(flow.id).toBeDefined();
      expect(flow.name).toBe('Custom Flow');
      expect(flow.steps.length).toBe(1);
    });
  });

  describe('getDefaultFlowId and setDefaultFlowId', () => {
    it('should get and set default flow ID', () => {
      plugin = new OnboardingPlugin({
        defaultFlowId: 'initial-flow',
        initDefaultFlow: false,
      });

      expect(plugin.getDefaultFlowId()).toBe('initial-flow');

      plugin.setDefaultFlowId('new-flow');
      expect(plugin.getDefaultFlowId()).toBe('new-flow');
    });
  });

  describe('clearStorage', () => {
    it('should clear in-memory storage', async () => {
      plugin = new OnboardingPlugin({ initDefaultFlow: false });
      const db = plugin.getDatabase();

      await db.createUser({ name: 'Test', status: 'new' });
      expect((db as any).getUserCount()).toBe(1);

      plugin.clearStorage();
      expect((db as any).getUserCount()).toBe(0);
    });

    it('should do nothing if using external database', () => {
      const mockDatabase = {
        createUser: jest.fn(),
        listFlows: jest.fn().mockResolvedValue([]),
      } as any;

      plugin = new OnboardingPlugin({
        database: mockDatabase,
        initDefaultFlow: false,
      });

      // Should not throw
      expect(() => plugin.clearStorage()).not.toThrow();
    });
  });
});

describe('createOnboardingPlugin', () => {
  it('should create a new OnboardingPlugin instance', () => {
    const plugin = createOnboardingPlugin({ initDefaultFlow: false });
    expect(plugin).toBeInstanceOf(OnboardingPlugin);
  });

  it('should accept options', () => {
    const plugin = createOnboardingPlugin({
      autoStart: false,
      maxRetries: 10,
      initDefaultFlow: false,
    });

    expect(plugin.getConfig().autoStart).toBe(false);
    expect(plugin.getConfig().maxRetries).toBe(10);
  });
});
