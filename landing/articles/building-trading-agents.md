# Building Trading Agents with SAM Terminal

Trading agents are automated systems that execute trades based on predefined strategies, market conditions, and custom logic. SAM Terminal provides a comprehensive framework for building sophisticated trading agents that can operate across multiple blockchain networks with minimal code.

This guide walks through the complete process of building production-ready trading agents, from basic order templates to complex multi-chain strategies with AI-assisted decision making.

## Agent Architecture

SAM Terminal's architecture consists of four core components:

**1. Plugins** - Modular capabilities for your agent (token data, swaps, wallet monitoring, AI analysis, notifications)

**2. Runtime Engine** - State machine that manages agent lifecycle, task scheduling, and execution

**3. Workflow Engine** - DAG-based workflow system for complex multi-step strategies

**4. Order Templates** - Pre-built trading patterns for common strategies (stop-loss, DCA, trailing stops, etc.)

The runtime engine orchestrates plugin interactions, while the workflow engine enables custom logic workflows. Order templates provide high-level abstractions for common trading patterns.

## Setting Up a Trading Agent

Start by installing SAM Terminal and creating a basic agent:

```bash
npm install -g @samterminal/cli
sam init my-trading-agent
cd my-trading-agent
```

Create a TypeScript agent with all necessary plugins:

```typescript
import { SAMTerminal } from '@samterminal/core';
import { TokenDataPlugin } from '@samterminal/plugin-tokendata';
import { SwapPlugin } from '@samterminal/plugin-swap';
import { WalletDataPlugin } from '@samterminal/plugin-walletdata';
import { AIPlugin } from '@samterminal/plugin-ai';
import { TelegramPlugin } from '@samterminal/plugin-telegram';

const agent = new SAMTerminal({
  name: 'my-trading-agent',
  plugins: [
    new TokenDataPlugin({
      providers: {
        coingecko: { apiKey: process.env.COINGECKO_API_KEY },
        dexscreener: {},
        moralis: { apiKey: process.env.MORALIS_API_KEY }
      }
    }),
    new SwapPlugin({
      providers: {
        matcha: { apiKey: process.env.MATCHA_API_KEY }
      },
      defaultSlippage: 0.005, // 0.5%
      defaultDeadline: 300, // 5 minutes
    }),
    new WalletDataPlugin({
      providers: {
        moralis: { apiKey: process.env.MORALIS_API_KEY }
      }
    }),
    new AIPlugin({
      providers: {
        anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
        openai: { apiKey: process.env.OPENAI_API_KEY }
      },
      defaultProvider: 'anthropic',
      defaultModel: 'claude-sonnet-4-6'
    }),
    new TelegramPlugin({
      botToken: process.env.MAIN_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID
    })
  ],
  chains: {
    default: 'base',
    enabled: ['base', 'ethereum', 'arbitrum', 'polygon']
  },
  runtime: {
    maxConcurrentTasks: 5,
    taskTimeout: 120000 // 2 minutes
  }
});

await agent.start();
console.log('Trading agent is running...');
```

Configure your environment variables:

```bash
# .env
COINGECKO_API_KEY=your_key
MORALIS_API_KEY=your_key
MATCHA_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
MAIN_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
WALLET_PRIVATE_KEY=your_private_key
```

> **Security Warning:** Never commit your `.env` file or share your private key. Use a dedicated hot wallet with limited funds for automated trading. For production, use a secure key management system (AWS KMS, HashiCorp Vault).

## Order Templates

SAM Terminal provides 10 pre-built order templates for common trading strategies. Each template can be created via CLI or TypeScript API.

### Stop-Loss Orders

Automatically sell when price drops below a trigger:

```bash
sam order create stop-loss \
  --token ETH \
  --trigger-price 3000 \
  --sell-percent 100 \
  --notify telegram
```

```typescript
import { OrderTemplates } from '@samterminal/core';

const templates = new OrderTemplates(agent.runtime);

const { order } = await templates.create('stop-loss', {
  token: 'ETH',
  triggerPrice: 3000,
  sellPercent: 100,
  chain: 'base'
});

// Or use convenience function
const stopLoss = await createStopLoss(agent.runtime, {
  token: '0x4200000000000000000000000000000000000006', // WETH on Base
  triggerPrice: 3000,
  sellPercent: 50 // Sell 50% of holdings
});
```

### Take-Profit Orders

Automatically sell when price rises above target:

```bash
sam order create take-profit \
  --token ETH \
  --trigger-price 4000 \
  --sell-percent 50 \
  --notify telegram
```

```typescript
const takeProfit = await createTakeProfit(agent.runtime, {
  token: 'ETH',
  triggerPrice: 4000,
  sellPercent: 50
});
```

### DCA (Dollar-Cost Averaging)

Automatically buy fixed amounts at regular intervals:

```bash
sam order create dca \
  --buy-token ETH \
  --sell-token USDC \
  --amount 100 \
  --interval daily \
  --notify telegram
```

```typescript
const dca = await createDCA(agent.runtime, {
  buyToken: 'ETH',
  sellToken: 'USDC',
  amountPerExecution: 100,
  interval: 'daily' // Options: hourly, daily, weekly, monthly
});
```

### TWAP (Time-Weighted Average Price)

Similar to DCA but distributes execution across time for better price averaging:

```bash
sam order create twap \
  --buy-token ETH \
  --sell-token USDC \
  --amount 100 \
  --interval hourly
```

```typescript
const twap = await templates.create('twap', {
  buyToken: 'ETH',
  sellToken: 'USDC',
  amountPerExecution: 100,
  interval: 'hourly'
});
```

### Conditional Buy Orders

Buy when specific conditions are met:

```bash
sam order create conditional-buy \
  --buy-token AERO \
  --sell-token USDC \
  --amount 1000 \
  --condition "price < 1.5" \
  --condition "volume24h > 1000000"
```

```typescript
const conditionalBuy = await templates.create('conditional-buy', {
  buyToken: 'AERO',
  sellToken: 'USDC',
  amount: 1000,
  conditions: {
    type: 'and',
    conditions: [
      { field: 'price', operator: 'lt', value: 1.5 },
      { field: 'volume24h', operator: 'gt', value: 1000000 }
    ]
  }
});
```

### Conditional Sell Orders

Sell when market conditions change:

```bash
sam order create conditional-sell \
  --token ETH \
  --sell-percent 100 \
  --condition "rsi > 70" \
  --condition "priceChange24h > 15"
```

```typescript
const conditionalSell = await createConditionalSell(agent.runtime, {
  token: 'ETH',
  sellPercent: 100,
  conditions: {
    type: 'or',
    conditions: [
      { field: 'rsi', operator: 'gt', value: 70 },
      { field: 'priceChange24h', operator: 'gt', value: 15 }
    ]
  }
});
```

### Smart Entry Orders

Buy with budget protection and cooldown to prevent overtrading:

```bash
sam order create smart-entry \
  --buy-token ETH \
  --sell-token USDC \
  --budget 5000 \
  --cooldown 3600
```

```typescript
const smartEntry = await templates.create('smart-entry', {
  buyToken: 'ETH',
  sellToken: 'USDC',
  budget: 5000, // Maximum to spend
  cooldown: 3600 // Wait 1 hour between executions
});
```

### Trailing Stop Orders

Dynamic stop-loss that follows price movements:

```bash
sam order create trailing-stop \
  --token ETH \
  --trail-percent 5
```

```typescript
const trailingStop = await templates.create('trailing-stop', {
  token: 'ETH',
  trailPercent: 5 // Trigger sell if price drops 5% from peak
});
```

### Dual Protection Orders

Combine stop-loss and take-profit in one order:

```bash
sam order create dual-protection \
  --token ETH \
  --stop-price 2800 \
  --target-price 4200
```

```typescript
const dualProtection = await templates.create('dual-protection', {
  token: 'ETH',
  stopPrice: 2800,
  targetPrice: 4200
});
```

### Whale Copy Trading

Automatically copy trades from successful wallets:

```bash
sam order create whale-copy \
  --wallet 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb \
  --auto-execute
```

```typescript
const whaleCopy = await templates.create('whale-copy', {
  walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  autoExecute: true,
  minTradeSize: 10000 // Only copy trades > $10k
});
```

## Workflow Engine for Custom Strategies

For strategies beyond simple order templates, use the Workflow Engine to build DAG-based workflows with complex logic.

### Node Types

The Workflow Engine supports seven node types:

- **trigger** - Start execution (webhook, schedule, event)
- **action** - Execute plugin action (swap, send notification, etc.)
- **condition** - Branch based on evaluation
- **loop** - Iterate (count, forEach, while)
- **delay** - Wait before continuing
- **subflow** - Execute another workflow
- **output** - Set workflow result

### Example: AI-Assisted Trading Workflow

Create a workflow that analyzes market conditions with AI before executing trades:

```typescript
const flow = {
  id: 'ai-trading-workflow',
  name: 'AI-Assisted Trading',
  nodes: [
    {
      id: 'trigger',
      type: 'trigger',
      data: { schedule: '0 */6 * * *' } // Every 6 hours
    },
    {
      id: 'get-price',
      type: 'action',
      data: {
        plugin: 'tokendata',
        action: 'getPrice',
        params: {
          token: '{{ input.token }}',
          chain: 'base'
        }
      }
    },
    {
      id: 'get-market-data',
      type: 'action',
      data: {
        plugin: 'tokendata',
        action: 'getMarketData',
        params: {
          token: '{{ input.token }}'
        }
      }
    },
    {
      id: 'analyze',
      type: 'action',
      data: {
        plugin: 'ai',
        action: 'chat',
        params: {
          messages: [
            {
              role: 'system',
              content: 'You are a crypto trading analyst. Analyze the provided data and recommend BUY, SELL, or HOLD.'
            },
            {
              role: 'user',
              content: 'Price: ${{ get-price.price }}, Volume 24h: ${{ get-market-data.volume24h }}, Price Change 24h: {{ get-market-data.priceChange24h }}%'
            }
          ],
          temperature: 0.3
        }
      }
    },
    {
      id: 'check-recommendation',
      type: 'condition',
      data: {
        conditions: {
          field: 'analyze.response',
          operator: 'contains',
          value: 'BUY'
        }
      }
    },
    {
      id: 'execute-buy',
      type: 'action',
      data: {
        plugin: 'swap',
        action: 'executeSwap',
        params: {
          tokenIn: 'USDC',
          tokenOut: '{{ input.token }}',
          amountIn: '{{ input.buyAmount }}',
          slippage: 0.005
        }
      }
    },
    {
      id: 'notify-success',
      type: 'action',
      data: {
        plugin: 'telegram',
        action: 'sendMessage',
        params: {
          text: 'Executed buy order for {{ input.token }} at ${{ get-price.price }}'
        }
      }
    }
  ],
  edges: [
    { source: 'trigger', target: 'get-price' },
    { source: 'get-price', target: 'get-market-data' },
    { source: 'get-market-data', target: 'analyze' },
    { source: 'analyze', target: 'check-recommendation' },
    {
      source: 'check-recommendation',
      target: 'execute-buy',
      sourceHandle: 'true',
      type: 'conditional'
    },
    {
      source: 'execute-buy',
      target: 'notify-success',
      type: 'success'
    }
  ]
};

const result = await agent.runtime.flowEngine.execute(flow, {
  token: 'ETH',
  buyAmount: 1000
});
```

### Variable Substitution

Use `{{ path.to.value }}` syntax to reference data from previous nodes:

```typescript
{
  id: 'swap',
  type: 'action',
  data: {
    plugin: 'swap',
    action: 'executeSwap',
    params: {
      tokenIn: 'USDC',
      tokenOut: '{{ input.token }}',
      amountIn: '{{ analyze.recommendedAmount }}',
      slippage: '{{ config.defaultSlippage }}'
    }
  }
}
```

### Condition Operators

Available operators for conditional logic:

- **Comparison**: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`
- **String**: `contains`, `startsWith`, `endsWith`
- **Array**: `in`, `notIn`
- **Null**: `isNull`, `isNotNull`

### Loop Patterns

Execute nodes multiple times:

```typescript
{
  id: 'dca-loop',
  type: 'loop',
  data: {
    loopType: 'count',
    count: 10,
    maxIterations: 10
  }
}
```

```typescript
{
  id: 'process-tokens',
  type: 'loop',
  data: {
    loopType: 'forEach',
    items: '{{ input.tokens }}',
    maxIterations: 50
  }
}
```

### Error Handling

Add error handling edges to gracefully handle failures:

```typescript
{
  source: 'execute-swap',
  target: 'notify-error',
  sourceHandle: 'error',
  type: 'failure'
}
```

## Scheduling Strategies

SAM Terminal supports two scheduling approaches:

### Cron-based Scheduling

Use cron expressions for precise timing:

```typescript
const flow = {
  nodes: [
    {
      id: 'trigger',
      type: 'trigger',
      data: {
        schedule: '0 9,15,21 * * *' // 9 AM, 3 PM, 9 PM daily
      }
    }
    // ... other nodes
  ]
};
```

### Interval-based Scheduling

Use intervals for simpler recurring tasks:

```typescript
await agent.runtime.scheduler.schedule({
  id: 'portfolio-check',
  interval: 3600000, // Every hour
  handler: async () => {
    const portfolio = await agent.getData('walletdata', 'getPortfolio', {
      address: process.env.WALLET_ADDRESS
    });
    console.log('Portfolio value:', portfolio.totalValue);
  }
});
```

## Multi-Chain Trading

Execute trades across multiple chains with automatic chain switching:

```typescript
// Trade on Base
await agent.executeAction('swap', 'executeSwap', {
  tokenIn: 'USDC',
  tokenOut: 'ETH',
  amountIn: 1000,
  chain: 'base'
});

// Trade on Arbitrum
await agent.executeAction('swap', 'executeSwap', {
  tokenIn: 'USDC',
  tokenOut: 'ARB',
  amountIn: 1000,
  chain: 'arbitrum'
});

// Create cross-chain strategy
const multiChainFlow = {
  nodes: [
    {
      id: 'check-base-price',
      type: 'action',
      data: {
        plugin: 'tokendata',
        action: 'getPrice',
        params: { token: 'ETH', chain: 'base' }
      }
    },
    {
      id: 'check-arbitrum-price',
      type: 'action',
      data: {
        plugin: 'tokendata',
        action: 'getPrice',
        params: { token: 'ETH', chain: 'arbitrum' }
      }
    },
    {
      id: 'find-arbitrage',
      type: 'condition',
      data: {
        conditions: {
          field: 'check-base-price.price',
          operator: 'lt',
          value: '{{ check-arbitrum-price.price * 0.98 }}' // 2% spread
        }
      }
    }
    // ... execute arbitrage
  ]
};
```

## Portfolio Monitoring

Monitor wallet holdings and trigger actions based on portfolio changes:

```typescript
const portfolioMonitor = {
  nodes: [
    {
      id: 'trigger',
      type: 'trigger',
      data: { schedule: '*/15 * * * *' } // Every 15 minutes
    },
    {
      id: 'get-portfolio',
      type: 'action',
      data: {
        plugin: 'walletdata',
        action: 'getPortfolio',
        params: {
          address: process.env.WALLET_ADDRESS,
          chain: 'base'
        }
      }
    },
    {
      id: 'check-exposure',
      type: 'condition',
      data: {
        conditions: {
          type: 'or',
          conditions: [
            {
              field: 'get-portfolio.tokens[0].percentOfPortfolio',
              operator: 'gt',
              value: 50 // Single token > 50% of portfolio
            },
            {
              field: 'get-portfolio.totalValue',
              operator: 'lt',
              value: 5000 // Portfolio < $5000
            }
          ]
        }
      }
    },
    {
      id: 'rebalance-alert',
      type: 'action',
      data: {
        plugin: 'telegram',
        action: 'sendMessage',
        params: {
          text: 'Portfolio rebalancing needed. Top holding: {{ get-portfolio.tokens[0].symbol }} ({{ get-portfolio.tokens[0].percentOfPortfolio }}%)'
        }
      }
    }
  ]
};
```

## AI-Assisted Trading

Integrate AI analysis into your trading strategies:

```typescript
// Analyze market sentiment
const sentiment = await agent.executeAction('ai', 'classify', {
  input: 'ETH price increased 15% in 24h with high volume',
  categories: ['bullish', 'neutral', 'bearish']
});

// Generate trading signal
const signal = await agent.executeAction('ai', 'chat', {
  messages: [
    {
      role: 'system',
      content: 'You are a crypto trading analyst. Provide BUY, SELL, or HOLD recommendation with confidence score.'
    },
    {
      role: 'user',
      content: `Analyze: Price $3500, Volume 24h $25B, RSI 68, MACD bullish crossover`
    }
  ],
  temperature: 0.2
});

// Extract structured data
const metrics = await agent.executeAction('ai', 'extract', {
  input: 'ETH is trading at $3500 with a market cap of $420B',
  schema: {
    price: 'number',
    marketCap: 'number'
  }
});
```

## Risk Management

Implement comprehensive risk controls:

```typescript
const safeSwapConfig = {
  defaultSlippage: 0.005, // 0.5% max slippage
  defaultDeadline: 300, // 5 minute deadline
  minOutputAmount: true, // Enforce minimum output
  dryRun: process.env.NODE_ENV !== 'production' // Test in development
};

// Add budget limits to orders
const budgetLimitedOrder = await templates.create('dca', {
  buyToken: 'ETH',
  sellToken: 'USDC',
  amountPerExecution: 100,
  interval: 'daily',
  maxTotalSpend: 5000 // Stop after spending $5000
});

// Implement circuit breakers
const circuitBreaker = {
  nodes: [
    {
      id: 'check-losses',
      type: 'condition',
      data: {
        conditions: {
          field: 'portfolio.dailyPnl',
          operator: 'lt',
          value: -500 // Lost > $500 today
        }
      }
    },
    {
      id: 'pause-trading',
      type: 'action',
      data: {
        plugin: 'core',
        action: 'pauseAllOrders',
        params: {}
      }
    },
    {
      id: 'alert',
      type: 'action',
      data: {
        plugin: 'telegram',
        action: 'sendMessage',
        params: {
          text: 'ALERT: Daily loss limit reached. All trading paused.'
        }
      }
    }
  ]
};
```

## Notifications

Configure Telegram alerts for trade execution and important events:

```typescript
// Send notification after each trade
const notifyingOrder = await templates.create('stop-loss', {
  token: 'ETH',
  triggerPrice: 3000,
  sellPercent: 100,
  notifications: {
    telegram: {
      onTrigger: true,
      onSuccess: true,
      onError: true
    }
  }
});

// Custom notification workflow
await agent.executeAction('telegram', 'sendMessage', {
  text: `Trade executed: Sold ${amount} ETH at $${price}`
});
```

## Managing Orders

Use the CLI to manage active orders:

```bash
# List all orders
sam order list

# Filter by status
sam order list --status active
sam order list --status paused

# Filter by type
sam order list --type stop-loss
sam order list --type dca

# Get order details
sam order get <orderId>

# Pause order
sam order pause <orderId>

# Resume order
sam order resume <orderId>

# Cancel order
sam order cancel <orderId>
```

Programmatically manage orders:

```typescript
// List active orders
const orders = await templates.list({
  status: 'active',
  type: 'stop-loss'
});

// Cancel order
await templates.cancel(orders[0].id);

// Pause order
await templates.pause(orders[0].id);

// Resume order
await templates.resume(orders[0].id);
```

## Best Practices

### Security

- Store private keys in secure key management systems (AWS KMS, HashiCorp Vault)
- Use environment variables for API keys and secrets
- Enable transaction simulation before execution
- Implement rate limiting on API calls
- Use read-only RPC endpoints for price checking

### Testing

Test your strategies thoroughly before deploying:

```typescript
// Use dry run mode
const agent = new SAMTerminal({
  // ... config
  runtime: {
    dryRun: true // Simulate without executing
  }
});

// Test with small amounts first
const testOrder = await templates.create('dca', {
  buyToken: 'ETH',
  sellToken: 'USDC',
  amountPerExecution: 10, // Start small
  interval: 'hourly'
});
```

### Monitoring

Implement comprehensive logging and monitoring:

```typescript
agent.runtime.on('order:executed', (order) => {
  console.log('Order executed:', order);
  // Send to logging service
});

agent.runtime.on('error', (error) => {
  console.error('Agent error:', error);
  // Alert on-call engineer
});

agent.runtime.on('flow:completed', (result) => {
  console.log('Workflow completed:', result);
  // Track metrics
});
```

### Performance

- Use multicall for batch price queries
- Cache frequently accessed data (token prices, metadata)
- Optimize gas usage with proper gas estimation
- Use WebSocket connections for real-time data

## Next Steps

Now that you understand how to build trading agents, explore these advanced topics:

- [Plugin Development](/docs/plugin-development) - Build custom plugins for your strategy
- [MCP Setup Guide](/docs/mcp-setup-guide) - Control your agent with AI assistants
- [OpenClaw Skills](/docs/openclaw-skills) - Teach AI assistants to operate your agent
- [Getting Started](/docs/getting-started) - Complete setup guide for SAM Terminal

For more examples, check the [playground examples](https://github.com/samterminal/samterminal/tree/main/apps/playground/src/examples) in the repository.
