import { getCore, type ToolDefinition } from '../utils.js';

export const pluginTools: ToolDefinition[] = [
  {
    name: 'sam_plugin_list',
    description: 'List all installed plugins with their names, versions, and capabilities (actions, providers, evaluators).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const core = await getCore();
      const plugins = core.plugins.getAll();
      return plugins.map((p) => ({
        name: p.name,
        version: p.version,
        description: p.description,
        actions: p.actions?.map((a) => a.name) ?? [],
        providers: p.providers?.map((pr) => pr.name) ?? [],
      }));
    },
  },
  {
    name: 'sam_plugin_actions',
    description: 'List all available actions across all plugins. Actions are executable operations that can be used in workflows and scheduled tasks.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const core = await getCore();
      const actions = core.services.getAllActions();
      const result: Array<{ name: string; description?: string; plugin?: string }> = [];
      for (const [name, action] of actions) {
        result.push({
          name,
          description: (action as Record<string, unknown>).description as string | undefined,
          plugin: (action as Record<string, unknown>).pluginName as string | undefined,
        });
      }
      return result;
    },
  },
];
