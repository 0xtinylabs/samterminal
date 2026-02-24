/**
 * MCP Server -- E2E: Wallet Tools
 */

const mockGrpcCall = jest.fn();
const mockExecuteAction = jest.fn();

jest.unstable_mockModule('@grpc/grpc-js', () => ({
  credentials: { createInsecure: jest.fn() },
  loadPackageDefinition: jest.fn(() => ({
    scanner_wallet: {
      ScannerWallet: class {
        getWallet = mockGrpcCall;
        getWalletTokens = mockGrpcCall;
        getWalletDetails = mockGrpcCall;
        addWallet = mockGrpcCall;
        updateWalletPortfolio = mockGrpcCall;
        close = jest.fn();
      },
    },
    scanner_token: {
      ScannerToken: class {
        getTokens = jest.fn(); getTokenPrice = jest.fn(); getToken = jest.fn();
        addToken = jest.fn(); removeToken = jest.fn(); addBlacklist = jest.fn(); close = jest.fn();
      },
    },
  })),
}));

jest.unstable_mockModule('@grpc/proto-loader', () => ({ loadSync: jest.fn() }));

jest.unstable_mockModule('@samterminal/core', () => ({
  createCore: jest.fn(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    runtime: { getData: jest.fn(), executeAction: mockExecuteAction },
  })),
}));

const { setupTestContext, callTool } = await import('./helpers.js');
type TestContext = Awaited<ReturnType<typeof setupTestContext>>;

describe('Wallet Tools E2E', () => {
  let ctx: TestContext;

  beforeAll(async () => { ctx = await setupTestContext(); });
  afterAll(async () => { await ctx.cleanup(); });

  describe('sam_get_wallet', () => {
    it('should return wallet summary with native balance', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => {
        cb(null, {
          walletData: {
            walletAddress: '0xuser1', totalDollarValue: '15420.50',
            nativeBalance: '5000000000000000000', nativeBalanceFormatted: '5.0',
            tokenAddresses: ['0xusdc', '0xdegen'],
          },
        });
      });

      const { result, isError } = await callTool(ctx.client, 'sam_get_wallet', { walletAddress: '0xuser1' });
      expect(isError).toBe(false);
      const data = result as { walletData: { totalDollarValue: string; tokenAddresses: string[] } };
      expect(data.walletData.totalDollarValue).toBe('15420.50');
      expect(data.walletData.tokenAddresses).toHaveLength(2);
    });

    it('should forward chain and type parameters', async () => {
      let capturedReq: Record<string, unknown> = {};
      mockGrpcCall.mockImplementation((req: unknown, cb: Function) => {
        capturedReq = req as Record<string, unknown>;
        cb(null, { walletData: {} });
      });

      await callTool(ctx.client, 'sam_get_wallet', { walletAddress: '0xuser1', chain: 'BASE', type: 'SCANNER' });
      expect(capturedReq.chain).toBe('BASE');
      expect(capturedReq.type).toBe('SCANNER');
    });

    it('should default to BASE chain and API type', async () => {
      let capturedReq: Record<string, unknown> = {};
      mockGrpcCall.mockImplementation((req: unknown, cb: Function) => {
        capturedReq = req as Record<string, unknown>;
        cb(null, { walletData: {} });
      });

      await callTool(ctx.client, 'sam_get_wallet', { walletAddress: '0xuser1' });
      expect(capturedReq.chain).toBe('BASE');
      expect(capturedReq.type).toBe('API');
    });
  });

  describe('sam_get_wallet_tokens', () => {
    it('should return token holdings with USD values', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => {
        cb(null, {
          tokens: [
            { tokenSymbol: 'USDC', tokenDollarValue: '5000' },
            { tokenSymbol: 'ETH', tokenDollarValue: '6400' },
          ],
          numberOfTokens: 2,
        });
      });

      const { result, isError } = await callTool(ctx.client, 'sam_get_wallet_tokens', { walletAddress: '0xuser1' });
      expect(isError).toBe(false);
      const data = result as { numberOfTokens: number };
      expect(data.numberOfTokens).toBe(2);
    });

    it('should filter low USD tokens when requested', async () => {
      let capturedReq: Record<string, unknown> = {};
      mockGrpcCall.mockImplementation((req: unknown, cb: Function) => {
        capturedReq = req as Record<string, unknown>;
        cb(null, { tokens: [], numberOfTokens: 0 });
      });

      await callTool(ctx.client, 'sam_get_wallet_tokens', { walletAddress: '0xuser1', filterLowUSD: true });
      expect(capturedReq.filterLowUSD).toBe(true);
    });
  });

  describe('sam_get_wallet_details', () => {
    it('should return combined wallet + token data', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => {
        cb(null, {
          walletData: { totalDollarValue: '11400' },
          tokens: [{ tokenSymbol: 'USDC' }],
          numberOfTokens: 1,
        });
      });

      const { result, isError } = await callTool(ctx.client, 'sam_get_wallet_details', { walletAddress: '0xuser1', chain: 'BASE' });
      expect(isError).toBe(false);
      expect((result as { numberOfTokens: number }).numberOfTokens).toBe(1);
    });
  });

  describe('sam_wallet_track', () => {
    it('should add wallet to tracking list', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => { cb(null, { success: true }); });

      const { result, isError } = await callTool(ctx.client, 'sam_wallet_track', { walletAddress: '0xwhale' });
      expect(isError).toBe(false);
      expect((result as { success: boolean }).success).toBe(true);
    });
  });

  describe('sam_wallet_update_portfolio', () => {
    it('should update cached portfolio value', async () => {
      let capturedReq: Record<string, unknown> = {};
      mockGrpcCall.mockImplementation((req: unknown, cb: Function) => {
        capturedReq = req as Record<string, unknown>;
        cb(null, { success: true });
      });

      await callTool(ctx.client, 'sam_wallet_update_portfolio', { walletAddress: '0xuser1', totalDollarValue: '25000.00' });
      expect(capturedReq.totalDollarValue).toBe('25000.00');
    });
  });

  describe('sam_wallet_label', () => {
    it('should assign label via Core action', async () => {
      mockExecuteAction.mockResolvedValue({ success: true });

      const { result, isError } = await callTool(ctx.client, 'sam_wallet_label', { walletAddress: '0xuser1', label: 'Main Trading Wallet' });
      expect(isError).toBe(false);
      expect((result as { success: boolean }).success).toBe(true);
    });
  });

  describe('sam_wallet_tracked_list', () => {
    it('should return all tracked wallets', async () => {
      mockExecuteAction.mockResolvedValue([
        { address: '0xuser1', label: 'Main Wallet' },
        { address: '0xwhale', label: 'Whale Watch' },
      ]);

      const { result, isError } = await callTool(ctx.client, 'sam_wallet_tracked_list', {});
      expect(isError).toBe(false);
      expect(result).toHaveLength(2);
    });
  });
});
