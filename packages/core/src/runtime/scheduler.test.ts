/**
 * Scheduler tests
 */


import { Scheduler, createScheduler } from './scheduler.js';

describe('Scheduler', () => {
  let scheduler: Scheduler;

  beforeEach(() => {
    jest.useFakeTimers();
    scheduler = new Scheduler();
  });

  afterEach(() => {
    scheduler.clear();
    jest.useRealTimers();
  });

  describe('schedule', () => {
    it('should throw if no interval or cron', () => {
      expect(() => scheduler.schedule(jest.fn(), {})).toThrow(
        'Either interval or cron must be specified'
      );
    });

    it('should schedule task with interval', () => {
      const task = scheduler.schedule(jest.fn(), { interval: 1000 });

      expect(task.id).toBeDefined();
      expect(task.interval).toBe(1000);
      expect(task.enabled).toBe(true);
    });

    it('should schedule task with cron', () => {
      const task = scheduler.schedule(jest.fn(), { cron: '@hourly' });

      expect(task.cron).toBe('@hourly');
    });

    it('should use provided name', () => {
      const task = scheduler.schedule(jest.fn(), {
        name: 'My Task',
        interval: 1000,
      });

      expect(task.name).toBe('My Task');
    });

    it('should start task if scheduler is running', async () => {
      scheduler.start();
      const execute = jest.fn().mockResolvedValue(undefined);

      scheduler.schedule(execute, { interval: 100 });

      await jest.advanceTimersByTimeAsync(100);
      expect(execute).toHaveBeenCalled();
    });

    it('should run immediately if configured', async () => {
      scheduler.start();
      const execute = jest.fn().mockResolvedValue(undefined);

      scheduler.schedule(execute, { interval: 1000, immediate: true });

      // Need to flush promises since the execute is async
      await jest.advanceTimersByTimeAsync(0);
      expect(execute).toHaveBeenCalled();
    });
  });

  describe('start', () => {
    it('should start scheduler', () => {
      scheduler.start();
      expect(scheduler.isRunning()).toBe(true);
    });

    it('should not restart if already running', () => {
      scheduler.start();
      scheduler.start();
      expect(scheduler.isRunning()).toBe(true);
    });

    it('should start all enabled tasks', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);
      scheduler.schedule(execute, { interval: 100 });

      scheduler.start();
      await jest.advanceTimersByTimeAsync(100);

      expect(execute).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop scheduler', () => {
      scheduler.start();
      scheduler.stop();

      expect(scheduler.isRunning()).toBe(false);
    });

    it('should stop all tasks', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);
      scheduler.schedule(execute, { interval: 100 });
      scheduler.start();

      // First, advance time to let the task run once
      await jest.advanceTimersByTimeAsync(100);
      expect(execute).toHaveBeenCalledTimes(1);

      scheduler.stop();
      await jest.advanceTimersByTimeAsync(200);

      // Should not be called again after stop
      expect(execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('enable', () => {
    it('should enable disabled task', () => {
      const task = scheduler.schedule(jest.fn(), { interval: 1000 });
      scheduler.disable(task.id);

      const result = scheduler.enable(task.id);

      expect(result).toBe(true);
      expect(scheduler.get(task.id)?.enabled).toBe(true);
    });

    it('should return false for unknown task', () => {
      expect(scheduler.enable('unknown')).toBe(false);
    });
  });

  describe('disable', () => {
    it('should disable task', () => {
      const task = scheduler.schedule(jest.fn(), { interval: 1000 });

      const result = scheduler.disable(task.id);

      expect(result).toBe(true);
      expect(scheduler.get(task.id)?.enabled).toBe(false);
    });

    it('should stop timer', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);
      scheduler.schedule(execute, { interval: 100 });
      scheduler.start();

      await jest.advanceTimersByTimeAsync(100);
      expect(execute).toHaveBeenCalledTimes(1);

      scheduler.disable(scheduler.getAll()[0].id);
      await jest.advanceTimersByTimeAsync(100);

      expect(execute).toHaveBeenCalledTimes(1);
    });

    it('should return false for unknown task', () => {
      expect(scheduler.disable('unknown')).toBe(false);
    });
  });

  describe('remove', () => {
    it('should remove task', () => {
      const task = scheduler.schedule(jest.fn(), { interval: 1000 });

      const result = scheduler.remove(task.id);

      expect(result).toBe(true);
      expect(scheduler.get(task.id)).toBeUndefined();
    });

    it('should return false for unknown task', () => {
      expect(scheduler.remove('unknown')).toBe(false);
    });
  });

  describe('get', () => {
    it('should return task by ID', () => {
      const task = scheduler.schedule(jest.fn(), { interval: 1000 });
      expect(scheduler.get(task.id)).toEqual(task);
    });

    it('should return undefined for unknown ID', () => {
      expect(scheduler.get('unknown')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all tasks', () => {
      scheduler.schedule(jest.fn(), { interval: 1000 });
      scheduler.schedule(jest.fn(), { interval: 2000 });

      expect(scheduler.getAll()).toHaveLength(2);
    });
  });

  describe('runNow', () => {
    it('should run task immediately', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);
      const task = scheduler.schedule(execute, { interval: 10000 });

      await scheduler.runNow(task.id);

      expect(execute).toHaveBeenCalled();
    });

    it('should throw for unknown task', async () => {
      await expect(scheduler.runNow('unknown')).rejects.toThrow('Task not found');
    });
  });

  describe('task execution', () => {
    it('should track run count', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);
      const task = scheduler.schedule(execute, { interval: 100 });
      scheduler.start();

      await jest.advanceTimersByTimeAsync(300);

      expect(scheduler.get(task.id)?.runCount).toBe(3);
    });

    it('should track last run time', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);
      const task = scheduler.schedule(execute, { interval: 100 });
      scheduler.start();

      await jest.advanceTimersByTimeAsync(100);

      expect(scheduler.get(task.id)?.lastRun).toBeDefined();
    });

    it('should track error count', async () => {
      const execute = jest.fn().mockRejectedValue(new Error('Fail'));
      const task = scheduler.schedule(execute, { interval: 100 });
      scheduler.start();

      await jest.advanceTimersByTimeAsync(100);

      expect(scheduler.get(task.id)?.errorCount).toBe(1);
    });

    it('should disable runOnce task after execution', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);
      const task = scheduler.schedule(execute, {
        interval: 100,
        runOnce: true,
      });
      scheduler.start();

      await jest.advanceTimersByTimeAsync(100);

      expect(scheduler.get(task.id)?.enabled).toBe(false);
    });
  });

  describe('cron parsing', () => {
    it('should parse @hourly', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);
      scheduler.schedule(execute, { cron: '@hourly' });
      scheduler.start();

      await jest.advanceTimersByTimeAsync(60 * 60 * 1000); // 1 hour

      expect(execute).toHaveBeenCalled();
    });

    it('should parse @daily', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);
      scheduler.schedule(execute, { cron: '@daily' });
      scheduler.start();

      await jest.advanceTimersByTimeAsync(24 * 60 * 60 * 1000); // 1 day

      expect(execute).toHaveBeenCalled();
    });

    it('should parse */5 minute interval', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);
      scheduler.schedule(execute, { cron: '*/5 * * * *' });
      scheduler.start();

      await jest.advanceTimersByTimeAsync(5 * 60 * 1000); // 5 minutes

      expect(execute).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear all tasks', () => {
      scheduler.schedule(jest.fn(), { interval: 1000 });
      scheduler.schedule(jest.fn(), { interval: 2000 });
      scheduler.start();

      scheduler.clear();

      expect(scheduler.getAll()).toHaveLength(0);
      expect(scheduler.isRunning()).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return stats', () => {
      scheduler.schedule(jest.fn(), { interval: 1000 });
      scheduler.schedule(jest.fn(), { interval: 2000 });
      scheduler.disable(scheduler.getAll()[0].id);

      const stats = scheduler.getStats();

      expect(stats.total).toBe(2);
      expect(stats.enabled).toBe(1);
    });

    it('should track total runs and errors', async () => {
      const success = jest.fn().mockResolvedValue(undefined);
      const fail = jest.fn().mockRejectedValue(new Error('Fail'));

      scheduler.schedule(success, { interval: 100 });
      scheduler.schedule(fail, { interval: 100 });
      scheduler.start();

      await jest.advanceTimersByTimeAsync(200);

      const stats = scheduler.getStats();
      // runCount only increments on successful runs
      // 2 successful runs (at 100ms and 200ms) for the success task
      expect(stats.totalRuns).toBe(2);
      // 2 failed runs (at 100ms and 200ms) for the fail task
      expect(stats.totalErrors).toBe(2);
    });
  });
});

describe('createScheduler', () => {
  it('should create a new Scheduler', () => {
    const scheduler = createScheduler();
    expect(scheduler).toBeInstanceOf(Scheduler);
  });
});
