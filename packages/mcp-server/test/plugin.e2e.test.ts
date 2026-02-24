/**
 * MCP Server -- E2E: Plugin Tools
 */

const mockPlugins = { getAll: jest.fn(), get: jest.fn(), has: jest.fn(), register: jest.fn(), load: jest.fn(), unload: jest.fn(), getLoadOrder: jest.fn() };
const mockServices = {
  getAllActions: jest.fn(), getAllProviders: jest.fn(), getAllEvaluators: jest.fn(),
  registerAction: jest.fn(), registerProvider: jest.fn(), registerEvaluator: jest.fn(),
  getAction: jest.fn(), getProvider: jest.fn(), getEvaluator: jest.fn(), unregisterPlugin: jest.fn(),
};

jest.unstable_mockModule('@grpc/grpc-js', () => ({ credentials: { createInsecure: jest.fn() }, loadPackageDefinition: jest.fn(() => ({})) }));
jest.unstable_mockModule('@grpc/proto-loader', () => ({ loadSync: jest.fn() }));
jest.unstable_mockModule('@samterminal/core', () => ({
  createCore: jest.fn(() => ({
    initialize: jest.fn().mockResolvedValue(undefined), start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined), plugins: mockPlugins, services: mockServices,
    runtime: { getData: jest.fn(), executeAction: jest.fn() },
  })),
}));

const { setupTestContext, callTool } = await import('./helpers.js');
type TestContext = Awaited<ReturnType<typeof setupTestContext>>;

describe('Plugin Tools E2E', () => {
  let ctx: TestContext;
  beforeAll(async () => { ctx = await setupTestContext(); });
  afterAll(async () => { await ctx.cleanup(); });

  describe('sam_plugin_list', () => {
    it('should return all installed plugins', async () => {
      mockPlugins.getAll.mockReturnValue([
        { name: 'tokendata', version: '1.0.0', description: 'Token data', actions: [{ name: 'tokendata:getPrice' }], providers: [{ name: 'tokendata:price' }] },
        { name: 'walletdata', version: '1.0.0', description: 'Wallet data', actions: [{ name: 'walletdata:label:set' }], providers: [] },
      ]);

      const { result } = await callTool(ctx.client, 'sam_plugin_list', {});
      const data = result as Array<{ name: string; actions: string[] }>;
      expect(data).toHaveLength(2);
      expect(data[0].actions).toContain('tokendata:getPrice');
    });

    it('should return empty array when no plugins installed', async () => {
      mockPlugins.getAll.mockReturnValue([]);
      const { result } = await callTool(ctx.client, 'sam_plugin_list', {});
      expect(result).toEqual([]);
    });
  });

  describe('sam_plugin_actions', () => {
    it('should return all available actions across plugins', async () => {
      const actionMap = new Map();
      actionMap.set('tokendata:getPrice', { description: 'Get token price', pluginName: 'tokendata' });
      actionMap.set('notification:send', { description: 'Send notification', pluginName: 'notification' });
      mockServices.getAllActions.mockReturnValue(actionMap);

      const { result } = await callTool(ctx.client, 'sam_plugin_actions', {});
      const data = result as Array<{ name: string; plugin: string }>;
      expect(data).toHaveLength(2);
      expect(data.find((a) => a.name === 'tokendata:getPrice')?.plugin).toBe('tokendata');
    });

    it('should return empty array when no actions registered', async () => {
      mockServices.getAllActions.mockReturnValue(new Map());
      const { result } = await callTool(ctx.client, 'sam_plugin_actions', {});
      expect(result).toEqual([]);
    });
  });
});
