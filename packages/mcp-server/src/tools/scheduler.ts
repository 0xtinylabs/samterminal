import { getCore, type ToolDefinition } from '../utils.js';

export const schedulerTools: ToolDefinition[] = [
  {
    name: 'sam_schedule_create',
    description: 'Create a scheduled task that runs on a cron schedule or at fixed intervals. Use cron for time-based patterns (e.g., "0 * * * *" for hourly) or interval for millisecond-based repeating. Presets: @yearly, @monthly, @weekly, @daily, @hourly, @minutely.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Task name for identification' },
        cron: { type: 'string', description: 'Cron expression (e.g., "0 * * * *" for hourly, "@daily" for daily). Use this OR interval, not both.' },
        interval: { type: 'number', description: 'Interval in milliseconds between executions. Use this OR cron, not both.' },
        action: { type: 'string', description: 'Action name to execute (e.g., "tokendata:getPrice")' },
        actionInput: { type: 'object', description: 'Input parameters for the action' },
        runOnce: { type: 'boolean', description: 'Run only once then auto-disable (default: false)' },
        immediate: { type: 'boolean', description: 'Run immediately on creation (default: false)' },
      },
      required: ['name', 'action'],
    },
    handler: async (args) => {
      const core = await getCore();
      const scheduler = core.runtime.getScheduler();
      const actionName = args.action as string;
      const actionInput = args.actionInput as Record<string, unknown> | undefined;

      const task = scheduler.schedule(
        async () => {
          await core.runtime.executeAction(actionName, actionInput ?? {});
        },
        {
          name: args.name as string,
          cron: args.cron as string | undefined,
          interval: args.interval as number | undefined,
          runOnce: args.runOnce as boolean | undefined,
          immediate: args.immediate as boolean | undefined,
        },
      );

      return {
        id: task.id,
        name: task.name,
        enabled: task.enabled,
        cron: task.cron,
        interval: task.interval,
        nextRun: task.nextRun,
      };
    },
  },
  {
    name: 'sam_schedule_list',
    description: 'List all scheduled tasks with their status, schedule, run count, and error count.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const core = await getCore();
      const scheduler = core.runtime.getScheduler();
      const tasks = scheduler.getAll();
      return tasks.map((t) => ({
        id: t.id,
        name: t.name,
        enabled: t.enabled,
        cron: t.cron,
        interval: t.interval,
        lastRun: t.lastRun,
        nextRun: t.nextRun,
        runCount: t.runCount,
        errorCount: t.errorCount,
      }));
    },
  },
  {
    name: 'sam_schedule_toggle',
    description: 'Enable or disable a scheduled task. Disabled tasks will not execute until re-enabled.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Scheduled task ID' },
        enabled: { type: 'boolean', description: 'true to enable, false to disable' },
      },
      required: ['taskId', 'enabled'],
    },
    handler: async (args) => {
      const core = await getCore();
      const scheduler = core.runtime.getScheduler();
      const success = args.enabled
        ? scheduler.enable(args.taskId as string)
        : scheduler.disable(args.taskId as string);
      return { success, taskId: args.taskId, enabled: args.enabled };
    },
  },
  {
    name: 'sam_schedule_delete',
    description: 'Delete a scheduled task permanently. The task will be stopped and removed.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Scheduled task ID to delete' },
      },
      required: ['taskId'],
    },
    handler: async (args) => {
      const core = await getCore();
      const scheduler = core.runtime.getScheduler();
      const success = scheduler.remove(args.taskId as string);
      return { success, taskId: args.taskId };
    },
  },
];
