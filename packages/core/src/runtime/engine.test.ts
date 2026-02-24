/**
 * Runtime Engine tests
 */

import { jest } from '@jest/globals';
import type { CoreConfig, SamTerminalCore } from '../interfaces/core.interface.js';
import type { AgentConfig } from '../types/index.js';
import type { Plugin } from '../interfaces/plugin.interface.js';

// Mock dependencies using unstable_mockModule for ESM compatibility
jest.unstable_mockModule('./state-machine.js', () => ({
  createStateMachine: () => ({
    getState: jest.fn().mockReturnValue('idle'),
    transitionTo: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.unstable_mockModule('./task-manager.js', () => ({
  createTaskManager: () => ({
    enqueue: jest.fn().mockImplementation((fn: () => Promise<unknown>) => fn()),
    waitAll: jest.fn().mockResolvedValue(undefined),
    getStats: jest.fn().mockReturnValue({ pending: 0, running: 0, completed: 0, failed: 0 }),
  }),
}));

jest.unstable_mockModule('./executor.js', () => ({
  createServiceRegistry: () => ({
    registerAction: jest.fn(),
    registerProvider: jest.fn(),
    registerEvaluator: jest.fn(),
    getAction: jest.fn(),
    getProvider: jest.fn(),
    getEvaluator: jest.fn(),
    getStats: jest.fn().mockReturnValue({ actions: 0, providers: 0, evaluators: 0 }),
  }),
  createExecutor: () => ({
    executeAction: jest.fn().mockResolvedValue({ success: true, data: { result: 'test' } }),
    getData: jest.fn().mockResolvedValue({ success: true, data: { value: 'data' } }),
    evaluate: jest.fn().mockResolvedValue(true),
  }),
}));

jest.unstable_mockModule('./scheduler.js', () => ({
  createScheduler: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    schedule: jest.fn().mockReturnValue('schedule-id'),
    getStats: jest.fn().mockReturnValue({ scheduled: 0, running: 0 }),
  }),
}));

jest.unstable_mockModule('../plugins/lifecycle.js', () => ({
  createPluginLifecycle: () => ({
    loadPlugin: jest.fn().mockResolvedValue(undefined),
    initAll: jest.fn().mockResolvedValue(undefined),
    destroyAll: jest.fn().mockResolvedValue(undefined),
    setCore: jest.fn(),
    getRegistry: jest.fn().mockReturnValue({
      register: jest.fn(),
    }),
  }),
}));

jest.unstable_mockModule('../chains/manager.js', () => ({
  createChainManager: () => ({}),
}));

jest.unstable_mockModule('../flow/engine.js', () => ({
  createFlowEngine: () => ({
    setCore: jest.fn(),
  }),
}));

jest.unstable_mockModule('../hooks/service.js', () => ({
  createHooksService: () => ({}),
}));

jest.unstable_mockModule('../utils/logger.js', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

// Dynamic import after mocks are set up
const { RuntimeEngineImpl, createRuntimeEngine } = await import('./engine.js');

describe('RuntimeEngineImpl', () => {
  let engine: InstanceType<typeof RuntimeEngineImpl>;

  beforeEach(() => {
    jest.clearAllMocks();
    engine = new RuntimeEngineImpl();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const newEngine = new RuntimeEngineImpl();
      expect(newEngine).toBeInstanceOf(RuntimeEngineImpl);
    });

    it('should initialize with custom config', () => {
      const config: CoreConfig = {
        maxConcurrentTasks: 20,
        plugins: ['@samterminal/plugin-test'],
      };
      const newEngine = new RuntimeEngineImpl(config);
      expect(newEngine).toBeInstanceOf(RuntimeEngineImpl);
    });
  });

  describe('state', () => {
    it('should return current state from state machine', () => {
      const state = engine.state;
      expect(state).toBe('idle');
    });
  });

  describe('getters', () => {
    it('should return service registry', () => {
      const registry = engine.getServiceRegistry();
      expect(registry).toBeDefined();
    });

    it('should return plugin lifecycle', () => {
      const lifecycle = engine.getPluginLifecycle();
      expect(lifecycle).toBeDefined();
    });

    it('should return chain manager', () => {
      const chainManager = engine.getChainManager();
      expect(chainManager).toBeDefined();
    });

    it('should return flow engine', () => {
      const flowEngine = engine.getFlowEngine();
      expect(flowEngine).toBeDefined();
    });

    it('should return hooks service', () => {
      const hooksService = engine.getHooksService();
      expect(hooksService).toBeDefined();
    });

    it('should return task manager', () => {
      const taskManager = engine.getTaskManager();
      expect(taskManager).toBeDefined();
    });

    it('should return scheduler', () => {
      const scheduler = engine.getScheduler();
      expect(scheduler).toBeDefined();
    });

    it('should return events emitter', () => {
      const events = engine.getEvents();
      expect(events).toBeDefined();
      expect(typeof events.emit).toBe('function');
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await expect(engine.initialize()).resolves.not.toThrow();
    });

    it('should load plugins from config', async () => {
      const config: CoreConfig = {
        plugins: ['@samterminal/plugin-test'],
      };
      const engineWithPlugins = new RuntimeEngineImpl(config);
      await engineWithPlugins.initialize();

      const lifecycle = engineWithPlugins.getPluginLifecycle();
      expect(lifecycle.loadPlugin).toHaveBeenCalledWith({
        type: 'package',
        name: '@samterminal/plugin-test',
        config: undefined,
      });
    });

    it('should register plugin objects directly', async () => {
      const mockPlugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        init: jest.fn(),
        destroy: jest.fn(),
      };

      const config: CoreConfig = {
        plugins: [mockPlugin as unknown as string],
      };
      const engineWithPlugins = new RuntimeEngineImpl(config);
      await engineWithPlugins.initialize();

      const lifecycle = engineWithPlugins.getPluginLifecycle();
      expect(lifecycle.getRegistry().register).toHaveBeenCalled();
    });

    it('should emit system:ready event', async () => {
      const readyHandler = jest.fn();
      engine.getEvents().on('system:ready', readyHandler);

      await engine.initialize();

      expect(readyHandler).toHaveBeenCalled();
    });
  });

  describe('start', () => {
    it('should throw if not in ready state', async () => {
      await expect(engine.start()).rejects.toThrow('Runtime must be in ready state to start');
    });

    it('should start scheduler on start', async () => {
      // Mock state to be ready
      jest.mocked((engine as any).stateMachine.getState).mockReturnValue('ready');

      await engine.start();

      expect(engine.getScheduler().start).toHaveBeenCalled();
    });

    it('should initialize all plugins on start', async () => {
      jest.mocked((engine as any).stateMachine.getState).mockReturnValue('ready');

      await engine.start();

      expect(engine.getPluginLifecycle().initAll).toHaveBeenCalled();
    });

    it('should emit system:init event', async () => {
      jest.mocked((engine as any).stateMachine.getState).mockReturnValue('ready');
      const initHandler = jest.fn();
      engine.getEvents().on('system:init', initHandler);

      await engine.start();

      expect(initHandler).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop scheduler', async () => {
      await engine.stop();
      expect(engine.getScheduler().stop).toHaveBeenCalled();
    });

    it('should wait for all tasks to complete', async () => {
      await engine.stop();
      expect(engine.getTaskManager().waitAll).toHaveBeenCalled();
    });

    it('should destroy all plugins', async () => {
      await engine.stop();
      expect(engine.getPluginLifecycle().destroyAll).toHaveBeenCalled();
    });

    it('should emit system:shutdown event', async () => {
      const shutdownHandler = jest.fn();
      engine.getEvents().on('system:shutdown', shutdownHandler);

      await engine.stop();

      expect(shutdownHandler).toHaveBeenCalled();
    });
  });

  describe('executeAction', () => {
    it('should execute action and return result', async () => {
      const result = await engine.executeAction('test:action', { input: 'data' });
      expect(result).toEqual({ result: 'test' });
    });

    it('should throw on action failure', async () => {
      const executor = (engine as any).executor;
      jest.mocked(executor.executeAction).mockResolvedValueOnce({
        success: false,
        error: 'Action failed',
      });

      await expect(engine.executeAction('test:action', {})).rejects.toThrow('Action failed');
    });

    it('should pass context to executor', async () => {
      const context = { chainId: 1 };
      await engine.executeAction('test:action', { input: 'data' }, context);

      expect((engine as any).executor.executeAction).toHaveBeenCalledWith(
        'test:action',
        { input: 'data' },
        { chainId: 1 },
      );
    });
  });

  describe('getData', () => {
    it('should get data from provider', async () => {
      const result = await engine.getData('test:provider', { query: 'test' });
      expect(result).toEqual({ value: 'data' });
    });

    it('should throw on provider failure', async () => {
      const executor = (engine as any).executor;
      jest.mocked(executor.getData).mockResolvedValueOnce({
        success: false,
        error: 'Provider failed',
      });

      await expect(engine.getData('test:provider', {})).rejects.toThrow('Provider failed');
    });

    it('should pass context to executor', async () => {
      const context = { chainId: 1 };
      await engine.getData('test:provider', { query: 'test' }, context);

      expect((engine as any).executor.getData).toHaveBeenCalledWith(
        'test:provider',
        { query: 'test' },
        { chainId: 1 },
      );
    });
  });

  describe('evaluate', () => {
    it('should evaluate condition', async () => {
      const result = await engine.evaluate('test:evaluator', { condition: true }, { data: 'test' });
      expect(result).toBe(true);
    });
  });

  describe('createAgent', () => {
    it('should create agent with config', async () => {
      const config: AgentConfig = {
        name: 'Test Agent',
        description: 'A test agent',
      };

      const agent = await engine.createAgent(config);

      expect(agent.name).toBe('Test Agent');
      expect(agent.description).toBe('A test agent');
      expect(agent.status).toBe('idle');
      expect(agent.id).toBeDefined();
      expect(agent.createdAt).toBeInstanceOf(Date);
    });

    it('should create agent with custom id', async () => {
      const config: AgentConfig = {
        id: 'custom-id',
        name: 'Test Agent',
      };

      const agent = await engine.createAgent(config);

      expect(agent.id).toBe('custom-id');
    });

    it('should store current agent', async () => {
      const config: AgentConfig = {
        name: 'Test Agent',
      };

      await engine.createAgent(config);
      const currentAgent = engine.getAgent();

      expect(currentAgent?.name).toBe('Test Agent');
    });
  });

  describe('getAgent', () => {
    it('should return undefined when no agent created', () => {
      expect(engine.getAgent()).toBeUndefined();
    });

    it('should return current agent after creation', async () => {
      await engine.createAgent({ name: 'Test' });
      expect(engine.getAgent()).toBeDefined();
    });
  });

  describe('setCore', () => {
    it('should set core reference in plugin lifecycle and flow engine', () => {
      const mockCore = { runtime: engine } as unknown as SamTerminalCore;
      engine.setCore(mockCore);

      expect(engine.getPluginLifecycle().setCore).toHaveBeenCalledWith(mockCore);
      expect(engine.getFlowEngine().setCore).toHaveBeenCalledWith(mockCore);
    });
  });

  describe('queueTask', () => {
    it('should queue task with task manager', async () => {
      const task = jest.fn().mockResolvedValue('result');
      const result = await engine.queueTask(task);

      expect(result).toBe('result');
    });

    it('should pass options to task manager', async () => {
      const task = jest.fn().mockResolvedValue('result');
      await engine.queueTask(task, { name: 'test-task', timeout: 5000, priority: 1 });

      expect(engine.getTaskManager().enqueue).toHaveBeenCalledWith(task, {
        name: 'test-task',
        timeout: 5000,
        priority: 1,
      });
    });
  });

  describe('scheduleTask', () => {
    it('should schedule task with scheduler', () => {
      const task = jest.fn().mockResolvedValue(undefined);
      const result = engine.scheduleTask(task, { name: 'scheduled-task', interval: 60000 });

      expect(result).toBe('schedule-id');
      expect(engine.getScheduler().schedule).toHaveBeenCalledWith(task, {
        name: 'scheduled-task',
        interval: 60000,
      });
    });

    it('should schedule task with cron expression', () => {
      const task = jest.fn().mockResolvedValue(undefined);
      engine.scheduleTask(task, { cron: '0 * * * *' });

      expect(engine.getScheduler().schedule).toHaveBeenCalledWith(task, {
        cron: '0 * * * *',
      });
    });
  });

  describe('getStats', () => {
    it('should return combined stats', () => {
      const stats = engine.getStats();

      expect(stats).toHaveProperty('state');
      expect(stats).toHaveProperty('tasks');
      expect(stats).toHaveProperty('scheduler');
      expect(stats).toHaveProperty('services');
    });
  });
});

describe('createRuntimeEngine', () => {
  it('should create a RuntimeEngineImpl instance', () => {
    const engine = createRuntimeEngine();
    expect(engine).toBeInstanceOf(RuntimeEngineImpl);
  });

  it('should pass config to constructor', () => {
    const config: CoreConfig = { maxConcurrentTasks: 5 };
    const engine = createRuntimeEngine(config);
    expect(engine).toBeInstanceOf(RuntimeEngineImpl);
  });
});
