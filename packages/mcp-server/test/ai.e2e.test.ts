/**
 * MCP Server -- E2E: AI Tools
 */

const mockGrpcCall = jest.fn();
const mockExecuteAction = jest.fn();

jest.unstable_mockModule('@grpc/grpc-js', () => ({
  credentials: { createInsecure: jest.fn() },
  loadPackageDefinition: jest.fn(() => ({
    ai: { AIService: class { generateText = mockGrpcCall; generateJSON = mockGrpcCall; checkAPIKey = jest.fn(); close = jest.fn(); } },
    scanner_token: { ScannerToken: class { getTokens = jest.fn(); getTokenPrice = jest.fn(); getToken = jest.fn(); addToken = jest.fn(); removeToken = jest.fn(); addBlacklist = jest.fn(); close = jest.fn(); } },
    scanner_wallet: { ScannerWallet: class { getWallet = jest.fn(); getWalletTokens = jest.fn(); getWalletDetails = jest.fn(); addWallet = jest.fn(); updateWalletPortfolio = jest.fn(); close = jest.fn(); } },
  })),
}));

jest.unstable_mockModule('@grpc/proto-loader', () => ({ loadSync: jest.fn() }));
jest.unstable_mockModule('@samterminal/core', () => ({
  createCore: jest.fn(() => ({
    initialize: jest.fn().mockResolvedValue(undefined), start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    runtime: { getData: jest.fn(), executeAction: mockExecuteAction },
  })),
}));

const { setupTestContext, callTool } = await import('./helpers.js');
type TestContext = Awaited<ReturnType<typeof setupTestContext>>;

describe('AI Tools E2E', () => {
  let ctx: TestContext;
  beforeAll(async () => { ctx = await setupTestContext(); });
  afterAll(async () => { await ctx.cleanup(); });

  describe('sam_ai_generate', () => {
    it('should generate text from messages', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => { cb(null, { text: 'ETH shows bullish momentum', id: 'gen-123' }); });

      const { result, isError } = await callTool(ctx.client, 'sam_ai_generate', {
        messages: [{ role: 'SYSTEM', content: 'Crypto analyst.' }, { role: 'USER', content: 'Analyze ETH.' }],
      });
      expect(isError).toBe(false);
      expect((result as { text: string }).text).toContain('bullish');
    });

    it('should forward temperature parameter', async () => {
      let captured: Record<string, unknown> = {};
      mockGrpcCall.mockImplementation((req: unknown, cb: Function) => { captured = req as Record<string, unknown>; cb(null, { text: 'ok', id: '1' }); });

      await callTool(ctx.client, 'sam_ai_generate', { messages: [{ role: 'USER', content: 'test' }], temperature: 0.3 });
      expect(captured.temperature).toBe(0.3);
    });

    it('should handle AI generation error', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => { cb(null, { error: 'Rate limit exceeded', text: null }); });

      const { result } = await callTool(ctx.client, 'sam_ai_generate', { messages: [{ role: 'USER', content: 'test' }] });
      expect((result as { error: string }).error).toBe('Rate limit exceeded');
    });
  });

  describe('sam_ai_generate_json', () => {
    it('should generate structured JSON output', async () => {
      mockGrpcCall.mockImplementation((_req: unknown, cb: Function) => {
        cb(null, { json: { sentiment: 'bullish', confidence: 0.82 }, id: 'json-1' });
      });

      const { result, isError } = await callTool(ctx.client, 'sam_ai_generate_json', {
        messages: [{ role: 'USER', content: 'Extract signals' }],
      });
      expect(isError).toBe(false);
      expect((result as { json: { sentiment: string } }).json.sentiment).toBe('bullish');
    });
  });

  describe('sam_ai_chat', () => {
    it('should execute AI chat via Core action', async () => {
      mockExecuteAction.mockResolvedValue({ response: 'I recommend DCA strategy.' });

      const { result, isError } = await callTool(ctx.client, 'sam_ai_chat', {
        message: 'What strategy for ETH?', context: 'Conservative advisor.',
      });
      expect(isError).toBe(false);
      expect((result as { response: string }).response).toContain('DCA');
    });

    it('should work without context', async () => {
      mockExecuteAction.mockResolvedValue({ response: 'Hello!' });

      const { result } = await callTool(ctx.client, 'sam_ai_chat', { message: 'Hi' });
      expect((result as { response: string }).response).toBe('Hello!');
    });
  });
});
