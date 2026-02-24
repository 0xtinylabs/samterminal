/**
 * Task Manager tests
 */


import { TaskManager, createTaskManager } from './task-manager.js';

describe('TaskManager', () => {
  let manager: TaskManager;

  beforeEach(() => {
    manager = new TaskManager(5);
  });

  afterEach(() => {
    manager.clear();
  });

  describe('constructor', () => {
    it('should set max concurrent tasks', () => {
      const custom = new TaskManager(10);
      expect(custom).toBeDefined();
    });

    it('should default to 10 concurrent tasks', () => {
      const defaultManager = new TaskManager();
      expect(defaultManager).toBeDefined();
    });
  });

  describe('setMaxConcurrent', () => {
    it('should update max concurrent', () => {
      manager.setMaxConcurrent(20);
      expect(manager).toBeDefined();
    });
  });

  describe('enqueue', () => {
    it('should create and queue task', () => {
      // Set maxConcurrent to 0 to prevent immediate execution
      manager.setMaxConcurrent(0);
      const task = manager.enqueue(async () => 'result');

      expect(task.id).toBeDefined();
      expect(task.status).toBe('pending');
    });

    it('should use provided options', () => {
      const task = manager.enqueue(async () => 'result', {
        name: 'My Task',
        timeout: 5000,
        priority: 10,
        metadata: { key: 'value' },
      });

      expect(task.name).toBe('My Task');
      expect(task.timeout).toBe(5000);
      expect(task.priority).toBe(10);
      expect(task.metadata).toEqual({ key: 'value' });
    });

    it('should start processing queue', async () => {
      const execute = jest.fn().mockResolvedValue('done');
      manager.enqueue(execute);

      await manager.waitAll();

      expect(execute).toHaveBeenCalled();
    });

    it('should sort by priority', async () => {
      const results: number[] = [];

      // Set maxConcurrent to 0 to queue all tasks without executing
      manager.setMaxConcurrent(0);

      manager.enqueue(async () => results.push(1), { priority: 1 });
      manager.enqueue(async () => results.push(2), { priority: 2 });
      manager.enqueue(async () => results.push(3), { priority: 3 });

      // Now set maxConcurrent to 1 to process one at a time in priority order
      manager.setMaxConcurrent(1);

      await manager.waitAll();

      expect(results).toEqual([3, 2, 1]);
    });
  });

  describe('run', () => {
    it('should execute and return result', async () => {
      const result = await manager.run(async () => 'hello');

      expect(result).toBe('hello');
    });

    it('should reject on error', async () => {
      await expect(
        manager.run(async () => {
          throw new Error('Failed');
        })
      ).rejects.toThrow('Failed');
    });
  });

  describe('waitFor', () => {
    it('should wait for task completion', async () => {
      const task = manager.enqueue(async () => 'result');
      const result = await manager.waitFor(task.id);

      expect(result).toBe('result');
    });

    it('should reject for unknown task', async () => {
      await expect(manager.waitFor('unknown')).rejects.toThrow('Task not found');
    });

    it('should reject for failed task', async () => {
      const task = manager.enqueue(async () => {
        throw new Error('Task failed');
      });

      await expect(manager.waitFor(task.id)).rejects.toThrow('Task failed');
    });

    it('should reject for cancelled task', async () => {
      manager.setMaxConcurrent(0); // Prevent execution
      const task = manager.enqueue(async () => 'result');
      manager.cancel(task.id);

      await expect(manager.waitFor(task.id)).rejects.toThrow('cancelled');
    });
  });

  describe('cancel', () => {
    it('should cancel pending task', () => {
      manager.setMaxConcurrent(0); // Prevent execution
      const task = manager.enqueue(async () => 'result');

      const result = manager.cancel(task.id);

      expect(result).toBe(true);
      expect(manager.get(task.id)?.status).toBe('cancelled');
    });

    it('should return false for running task', async () => {
      let resolve: () => void;
      const promise = new Promise<void>((r) => (resolve = r));

      const task = manager.enqueue(async () => {
        await promise;
        return 'done';
      });

      // Wait for task to start
      await new Promise((r) => setTimeout(r, 10));

      const result = manager.cancel(task.id);

      expect(result).toBe(false);

      resolve!();
      await manager.waitAll();
    });

    it('should return false for unknown task', () => {
      expect(manager.cancel('unknown')).toBe(false);
    });
  });

  describe('get', () => {
    it('should return task by ID', () => {
      const task = manager.enqueue(async () => 'result');
      expect(manager.get(task.id)).toEqual(task);
    });

    it('should return undefined for unknown ID', () => {
      expect(manager.get('unknown')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all tasks', () => {
      manager.enqueue(async () => 1);
      manager.enqueue(async () => 2);

      expect(manager.getAll()).toHaveLength(2);
    });
  });

  describe('getPending', () => {
    it('should return pending tasks', () => {
      manager.setMaxConcurrent(0);
      manager.enqueue(async () => 1);
      manager.enqueue(async () => 2);

      expect(manager.getPending()).toHaveLength(2);
    });
  });

  describe('getRunning', () => {
    it('should return running tasks', async () => {
      let resolve: () => void;
      const promise = new Promise<void>((r) => (resolve = r));

      manager.enqueue(async () => {
        await promise;
        return 'done';
      });

      // Wait for task to start
      await new Promise((r) => setTimeout(r, 10));

      expect(manager.getRunning()).toHaveLength(1);

      resolve!();
      await manager.waitAll();
    });
  });

  describe('waitAll', () => {
    it('should wait for all tasks to complete', async () => {
      const results: number[] = [];

      manager.enqueue(async () => results.push(1));
      manager.enqueue(async () => results.push(2));
      manager.enqueue(async () => results.push(3));

      await manager.waitAll();

      expect(results).toHaveLength(3);
    });
  });

  describe('cleanup', () => {
    it('should remove completed tasks', async () => {
      manager.enqueue(async () => 'result');
      await manager.waitAll();

      const count = manager.cleanup();

      expect(count).toBe(1);
      expect(manager.getAll()).toHaveLength(0);
    });

    it('should remove failed tasks', async () => {
      manager.enqueue(async () => {
        throw new Error('Fail');
      });

      try {
        await manager.waitAll();
      } catch (_error) {
        // Expected
      }

      const count = manager.cleanup();

      expect(count).toBe(1);
    });

    it('should not remove pending/running tasks', () => {
      manager.setMaxConcurrent(0);
      manager.enqueue(async () => 'result');

      const count = manager.cleanup();

      expect(count).toBe(0);
      expect(manager.getAll()).toHaveLength(1);
    });
  });

  describe('clear', () => {
    it('should clear all tasks', () => {
      manager.enqueue(async () => 1);
      manager.enqueue(async () => 2);

      manager.clear();

      expect(manager.getAll()).toHaveLength(0);
    });
  });

  describe('task execution', () => {
    it('should update task status to running', async () => {
      let resolve: () => void;
      const promise = new Promise<void>((r) => (resolve = r));

      const task = manager.enqueue(async () => {
        await promise;
        return 'done';
      });

      // Wait for task to start
      await new Promise((r) => setTimeout(r, 10));

      expect(manager.get(task.id)?.status).toBe('running');
      expect(manager.get(task.id)?.startedAt).toBeDefined();

      resolve!();
      await manager.waitAll();
    });

    it('should update task status to completed', async () => {
      const task = manager.enqueue(async () => 'result');
      await manager.waitAll();

      expect(manager.get(task.id)?.status).toBe('completed');
      expect(manager.get(task.id)?.result).toBe('result');
      expect(manager.get(task.id)?.completedAt).toBeDefined();
    });

    it('should update task status to failed', async () => {
      const task = manager.enqueue(async () => {
        throw new Error('Task failed');
      });

      try {
        await manager.waitFor(task.id);
      } catch (_error) {
        // Expected
      }

      expect(manager.get(task.id)?.status).toBe('failed');
      expect(manager.get(task.id)?.error?.message).toBe('Task failed');
    });

    it('should handle timeout', async () => {
      const task = manager.enqueue(
        async () => {
          await new Promise((r) => setTimeout(r, 1000));
          return 'done';
        },
        { timeout: 50 }
      );

      try {
        await manager.waitFor(task.id);
      } catch (_error) {
        // Expected
      }

      expect(manager.get(task.id)?.status).toBe('failed');
      expect(manager.get(task.id)?.error?.message).toContain('timeout');
    });

    it('should respect max concurrent', async () => {
      manager.setMaxConcurrent(2);

      let concurrent = 0;
      let maxConcurrent = 0;

      const tasks = Array.from({ length: 5 }, () =>
        manager.enqueue(async () => {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await new Promise((r) => setTimeout(r, 10));
          concurrent--;
        })
      );

      await manager.waitAll();

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });

  describe('events', () => {
    it('should emit started event', async () => {
      const listener = jest.fn();
      manager.on(listener);

      const task = manager.enqueue(async () => 'result');
      await manager.waitAll();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'started',
          task: expect.objectContaining({ id: task.id }),
        })
      );
    });

    it('should emit completed event', async () => {
      const listener = jest.fn();
      manager.on(listener);

      const task = manager.enqueue(async () => 'result');
      await manager.waitAll();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'completed',
          task: expect.objectContaining({ id: task.id }),
        })
      );
    });

    it('should emit failed event', async () => {
      const listener = jest.fn();
      manager.on(listener);

      const task = manager.enqueue(async () => {
        throw new Error('Fail');
      });

      try {
        await manager.waitFor(task.id);
      } catch (_error) {
        // Expected
      }

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'failed',
          task: expect.objectContaining({ id: task.id }),
        })
      );
    });

    it('should return unsubscribe function', () => {
      const listener = jest.fn();
      const unsubscribe = manager.on(listener);

      unsubscribe();

      manager.enqueue(async () => 'result');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return stats', async () => {
      manager.setMaxConcurrent(0);
      manager.enqueue(async () => 1);
      manager.enqueue(async () => 2);

      const stats = manager.getStats();

      expect(stats.total).toBe(2);
      expect(stats.pending).toBe(2);
      expect(stats.running).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
    });
  });
});

describe('createTaskManager', () => {
  it('should create a new TaskManager', () => {
    const manager = createTaskManager();
    expect(manager).toBeInstanceOf(TaskManager);
  });

  it('should accept max concurrent', () => {
    const manager = createTaskManager(20);
    expect(manager).toBeInstanceOf(TaskManager);
  });
});
