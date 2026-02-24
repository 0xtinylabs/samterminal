/**
 * MCP Server -- E2E: Scheduler Tools
 */

const mockScheduler = {
  schedule: jest.fn(), getAll: jest.fn(), enable: jest.fn(),
  disable: jest.fn(), remove: jest.fn(), get: jest.fn(), start: jest.fn(), stop: jest.fn(),
};
const mockExecuteAction = jest.fn();

jest.unstable_mockModule('@grpc/grpc-js', () => ({ credentials: { createInsecure: jest.fn() }, loadPackageDefinition: jest.fn(() => ({})) }));
jest.unstable_mockModule('@grpc/proto-loader', () => ({ loadSync: jest.fn() }));
jest.unstable_mockModule('@samterminal/core', () => ({
  createCore: jest.fn(() => ({
    initialize: jest.fn().mockResolvedValue(undefined), start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    runtime: { getData: jest.fn(), executeAction: mockExecuteAction, getScheduler: () => mockScheduler },
  })),
}));

const { setupTestContext, callTool } = await import('./helpers.js');
type TestContext = Awaited<ReturnType<typeof setupTestContext>>;

describe('Scheduler Tools E2E', () => {
  let ctx: TestContext;
  beforeAll(async () => { ctx = await setupTestContext(); });
  afterAll(async () => { await ctx.cleanup(); });

  describe('sam_schedule_create', () => {
    it('should create a cron-based scheduled task', async () => {
      mockScheduler.schedule.mockReturnValue({
        id: 'task-1', name: 'Hourly Price Check', enabled: true,
        cron: '0 * * * *', interval: undefined, nextRun: new Date('2026-02-16T01:00:00Z'),
      });

      const { result, isError } = await callTool(ctx.client, 'sam_schedule_create', {
        name: 'Hourly Price Check', cron: '0 * * * *', action: 'tokendata:getPrice', actionInput: { tokenAddress: '0xeth' },
      });
      expect(isError).toBe(false);
      const data = result as { id: string; cron: string; enabled: boolean };
      expect(data.id).toBe('task-1');
      expect(data.cron).toBe('0 * * * *');
      expect(data.enabled).toBe(true);
    });

    it('should create an interval-based task', async () => {
      mockScheduler.schedule.mockReturnValue({ id: 'task-2', name: 'Rapid Monitor', enabled: true, interval: 30000, nextRun: new Date() });

      const { result } = await callTool(ctx.client, 'sam_schedule_create', { name: 'Rapid Monitor', interval: 30000, action: 'tokendata:getPrice', immediate: true });
      expect((result as { interval: number }).interval).toBe(30000);
    });

    it('should pass schedule options to scheduler', async () => {
      let capturedOpts: Record<string, unknown> = {};
      mockScheduler.schedule.mockImplementation((_fn: unknown, opts: Record<string, unknown>) => { capturedOpts = opts; return { id: 'task-3', name: opts.name, enabled: true }; });

      await callTool(ctx.client, 'sam_schedule_create', { name: 'One-time Task', cron: '@daily', action: 'notification:send', runOnce: true, immediate: false });
      expect(capturedOpts.runOnce).toBe(true);
      expect(capturedOpts.cron).toBe('@daily');
    });
  });

  describe('sam_schedule_list', () => {
    it('should return all scheduled tasks', async () => {
      mockScheduler.getAll.mockReturnValue([
        { id: 'task-1', name: 'Price Check', enabled: true, cron: '0 * * * *', lastRun: new Date(), nextRun: new Date(), runCount: 24, errorCount: 0 },
        { id: 'task-2', name: 'DCA Bot', enabled: false, cron: '@daily', lastRun: null, nextRun: null, runCount: 0, errorCount: 0 },
      ]);

      const { result } = await callTool(ctx.client, 'sam_schedule_list', {});
      const data = result as Array<{ id: string; runCount: number }>;
      expect(data).toHaveLength(2);
      expect(data[0].runCount).toBe(24);
    });

    it('should return empty array when no tasks exist', async () => {
      mockScheduler.getAll.mockReturnValue([]);
      const { result } = await callTool(ctx.client, 'sam_schedule_list', {});
      expect(result).toEqual([]);
    });
  });

  describe('sam_schedule_toggle', () => {
    it('should enable a disabled task', async () => {
      mockScheduler.enable.mockReturnValue(true);
      const { result } = await callTool(ctx.client, 'sam_schedule_toggle', { taskId: 'task-2', enabled: true });
      expect((result as { success: boolean; enabled: boolean }).success).toBe(true);
      expect((result as { enabled: boolean }).enabled).toBe(true);
    });

    it('should disable an active task', async () => {
      mockScheduler.disable.mockReturnValue(true);
      const { result } = await callTool(ctx.client, 'sam_schedule_toggle', { taskId: 'task-1', enabled: false });
      expect((result as { success: boolean }).success).toBe(true);
    });

    it('should return false for non-existent task', async () => {
      mockScheduler.enable.mockReturnValue(false);
      const { result } = await callTool(ctx.client, 'sam_schedule_toggle', { taskId: 'non-existent', enabled: true });
      expect((result as { success: boolean }).success).toBe(false);
    });
  });

  describe('sam_schedule_delete', () => {
    it('should delete a scheduled task', async () => {
      mockScheduler.remove.mockReturnValue(true);
      const { result } = await callTool(ctx.client, 'sam_schedule_delete', { taskId: 'task-1' });
      expect((result as { success: boolean }).success).toBe(true);
    });

    it('should return false for non-existent task', async () => {
      mockScheduler.remove.mockReturnValue(false);
      const { result } = await callTool(ctx.client, 'sam_schedule_delete', { taskId: 'ghost-task' });
      expect((result as { success: boolean }).success).toBe(false);
    });
  });
});
