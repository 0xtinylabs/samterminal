/**
 * MCP Server -- E2E: Chain Management Tools
 */

const mockChains = {
  getAll: jest.fn(), getCurrentChain: jest.fn(), setCurrentChain: jest.fn(),
  get: jest.fn(), register: jest.fn(), isSupported: jest.fn(), getRpcUrl: jest.fn(),
};

jest.unstable_mockModule('@grpc/grpc-js', () => ({ credentials: { createInsecure: jest.fn() }, loadPackageDefinition: jest.fn(() => ({})) }));
jest.unstable_mockModule('@grpc/proto-loader', () => ({ loadSync: jest.fn() }));
jest.unstable_mockModule('@samterminal/core', () => ({
  createCore: jest.fn(() => ({
    initialize: jest.fn().mockResolvedValue(undefined), start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined), chains: mockChains,
    runtime: { getData: jest.fn(), executeAction: jest.fn() },
  })),
}));

const { setupTestContext, callTool } = await import('./helpers.js');
type TestContext = Awaited<ReturnType<typeof setupTestContext>>;

describe('Chain Tools E2E', () => {
  let ctx: TestContext;
  beforeAll(async () => { ctx = await setupTestContext(); });
  afterAll(async () => { await ctx.cleanup(); });

  describe('sam_chain_list', () => {
    it('should return all supported chains', async () => {
      mockChains.getAll.mockReturnValue([
        { id: 'base', name: 'Base', type: 'evm', nativeCurrency: { symbol: 'ETH' }, rpcUrl: 'https://mainnet.base.org', explorerUrl: 'https://basescan.org', testnet: false },
      ]);

      const { result } = await callTool(ctx.client, 'sam_chain_list', {});
      const data = result as Array<{ id: string; type: string }>;
      expect(data).toHaveLength(1);
      expect(data[0].type).toBe('evm');
    });
  });

  describe('sam_chain_current', () => {
    it('should return current active chain', async () => {
      mockChains.getCurrentChain.mockReturnValue({ id: 'base', name: 'Base', type: 'evm', nativeCurrency: { symbol: 'ETH' }, rpcUrl: 'https://mainnet.base.org', explorerUrl: 'https://basescan.org' });

      const { result } = await callTool(ctx.client, 'sam_chain_current', {});
      expect((result as { id: string }).id).toBe('base');
    });

    it('should return error when no chain is set', async () => {
      mockChains.getCurrentChain.mockReturnValue(undefined);
      const { result } = await callTool(ctx.client, 'sam_chain_current', {});
      expect((result as { error: string }).error).toBe('No chain currently set');
    });
  });

  describe('sam_chain_switch', () => {
    it('should switch to a different chain', async () => {
      mockChains.setCurrentChain.mockImplementation(() => {});
      mockChains.getCurrentChain.mockReturnValue({ id: 'ethereum', name: 'Ethereum', type: 'evm' });

      const { result } = await callTool(ctx.client, 'sam_chain_switch', { chainId: 'ethereum' });
      const data = result as { success: boolean; currentChain: { id: string } };
      expect(data.success).toBe(true);
      expect(data.currentChain.id).toBe('ethereum');
    });

    it('should call setCurrentChain with the correct chainId', async () => {
      mockChains.setCurrentChain.mockImplementation(() => {});
      mockChains.getCurrentChain.mockReturnValue({ id: 'base', name: 'Base', type: 'evm' });

      await callTool(ctx.client, 'sam_chain_switch', { chainId: 'base' });
      expect(mockChains.setCurrentChain).toHaveBeenCalledWith('base');
    });
  });
});
