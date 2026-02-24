/**
 * MCP Server -- E2E: Server Bootstrap & Tool Discovery
 */

jest.unstable_mockModule('@grpc/grpc-js', () => ({
  credentials: { createInsecure: jest.fn() },
  loadPackageDefinition: jest.fn(),
}));
jest.unstable_mockModule('@grpc/proto-loader', () => ({
  loadSync: jest.fn(),
}));
jest.unstable_mockModule('@samterminal/core', () => ({
  createCore: jest.fn(),
}));

const { setupTestContext, listTools, callTool } = await import('./helpers.js');
type TestContext = Awaited<ReturnType<typeof setupTestContext>>;

describe('MCP Server Bootstrap', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await setupTestContext();
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  it('should list all 40 registered tools', async () => {
    const tools = await listTools(ctx.client);
    expect(tools.length).toBe(40);
  });

  it('should include tools from every category', async () => {
    const tools = await listTools(ctx.client);
    const names = tools.map((t) => t.name);

    // Token (7)
    expect(names).toContain('sam_get_tokens');
    expect(names).toContain('sam_get_token_price');
    expect(names).toContain('sam_get_token_info');
    expect(names).toContain('sam_token_track');
    expect(names).toContain('sam_token_untrack');
    expect(names).toContain('sam_token_blacklist');
    expect(names).toContain('sam_token_search');

    // Wallet (7)
    expect(names).toContain('sam_get_wallet');
    expect(names).toContain('sam_get_wallet_tokens');
    expect(names).toContain('sam_get_wallet_details');
    expect(names).toContain('sam_wallet_track');
    expect(names).toContain('sam_wallet_update_portfolio');
    expect(names).toContain('sam_wallet_label');
    expect(names).toContain('sam_wallet_tracked_list');

    // Swap (3)
    expect(names).toContain('sam_swap_quote');
    expect(names).toContain('sam_swap_execute');
    expect(names).toContain('sam_swap_approve');

    // Flow (7)
    expect(names).toContain('sam_flow_list');
    expect(names).toContain('sam_flow_get');
    expect(names).toContain('sam_flow_create');
    expect(names).toContain('sam_flow_create_from_template');
    expect(names).toContain('sam_flow_execute');
    expect(names).toContain('sam_flow_status');
    expect(names).toContain('sam_flow_templates');

    // Notification (4)
    expect(names).toContain('sam_notify_send');
    expect(names).toContain('sam_notify_bot_url');
    expect(names).toContain('sam_notify_bot_state');
    expect(names).toContain('sam_notify_toggle');

    // AI (3)
    expect(names).toContain('sam_ai_generate');
    expect(names).toContain('sam_ai_generate_json');
    expect(names).toContain('sam_ai_chat');

    // Scheduler (4)
    expect(names).toContain('sam_schedule_create');
    expect(names).toContain('sam_schedule_list');
    expect(names).toContain('sam_schedule_toggle');
    expect(names).toContain('sam_schedule_delete');

    // Chain (3)
    expect(names).toContain('sam_chain_list');
    expect(names).toContain('sam_chain_current');
    expect(names).toContain('sam_chain_switch');

    // Plugin (2)
    expect(names).toContain('sam_plugin_list');
    expect(names).toContain('sam_plugin_actions');

  });

  it('should have descriptions for every tool', async () => {
    const tools = await listTools(ctx.client);
    for (const tool of tools) {
      expect(tool.description).toBeTruthy();
      expect(tool.description.length).toBeGreaterThan(10);
    }
  });

  it('should use sam_ prefix for all tool names', async () => {
    const tools = await listTools(ctx.client);
    for (const tool of tools) {
      expect(tool.name).toMatch(/^sam_/);
    }
  });

  it('should return error for unknown tool', async () => {
    const { result, isError } = await callTool(ctx.client, 'sam_nonexistent_tool', {});
    expect(isError).toBe(true);
    expect(result).toHaveProperty('error');
    expect((result as Record<string, string>).error).toContain('Unknown tool');
  });
});
