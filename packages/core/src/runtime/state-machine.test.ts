
import {
  RuntimeStateMachine,
  createStateMachine,
} from './state-machine.js';

describe('RuntimeStateMachine', () => {
  let stateMachine: RuntimeStateMachine;

  beforeEach(() => {
    stateMachine = createStateMachine();
  });

  describe('initial state', () => {
    it('should start in uninitialized state', () => {
      expect(stateMachine.getState()).toBe('uninitialized');
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      expect(stateMachine.getState()).toBe('uninitialized');
    });
  });

  describe('canTransitionTo', () => {
    it('should return true for valid transitions from uninitialized', () => {
      expect(stateMachine.canTransitionTo('initializing')).toBe(true);
    });

    it('should return false for invalid transitions', () => {
      expect(stateMachine.canTransitionTo('running')).toBe(false);
      expect(stateMachine.canTransitionTo('ready')).toBe(false);
      expect(stateMachine.canTransitionTo('shutdown')).toBe(false);
    });

    it('should validate transitions based on current state', async () => {
      await stateMachine.transitionTo('initializing');

      expect(stateMachine.canTransitionTo('loading_plugins')).toBe(true);
      expect(stateMachine.canTransitionTo('error')).toBe(true);
      expect(stateMachine.canTransitionTo('ready')).toBe(false);
    });
  });

  describe('getValidTransitions', () => {
    it('should return valid transitions from uninitialized', () => {
      const transitions = stateMachine.getValidTransitions();

      expect(transitions).toContain('initializing');
      expect(transitions).toHaveLength(1);
    });

    it('should return valid transitions from initializing', async () => {
      await stateMachine.transitionTo('initializing');

      const transitions = stateMachine.getValidTransitions();

      expect(transitions).toContain('loading_plugins');
      expect(transitions).toContain('error');
    });

    it('should return valid transitions from ready', async () => {
      await stateMachine.transitionTo('initializing');
      await stateMachine.transitionTo('loading_plugins');
      await stateMachine.transitionTo('ready');

      const transitions = stateMachine.getValidTransitions();

      expect(transitions).toContain('running');
      expect(transitions).toContain('shutdown');
      expect(transitions).toContain('error');
    });
  });

  describe('transitionTo', () => {
    it('should transition to valid state', async () => {
      await stateMachine.transitionTo('initializing');

      expect(stateMachine.getState()).toBe('initializing');
    });

    it('should throw for invalid transition', async () => {
      await expect(stateMachine.transitionTo('running')).rejects.toThrow(
        /Invalid state transition/,
      );
    });

    it('should include valid transitions in error message', async () => {
      await expect(stateMachine.transitionTo('running')).rejects.toThrow(
        /Valid transitions: initializing/,
      );
    });

    it('should record transition in history', async () => {
      await stateMachine.transitionTo('initializing');

      const history = stateMachine.getHistory();

      expect(history).toHaveLength(1);
      expect(history[0].from).toBe('uninitialized');
      expect(history[0].to).toBe('initializing');
      expect(history[0].at).toBeInstanceOf(Date);
    });

    it('should call transition listeners', async () => {
      const listener = jest.fn();
      stateMachine.onTransition(listener);

      await stateMachine.transitionTo('initializing');

      expect(listener).toHaveBeenCalledWith('uninitialized', 'initializing');
    });

    it('should handle async listeners', async () => {
      const calls: string[] = [];

      stateMachine.onTransition(async (from, to) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        calls.push(`${from}->${to}`);
      });

      await stateMachine.transitionTo('initializing');

      expect(calls).toContain('uninitialized->initializing');
    });

    it('should continue even if listener throws', async () => {
      const errorListener = jest.fn().mockRejectedValue(new Error('Listener error'));
      const normalListener = jest.fn();

      stateMachine.onTransition(errorListener);
      stateMachine.onTransition(normalListener);

      await stateMachine.transitionTo('initializing');

      expect(stateMachine.getState()).toBe('initializing');
      expect(normalListener).toHaveBeenCalled();
    });
  });

  describe('forceState', () => {
    it('should force state without validation', () => {
      stateMachine.forceState('running');

      expect(stateMachine.getState()).toBe('running');
    });

    it('should not trigger listeners', () => {
      const listener = jest.fn();
      stateMachine.onTransition(listener);

      stateMachine.forceState('running');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should not record in history', () => {
      stateMachine.forceState('running');

      expect(stateMachine.getHistory()).toHaveLength(0);
    });
  });

  describe('onTransition', () => {
    it('should add listener', async () => {
      const listener = jest.fn();

      stateMachine.onTransition(listener);
      await stateMachine.transitionTo('initializing');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', async () => {
      const listener = jest.fn();

      const unsubscribe = stateMachine.onTransition(listener);
      unsubscribe();
      await stateMachine.transitionTo('initializing');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple listeners', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      stateMachine.onTransition(listener1);
      stateMachine.onTransition(listener2);
      await stateMachine.transitionTo('initializing');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    it('should return empty array initially', () => {
      expect(stateMachine.getHistory()).toEqual([]);
    });

    it('should return copy of history', async () => {
      await stateMachine.transitionTo('initializing');

      const history1 = stateMachine.getHistory();
      const history2 = stateMachine.getHistory();

      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
    });

    it('should track multiple transitions', async () => {
      await stateMachine.transitionTo('initializing');
      await stateMachine.transitionTo('loading_plugins');
      await stateMachine.transitionTo('ready');

      const history = stateMachine.getHistory();

      expect(history).toHaveLength(3);
      expect(history[0].to).toBe('initializing');
      expect(history[1].to).toBe('loading_plugins');
      expect(history[2].to).toBe('ready');
    });
  });

  describe('clearHistory', () => {
    it('should clear transition history', async () => {
      await stateMachine.transitionTo('initializing');
      expect(stateMachine.getHistory()).toHaveLength(1);

      stateMachine.clearHistory();

      expect(stateMachine.getHistory()).toHaveLength(0);
    });

    it('should not affect current state', async () => {
      await stateMachine.transitionTo('initializing');
      stateMachine.clearHistory();

      expect(stateMachine.getState()).toBe('initializing');
    });
  });

  describe('isIn', () => {
    it('should return true for current state', () => {
      expect(stateMachine.isIn('uninitialized')).toBe(true);
    });

    it('should return false for other states', () => {
      expect(stateMachine.isIn('running')).toBe(false);
      expect(stateMachine.isIn('ready')).toBe(false);
    });
  });

  describe('isRunning', () => {
    it('should return false initially', () => {
      expect(stateMachine.isRunning()).toBe(false);
    });

    it('should return true when running', async () => {
      await stateMachine.transitionTo('initializing');
      await stateMachine.transitionTo('loading_plugins');
      await stateMachine.transitionTo('ready');
      await stateMachine.transitionTo('running');

      expect(stateMachine.isRunning()).toBe(true);
    });
  });

  describe('isReady', () => {
    it('should return false initially', () => {
      expect(stateMachine.isReady()).toBe(false);
    });

    it('should return true when ready', async () => {
      await stateMachine.transitionTo('initializing');
      await stateMachine.transitionTo('loading_plugins');
      await stateMachine.transitionTo('ready');

      expect(stateMachine.isReady()).toBe(true);
    });

    it('should return true when running', async () => {
      await stateMachine.transitionTo('initializing');
      await stateMachine.transitionTo('loading_plugins');
      await stateMachine.transitionTo('ready');
      await stateMachine.transitionTo('running');

      expect(stateMachine.isReady()).toBe(true);
    });
  });

  describe('isError', () => {
    it('should return false initially', () => {
      expect(stateMachine.isError()).toBe(false);
    });

    it('should return true when in error state', async () => {
      await stateMachine.transitionTo('initializing');
      await stateMachine.transitionTo('error');

      expect(stateMachine.isError()).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset to uninitialized state', async () => {
      await stateMachine.transitionTo('initializing');
      await stateMachine.transitionTo('loading_plugins');

      stateMachine.reset();

      expect(stateMachine.getState()).toBe('uninitialized');
    });

    it('should clear history', async () => {
      await stateMachine.transitionTo('initializing');

      stateMachine.reset();

      expect(stateMachine.getHistory()).toHaveLength(0);
    });

    it('should clear listeners', async () => {
      const listener = jest.fn();
      stateMachine.onTransition(listener);

      stateMachine.reset();
      await stateMachine.transitionTo('initializing');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('full lifecycle', () => {
    it('should complete normal startup sequence', async () => {
      await stateMachine.transitionTo('initializing');
      await stateMachine.transitionTo('loading_plugins');
      await stateMachine.transitionTo('ready');
      await stateMachine.transitionTo('running');

      expect(stateMachine.isRunning()).toBe(true);
    });

    it('should handle error recovery', async () => {
      await stateMachine.transitionTo('initializing');
      await stateMachine.transitionTo('error');
      await stateMachine.transitionTo('initializing');
      await stateMachine.transitionTo('loading_plugins');
      await stateMachine.transitionTo('ready');

      expect(stateMachine.isReady()).toBe(true);
    });

    it('should handle graceful shutdown', async () => {
      await stateMachine.transitionTo('initializing');
      await stateMachine.transitionTo('loading_plugins');
      await stateMachine.transitionTo('ready');
      await stateMachine.transitionTo('running');
      await stateMachine.transitionTo('ready');
      await stateMachine.transitionTo('shutdown');
      await stateMachine.transitionTo('uninitialized');

      expect(stateMachine.getState()).toBe('uninitialized');
    });
  });
});

describe('createStateMachine', () => {
  it('should create a new RuntimeStateMachine instance', () => {
    const machine = createStateMachine();
    expect(machine).toBeInstanceOf(RuntimeStateMachine);
  });
});
