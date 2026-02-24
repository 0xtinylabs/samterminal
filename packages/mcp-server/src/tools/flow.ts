import { getCore, type ToolDefinition } from '../utils.js';

export const flowTools: ToolDefinition[] = [
  {
    name: 'sam_flow_list',
    description: 'List all workflows. Returns flow IDs, names, descriptions, and status.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const core = await getCore();
      const flows = core.flow.getAll();
      return flows.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        nodeCount: f.nodes.length,
        edgeCount: f.edges.length,
      }));
    },
  },
  {
    name: 'sam_flow_get',
    description: 'Get detailed workflow information including all nodes, edges, and configuration.',
    inputSchema: {
      type: 'object',
      properties: {
        flowId: { type: 'string', description: 'Workflow ID' },
      },
      required: ['flowId'],
    },
    handler: async (args) => {
      const core = await getCore();
      return core.flow.get(args.flowId as string);
    },
  },
  {
    name: 'sam_flow_create',
    description: 'Create a custom workflow with specified nodes and edges. Nodes define actions (trigger, action, condition, loop, delay, subflow, output) and edges define the execution flow between them.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Workflow name' },
        description: { type: 'string', description: 'Workflow description' },
        nodes: {
          type: 'array',
          description: 'Array of flow nodes. Each node has: id, type (trigger|action|condition|loop|delay|subflow|output), name, data (type-specific config), position ({x,y}).',
          items: { type: 'object' },
        },
        edges: {
          type: 'array',
          description: 'Array of flow edges connecting nodes. Each edge has: id, source (node ID), target (node ID), type (default|success|failure|conditional), optional sourceHandle and condition.',
          items: { type: 'object' },
        },
      },
      required: ['name', 'nodes', 'edges'],
    },
    handler: async (args) => {
      const core = await getCore();
      return core.flow.create({
        name: args.name as string,
        description: args.description as string | undefined,
        nodes: args.nodes as Array<Record<string, unknown>>,
        edges: args.edges as Array<Record<string, unknown>>,
      } as Parameters<typeof core.flow.create>[0]);
    },
  },
  {
    name: 'sam_flow_create_from_template',
    description: 'Create a workflow from a predefined template. Available templates: simple-action, conditional, error-handling, scheduled. Use sam_flow_templates to see all available templates.',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string', description: 'Template ID (e.g., "simple-action", "conditional", "error-handling", "scheduled")' },
        name: { type: 'string', description: 'Custom name for the new workflow (optional, uses template default if not provided)' },
      },
      required: ['templateId'],
    },
    handler: async (args) => {
      const core = await getCore();
      const { FlowService } = await import('@samterminal/core/flow');
      const flowService = new FlowService(core.flow as Parameters<typeof FlowService.prototype.constructor>[0]);
      return flowService.createFromTemplate(args.templateId as string, args.name as string | undefined);
    },
  },
  {
    name: 'sam_flow_execute',
    description: 'Execute a workflow by ID. Optionally pass input variables that can be referenced by nodes using {{ variable }} syntax.',
    inputSchema: {
      type: 'object',
      properties: {
        flowId: { type: 'string', description: 'Workflow ID to execute' },
        input: { type: 'object', description: 'Optional input variables for the workflow execution' },
      },
      required: ['flowId'],
    },
    handler: async (args) => {
      const core = await getCore();
      const result = await core.flow.execute(
        args.flowId as string,
        args.input as Record<string, unknown> | undefined,
      );
      return {
        executionId: result.executionId,
        status: result.status,
        output: result.nodeResults,
      };
    },
  },
  {
    name: 'sam_flow_status',
    description: 'Get the execution status and result of a running or completed workflow execution.',
    inputSchema: {
      type: 'object',
      properties: {
        executionId: { type: 'string', description: 'Execution ID returned from sam_flow_execute' },
      },
      required: ['executionId'],
    },
    handler: async (args) => {
      const core = await getCore();
      return core.flow.getExecution(args.executionId as string);
    },
  },
  {
    name: 'sam_flow_templates',
    description: 'List all available workflow templates with their descriptions, node types, and categories.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const core = await getCore();
      const { FlowService } = await import('@samterminal/core/flow');
      const flowService = new FlowService(core.flow as Parameters<typeof FlowService.prototype.constructor>[0]);
      return flowService.getTemplates();
    },
  },
];
