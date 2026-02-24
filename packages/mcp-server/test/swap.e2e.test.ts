/**
 * MCP Server -- E2E: Swap Tools
 */

const mockGrpcCall = jest.fn();

jest.unstable_mockModule('@grpc/grpc-js', () => ({
  credentials: { createInsecure: jest.fn() },
  loadPackageDefinition: jest.fn(() => ({
    swap: { SwapService: class { getFee = mockGrpcCall; swap = mockGrpcCall; approve = mockGrpcCall; close = jest.fn(); } },
    scanner_token: { ScannerToken: class { getTokens = jest.fn(); getTokenPrice = jest.fn(); getToken = jest.fn(); addToken = jest.fn(); removeToken = jest.fn(); addBlacklist = jest.fn(); close = jest.fn(); } },
    scanner_wallet: { ScannerWallet: class { getWallet = jest.fn(); getWalletTokens = jest.fn(); getWalletDetails = jest.fn(); addWallet = jest.fn(); updateWalletPortfolio = jest.fn(); close = jest.fn(); } },
  })),
}));

jest.unstable_mockModule('@grpc/proto-loader', () => ({ loadSync: jest.fn() }));
jest.unstable_mockModule('@samterminal/core', () => ({
  createCore: jest.fn(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    runtime: { getData: jest.fn(), executeAction: jest.fn() },
  })),
}));

const { setupTestContext, callTool } = await import('./helpers.js');
type TestContext = Awaited<ReturnType<typeof setupTestContext>>;

describe('Swap Tools E2E', () => {
  let ctx: TestContext;

  beforeAll(async () => { ctx = await setupTestContext(); });
  afterAll(async () => { await ctx.cleanup(); });

  describe('sam_swap_quote', () => {
    it('should return fee estimate', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => { cb(null, { success: true }); });

      const { result, isError } = await callTool(ctx.client, 'sam_swap_quote', { to: '0xswapRouter', value: '1000000000000000000' });
      expect(isError).toBe(false);
      expect((result as { success: boolean }).success).toBe(true);
    });

    it('should handle quote failure', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => { cb({ message: 'Insufficient liquidity' }, null); });

      const { result, isError } = await callTool(ctx.client, 'sam_swap_quote', { to: '0xdeadpool' });
      expect(isError).toBe(true);
      expect((result as Record<string, string>).error).toContain('Insufficient liquidity');
    });
  });

  describe('sam_swap_approve', () => {
    it('should approve ERC20 token spending', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => { cb(null, { success: true }); });

      const { result, isError } = await callTool(ctx.client, 'sam_swap_approve', { walletPrivateKey: '0xprivatekey', tokenAddress: '0xusdc' });
      expect(isError).toBe(false);
      expect((result as { success: boolean }).success).toBe(true);
    });

    it('should forward private key and token address correctly', async () => {
      let capturedReq: Record<string, unknown> = {};
      mockGrpcCall.mockImplementation((req: unknown, cb: Function) => { capturedReq = req as Record<string, unknown>; cb(null, { success: true }); });

      await callTool(ctx.client, 'sam_swap_approve', { walletPrivateKey: '0xabc123', tokenAddress: '0xtoken456' });
      expect(capturedReq.walletPrivateKey).toBe('0xabc123');
      expect(capturedReq.tokenAddress).toBe('0xtoken456');
    });
  });

  describe('sam_swap_execute', () => {
    it('should execute a swap and return tx details', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => {
        cb(null, { success: true, tx: '0xtxhash123', sellAmount: '1000000000000000000', buyAmount: '3200000000', companyFee: '0.003' });
      });

      const { result, isError } = await callTool(ctx.client, 'sam_swap_execute', {
        fromTokenAddress: '0xeth', toTokenAddress: '0xusdc', amount: 1.0, privateKey: '0xprivkey', chain: 'BASE',
      });
      expect(isError).toBe(false);
      const data = result as { success: boolean; tx: string; buyAmount: string };
      expect(data.success).toBe(true);
      expect(data.tx).toBe('0xtxhash123');
    });

    it('should forward slippage and feeResource parameters', async () => {
      let capturedReq: Record<string, unknown> = {};
      mockGrpcCall.mockImplementation((req: unknown, cb: Function) => { capturedReq = req as Record<string, unknown>; cb(null, { success: true }); });

      await callTool(ctx.client, 'sam_swap_execute', {
        fromTokenAddress: '0xeth', toTokenAddress: '0xusdc', amount: 0.5, privateKey: '0xkey', slippage: 100, feeResource: 'SELF',
      });
      expect(capturedReq.slippage).toBe(100);
      expect(capturedReq.feeResource).toBe('SELF');
    });

    it('should handle swap failure with error details', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => { cb(null, { success: false, error: { reason: 'INSUFFICIENT_BALANCE' } }); });

      const { result } = await callTool(ctx.client, 'sam_swap_execute', {
        fromTokenAddress: '0xeth', toTokenAddress: '0xusdc', amount: 999999, privateKey: '0xkey',
      });
      expect((result as { success: boolean }).success).toBe(false);
    });
  });

  describe('Swap Lifecycle (quote -> approve -> execute)', () => {
    it('should complete full swap flow end-to-end', async () => {
      mockGrpcCall.mockImplementationOnce((_req: unknown, cb: Function) => { cb(null, { success: true }); });
      const quote = await callTool(ctx.client, 'sam_swap_quote', { to: '0xrouter', value: '1000000' });
      expect(quote.isError).toBe(false);

      mockGrpcCall.mockImplementationOnce((_req: unknown, cb: Function) => { cb(null, { success: true }); });
      const approve = await callTool(ctx.client, 'sam_swap_approve', { walletPrivateKey: '0xkey', tokenAddress: '0xusdc' });
      expect(approve.isError).toBe(false);

      mockGrpcCall.mockImplementationOnce((_req: unknown, cb: Function) => { cb(null, { success: true, tx: '0xfinaltx', sellAmount: '1000000', buyAmount: '310000000000000' }); });
      const execute = await callTool(ctx.client, 'sam_swap_execute', {
        fromTokenAddress: '0xusdc', toTokenAddress: '0xeth', amount: 1.0, privateKey: '0xkey',
      });
      expect(execute.isError).toBe(false);
      expect((execute.result as { tx: string }).tx).toBe('0xfinaltx');
    });
  });
});
