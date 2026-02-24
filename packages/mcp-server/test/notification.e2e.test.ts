/**
 * MCP Server -- E2E: Notification Tools
 */

const mockGrpcCall = jest.fn();

jest.unstable_mockModule('@grpc/grpc-js', () => ({
  credentials: { createInsecure: jest.fn() },
  loadPackageDefinition: jest.fn(() => ({
    notification: {
      NotificationService: class {
        send = mockGrpcCall; getUserBotURL = mockGrpcCall;
        getUserBotStates = mockGrpcCall; toggleBotState = mockGrpcCall; close = jest.fn();
      },
    },
    scanner_token: { ScannerToken: class { getTokens = jest.fn(); getTokenPrice = jest.fn(); getToken = jest.fn(); addToken = jest.fn(); removeToken = jest.fn(); addBlacklist = jest.fn(); close = jest.fn(); } },
    scanner_wallet: { ScannerWallet: class { getWallet = jest.fn(); getWalletTokens = jest.fn(); getWalletDetails = jest.fn(); addWallet = jest.fn(); updateWalletPortfolio = jest.fn(); close = jest.fn(); } },
  })),
}));

jest.unstable_mockModule('@grpc/proto-loader', () => ({ loadSync: jest.fn() }));
jest.unstable_mockModule('@samterminal/core', () => ({
  createCore: jest.fn(() => ({
    initialize: jest.fn().mockResolvedValue(undefined), start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined), runtime: { getData: jest.fn(), executeAction: jest.fn() },
  })),
}));

const { setupTestContext, callTool } = await import('./helpers.js');
type TestContext = Awaited<ReturnType<typeof setupTestContext>>;

describe('Notification Tools E2E', () => {
  let ctx: TestContext;
  beforeAll(async () => { ctx = await setupTestContext(); });
  afterAll(async () => { await ctx.cleanup(); });

  describe('sam_notify_send', () => {
    it('should send a Telegram notification', async () => {
      let captured: Record<string, unknown> = {};
      mockGrpcCall.mockImplementation((req: unknown, cb: Function) => { captured = req as Record<string, unknown>; cb(null, { success: true }); });

      const { result, isError } = await callTool(ctx.client, 'sam_notify_send', { message: 'ETH dropped!', type: 'TELEGRAM', to: 'user123' });
      expect(isError).toBe(false);
      expect(captured.message).toBe('ETH dropped!');
      expect(captured.type).toBe('TELEGRAM');
    });

    it('should send with buttons attached', async () => {
      let captured: Record<string, unknown> = {};
      mockGrpcCall.mockImplementation((req: unknown, cb: Function) => { captured = req as Record<string, unknown>; cb(null, { success: true }); });

      await callTool(ctx.client, 'sam_notify_send', {
        message: 'New token!', to: 'user123',
        buttons: [{ label: 'View', data: 'https://basescan.org', type: 'LINK' }, { label: 'Track', data: 'track:0x123', type: 'FUNCTION' }],
      });

      const extras = captured.extras as { buttons: Array<{ type: string }> };
      expect(extras.buttons).toHaveLength(2);
      expect(extras.buttons[0].type).toBe('LINK');
    });

    it('should default to TELEGRAM and MAIN bot', async () => {
      let captured: Record<string, unknown> = {};
      mockGrpcCall.mockImplementation((req: unknown, cb: Function) => { captured = req as Record<string, unknown>; cb(null, { success: true }); });

      await callTool(ctx.client, 'sam_notify_send', { message: 'Test', to: 'user1' });
      expect(captured.type).toBe('TELEGRAM');
      expect(captured.botName).toBe('MAIN');
    });
  });

  describe('sam_notify_bot_url', () => {
    it('should return bot connection URLs', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => {
        cb(null, { urls: [{ code: 'ABC', url: 'https://t.me/sambot?start=ABC', type: 'TELEGRAM' }] });
      });

      const { result, isError } = await callTool(ctx.client, 'sam_notify_bot_url', { userId: 'user1' });
      expect(isError).toBe(false);
      expect((result as { urls: unknown[] }).urls).toHaveLength(1);
    });
  });

  describe('sam_notify_bot_state', () => {
    it('should return bot connection states', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => {
        cb(null, { success: true, botStates: [{ type: 'TELEGRAM', isActive: true }, { type: 'FARCASTER', isActive: false }] });
      });

      const { result } = await callTool(ctx.client, 'sam_notify_bot_state', { userId: 'user1' });
      const data = result as { botStates: Array<{ isActive: boolean }> };
      expect(data.botStates[0].isActive).toBe(true);
      expect(data.botStates[1].isActive).toBe(false);
    });
  });

  describe('sam_notify_toggle', () => {
    it('should toggle notification channel', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => { cb(null, { success: true, botStates: [] }); });

      const { result, isError } = await callTool(ctx.client, 'sam_notify_toggle', { userId: 'user1', type: 'TELEGRAM' });
      expect(isError).toBe(false);
      expect((result as { success: boolean }).success).toBe(true);
    });

    it('should pass correct channel type', async () => {
      let captured: Record<string, unknown> = {};
      mockGrpcCall.mockImplementation((req: unknown, cb: Function) => { captured = req as Record<string, unknown>; cb(null, { success: true, botStates: [] }); });

      await callTool(ctx.client, 'sam_notify_toggle', { userId: 'user1', type: 'FARCASTER' });
      expect(captured.type).toBe('FARCASTER');
    });
  });
});
