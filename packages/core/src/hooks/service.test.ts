/**
 * Hooks Service tests
 */


import { HooksService, createHooksService } from './service.js';
import type { Hook } from '../interfaces/hook.interface.js';

describe('HooksService', () => {
  let service: HooksService;

  beforeEach(() => {
    service = new HooksService();
  });

  describe('register', () => {
    it('should register a hook', () => {
      const hook: Hook = {
        name: 'test-hook',
        event: 'system:init',
        handler: jest.fn(),
      };

      const registration = service.register(hook);

      expect(registration.id).toBeDefined();
      expect(typeof registration.unsubscribe).toBe('function');
    });

    it('should register hook with priority', () => {
      const hook: Hook = {
        name: 'priority-hook',
        event: 'system:init',
        priority: 10,
        handler: jest.fn(),
      };

      service.register(hook);
      const hooks = service.getHooks('system:init');

      expect(hooks[0].priority).toBe(10);
    });

    it('should register hook with plugin name', () => {
      const hook: Hook = {
        name: 'plugin-hook',
        event: 'system:init',
        handler: jest.fn(),
      };

      service.register(hook, 'my-plugin');

      expect(service.getTotalHookCount()).toBe(1);
    });
  });

  describe('on', () => {
    it('should register handler for event', () => {
      const handler = jest.fn();
      const registration = service.on('system:init', handler);

      expect(registration.id).toBeDefined();
      expect(service.getHookCount('system:init')).toBe(1);
    });

    it('should register with options', () => {
      const handler = jest.fn();
      service.on('system:init', handler, {
        name: 'custom-name',
        priority: 5,
      });

      const hooks = service.getHooks('system:init');
      expect(hooks[0].name).toBe('custom-name');
      expect(hooks[0].priority).toBe(5);
    });
  });

  describe('once', () => {
    it('should register one-time handler', async () => {
      const handler = jest.fn();
      service.once('system:init', handler);

      await service.emit('system:init', undefined);
      await service.emit('system:init', undefined);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('emit', () => {
    it('should call registered handlers', async () => {
      const handler = jest.fn();
      service.on('system:init', handler);

      await service.emit('system:init', { test: true });

      expect(handler).toHaveBeenCalled();
    });

    it('should pass payload to handler', async () => {
      const handler = jest.fn();
      service.on('agent:start', handler);

      await service.emit('agent:start', { agentId: '123' });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'agent:start',
          data: { agentId: '123' },
        })
      );
    });

    it('should return empty array if no handlers', async () => {
      const results = await service.emit('system:init', undefined);
      expect(results).toEqual([]);
    });

    it('should return execution results', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      service.on('system:init', handler);

      const results = await service.emit('system:init', undefined);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    it('should call handlers in priority order', async () => {
      const calls: number[] = [];

      service.on('system:init', async () => calls.push(1), { priority: 1 });
      service.on('system:init', async () => calls.push(2), { priority: 2 });
      service.on('system:init', async () => calls.push(3), { priority: 3 });

      await service.emit('system:init', undefined);

      expect(calls).toEqual([3, 2, 1]);
    });

    it('should continue on error by default', async () => {
      const handler1 = jest.fn().mockRejectedValue(new Error('Fail'));
      const handler2 = jest.fn();

      service.on('system:init', handler1);
      service.on('system:init', handler2);

      await service.emit('system:init', undefined);

      expect(handler2).toHaveBeenCalled();
    });

    it('should stop on error when configured', async () => {
      const handler1 = jest.fn().mockRejectedValue(new Error('Fail'));
      const handler2 = jest.fn();

      service.on('system:init', handler1);
      service.on('system:init', handler2);

      const results = await service.emit('system:init', undefined, {
        stopOnError: true,
      });

      expect(results[0].success).toBe(false);
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should handle hook timeout', async () => {
      const slowHandler = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      );

      service.on('system:init', slowHandler, { timeout: 50 });

      const results = await service.emit('system:init', undefined, { timeout: 50 });

      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('timeout');
    });

    it('should remove one-time hooks after execution', async () => {
      const handler = jest.fn();
      service.once('system:init', handler);

      await service.emit('system:init', undefined);

      expect(service.getHookCount('system:init')).toBe(0);
    });

    it('should track duration', async () => {
      const handler = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50))
      );
      service.on('system:init', handler);

      const results = await service.emit('system:init', undefined);

      expect(results[0].duration).toBeGreaterThanOrEqual(40);
    });
  });

  describe('unregister', () => {
    it('should unregister hook by ID', () => {
      const registration = service.on('system:init', jest.fn());

      const result = service.unregister(registration.id);

      expect(result).toBe(true);
      expect(service.getHookCount('system:init')).toBe(0);
    });

    it('should return false for unknown ID', () => {
      const result = service.unregister('unknown-id');
      expect(result).toBe(false);
    });

    it('should work via unsubscribe function', () => {
      const registration = service.on('system:init', jest.fn());
      registration.unsubscribe();

      expect(service.getHookCount('system:init')).toBe(0);
    });
  });

  describe('unregisterPlugin', () => {
    it('should unregister all hooks for plugin', () => {
      service.register(
        { name: 'hook1', event: 'system:init', handler: jest.fn() },
        'my-plugin'
      );
      service.register(
        { name: 'hook2', event: 'system:ready', handler: jest.fn() },
        'my-plugin'
      );
      service.register(
        { name: 'hook3', event: 'system:init', handler: jest.fn() },
        'other-plugin'
      );

      const count = service.unregisterPlugin('my-plugin');

      expect(count).toBe(2);
      expect(service.getTotalHookCount()).toBe(1);
    });
  });

  describe('getHooks', () => {
    it('should return hooks for event', () => {
      service.register({
        name: 'hook1',
        event: 'system:init',
        handler: jest.fn(),
      });

      const hooks = service.getHooks('system:init');

      expect(hooks).toHaveLength(1);
      expect(hooks[0].name).toBe('hook1');
    });

    it('should return empty array for unknown event', () => {
      const hooks = service.getHooks('unknown' as any);
      expect(hooks).toEqual([]);
    });
  });

  describe('getAllHooks', () => {
    it('should return map of all hooks by event', () => {
      service.register({
        name: 'hook1',
        event: 'system:init',
        handler: jest.fn(),
      });
      service.register({
        name: 'hook2',
        event: 'system:ready',
        handler: jest.fn(),
      });

      const all = service.getAllHooks();

      expect(all.get('system:init')).toHaveLength(1);
      expect(all.get('system:ready')).toHaveLength(1);
    });
  });

  describe('getEvents', () => {
    it('should return list of events with hooks', () => {
      service.register({
        name: 'hook1',
        event: 'system:init',
        handler: jest.fn(),
      });
      service.register({
        name: 'hook2',
        event: 'system:ready',
        handler: jest.fn(),
      });

      const events = service.getEvents();

      expect(events).toContain('system:init');
      expect(events).toContain('system:ready');
    });
  });

  describe('getHookCount', () => {
    it('should return count for event', () => {
      service.on('system:init', jest.fn());
      service.on('system:init', jest.fn());

      expect(service.getHookCount('system:init')).toBe(2);
    });

    it('should return 0 for unknown event', () => {
      expect(service.getHookCount('unknown' as any)).toBe(0);
    });
  });

  describe('getTotalHookCount', () => {
    it('should return total count', () => {
      service.on('system:init', jest.fn());
      service.on('system:ready', jest.fn());
      service.on('agent:start', jest.fn());

      expect(service.getTotalHookCount()).toBe(3);
    });
  });

  describe('clear', () => {
    it('should remove all hooks', () => {
      service.on('system:init', jest.fn());
      service.on('system:ready', jest.fn());

      service.clear();

      expect(service.getTotalHookCount()).toBe(0);
    });
  });
});

describe('createHooksService', () => {
  it('should create a new HooksService', () => {
    const service = createHooksService();
    expect(service).toBeInstanceOf(HooksService);
  });
});
