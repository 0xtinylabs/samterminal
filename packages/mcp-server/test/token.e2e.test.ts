/**
 * MCP Server -- E2E: Token Tools
 */

const mockGrpcCall = jest.fn();
const mockGetData = jest.fn();

jest.unstable_mockModule('@grpc/grpc-js', () => ({
  credentials: { createInsecure: jest.fn() },
  loadPackageDefinition: jest.fn(() => ({
    scanner_token: {
      ScannerToken: class {
        getTokens = mockGrpcCall;
        getTokenPrice = mockGrpcCall;
        getToken = mockGrpcCall;
        addToken = mockGrpcCall;
        removeToken = mockGrpcCall;
        addBlacklist = mockGrpcCall;
        close = jest.fn();
      },
    },
  })),
}));

jest.unstable_mockModule('@grpc/proto-loader', () => ({
  loadSync: jest.fn(),
}));

jest.unstable_mockModule('@samterminal/core', () => ({
  createCore: jest.fn(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    runtime: {
      getData: mockGetData,
      executeAction: jest.fn(),
    },
  })),
}));

const { setupTestContext, callTool } = await import('./helpers.js');
type TestContext = Awaited<ReturnType<typeof setupTestContext>>;

describe('Token Tools E2E', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await setupTestContext();
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  describe('sam_get_tokens', () => {
    it('should return all tracked tokens when no addresses provided', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => {
        cb(null, {
          tokens: [
            { name: 'Ethereum', symbol: 'ETH', price: '3200.50', address: '0xeee' },
            { name: 'USD Coin', symbol: 'USDC', price: '1.00', address: '0xaaa' },
          ],
        });
      });

      const { result, isError } = await callTool(ctx.client, 'sam_get_tokens', {});
      expect(isError).toBe(false);
      const data = result as { tokens: Array<{ symbol: string }> };
      expect(data.tokens).toHaveLength(2);
      expect(data.tokens[0].symbol).toBe('ETH');
    });

    it('should filter tokens by addresses', async () => {
      mockGrpcCall.mockImplementation((req: { tokenAddresses: string[] }, cb: Function) => {
        cb(null, {
          tokens: [{ name: 'Ethereum', symbol: 'ETH', price: '3200', address: req.tokenAddresses[0] }],
        });
      });

      const { result, isError } = await callTool(ctx.client, 'sam_get_tokens', {
        tokenAddresses: ['0xeee'],
      });
      expect(isError).toBe(false);
      const data = result as { tokens: Array<{ address: string }> };
      expect(data.tokens).toHaveLength(1);
      expect(data.tokens[0].address).toBe('0xeee');
    });
  });

  describe('sam_get_token_price', () => {
    it('should return price and volume for a token', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => {
        cb(null, { success: true, price: '3250.42', volume: '15000000' });
      });

      const { result, isError } = await callTool(ctx.client, 'sam_get_token_price', {
        tokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      });
      expect(isError).toBe(false);
      const data = result as { success: boolean; price: string; volume: string };
      expect(data.success).toBe(true);
      expect(data.price).toBe('3250.42');
      expect(data.volume).toBe('15000000');
    });

    it('should forward optional reason parameter', async () => {
      let capturedRequest: Record<string, unknown> = {};
      mockGrpcCall.mockImplementation((req: unknown, cb: Function) => {
        capturedRequest = req as Record<string, unknown>;
        cb(null, { success: true, price: '3200', volume: '10000000' });
      });

      await callTool(ctx.client, 'sam_get_token_price', {
        tokenAddress: '0xabc',
        reason: 'price-alert-check',
      });

      expect(capturedRequest.reason).toBe('price-alert-check');
    });

    it('should return error on gRPC failure', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => {
        cb({ message: 'Token not found', code: 5 }, null);
      });

      const { result, isError } = await callTool(ctx.client, 'sam_get_token_price', {
        tokenAddress: '0xdead',
      });
      expect(isError).toBe(true);
      expect((result as Record<string, string>).error).toContain('Token not found');
    });
  });

  describe('sam_get_token_info', () => {
    it('should return full token details', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => {
        cb(null, {
          token: {
            name: 'DEGEN', symbol: 'DEGEN', price: '0.008', volume: '5000000',
            address: '0xdegen', poolAddress: '0xpool', supply: '1000000000',
          },
        });
      });

      const { result, isError } = await callTool(ctx.client, 'sam_get_token_info', {
        tokenAddress: '0xdegen',
      });
      expect(isError).toBe(false);
      const data = result as { token: { name: string; supply: string } };
      expect(data.token.name).toBe('DEGEN');
      expect(data.token.supply).toBe('1000000000');
    });

    it('should pass addIfNotExist flag', async () => {
      let capturedRequest: Record<string, unknown> = {};
      mockGrpcCall.mockImplementation((req: unknown, cb: Function) => {
        capturedRequest = req as Record<string, unknown>;
        cb(null, { token: { name: 'NEW', symbol: 'NEW' } });
      });

      await callTool(ctx.client, 'sam_get_token_info', {
        tokenAddress: '0xnew',
        addIfNotExist: true,
      });

      expect(capturedRequest.addIfNotExist).toBe(true);
    });
  });

  describe('sam_token_track', () => {
    it('should start tracking a token successfully', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => {
        cb(null, { success: true, type: 'FIRST_TIME', Message: 'Token added' });
      });

      const { result, isError } = await callTool(ctx.client, 'sam_token_track', {
        tokenAddress: '0xnewtoken', name: 'New Token', symbol: 'NEW',
      });
      expect(isError).toBe(false);
      expect((result as { success: boolean; type: string }).type).toBe('FIRST_TIME');
    });

    it('should detect duplicate tracking', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => {
        cb(null, { success: true, type: 'DUPLICATE', Message: 'Already tracked' });
      });

      const { result } = await callTool(ctx.client, 'sam_token_track', { tokenAddress: '0xexisting' });
      expect((result as { type: string }).type).toBe('DUPLICATE');
    });
  });

  describe('sam_token_untrack', () => {
    it('should remove a token from tracking', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => {
        cb(null, { success: true, type: 'ALL_CLEAR', Message: 'Token removed' });
      });

      const { result, isError } = await callTool(ctx.client, 'sam_token_untrack', { tokenAddress: '0xremove' });
      expect(isError).toBe(false);
      expect((result as { type: string }).type).toBe('ALL_CLEAR');
    });
  });

  describe('sam_token_blacklist', () => {
    it('should blacklist multiple tokens', async () => {
      let capturedRequest: Record<string, unknown> = {};
      mockGrpcCall.mockImplementation((req: unknown, cb: Function) => {
        capturedRequest = req as Record<string, unknown>;
        cb(null, { success: true });
      });

      const addresses = ['0xscam1', '0xscam2', '0xscam3'];
      const { result, isError } = await callTool(ctx.client, 'sam_token_blacklist', { tokenAddresses: addresses });
      expect(isError).toBe(false);
      expect((result as { success: boolean }).success).toBe(true);
      expect(capturedRequest.tokenAddresses).toEqual(addresses);
    });
  });

  describe('sam_token_search', () => {
    it('should search tokens via Core provider', async () => {
      mockGetData.mockResolvedValue([{ address: '0xdegen', symbol: 'DEGEN', name: 'DEGEN Token' }]);

      const { result, isError } = await callTool(ctx.client, 'sam_token_search', { query: 'DEGEN' });
      expect(isError).toBe(false);
      expect(result).toHaveLength(1);
      expect((result as Array<{ symbol: string }>)[0].symbol).toBe('DEGEN');
    });

    it('should return empty for no matches', async () => {
      mockGetData.mockResolvedValue([]);

      const { result, isError } = await callTool(ctx.client, 'sam_token_search', { query: 'nonexistent_xyz' });
      expect(isError).toBe(false);
      expect(result).toEqual([]);
    });
  });
});
