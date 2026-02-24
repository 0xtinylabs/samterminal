/**
 * Event Emitter tests
 */


import { TypedEventEmitter, createEventEmitter } from './event-emitter.js';

describe('TypedEventEmitter', () => {
  let emitter: TypedEventEmitter;

  beforeEach(() => {
    emitter = new TypedEventEmitter();
  });

  describe('on', () => {
    it('should register listener', () => {
      const listener = jest.fn();
      emitter.on('system:init', listener);

      expect(emitter.listenerCount('system:init')).toBe(1);
    });

    it('should return this for chaining', () => {
      const result = emitter.on('system:init', jest.fn());
      expect(result).toBe(emitter);
    });

    it('should call listener when event emitted', () => {
      const listener = jest.fn();
      emitter.on('agent:start', listener);

      emitter.emit('agent:start', { agentId: '123' });

      expect(listener).toHaveBeenCalledWith({ agentId: '123' });
    });

    it('should support multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on('system:ready', listener1);
      emitter.on('system:ready', listener2);

      emitter.emit('system:ready', undefined);

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('once', () => {
    it('should call listener only once', () => {
      const listener = jest.fn();
      emitter.once('system:init', listener);

      emitter.emit('system:init', undefined);
      emitter.emit('system:init', undefined);

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('off', () => {
    it('should remove listener', () => {
      const listener = jest.fn();
      emitter.on('system:init', listener);
      emitter.off('system:init', listener);

      emitter.emit('system:init', undefined);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should return this for chaining', () => {
      const listener = jest.fn();
      const result = emitter.off('system:init', listener);
      expect(result).toBe(emitter);
    });
  });

  describe('emit', () => {
    it('should return true if listeners exist', () => {
      emitter.on('system:init', jest.fn());
      const result = emitter.emit('system:init', undefined);
      expect(result).toBe(true);
    });

    it('should return false if no listeners', () => {
      const result = emitter.emit('system:init', undefined);
      expect(result).toBe(false);
    });

    it('should pass data to listeners', () => {
      const listener = jest.fn();
      emitter.on('flow:start', listener);

      emitter.emit('flow:start', { flowId: 'flow1', executionId: 'exec1' });

      expect(listener).toHaveBeenCalledWith({
        flowId: 'flow1',
        executionId: 'exec1',
      });
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for event', () => {
      emitter.on('system:init', jest.fn());
      emitter.on('system:init', jest.fn());

      emitter.removeAllListeners('system:init');

      expect(emitter.listenerCount('system:init')).toBe(0);
    });

    it('should return this for chaining', () => {
      const result = emitter.removeAllListeners('system:init');
      expect(result).toBe(emitter);
    });
  });

  describe('listenerCount', () => {
    it('should return 0 for no listeners', () => {
      expect(emitter.listenerCount('system:init')).toBe(0);
    });

    it('should return correct count', () => {
      emitter.on('system:init', jest.fn());
      emitter.on('system:init', jest.fn());

      expect(emitter.listenerCount('system:init')).toBe(2);
    });
  });

  describe('listeners', () => {
    it('should return empty array for no listeners', () => {
      expect(emitter.listeners('system:init')).toEqual([]);
    });

    it('should return registered listeners', () => {
      const listener = jest.fn();
      emitter.on('system:init', listener);

      expect(emitter.listeners('system:init')).toContain(listener);
    });
  });

  describe('getEmitter', () => {
    it('should return underlying EventEmitter', () => {
      const underlying = emitter.getEmitter();
      expect(underlying).toBeDefined();
    });
  });

  describe('setMaxListeners', () => {
    it('should set max listeners', () => {
      emitter.setMaxListeners(50);
      expect(emitter.getEmitter().getMaxListeners()).toBe(50);
    });

    it('should return this for chaining', () => {
      const result = emitter.setMaxListeners(50);
      expect(result).toBe(emitter);
    });
  });

  describe('waitFor', () => {
    it('should resolve when event is emitted', async () => {
      const promise = emitter.waitFor('agent:start');

      setTimeout(() => {
        emitter.emit('agent:start', { agentId: 'test' });
      }, 10);

      const result = await promise;
      expect(result).toEqual({ agentId: 'test' });
    });

    it('should reject on timeout', async () => {
      const promise = emitter.waitFor('system:init', 50);

      await expect(promise).rejects.toThrow('Timeout waiting for event');
    });

    it('should cleanup listener on timeout', async () => {
      const promise = emitter.waitFor('system:init', 50);

      try {
        await promise;
      } catch (_error) {
        // Expected
      }

      expect(emitter.listenerCount('system:init')).toBe(0);
    });
  });

  describe('typed events', () => {
    it('should work with plugin events', () => {
      const listener = jest.fn();
      emitter.on('plugin:load', listener);

      emitter.emit('plugin:load', { pluginName: 'test-plugin' });

      expect(listener).toHaveBeenCalledWith({ pluginName: 'test-plugin' });
    });

    it('should work with flow events', () => {
      const listener = jest.fn();
      emitter.on('flow:complete', listener);

      emitter.emit('flow:complete', {
        flowId: 'flow1',
        executionId: 'exec1',
        result: { success: true },
      });

      expect(listener).toHaveBeenCalled();
    });

    it('should work with chain events', () => {
      const listener = jest.fn();
      emitter.on('chain:switch', listener);

      emitter.emit('chain:switch', { fromChain: 1, toChain: 8453 });

      expect(listener).toHaveBeenCalledWith({ fromChain: 1, toChain: 8453 });
    });

    it('should work with custom events', () => {
      const listener = jest.fn();
      emitter.on('custom:my-event', listener);

      emitter.emit('custom:my-event', { data: 'test' });

      expect(listener).toHaveBeenCalledWith({ data: 'test' });
    });
  });
});

describe('createEventEmitter', () => {
  it('should create a new TypedEventEmitter', () => {
    const emitter = createEventEmitter();
    expect(emitter).toBeInstanceOf(TypedEventEmitter);
  });
});
