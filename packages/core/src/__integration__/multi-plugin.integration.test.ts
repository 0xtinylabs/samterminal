/**
 * Multi-Plugin Interaction Integration Tests
 * Tests for cross-plugin communication and data sharing
 */


import { PluginRegistry, createPluginRegistry } from '../plugins/registry.js';
import { ServiceRegistryImpl, createServiceRegistry, Executor, createExecutor } from '../runtime/executor.js';
import { HooksService, createHooksService } from '../hooks/service.js';
import type { SamTerminalPlugin } from '../interfaces/plugin.interface.js';
import type { Action, ActionContext, ActionResult } from '../interfaces/action.interface.js';
import type { Provider, ProviderContext, ProviderResult } from '../interfaces/provider.interface.js';
import type { SamTerminalCore } from '../interfaces/core.interface.js';
import { uuid } from '../utils/id.js';

/**
 * Simulated TokenData Plugin
 */
function createTokenDataPlugin(services: ServiceRegistryImpl): SamTerminalPlugin {
  const tokenPrices: Record<string, number> = {
    ETH: 2000,
    BTC: 40000,
    USDC: 1,
    SOL: 100,
  };

  const tokenMetadata: Record<string, { name: string; symbol: string; decimals: number }> = {
    ETH: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    BTC: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
    USDC: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  };

  const priceProvider: Provider = {
    name: 'tokendata:price',
    type: 'token',
    get: async (ctx: ProviderContext): Promise<ProviderResult> => {
      const { symbol } = ctx.query as { symbol: string };
      const price = tokenPrices[symbol];
      if (price === undefined) {
        return { success: false, error: `Unknown token: ${symbol}`, timestamp: new Date() };
      }
      return { success: true, data: { symbol, price }, timestamp: new Date() };
    },
  };

  const metadataProvider: Provider = {
    name: 'tokendata:metadata',
    type: 'token',
    get: async (ctx: ProviderContext): Promise<ProviderResult> => {
      const { symbol } = ctx.query as { symbol: string };
      const metadata = tokenMetadata[symbol];
      if (!metadata) {
        return { success: false, error: `Unknown token: ${symbol}`, timestamp: new Date() };
      }
      return { success: true, data: metadata, timestamp: new Date() };
    },
  };

  const trackAction: Action = {
    name: 'tokendata:track',
    execute: async (ctx: ActionContext): Promise<ActionResult> => {
      const { symbol } = ctx.input as { symbol: string };
      return { success: true, data: { tracked: true, symbol } };
    },
  };

  return {
    name: '@samterminal/plugin-tokendata',
    version: '1.0.0',
    description: 'Token data provider plugin',
    providers: [priceProvider, metadataProvider],
    actions: [trackAction],
    init: async () => {
      services.registerProvider(priceProvider, '@samterminal/plugin-tokendata');
      services.registerProvider(metadataProvider, '@samterminal/plugin-tokendata');
      services.registerAction(trackAction, '@samterminal/plugin-tokendata');
    },
    destroy: async () => {
      services.unregisterPlugin('@samterminal/plugin-tokendata');
    },
  };
}

/**
 * Simulated WalletData Plugin
 */
function createWalletDataPlugin(services: ServiceRegistryImpl): SamTerminalPlugin {
  const walletBalances: Record<string, Record<string, number>> = {
    '0x1234': { ETH: 10, USDC: 1000 },
    '0x5678': { ETH: 5, BTC: 0.5, SOL: 50 },
  };

  const balanceProvider: Provider = {
    name: 'walletdata:balance',
    type: 'wallet',
    get: async (ctx: ProviderContext): Promise<ProviderResult> => {
      const { address } = ctx.query as { address: string };
      const balances = walletBalances[address];
      if (!balances) {
        return { success: true, data: { address, balances: {} }, timestamp: new Date() };
      }
      return { success: true, data: { address, balances }, timestamp: new Date() };
    },
  };

  const portfolioProvider: Provider = {
    name: 'walletdata:portfolio',
    type: 'wallet',
    get: async (ctx: ProviderContext): Promise<ProviderResult> => {
      const { address } = ctx.query as { address: string };
      const executor = createExecutor(services);
      const balances = walletBalances[address] ?? {};

      let totalValue = 0;
      const positions: Array<{ symbol: string; balance: number; value: number }> = [];

      for (const [symbol, balance] of Object.entries(balances)) {
        const priceResult = await executor.getData('tokendata:price', { symbol });
        if (priceResult.success) {
          const price = (priceResult.data as { price: number }).price;
          const value = balance * price;
          totalValue += value;
          positions.push({ symbol, balance, value });
        }
      }

      return {
        success: true,
        data: { address, totalValue, positions },
        timestamp: new Date(),
      };
    },
  };

  const trackAction: Action = {
    name: 'walletdata:track',
    execute: async (ctx: ActionContext): Promise<ActionResult> => {
      const { address } = ctx.input as { address: string };
      return { success: true, data: { tracked: true, address } };
    },
  };

  return {
    name: '@samterminal/plugin-walletdata',
    version: '1.0.0',
    description: 'Wallet data provider plugin',
    dependencies: ['@samterminal/plugin-tokendata'],
    providers: [balanceProvider, portfolioProvider],
    actions: [trackAction],
    init: async () => {
      services.registerProvider(balanceProvider, '@samterminal/plugin-walletdata');
      services.registerProvider(portfolioProvider, '@samterminal/plugin-walletdata');
      services.registerAction(trackAction, '@samterminal/plugin-walletdata');
    },
    destroy: async () => {
      services.unregisterPlugin('@samterminal/plugin-walletdata');
    },
  };
}

/**
 * Simulated AI Plugin
 */
function createAIPlugin(services: ServiceRegistryImpl, hooks: HooksService): SamTerminalPlugin {
  const analyzeAction: Action = {
    name: 'ai:analyze',
    execute: async (ctx: ActionContext): Promise<ActionResult> => {
      const { data, prompt } = ctx.input as { data: unknown; prompt: string };
      // Simulate AI analysis
      return {
        success: true,
        data: {
          analysis: `Analysis of ${JSON.stringify(data)} with prompt: ${prompt}`,
          confidence: 0.95,
        },
      };
    },
  };

  const summarizeAction: Action = {
    name: 'ai:summarize',
    execute: async (ctx: ActionContext): Promise<ActionResult> => {
      const { text } = ctx.input as { text: string };
      return {
        success: true,
        data: {
          summary: `Summary: ${text.substring(0, 50)}...`,
        },
      };
    },
  };

  return {
    name: '@samterminal/plugin-ai',
    version: '1.0.0',
    description: 'AI capabilities plugin',
    actions: [analyzeAction, summarizeAction],
    init: async () => {
      services.registerAction(analyzeAction, '@samterminal/plugin-ai');
      services.registerAction(summarizeAction, '@samterminal/plugin-ai');

      // Register hook for analytics
      hooks.on('action:after', async (payload) => {
        // Log action executions for AI learning
      });
    },
    destroy: async () => {
      services.unregisterPlugin('@samterminal/plugin-ai');
      hooks.unregisterPlugin('@samterminal/plugin-ai');
    },
  };
}

/**
 * Simulated Telegram Plugin
 */
function createTelegramPlugin(services: ServiceRegistryImpl, hooks: HooksService): SamTerminalPlugin {
  const messages: Array<{ chatId: string; text: string }> = [];

  const sendAction: Action = {
    name: 'telegram:send',
    execute: async (ctx: ActionContext): Promise<ActionResult> => {
      const { chatId, text } = ctx.input as { chatId: string; text: string };
      messages.push({ chatId, text });
      await hooks.emit('telegram:message:sent', { chatId, text });
      return { success: true, data: { messageId: uuid() } };
    },
  };

  const getMessagesProvider: Provider = {
    name: 'telegram:messages',
    type: 'custom',
    get: async (): Promise<ProviderResult> => {
      return { success: true, data: { messages: [...messages] }, timestamp: new Date() };
    },
  };

  return {
    name: '@samterminal/plugin-telegram',
    version: '1.0.0',
    description: 'Telegram integration plugin',
    actions: [sendAction],
    providers: [getMessagesProvider],
    init: async () => {
      services.registerAction(sendAction, '@samterminal/plugin-telegram');
      services.registerProvider(getMessagesProvider, '@samterminal/plugin-telegram');
    },
    destroy: async () => {
      services.unregisterPlugin('@samterminal/plugin-telegram');
    },
  };
}

/**
 * Simulated Swap Plugin
 */
function createSwapPlugin(services: ServiceRegistryImpl): SamTerminalPlugin {
  const quoteAction: Action = {
    name: 'swap:quote',
    execute: async (ctx: ActionContext): Promise<ActionResult> => {
      const { fromToken, toToken, amount } = ctx.input as {
        fromToken: string;
        toToken: string;
        amount: number;
      };

      const executor = createExecutor(services);

      // Get prices from tokendata
      const fromPrice = await executor.getData('tokendata:price', { symbol: fromToken });
      const toPrice = await executor.getData('tokendata:price', { symbol: toToken });

      if (!fromPrice.success || !toPrice.success) {
        return { success: false, error: 'Failed to get token prices' };
      }

      const fromPriceValue = (fromPrice.data as { price: number }).price;
      const toPriceValue = (toPrice.data as { price: number }).price;

      const inputValue = amount * fromPriceValue;
      const outputAmount = inputValue / toPriceValue;

      return {
        success: true,
        data: {
          fromToken,
          toToken,
          inputAmount: amount,
          outputAmount,
          rate: fromPriceValue / toPriceValue,
          priceImpact: 0.001,
        },
      };
    },
  };

  const executeSwapAction: Action = {
    name: 'swap:execute',
    execute: async (ctx: ActionContext): Promise<ActionResult> => {
      const { fromToken, toToken, amount, walletAddress } = ctx.input as {
        fromToken: string;
        toToken: string;
        amount: number;
        walletAddress: string;
      };

      const executor = createExecutor(services);

      // Check wallet balance
      const balance = await executor.getData('walletdata:balance', { address: walletAddress });
      if (!balance.success) {
        return { success: false, error: 'Failed to get wallet balance' };
      }

      const balances = (balance.data as { balances: Record<string, number> }).balances;
      if (!balances[fromToken] || balances[fromToken] < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Get quote
      const quote = await executor.executeAction('swap:quote', {
        fromToken,
        toToken,
        amount,
      });

      if (!quote.success) {
        return { success: false, error: 'Failed to get quote' };
      }

      // Simulate swap execution
      return {
        success: true,
        data: {
          transactionHash: `0x${uuid().replace(/-/g, '')}`,
          fromToken,
          toToken,
          inputAmount: amount,
          outputAmount: (quote.data as { outputAmount: number }).outputAmount,
        },
      };
    },
  };

  return {
    name: '@samterminal/plugin-swap',
    version: '1.0.0',
    description: 'Token swap plugin',
    dependencies: ['@samterminal/plugin-tokendata', '@samterminal/plugin-walletdata'],
    actions: [quoteAction, executeSwapAction],
    init: async () => {
      services.registerAction(quoteAction, '@samterminal/plugin-swap');
      services.registerAction(executeSwapAction, '@samterminal/plugin-swap');
    },
    destroy: async () => {
      services.unregisterPlugin('@samterminal/plugin-swap');
    },
  };
}

describe('Multi-Plugin Interaction Integration Tests', () => {
  let registry: PluginRegistry;
  let services: ServiceRegistryImpl;
  let hooks: HooksService;
  let mockCore: SamTerminalCore;
  let executor: Executor;

  beforeEach(async () => {
    registry = createPluginRegistry();
    services = createServiceRegistry();
    hooks = createHooksService();

    mockCore = {
      config: {},
      services,
      hooks,
    } as unknown as SamTerminalCore;

    executor = createExecutor(services);
  });

  afterEach(() => {
    registry.clear();
    services.clear();
    hooks.clear();
  });

  describe('TokenData + WalletData Plugin Interaction', () => {
    beforeEach(async () => {
      const tokenDataPlugin = createTokenDataPlugin(services);
      const walletDataPlugin = createWalletDataPlugin(services);

      registry.register(tokenDataPlugin);
      registry.register(walletDataPlugin);

      // Initialize in dependency order
      for (const name of registry.getLoadOrder()) {
        const plugin = registry.get(name);
        if (plugin) await plugin.init(mockCore);
      }
    });

    it('should get token price from tokendata plugin', async () => {
      const result = await executor.getData('tokendata:price', { symbol: 'ETH' });

      expect(result.success).toBe(true);
      expect((result.data as { price: number }).price).toBe(2000);
    });

    it('should get wallet balance from walletdata plugin', async () => {
      const result = await executor.getData('walletdata:balance', { address: '0x1234' });

      expect(result.success).toBe(true);
      expect((result.data as { balances: Record<string, number> }).balances.ETH).toBe(10);
    });

    it('should calculate portfolio value using both plugins', async () => {
      const result = await executor.getData('walletdata:portfolio', { address: '0x1234' });

      expect(result.success).toBe(true);
      const data = result.data as { totalValue: number; positions: Array<{ symbol: string; value: number }> };

      // 10 ETH * $2000 + 1000 USDC * $1 = $21,000
      expect(data.totalValue).toBe(21000);
      expect(data.positions.length).toBe(2);
    });

    it('should calculate complex portfolio with multiple tokens', async () => {
      const result = await executor.getData('walletdata:portfolio', { address: '0x5678' });

      expect(result.success).toBe(true);
      const data = result.data as { totalValue: number };

      // 5 ETH * $2000 + 0.5 BTC * $40000 + 50 SOL * $100 = $10,000 + $20,000 + $5,000 = $35,000
      expect(data.totalValue).toBe(35000);
    });

    it('should track tokens through action', async () => {
      const result = await executor.executeAction('tokendata:track', { symbol: 'ETH' });

      expect(result.success).toBe(true);
      expect((result.data as { tracked: boolean; symbol: string }).tracked).toBe(true);
    });
  });

  describe('Telegram + AI Plugin Interaction', () => {
    beforeEach(async () => {
      const telegramPlugin = createTelegramPlugin(services, hooks);
      const aiPlugin = createAIPlugin(services, hooks);

      registry.register(telegramPlugin);
      registry.register(aiPlugin);

      for (const name of registry.getLoadOrder()) {
        const plugin = registry.get(name);
        if (plugin) await plugin.init(mockCore);
      }
    });

    it('should send telegram message', async () => {
      const result = await executor.executeAction('telegram:send', {
        chatId: '12345',
        text: 'Hello from test',
      });

      expect(result.success).toBe(true);
      expect((result.data as { messageId: string }).messageId).toBeDefined();
    });

    it('should analyze data with AI and send via telegram', async () => {
      // Get analysis from AI
      const analysis = await executor.executeAction('ai:analyze', {
        data: { price: 2000, change: 5 },
        prompt: 'Analyze this price data',
      });

      expect(analysis.success).toBe(true);

      // Send analysis via telegram
      const sendResult = await executor.executeAction('telegram:send', {
        chatId: '12345',
        text: (analysis.data as { analysis: string }).analysis,
      });

      expect(sendResult.success).toBe(true);

      // Verify message was stored
      const messages = await executor.getData('telegram:messages', {});
      expect((messages.data as { messages: Array<{ text: string }> }).messages.length).toBe(1);
    });

    it('should emit hook when message is sent', async () => {
      const hookCalls: unknown[] = [];

      hooks.on('telegram:message:sent', async (payload) => {
        hookCalls.push(payload.data);
      });

      await executor.executeAction('telegram:send', {
        chatId: '12345',
        text: 'Test message',
      });

      expect(hookCalls.length).toBe(1);
      expect((hookCalls[0] as { chatId: string }).chatId).toBe('12345');
    });
  });

  describe('Swap Plugin with Token/Wallet Data', () => {
    beforeEach(async () => {
      const tokenDataPlugin = createTokenDataPlugin(services);
      const walletDataPlugin = createWalletDataPlugin(services);
      const swapPlugin = createSwapPlugin(services);

      registry.register(tokenDataPlugin);
      registry.register(walletDataPlugin);
      registry.register(swapPlugin);

      for (const name of registry.getLoadOrder()) {
        const plugin = registry.get(name);
        if (plugin) await plugin.init(mockCore);
      }
    });

    it('should verify dependency order', () => {
      const loadOrder = registry.getLoadOrder();

      const tokenIndex = loadOrder.indexOf('@samterminal/plugin-tokendata');
      const walletIndex = loadOrder.indexOf('@samterminal/plugin-walletdata');
      const swapIndex = loadOrder.indexOf('@samterminal/plugin-swap');

      expect(tokenIndex).toBeLessThan(walletIndex);
      expect(walletIndex).toBeLessThan(swapIndex);
    });

    it('should get swap quote using token prices', async () => {
      const result = await executor.executeAction('swap:quote', {
        fromToken: 'ETH',
        toToken: 'USDC',
        amount: 1,
      });

      expect(result.success).toBe(true);
      const data = result.data as { outputAmount: number; rate: number };

      // 1 ETH = $2000, 1 USDC = $1, so 1 ETH = 2000 USDC
      expect(data.outputAmount).toBe(2000);
      expect(data.rate).toBe(2000);
    });

    it('should execute swap with balance check', async () => {
      const result = await executor.executeAction('swap:execute', {
        fromToken: 'ETH',
        toToken: 'USDC',
        amount: 5,
        walletAddress: '0x1234',
      });

      expect(result.success).toBe(true);
      const data = result.data as { outputAmount: number; transactionHash: string };

      expect(data.outputAmount).toBe(10000); // 5 ETH * 2000 = 10000 USDC
      expect(data.transactionHash).toBeDefined();
    });

    it('should fail swap with insufficient balance', async () => {
      const result = await executor.executeAction('swap:execute', {
        fromToken: 'ETH',
        toToken: 'USDC',
        amount: 20, // Only have 10 ETH
        walletAddress: '0x1234',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient balance');
    });

    it('should fail swap for unknown token', async () => {
      const result = await executor.executeAction('swap:quote', {
        fromToken: 'UNKNOWN',
        toToken: 'USDC',
        amount: 1,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Full Plugin Ecosystem', () => {
    beforeEach(async () => {
      const tokenDataPlugin = createTokenDataPlugin(services);
      const walletDataPlugin = createWalletDataPlugin(services);
      const aiPlugin = createAIPlugin(services, hooks);
      const telegramPlugin = createTelegramPlugin(services, hooks);
      const swapPlugin = createSwapPlugin(services);

      registry.register(tokenDataPlugin);
      registry.register(walletDataPlugin);
      registry.register(aiPlugin);
      registry.register(telegramPlugin);
      registry.register(swapPlugin);

      for (const name of registry.getLoadOrder()) {
        const plugin = registry.get(name);
        if (plugin) await plugin.init(mockCore);
      }
    });

    it('should load all plugins successfully', () => {
      expect(registry.size).toBe(5);
      expect(services.getStats().actions).toBeGreaterThan(0);
      expect(services.getStats().providers).toBeGreaterThan(0);
    });

    it('should execute complex multi-plugin workflow', async () => {
      // Step 1: Get portfolio value
      const portfolio = await executor.getData('walletdata:portfolio', {
        address: '0x1234',
      });
      expect(portfolio.success).toBe(true);

      // Step 2: Analyze portfolio with AI
      const analysis = await executor.executeAction('ai:analyze', {
        data: portfolio.data,
        prompt: 'Analyze this portfolio',
      });
      expect(analysis.success).toBe(true);

      // Step 3: Get swap quote
      const quote = await executor.executeAction('swap:quote', {
        fromToken: 'ETH',
        toToken: 'USDC',
        amount: 1,
      });
      expect(quote.success).toBe(true);

      // Step 4: Summarize and send via telegram
      const summary = await executor.executeAction('ai:summarize', {
        text: `Portfolio value: ${(portfolio.data as { totalValue: number }).totalValue}, Swap rate: ${(quote.data as { rate: number }).rate}`,
      });
      expect(summary.success).toBe(true);

      const sendResult = await executor.executeAction('telegram:send', {
        chatId: '12345',
        text: (summary.data as { summary: string }).summary,
      });
      expect(sendResult.success).toBe(true);
    });

    it('should handle cross-plugin event propagation', async () => {
      const events: string[] = [];

      hooks.on('telegram:message:sent', async () => {
        events.push('message_sent');
      });

      hooks.on('action:after', async () => {
        events.push('action_completed');
      });

      await executor.executeAction('telegram:send', {
        chatId: '12345',
        text: 'Test',
      });

      // telegram:message:sent should have been emitted
      expect(events).toContain('message_sent');
    });

    it('should list all available services', () => {
      const actions = executor.getAvailableActions();
      const providers = executor.getAvailableProviders();

      expect(actions).toContain('tokendata:track');
      expect(actions).toContain('walletdata:track');
      expect(actions).toContain('ai:analyze');
      expect(actions).toContain('telegram:send');
      expect(actions).toContain('swap:quote');
      expect(actions).toContain('swap:execute');

      expect(providers).toContain('tokendata:price');
      expect(providers).toContain('tokendata:metadata');
      expect(providers).toContain('walletdata:balance');
      expect(providers).toContain('walletdata:portfolio');
      expect(providers).toContain('telegram:messages');
    });

    it('should handle plugin unload without affecting others', async () => {
      // Unload telegram plugin
      const telegramPlugin = registry.get('@samterminal/plugin-telegram');
      if (telegramPlugin?.destroy) {
        await telegramPlugin.destroy();
      }

      // Other plugins should still work
      const tokenResult = await executor.getData('tokendata:price', { symbol: 'ETH' });
      expect(tokenResult.success).toBe(true);

      const portfolioResult = await executor.getData('walletdata:portfolio', {
        address: '0x1234',
      });
      expect(portfolioResult.success).toBe(true);

      // Telegram action should fail
      const telegramResult = await executor.executeAction('telegram:send', {
        chatId: '12345',
        text: 'Test',
      });
      expect(telegramResult.success).toBe(false);
    });
  });
});
