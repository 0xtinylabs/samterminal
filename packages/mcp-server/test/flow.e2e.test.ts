/**
 * MCP Server -- E2E: Flow/Workflow Tools
 */

const mockFlowEngine = {
  getAll: jest.fn(),
  get: jest.fn(),
  create: jest.fn(),
  execute: jest.fn(),
  getExecution: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  validate: jest.fn(),
};

jest.unstable_mockModule('@grpc/grpc-js', () => ({
  credentials: { createInsecure: jest.fn() },
  loadPackageDefinition: jest.fn(() => ({})),
}));
jest.unstable_mockModule('@grpc/proto-loader', () => ({ loadSync: jest.fn() }));

jest.unstable_mockModule('@samterminal/core', () => ({
  createCore: jest.fn(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    flow: mockFlowEngine,
    runtime: { getData: jest.fn(), executeAction: jest.fn() },
  })),
}));

jest.unstable_mockModule('@samterminal/core/flow', () => ({
  FlowService: jest.fn().mockImplementation(() => ({
    createFromTemplate: jest.fn().mockReturnValue({ id: 'tpl-flow-1', name: 'From Template', nodes: [], edges: [] }),
    getTemplates: jest.fn().mockReturnValue([
      { id: 'simple-action', name: 'Simple Action', description: 'Basic trigger -> action -> output', category: 'basic' },
      { id: 'conditional', name: 'Conditional', description: 'Trigger -> condition -> branches', category: 'basic' },
      { id: 'error-handling', name: 'Error Handling', description: 'Action with error handler', category: 'advanced' },
      { id: 'scheduled', name: 'Scheduled', description: 'Schedule-triggered flow', category: 'automation' },
    ]),
  })),
}));

const { setupTestContext, callTool } = await import('./helpers.js');
type TestContext = Awaited<ReturnType<typeof setupTestContext>>;

describe('Flow Tools E2E', () => {
  let ctx: TestContext;

  beforeAll(async () => { ctx = await setupTestContext(); });
  afterAll(async () => { await ctx.cleanup(); });

  describe('sam_flow_list', () => {
    it('should return all flows with summary data', async () => {
      mockFlowEngine.getAll.mockReturnValue([
        { id: 'flow-1', name: 'Price Alert', description: 'ETH monitor', nodes: [1, 2, 3], edges: [1, 2] },
        { id: 'flow-2', name: 'DCA Bot', description: 'Daily buy', nodes: [1, 2], edges: [1] },
      ]);

      const { result, isError } = await callTool(ctx.client, 'sam_flow_list', {});
      expect(isError).toBe(false);
      const data = result as Array<{ id: string; nodeCount: number; edgeCount: number }>;
      expect(data).toHaveLength(2);
      expect(data[0].nodeCount).toBe(3);
      expect(data[0].edgeCount).toBe(2);
    });

    it('should return empty array when no flows exist', async () => {
      mockFlowEngine.getAll.mockReturnValue([]);
      const { result } = await callTool(ctx.client, 'sam_flow_list', {});
      expect(result).toEqual([]);
    });
  });

  describe('sam_flow_get', () => {
    it('should return full flow details', async () => {
      mockFlowEngine.get.mockReturnValue({
        id: 'flow-1', name: 'Price Alert',
        nodes: [{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }],
        edges: [{ id: 'e1' }, { id: 'e2' }],
      });

      const { result, isError } = await callTool(ctx.client, 'sam_flow_get', { flowId: 'flow-1' });
      expect(isError).toBe(false);
      expect((result as { nodes: unknown[] }).nodes).toHaveLength(3);
    });

    it('should return null for non-existent flow', async () => {
      mockFlowEngine.get.mockReturnValue(undefined);
      const { result, isError } = await callTool(ctx.client, 'sam_flow_get', { flowId: 'non-existent' });
      expect(isError).toBe(false);
      expect(result).toBeNull();
    });
  });

  describe('sam_flow_create', () => {
    it('should create a custom workflow', async () => {
      mockFlowEngine.create.mockReturnValue({ id: 'new-flow-1', name: 'Custom Alert', nodes: [], edges: [] });

      const { result, isError } = await callTool(ctx.client, 'sam_flow_create', {
        name: 'Custom Alert', description: 'My custom alert',
        nodes: [{ id: 'n1', type: 'trigger', name: 'Manual', data: {}, position: { x: 0, y: 0 } }],
        edges: [{ id: 'e1', source: 'n1', target: 'n2', type: 'default' }],
      });
      expect(isError).toBe(false);
      expect((result as { id: string }).id).toBe('new-flow-1');
    });
  });

  describe('sam_flow_create_from_template', () => {
    it('should create a flow from template', async () => {
      const { result, isError } = await callTool(ctx.client, 'sam_flow_create_from_template', {
        templateId: 'simple-action', name: 'My Simple Flow',
      });
      expect(isError).toBe(false);
      expect((result as { id: string }).id).toBe('tpl-flow-1');
    });
  });

  describe('sam_flow_execute', () => {
    it('should execute a flow and return execution context', async () => {
      mockFlowEngine.execute.mockResolvedValue({ executionId: 'exec-1', status: 'completed', nodeResults: { triggered: true } });

      const { result, isError } = await callTool(ctx.client, 'sam_flow_execute', { flowId: 'flow-1', input: { tokenAddress: '0xeth' } });
      expect(isError).toBe(false);
      const data = result as { executionId: string; status: string };
      expect(data.executionId).toBe('exec-1');
      expect(data.status).toBe('completed');
    });

    it('should handle execution failure', async () => {
      mockFlowEngine.execute.mockRejectedValue(new Error('Flow validation failed: no trigger node'));

      const { result, isError } = await callTool(ctx.client, 'sam_flow_execute', { flowId: 'invalid-flow' });
      expect(isError).toBe(true);
      expect((result as Record<string, string>).error).toContain('no trigger node');
    });
  });

  describe('sam_flow_status', () => {
    it('should return execution status', async () => {
      mockFlowEngine.getExecution.mockReturnValue({ id: 'exec-1', status: 'running', progress: 0.5 });

      const { result } = await callTool(ctx.client, 'sam_flow_status', { executionId: 'exec-1' });
      expect((result as { status: string }).status).toBe('running');
    });
  });

  describe('sam_flow_templates', () => {
    it('should return all available templates', async () => {
      const { result, isError } = await callTool(ctx.client, 'sam_flow_templates', {});
      expect(isError).toBe(false);
      const data = result as Array<{ id: string }>;
      expect(data).toHaveLength(4);
      expect(data.map((t) => t.id)).toEqual(
        expect.arrayContaining(['simple-action', 'conditional', 'error-handling', 'scheduled']),
      );
    });
  });

  describe('Flow Lifecycle (template -> execute -> status)', () => {
    it('should create from template, execute, and check status', async () => {
      const create = await callTool(ctx.client, 'sam_flow_create_from_template', { templateId: 'scheduled', name: 'Hourly Check' });
      expect(create.isError).toBe(false);

      mockFlowEngine.execute.mockResolvedValue({ id: 'exec-lc-1', status: 'completed', output: {} });
      const execute = await callTool(ctx.client, 'sam_flow_execute', { flowId: (create.result as { id: string }).id });
      expect(execute.isError).toBe(false);

      mockFlowEngine.getExecution.mockReturnValue({ id: 'exec-lc-1', status: 'completed' });
      const status = await callTool(ctx.client, 'sam_flow_status', { executionId: (execute.result as { executionId: string }).executionId });
      expect((status.result as { status: string }).status).toBe('completed');
    });
  });
});
