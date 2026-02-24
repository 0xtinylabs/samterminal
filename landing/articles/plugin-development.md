# Plugin Development Guide

## Introduction

SAM Terminal's plugin architecture enables developers to extend the framework with custom functionality while maintaining clean separation of concerns. Plugins can provide blockchain data, execute transactions, integrate AI services, manage workflows, and more.

This modular design allows you to:
- Build reusable components that work across different projects
- Share functionality with the community through npm packages
- Compose complex agent behaviors from simple, focused plugins
- Maintain clear boundaries between different parts of your system

## Core Plugin Concepts

Every SAM Terminal plugin can expose four types of capabilities:

### Actions

Actions are executable operations that perform work and return results. They represent the "verbs" of your system - things your agent can do.

```typescript
{
  name: 'swap-tokens',
  description: 'Execute a token swap on a DEX',
  params: z.object({
    fromToken: z.string(),
    toToken: z.string(),
    amount: z.string()
  }),
  execute: async (params, context) => {
    // Implementation
    return { txHash: '0x...' };
  }
}
```

### Providers

Providers fetch and return data without modifying state. They represent the "sensors" of your system - ways to read information.

```typescript
{
  name: 'token-price',
  description: 'Get current token price',
  query: z.object({
    address: z.string(),
    chain: z.string()
  }),
  fetch: async (query, context) => {
    // Implementation
    return { price: 1.23, priceUSD: 1.23 };
  }
}
```

### Evaluators

Evaluators assess conditions and return boolean results. They enable dynamic control in the workflow engine.

```typescript
{
  name: 'price-above-threshold',
  description: 'Check if token price exceeds threshold',
  params: z.object({
    tokenAddress: z.string(),
    threshold: z.number()
  }),
  evaluate: async (params, context) => {
    // Implementation
    return price > params.threshold;
  }
}
```

### Hooks

Hooks respond to lifecycle events and enable inter-plugin communication through the event system.

```typescript
{
  event: 'plugin:initialized',
  handler: async (data, context) => {
    // React to system events
  }
}
```

## Scaffolding a New Plugin

Create a new plugin using the CLI:

```bash
sam plugin create my-plugin
cd my-plugin
pnpm install
```

This generates a basic structure:

```
my-plugin/
├── src/
│   ├── actions/
│   │   └── index.ts
│   ├── providers/
│   │   └── index.ts
│   ├── plugin.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

## Creating a Plugin Class

For complex plugins with initialization logic and state management, extend `BasePlugin`:

```typescript
import { BasePlugin, type SamTerminalCore } from '@samterminal/core';
import { z } from 'zod';

export class MyPlugin extends BasePlugin {
  readonly name = 'my-plugin';
  readonly version = '1.0.0';
  readonly description = 'My custom plugin';
  readonly author = 'Your Name';

  // Plugin state
  private apiClient: ApiClient | null = null;

  protected async onInit(): Promise<void> {
    // Initialize resources
    const config = this.getCore().getConfig();
    this.apiClient = new ApiClient(config.apiKey);

    // Register actions
    this.registerAction({
      name: 'fetch-data',
      description: 'Fetch data from API',
      params: z.object({
        query: z.string()
      }),
      execute: async (params, context) => {
        if (!this.apiClient) {
          throw new Error('Plugin not initialized');
        }
        return await this.apiClient.fetchData(params.query);
      }
    });

    // Register providers
    this.registerProvider({
      name: 'data-status',
      description: 'Get API status',
      query: z.object({}),
      fetch: async (query, context) => {
        return { status: 'ready', timestamp: Date.now() };
      }
    });

    this.logger.info('Plugin initialized');
  }

  protected async onDestroy(): Promise<void> {
    // Cleanup resources
    if (this.apiClient) {
      await this.apiClient.close();
      this.apiClient = null;
    }
    this.logger.info('Plugin destroyed');
  }
}

export default new MyPlugin();
```

## Using the createPlugin() Factory

For simpler plugins without complex state, use the factory function:

```typescript
import { createPlugin } from '@samterminal/core';
import { z } from 'zod';

export default createPlugin({
  name: 'simple-plugin',
  version: '1.0.0',
  description: 'A simple plugin',

  actions: [
    {
      name: 'hello',
      description: 'Say hello',
      params: z.object({
        name: z.string()
      }),
      execute: async (params, context) => {
        return { message: `Hello, ${params.name}!` };
      }
    }
  ],

  providers: [
    {
      name: 'greeting',
      description: 'Get greeting template',
      query: z.object({
        language: z.string().optional()
      }),
      fetch: async (query, context) => {
        const greetings = { en: 'Hello', es: 'Hola', fr: 'Bonjour' };
        return { template: greetings[query.language || 'en'] };
      }
    }
  ]
});
```

## Defining Actions

Actions should validate inputs, handle errors, and return strongly-typed results:

```typescript
import { z } from 'zod';

const swapAction = {
  name: 'swap-tokens',
  description: 'Execute a DEX token swap',

  // Schema validation with zod
  params: z.object({
    fromToken: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    toToken: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    amount: z.string(),
    slippage: z.number().min(0).max(50).optional()
  }),

  execute: async (params, context) => {
    const { fromToken, toToken, amount, slippage = 1 } = params;

    try {
      // Get quote
      const quote = await context.getData('quote-provider', {
        fromToken,
        toToken,
        amount
      });

      // Check allowance
      const allowance = await context.getData('allowance-provider', {
        token: fromToken,
        spender: quote.router
      });

      // Approve if needed
      if (BigInt(allowance) < BigInt(amount)) {
        await context.executeAction('approve-token', {
          token: fromToken,
          spender: quote.router,
          amount
        });
      }

      // Execute swap
      const tx = await executeSwap(quote, slippage);

      return {
        success: true,
        txHash: tx.hash,
        fromAmount: amount,
        toAmount: quote.toAmount
      };
    } catch (error) {
      context.logger.error('Swap failed', { error });
      throw error;
    }
  }
};
```

## Defining Providers

Providers fetch data from external sources or compute derived values:

```typescript
const tokenPriceProvider = {
  name: 'token-price',
  description: 'Fetch current token price from multiple sources',

  query: z.object({
    address: z.string(),
    chain: z.enum(['ethereum', 'base', 'arbitrum', 'polygon']),
    currency: z.string().default('usd')
  }),

  fetch: async (query, context) => {
    const { address, chain, currency } = query;

    // Fetch from multiple sources
    const [coingeckoPrice, dexscreenerPrice] = await Promise.allSettled([
      fetchCoingeckoPrice(address, chain, currency),
      fetchDexscreenerPrice(address, chain)
    ]);

    // Use fallback logic
    const price =
      coingeckoPrice.status === 'fulfilled' ? coingeckoPrice.value :
      dexscreenerPrice.status === 'fulfilled' ? dexscreenerPrice.value :
      null;

    if (!price) {
      throw new Error('Failed to fetch price from all sources');
    }

    return {
      price: price.value,
      currency: price.currency,
      source: price.source,
      timestamp: Date.now(),
      confidence: price.confidence || 'high'
    };
  }
};
```

## Defining Evaluators

Evaluators enable conditional logic in flows:

```typescript
const priceThresholdEvaluator = {
  name: 'price-above-threshold',
  description: 'Check if token price exceeds threshold',

  params: z.object({
    tokenAddress: z.string(),
    chain: z.string(),
    threshold: z.number(),
    comparison: z.enum(['gt', 'gte', 'lt', 'lte']).default('gt')
  }),

  evaluate: async (params, context) => {
    const { tokenAddress, chain, threshold, comparison } = params;

    // Fetch current price
    const priceData = await context.getData('token-price', {
      address: tokenAddress,
      chain
    });

    const price = priceData.price;

    // Evaluate condition
    switch (comparison) {
      case 'gt': return price > threshold;
      case 'gte': return price >= threshold;
      case 'lt': return price < threshold;
      case 'lte': return price <= threshold;
    }
  }
};
```

## Lifecycle Hooks

Plugins can hook into system events:

```typescript
export class MyPlugin extends BasePlugin {
  readonly name = 'event-listener-plugin';
  readonly version = '1.0.0';

  protected async onInit(): Promise<void> {
    // Register hooks for system events
    this.registerHook({
      event: 'action:executed',
      handler: async (data, context) => {
        context.logger.info('Action executed', {
          action: data.actionName,
          result: data.result
        });
      }
    });

    this.registerHook({
      event: 'transaction:confirmed',
      handler: async (data, context) => {
        // Send notification
        await context.executeAction('send-telegram-message', {
          message: `Transaction confirmed: ${data.txHash}`
        });
      }
    });

    this.registerHook({
      event: 'error:occurred',
      handler: async (data, context) => {
        // Log to external service
        await this.reportError(data.error);
      }
    });
  }

  private async reportError(error: Error): Promise<void> {
    // Implementation
  }
}
```

## Cross-Plugin Communication

Plugins can interact with each other through the core:

```typescript
export class DeFiPlugin extends BasePlugin {
  readonly name = 'defi-plugin';
  readonly version = '1.0.0';

  protected async onInit(): Promise<void> {
    this.registerAction({
      name: 'auto-compound',
      description: 'Auto-compound yield farming rewards',
      params: z.object({
        farmAddress: z.string()
      }),
      execute: async (params, context) => {
        // Get pending rewards (from another plugin's provider)
        const rewards = await this.getData('farm-rewards', {
          farm: params.farmAddress
        });

        if (rewards.amount < MIN_COMPOUND_AMOUNT) {
          return { skipped: true, reason: 'Insufficient rewards' };
        }

        // Execute harvest (from another plugin's action)
        const harvestResult = await this.executeAction('harvest-rewards', {
          farm: params.farmAddress
        });

        // Get optimal swap route (from swap plugin)
        const route = await this.getData('swap-route', {
          fromToken: rewards.token,
          toToken: FARM_TOKEN,
          amount: rewards.amount
        });

        // Execute swap (from swap plugin)
        const swapResult = await this.executeAction('swap-tokens', {
          fromToken: rewards.token,
          toToken: FARM_TOKEN,
          amount: rewards.amount,
          slippage: 2
        });

        // Emit event for other plugins
        await this.emit('compound:completed', {
          farm: params.farmAddress,
          amount: swapResult.toAmount,
          txHash: swapResult.txHash
        });

        return {
          success: true,
          compounded: swapResult.toAmount
        };
      }
    });
  }
}
```

## Dependencies

Declare plugin dependencies to ensure proper load order:

```typescript
export class AdvancedPlugin extends BasePlugin {
  readonly name = 'advanced-plugin';
  readonly version = '1.0.0';

  // Required dependencies (must be present)
  readonly dependencies = [
    '@samterminal/plugin-walletdata',
    '@samterminal/plugin-tokendata'
  ];

  // Optional dependencies (enhanced features if available)
  readonly optionalDependencies = [
    '@samterminal/plugin-telegram',
    '@samterminal/plugin-ai'
  ];

  protected async onInit(): Promise<void> {
    // Check if optional dependency is available
    const hasTelegram = await this.checkPluginAvailable('telegram');

    if (hasTelegram) {
      this.logger.info('Telegram notifications enabled');
      // Enable telegram features
    }
  }

  private async checkPluginAvailable(name: string): Promise<boolean> {
    try {
      const plugins = this.getCore().getPluginRegistry();
      return plugins.has(name);
    } catch {
      return false;
    }
  }
}
```

## Multi-Chain Support

Plugins can support multiple blockchain networks:

```typescript
import { defineChain } from '@samterminal/core';

export class MultiChainPlugin extends BasePlugin {
  readonly name = 'multichain-plugin';
  readonly version = '1.0.0';

  readonly chains = [
    defineChain({
      id: 1,
      name: 'ethereum',
      rpcUrl: process.env.ETHEREUM_RPC_URL!
    }),
    defineChain({
      id: 8453,
      name: 'base',
      rpcUrl: process.env.BASE_RPC_URL!
    })
  ];

  readonly chainConfig = {
    supportedChains: ['ethereum', 'base', 'arbitrum', 'polygon'],
    defaultChain: 'base',
    requireChainParam: true
  };

  protected async onInit(): Promise<void> {
    this.registerAction({
      name: 'cross-chain-transfer',
      description: 'Bridge tokens across chains',
      params: z.object({
        fromChain: z.string(),
        toChain: z.string(),
        token: z.string(),
        amount: z.string()
      }),
      execute: async (params, context) => {
        // Validate chains are supported
        if (!this.chainConfig.supportedChains.includes(params.fromChain)) {
          throw new Error(`Unsupported chain: ${params.fromChain}`);
        }

        // Get chain-specific provider
        const provider = this.getChainProvider(params.fromChain);

        // Implementation
        return { txHash: '0x...' };
      }
    });
  }

  private getChainProvider(chain: string) {
    const chainData = this.chains?.find(c => c.name === chain);
    if (!chainData) {
      throw new Error(`Chain not configured: ${chain}`);
    }
    return createProvider(chainData.rpcUrl);
  }
}
```

## Testing Plugins

Write comprehensive tests using vitest and testing utilities:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockContext } from '@samterminal/testing-utils';
import { MyPlugin } from '../src/plugin';

describe('MyPlugin', () => {
  let plugin: MyPlugin;
  let mockCore: any;

  beforeEach(async () => {
    mockCore = createMockContext();
    plugin = new MyPlugin();
    await plugin.init(mockCore);
  });

  describe('fetch-data action', () => {
    it('should fetch data successfully', async () => {
      const result = await plugin['executeAction']('fetch-data', {
        query: 'test-query'
      });

      expect(result).toHaveProperty('data');
      expect(result.success).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      await expect(
        plugin['executeAction']('fetch-data', { query: '' })
      ).rejects.toThrow('Query cannot be empty');
    });

    it('should validate parameters', async () => {
      await expect(
        plugin['executeAction']('fetch-data', { invalid: true })
      ).rejects.toThrow();
    });
  });

  describe('data-status provider', () => {
    it('should return current status', async () => {
      const result = await plugin['getData']('data-status', {});

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result.status).toBe('ready');
    });
  });

  describe('lifecycle', () => {
    it('should initialize correctly', () => {
      expect(plugin['isInitialized']()).toBe(true);
    });

    it('should cleanup on destroy', async () => {
      await plugin.destroy();
      expect(plugin['isInitialized']()).toBe(false);
    });
  });
});
```

## Building and Packaging

Configure tsup for optimal bundling:

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@samterminal/core'],
  treeshake: true
});
```

Configure package.json:

```json
{
  "name": "@my-org/sam-plugin-custom",
  "version": "1.0.0",
  "description": "Custom SAM Terminal plugin",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  },
  "peerDependencies": {
    "@samterminal/core": "^1.0.0"
  },
  "devDependencies": {
    "@samterminal/core": "^1.0.0",
    "@samterminal/testing-utils": "^1.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  },
  "keywords": ["samterminal", "plugin", "web3"],
  "license": "MIT"
}
```

## Installation and Registration

Install via CLI:

```bash
# Install from npm
sam plugin install @my-org/sam-plugin-custom

# Install specific version
sam plugin install @my-org/sam-plugin-custom@1.2.3

# Install from local path
sam plugin install ./path/to/plugin

# List installed plugins
sam plugin list
```

Or configure in `samterminal.config.json`:

```json
{
  "plugins": [
    {
      "name": "@my-org/sam-plugin-custom",
      "enabled": true,
      "config": {
        "apiKey": "${CUSTOM_API_KEY}",
        "timeout": 5000
      }
    }
  ]
}
```

## Real-World Examples

### Token Price Tracking (from plugin-tokendata)

```typescript
this.registerAction({
  name: 'track-token',
  description: 'Monitor token price and trigger alerts',
  params: z.object({
    address: z.string(),
    chain: z.string(),
    interval: z.number().default(60000)
  }),
  execute: async (params, context) => {
    const tracker = setInterval(async () => {
      const price = await context.getData('token-price', {
        address: params.address,
        chain: params.chain
      });

      await context.emit('price:updated', {
        token: params.address,
        price: price.price
      });
    }, params.interval);

    return { trackerId: tracker[Symbol.toPrimitive]() };
  }
});
```

### Swap with Quote (from plugin-swap)

```typescript
this.registerAction({
  name: 'swap',
  description: 'Execute token swap with best quote',
  params: z.object({
    fromToken: z.string(),
    toToken: z.string(),
    amount: z.string(),
    slippage: z.number().optional()
  }),
  execute: async (params, context) => {
    // Get quote from provider
    const quote = await context.getData('swap-quote', {
      sellToken: params.fromToken,
      buyToken: params.toToken,
      sellAmount: params.amount
    });

    // Check and approve if needed
    const allowance = await context.getData('token-allowance', {
      token: params.fromToken,
      spender: quote.to
    });

    if (BigInt(allowance) < BigInt(params.amount)) {
      await context.executeAction('approve', {
        token: params.fromToken,
        spender: quote.to,
        amount: params.amount
      });
    }

    // Execute swap
    const tx = await sendTransaction(quote);
    return { txHash: tx.hash, quote };
  }
});
```

## Best Practices

### Type Safety

Always use TypeScript strict mode and define explicit types:

```typescript
// Good
interface SwapResult {
  txHash: string;
  fromAmount: string;
  toAmount: string;
  gasUsed: bigint;
}

const execute = async (params: SwapParams): Promise<SwapResult> => {
  // Implementation
};

// Bad
const execute = async (params: any): Promise<any> => {
  // Implementation
};
```

### Error Handling

Provide meaningful error messages and handle edge cases:

```typescript
try {
  const result = await externalApiCall();
  if (!result.data) {
    throw new Error('No data returned from API');
  }
  return result.data;
} catch (error) {
  if (error instanceof NetworkError) {
    throw new Error('Network request failed. Please check connectivity.');
  }
  throw new Error(`Unexpected error: ${error.message}`);
}
```

### Logging

Use structured logging with appropriate levels:

```typescript
this.logger.debug('Fetching token price', { token, chain });
this.logger.info('Price fetched successfully', { price, source });
this.logger.warn('Fallback to secondary source', { reason });
this.logger.error('Failed to fetch price', { error, token });
```

### Configuration

Use environment variables for sensitive data:

```typescript
protected async onInit(): Promise<void> {
  const apiKey = process.env.MY_PLUGIN_API_KEY;
  if (!apiKey) {
    throw new Error('MY_PLUGIN_API_KEY environment variable required');
  }
  this.apiClient = new ApiClient(apiKey);
}
```

### Resource Cleanup

Always cleanup resources in onDestroy:

```typescript
protected async onDestroy(): Promise<void> {
  // Clear intervals/timeouts
  if (this.priceTracker) {
    clearInterval(this.priceTracker);
  }

  // Close connections
  if (this.wsConnection) {
    await this.wsConnection.close();
  }

  // Clear caches
  this.cache.clear();
}
```

### Testing Coverage

Aim for high test coverage including edge cases:

```typescript
describe('edge cases', () => {
  it('handles empty response', async () => {
    mockApi.mockResolvedValue({ data: null });
    await expect(action.execute(params)).rejects.toThrow();
  });

  it('handles timeout', async () => {
    mockApi.mockRejectedValue(new TimeoutError());
    await expect(action.execute(params)).rejects.toThrow('timeout');
  });

  it('handles rate limiting', async () => {
    mockApi.mockRejectedValue(new RateLimitError());
    const result = await action.execute(params);
    expect(result.retryAfter).toBeDefined();
  });
});
```

## Next Steps

- Review existing plugins in the [GitHub repository](https://github.com/samterminal/samterminal)
- Read the [Building Trading Agents](/docs/building-trading-agents) guide for workflow engine and order templates
- Check out [OpenClaw Skills](/docs/openclaw-skills) to teach AI assistants to use your plugins

Start building your first plugin and extend SAM Terminal with custom capabilities tailored to your needs.
