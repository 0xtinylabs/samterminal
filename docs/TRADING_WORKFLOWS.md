# SAM Terminal - Trading Workflows Cookbook

This document comprehensively explains the trading workflows you can create with SAM Terminal's existing infrastructure.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Core Concepts](#core-concepts)
3. [Beginner Workflows](#beginner-workflows)
4. [Intermediate Workflows](#intermediate-workflows)
5. [Advanced Workflows](#advanced-workflows)
6. [Condition System Reference](#condition-system-reference)
7. [MCP Tool Quick Reference](#mcp-tool-quick-reference)

---

## Introduction

SAM Terminal offers comprehensive trading automation with **10 order templates**, **40+ MCP tools**, and a **Flow Engine**. Using these tools you can:

- Create price alerts and notifications
- Define stop-loss / take-profit orders
- Automate DCA (Dollar-Cost Averaging) strategies
- Monitor whale wallets and copy their trades
- Build fully custom workflows with complete flexibility

### Supported Chains

Base (default), Ethereum, Arbitrum, Polygon, Optimism, BSC

### How It Works

```
Trigger (schedule/event) --> Token Data Query --> Condition Check --> Action (swap/notification) --> Output
```

Each workflow is executed by the Flow Engine as a **DAG (Directed Acyclic Graph)**.

---

## Core Concepts

### Order Template Types

SAM Terminal offers 10 built-in order templates:

| # | Template | Description | Status |
|---|----------|-------------|--------|
| 1 | `conditional-sell` | Sell when conditions are met | Active |
| 2 | `conditional-buy` | Buy when conditions are met | Active |
| 3 | `stop-loss` | Sell when price drops below a certain level | Active |
| 4 | `take-profit` | Sell when price rises above a certain level | Active |
| 5 | `smart-entry` | Protected buy with budget limit + cooldown | Active |
| 6 | `dca` | Automatic buy at regular intervals | Active |
| 7 | `twap` | Spread large orders over time | Defined |
| 8 | `trailing-stop` | Dynamic stop with price tracking | Active |
| 9 | `dual-protection` | Stop-loss + take-profit together | Active |
| 10 | `whale-copy` | Whale wallet monitoring + trade copying | Defined |

> **Active**: Flow generator is implemented. **Defined**: Types are defined, flow is not yet implemented.

### Condition System

Each condition consists of three components:

```typescript
{
  field: 'price',        // Which data field
  operator: 'lte',       // Comparison operator
  value: 3000            // Target value
}
```

Conditions can be combined with **AND/OR** grouping:

```typescript
{
  operator: 'AND',
  conditions: [
    { field: 'price', operator: 'lte', value: 3000 },
    { field: 'volume24h', operator: 'gte', value: 1000000 },
    {
      operator: 'OR',
      conditions: [
        { field: 'holders', operator: 'gte', value: 1000 },
        { field: 'liquidity', operator: 'gte', value: 500000 },
      ]
    }
  ]
}
```

### Flow Engine

The Flow Engine executes DAG structures composed of nodes:

| Node Type | Description |
|-----------|-------------|
| `trigger` | Initiates the flow (schedule, event, webhook, manual) |
| `action` | Runs a plugin action (swap, getMarket, send) |
| `condition` | Evaluates conditions, determines true/false path |
| `loop` | Loop for repeating operations |
| `delay` | Waits for a specified duration |
| `subflow` | Runs another flow as a nested flow |
| `output` | Returns the result (return, log, notify, store) |

### MCP Tool Usage

You can access all SAM Terminal capabilities through MCP tools (`sam_*`). Example:

```
sam_get_token_price(tokenAddress: "0x...")  -> Query price
sam_swap_execute(...)                       -> Execute swap
sam_notify_send(...)                        -> Send notification
sam_flow_create(...)                        -> Create custom flow
```

---

## Beginner Workflows

### 1. Price Alert

Monitors a specific token's price and sends a notification when the specified condition is met.

**When to Use:** When waiting for a token to reach a specific price.

**MCP Tool Chain:**
```
sam_token_track -> sam_schedule_create -> sam_get_token_price -> sam_notify_send
```

**Step by Step:**

```bash
# 1. Start tracking the token
sam_token_track(tokenAddress: "0xABC...")

# 2. Create a scheduled check (every 5 min)
sam_schedule_create(
  name: "ETH Price Alert",
  type: "interval",
  interval: 300000,
  action: {
    tool: "sam_get_token_price",
    params: { tokenAddress: "0xABC..." }
  }
)

# 3. Notify when condition is met
sam_notify_send(
  userId: "user123",
  channel: "telegram",
  message: "ETH reached $3000!"
)
```

**Flow Diagram:**
```
[Schedule: 5min]
       |
       v
[Get Token Price]
       |
       v
[Price >= 3000?]---NO---> [Wait for next cycle]
       |
      YES
       |
       v
[Send Notification]
       |
       v
[Done]
```

> **Risk:** Only sends notifications, does not execute trades. Low risk.

---

### 2. Stop-Loss Order

Automatically sells when the price drops below a certain level.

**When to Use:** To protect your investment against downside risk.

**CLI Command:**
```bash
sam order create stop-loss \
  --token 0xABC... \
  --trigger-price 2800 \
  --sell-percent 100 \
  --notify telegram
```

**TypeScript API:**
```typescript
import { createOrderTemplates, createStopLoss } from '@samterminal/core';

const templates = createOrderTemplates();

const { order, flow } = await createStopLoss(
  templates,
  '0xABC...',     // token address
  2800,           // trigger price ($)
  100,            // sell percent
  {
    chainId: 'base',
    receiveToken: 'USDC',
    notifyChannels: ['telegram'],
  }
);
```

**Generated Flow:**
```
[Schedule: 30s] --> [Get Market Data] --> [price <= $2800?]
                                              |
                                    YES       |       NO
                                     |        |        |
                                     v        |   [Next cycle]
                              [Swap: Token -> USDC]
                                     |
                                     v
                              [Telegram Notification]
                                     |
                                     v
                                  [Done]
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `token` | string | - | Token contract address (required) |
| `triggerPrice` | number | - | Trigger price (required) |
| `sellPercent` | number | 100 | Percentage to sell |
| `receiveToken` | string | USDC | Token to receive in exchange |
| `chainId` | string | base | Chain |
| `notifyChannels` | string[] | [] | Notification channels |

> **Risk:** Slippage may occur in market conditions. May not sell at the exact trigger price during a sudden drop.

---

### 3. Take-Profit Order

Automatically sells when the price rises above a certain level.

**When to Use:** To realize profits by setting a target price.

**CLI Command:**
```bash
sam order create take-profit \
  --token 0xABC... \
  --trigger-price 5000 \
  --sell-percent 50 \
  --notify telegram
```

**TypeScript API:**
```typescript
const { order } = await templates.create('take-profit', {
  token: '0xABC...',
  triggerPrice: 5000,
  sellPercent: 50,           // Sell half of the position
  receiveToken: 'USDC',
  chainId: 'base',
  notifyChannels: ['telegram'],
});
```

**Generated Flow:**
```
[Schedule: 30s] --> [Get Market Data] --> [price >= $5000?]
                                              |
                                    YES       |       NO
                                     |        |        |
                                     v        |   [Next cycle]
                             [Swap: 50% Token -> USDC]
                                     |
                                     v
                              [Telegram Notification]
```

> **Risk:** Price may rise well above the target, but it only sells at the target. Create multiple orders for staged take-profit.

---

### 4. Token Tracking

Add a token to the system and query its detailed information.

**MCP Tool Chain:**
```
sam_token_track -> sam_get_token_info -> sam_get_token_price
```

**Example:**
```bash
# Start tracking the token
sam_token_track(
  tokenAddress: "0xABC...",
  reason: "New memecoin monitoring"
)

# Get detailed info
sam_get_token_info(
  tokenAddress: "0xABC...",
  addIfNotExist: true
)

# Search token (by name/symbol)
sam_token_search(query: "PEPE")
```

> **Risk:** None - read-only operation.

---

## Intermediate Workflows

### 5. DCA (Dollar-Cost Averaging)

Buys a fixed amount of tokens at regular intervals. Reduces market timing risk.

**When to Use:** For long-term accumulation strategies.

**CLI Command:**
```bash
sam order create dca \
  --buy-token 0xABC... \
  --sell-token USDC \
  --amount 100 \
  --interval daily \
  --notify telegram
```

**TypeScript API:**
```typescript
import { createOrderTemplates, createDCA } from '@samterminal/core';

const templates = createOrderTemplates();

const { order } = await createDCA(
  templates,
  '0xABC...',    // buyToken
  'USDC',        // sellToken
  100,           // amountPerExecution ($100)
  'daily',       // interval
  {
    chainId: 'base',
    maxExecutions: 30,          // Max 30 days
    notifyChannels: ['telegram'],
  }
);
```

**Interval Options:**

| Interval | Period | Milliseconds |
|----------|--------|--------------|
| `hourly` | Every hour | 3,600,000 |
| `daily` | Every day | 86,400,000 |
| `weekly` | Every week | 604,800,000 |
| `monthly` | Every month | 2,592,000,000 |
| `number` | Custom (ms) | User-defined |

**Conditional DCA (advanced):**

Only performs DCA when certain conditions are met:

```typescript
const { order } = await templates.create('dca', {
  token: '0xABC...',
  buyToken: '0xABC...',
  sellToken: 'USDC',
  amountPerExecution: 100,
  interval: 'daily',
  conditions: {
    operator: 'AND',
    conditions: [
      { field: 'price', operator: 'lte', value: 3500 },      // Price below $3500
      { field: 'volume24h', operator: 'gte', value: 500000 }, // Min volume $500K
    ],
  },
  maxExecutions: 30,
});
```

**Flow Diagram (Conditional DCA):**
```
[Schedule: daily]
       |
       v
[Get Market Data]
       |
       v
[price <= $3500 AND volume >= $500K?]
       |                    |
      YES                   NO
       |                    |
       v              [Next day]
[Swap: $100 USDC -> Token]
       |
       v
[Telegram Notification]
       |
       v
[maxExecutions check]
```

> **Risk:** DCA buys in all conditions (in unconditional mode). Can accumulate losses during a downtrend. Using conditional DCA provides protection.

---

### 6. Conditional Buy (Dip Buying)

Automatically buys when multiple conditions are met. Differs from DCA: single execution and multi-condition.

**When to Use:** To automate "dip" buying opportunities.

**CLI Command:**
```bash
sam order create conditional-buy \
  --buy-token 0xABC... \
  --sell-token USDC \
  --amount 500 \
  --condition "price lt 2500" \
  --condition "volume24h gte 1000000" \
  --condition "holders gte 500"
```

**TypeScript API:**
```typescript
const { order } = await templates.create('conditional-buy', {
  token: '0xABC...',
  buyToken: '0xABC...',
  sellToken: 'USDC',
  spendAmount: 500,
  conditions: {
    operator: 'AND',
    conditions: [
      { field: 'price', operator: 'lt', value: 2500 },
      { field: 'volume24h', operator: 'gte', value: 1000000 },
      { field: 'holders', operator: 'gte', value: 500 },
    ],
  },
  chainId: 'base',
  notifyChannels: ['telegram'],
});
```

**Flow Diagram:**
```
[Schedule: 30s]
       |
       v
[Get Market Data: buyToken]
       |
       v
[price < $2500 AND volume >= $1M AND holders >= 500?]
       |                              |
      YES                             NO
       |                              |
       v                         [Wait]
[Swap: $500 USDC -> Token]
       |
       v
[Telegram Notification]
```

> **Risk:** Defining multiple conditions is important. Price check alone is insufficient; volume and holder checks reduce scam token risk.

---

### 7. Smart Entry

Protected entry strategy with budget limit and cooldown. An advanced version of conditional buy.

**When to Use:** To build a position within a specific budget without overtrading.

**TypeScript API:**
```typescript
const { order } = await templates.create('smart-entry', {
  token: '0xABC...',
  buyToken: '0xABC...',
  sellToken: 'USDC',
  spendAmount: 200,           // $200 per execution
  maxSpendTotal: 2000,        // Total max $2000
  cooldownMinutes: 120,       // Min 2 hours between trades
  conditions: {
    operator: 'AND',
    conditions: [
      { field: 'price', operator: 'lte', value: 3000 },
      { field: 'liquidity', operator: 'gte', value: 100000 },
      { field: 'priceChange1h', operator: 'lte', value: -5 },  // 5%+ drop in the last hour
    ],
  },
  chainId: 'base',
  notifyChannels: ['telegram'],
});
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `spendAmount` | number | - | Amount to spend per trade |
| `maxSpendTotal` | number | - | Total spending limit |
| `cooldownMinutes` | number | 60 | Min interval between trades (minutes) |
| `conditions` | ConditionGroup | - | Entry conditions |

**Flow Diagram:**
```
[Schedule: 30s]
       |
       v
[Get Market Data (includeHolders)]
       |
       v
[Conditions met?]
       |           |
      YES          NO
       |           |
       v       [Wait]
[Swap with Limits]
  - amount: $200
  - maxTotal: $2000
  - cooldown: 2h
       |
       v
[Telegram Notification]
```

> **Risk:** The cooldownMinutes and maxSpendTotal parameters limit overtrading risk. However, token liquidity and security checks remain the user's responsibility.

---

### 8. Portfolio Monitoring

Periodically checks wallet status and generates reports.

**MCP Tool Chain:**
```
sam_wallet_track -> sam_schedule_create -> sam_get_wallet_details -> sam_notify_send
```

**Example:**
```bash
# 1. Start tracking the wallet
sam_wallet_track(walletAddress: "0x123...")

# 2. Assign a label
sam_wallet_label(
  walletAddress: "0x123...",
  label: "Main Trading Wallet"
)

# 3. Create scheduled portfolio report (daily)
sam_schedule_create(
  name: "Daily Portfolio Report",
  type: "cron",
  cron: "0 9 * * *",      // Every day at 09:00
  action: {
    tool: "sam_get_wallet_details",
    params: {
      walletAddress: "0x123...",
      filterLowUSD: true
    }
  }
)

# 4. Send report to Telegram
sam_notify_send(
  userId: "user123",
  channel: "telegram",
  message: "Daily Portfolio: $12,345 (+2.3%)"
)
```

**List All Tracked Wallets:**
```bash
sam_wallet_tracked_list()
```

> **Risk:** None - read-only operation. Wallet addresses should be kept private.

---

## Advanced Workflows

### 9. Trailing Stop

A dynamic stop-loss that automatically raises the stop level as the price increases.

**When to Use:** To maximize gains from an uptrend while limiting losses.

**TypeScript API:**
```typescript
const { order } = await templates.create('trailing-stop', {
  token: '0xABC...',
  trailPercent: 10,           // Trigger when price drops 10%
  sellPercent: 100,
  activationConditions: {     // Optional: activate only when in profit
    operator: 'AND',
    conditions: [
      { field: 'price', operator: 'gte', value: 3500 },  // Must be above $3500 first
    ],
  },
  receiveToken: 'USDC',
  chainId: 'base',
  notifyChannels: ['telegram'],
});
```

**How It Works:**
```
Example: Token bought at $3000, trailPercent: 10%

Price $3000 -> Stop: none (waiting for activation)
Price $3500 -> Activation condition met! Stop: $3150
Price $4000 -> Stop updated: $3600
Price $4500 -> Stop updated: $4050
Price $4200 -> Stop still: $4050 (does not update on decline)
Price $4050 -> TRIGGERED! Sell!
```

**Flow Diagram:**
```
[Schedule: 30s]
       |
       v
[Get Market Data]
       |
       v
[Check Trailing Stop]
  - Track the peak
  - Calculate trailPercent
       |
       v
[Trailing Triggered?]
       |           |
      YES          NO
       |           |
       v       [Next cycle]
[Swap: Token -> USDC]
       |
       v
[Telegram Notification]
```

> **Risk:** Trailing stop may lag during sudden flash crashes (30s check interval). The check interval can be reduced via FlowGeneratorConfig.

---

### 10. Dual Protection (Stop-Loss + Take-Profit)

Provides both downside and upside protection. Whichever triggers first executes.

**When to Use:** To protect your position in both directions.

**CLI Command:**
```bash
sam order create dual-protection \
  --token 0xABC... \
  --stop-price 2800 \
  --target-price 5000 \
  --sell-percent 100 \
  --notify telegram
```

**TypeScript API:**
```typescript
const { order } = await templates.create('dual-protection', {
  token: '0xABC...',
  stopLoss: {
    conditions: {
      operator: 'AND',
      conditions: [
        { field: 'price', operator: 'lte', value: 2800 },
      ],
    },
    sellPercent: 100,
  },
  takeProfit: {
    conditions: {
      operator: 'AND',
      conditions: [
        { field: 'price', operator: 'gte', value: 5000 },
      ],
    },
    sellPercent: 50,            // Sell 50% at target, keep the rest
  },
  receiveToken: 'USDC',
  chainId: 'base',
  notifyChannels: ['telegram'],
});
```

**Flow Diagram:**
```
[Schedule: 30s]
       |
       v
[Get Market Data]
       |
       v
[Stop-Loss: price <= $2800?]
       |                    |
      YES                   NO
       |                    |
       v                    v
[Swap 100%]     [Take-Profit: price >= $5000?]
       |                    |              |
       v                   YES             NO
[Notification SL]          |              |
       |                    v         [Next]
       v              [Swap 50%]
    [Done]                  |
                            v
                     [Notification TP]
                            |
                            v
                         [Done]
```

> **Risk:** Stop-loss and take-profit cannot trigger simultaneously (stop-loss takes priority). The 100% stop-loss vs 50% take-profit differentiation is important.

---

### 11. Whale Copy Trading

Monitors large wallets (whales) and copies or inverses their trades.

**When to Use:** To follow strategies of successful traders.

**Parameters (WhaleCopyParams):**

| Parameter | Type | Description |
|-----------|------|-------------|
| `watchAddress` | string | Whale wallet address to monitor |
| `minTransactionValue` | number | Min transaction value ($) |
| `action` | 'copy' \| 'inverse' | Copy or inverse the trade |
| `tradeAmount` | number | Amount to use per copy trade |
| `tradeToken` | string | Trade token |
| `tokenFilter` | string[] | Only specific tokens (optional) |

**MCP Tool Chain:**
```
sam_wallet_track -> sam_get_wallet_tokens -> [Change detection] -> sam_swap_execute
```

**Example Workflow (Manual MCP):**
```bash
# 1. Start tracking the whale wallet
sam_wallet_track(walletAddress: "0xWHALE...")

# 2. Create periodic check
sam_schedule_create(
  name: "Whale Watcher",
  type: "interval",
  interval: 60000,          // Every minute
  action: {
    tool: "sam_get_wallet_tokens",
    params: { walletAddress: "0xWHALE..." }
  }
)

# 3. Swap when new token is detected
sam_swap_execute(
  fromToken: "USDC",
  toToken: "0xNEW_TOKEN...",
  amount: "100",
  chain: "BASE"
)
```

> **Risk:** High. Whale trades are not a guarantee of future performance. The `minTransactionValue` filter skips small/test transactions. The `inverse` mode is used for contrarian strategies.

---

### 12. Custom Flow Creation

You can define fully custom DAG workflows with `sam_flow_create`.

**MCP Tool:**
```bash
sam_flow_create(
  name: "My Custom Trading Flow",
  description: "Buy on price drop, sell on rise",
  nodes: [
    {
      id: "trigger-1",
      type: "trigger",
      name: "Schedule Trigger",
      position: { x: 0, y: 0 },
      data: { triggerType: "schedule", config: { interval: 60000 } }
    },
    {
      id: "get-data",
      type: "action",
      name: "Get Token Data",
      position: { x: 200, y: 0 },
      data: {
        pluginName: "tokendata",
        actionName: "getMarket",
        params: { address: "0xABC...", chainId: "base" }
      }
    },
    {
      id: "check-price",
      type: "condition",
      name: "Price Check",
      position: { x: 400, y: 0 },
      data: {
        conditions: [{ field: "priceChange1h", operator: "lte", value: -10 }],
        operator: "and"
      }
    },
    {
      id: "buy-action",
      type: "action",
      name: "Buy Token",
      position: { x: 600, y: -100 },
      data: {
        pluginName: "swap",
        actionName: "execute",
        params: { fromToken: "USDC", toToken: "0xABC...", amount: 200 }
      }
    },
    {
      id: "notify",
      type: "action",
      name: "Send Alert",
      position: { x: 800, y: -100 },
      data: {
        pluginName: "telegram",
        actionName: "send",
        params: { template: "custom-buy-alert" }
      }
    },
    {
      id: "output-1",
      type: "output",
      name: "Done",
      position: { x: 1000, y: 0 },
      data: { outputType: "return", config: {} }
    }
  ],
  edges: [
    { id: "e1", source: "trigger-1", target: "get-data", type: "default" },
    { id: "e2", source: "get-data", target: "check-price", type: "default" },
    { id: "e3", source: "check-price", target: "buy-action", type: "conditional", sourceHandle: "true" },
    { id: "e4", source: "buy-action", target: "notify", type: "default" },
    { id: "e5", source: "notify", target: "output-1", type: "default" }
  ]
)
```

**Creating from Flow Templates:**
```bash
# List available templates
sam_flow_templates()

# Create from template
sam_flow_create_from_template(
  templateId: "conditional",
  name: "My Conditional Flow"
)
```

**Flow Management:**
```bash
# List all flows
sam_flow_list()

# View flow details
sam_flow_get(flowId: "flow-123")

# Execute a flow
sam_flow_execute(flowId: "flow-123", input: { token: "0xABC..." })

# Check execution status
sam_flow_status(executionId: "exec-456")
```

---

## Condition System Reference

### Available Fields

| Field | Type | Description | Example Value |
|-------|------|-------------|---------------|
| `price` | number | Current price ($) | 3245.50 |
| `priceChange1h` | number | 1-hour price change (%) | -2.5 |
| `priceChange24h` | number | 24-hour price change (%) | 5.3 |
| `priceChange7d` | number | 7-day price change (%) | -12.1 |
| `mcap` | number | Market cap ($) | 150000000 |
| `fdv` | number | Fully diluted valuation ($) | 200000000 |
| `volume24h` | number | 24-hour trading volume ($) | 5000000 |
| `volumeChange24h` | number | 24-hour volume change (%) | 15.2 |
| `liquidity` | number | Liquidity pool size ($) | 2000000 |
| `holders` | number | Number of token holders | 1500 |
| `tokenAge` | number | Token age (days) | 30 |
| `txCount24h` | number | 24-hour transaction count | 500 |
| `buyCount24h` | number | 24-hour buy count | 300 |
| `sellCount24h` | number | 24-hour sell count | 200 |
| `buyPressure` | number | Buy pressure ratio (0-1) | 0.6 |
| `sellPressure` | number | Sell pressure ratio (0-1) | 0.4 |

### Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equal to | `{ field: 'holders', operator: 'eq', value: 1000 }` |
| `neq` | Not equal to | `{ field: 'price', operator: 'neq', value: 0 }` |
| `gt` | Greater than | `{ field: 'volume24h', operator: 'gt', value: 1000000 }` |
| `gte` | Greater than or equal to | `{ field: 'mcap', operator: 'gte', value: 10000000 }` |
| `lt` | Less than | `{ field: 'price', operator: 'lt', value: 100 }` |
| `lte` | Less than or equal to | `{ field: 'priceChange24h', operator: 'lte', value: -10 }` |
| `between` | Within range (inclusive) | `{ field: 'price', operator: 'between', value: [2500, 3500] }` |
| `change` | Change percentage | `{ field: 'price', operator: 'change', value: -5 }` |

### Nested Condition Examples

**Example 1: Buy Opportunity Detection**
```typescript
{
  operator: 'AND',
  conditions: [
    // Price is cheap
    { field: 'price', operator: 'lte', value: 1.0 },
    // Sufficient liquidity exists
    { field: 'liquidity', operator: 'gte', value: 100000 },
    // AND one of the following:
    {
      operator: 'OR',
      conditions: [
        // Either volume has increased
        { field: 'volumeChange24h', operator: 'gte', value: 50 },
        // Or new holders are coming in
        { field: 'holders', operator: 'gte', value: 500 },
      ],
    },
  ],
}
```

**Example 2: Risk Alert**
```typescript
{
  operator: 'OR',
  conditions: [
    // Price dropped more than 20%
    { field: 'priceChange24h', operator: 'lte', value: -20 },
    // Liquidity dropped significantly
    { field: 'liquidity', operator: 'lt', value: 50000 },
    // Sell pressure is very high
    { field: 'sellPressure', operator: 'gte', value: 0.8 },
  ],
}
```

**Example 3: Safe Token Filter**
```typescript
{
  operator: 'AND',
  conditions: [
    { field: 'holders', operator: 'gte', value: 1000 },
    { field: 'liquidity', operator: 'gte', value: 500000 },
    { field: 'tokenAge', operator: 'gte', value: 7 },
    { field: 'volume24h', operator: 'gte', value: 100000 },
    // Buy/sell is balanced
    { field: 'buyPressure', operator: 'between', value: [0.3, 0.7] },
  ],
}
```

---

## MCP Tool Quick Reference

### Token Tools (7)

| Tool | Description |
|------|-------------|
| `sam_get_tokens` | Token list (all or filtered) |
| `sam_get_token_price` | Current price and volume |
| `sam_get_token_info` | Detailed token info (name, symbol, supply, pool) |
| `sam_token_track` | Start tracking a token |
| `sam_token_untrack` | Stop tracking a token |
| `sam_token_blacklist` | Add token addresses to blacklist |
| `sam_token_search` | Search tokens by name/symbol/address |

### Wallet Tools (7)

| Tool | Description |
|------|-------------|
| `sam_get_wallet` | Wallet summary (balance, total value) |
| `sam_get_wallet_tokens` | All tokens and their values in the wallet |
| `sam_get_wallet_details` | Full wallet details (summary + tokens) |
| `sam_wallet_track` | Start monitoring a wallet |
| `sam_wallet_update_portfolio` | Update portfolio value |
| `sam_wallet_label` | Assign a label to a wallet |
| `sam_wallet_tracked_list` | List monitored wallets |

### Flow Tools (7)

| Tool | Description |
|------|-------------|
| `sam_flow_list` | List all workflows |
| `sam_flow_get` | View workflow details |
| `sam_flow_create` | Create custom workflow (node + edge) |
| `sam_flow_create_from_template` | Create workflow from template |
| `sam_flow_execute` | Execute a workflow |
| `sam_flow_status` | Query execution status |
| `sam_flow_templates` | List available templates |

### Swap Tools (3)

| Tool | Description |
|------|-------------|
| `sam_swap_quote` | Pre-swap price/fee estimate |
| `sam_swap_execute` | Execute a token swap |
| `sam_swap_approve` | Grant ERC20 token spending allowance |

### Notification Tools (4)

| Tool | Description |
|------|-------------|
| `sam_notify_send` | Send Telegram/Farcaster notification |
| `sam_notify_bot_url` | Get bot connection URLs |
| `sam_notify_bot_state` | View bot connection status |
| `sam_notify_toggle` | Enable/disable a notification channel |

### Scheduler Tools (4)

| Tool | Description |
|------|-------------|
| `sam_schedule_create` | Create a scheduled task (cron/interval) |
| `sam_schedule_list` | List scheduled tasks |
| `sam_schedule_toggle` | Enable/disable a task |
| `sam_schedule_delete` | Delete a scheduled task |

### AI Tools (3)

| Tool | Description |
|------|-------------|
| `sam_ai_generate` | Generate text with AI (analysis, summary, strategy) |
| `sam_ai_generate_json` | Generate structured JSON output with AI |
| `sam_ai_chat` | Multi-turn AI chat |

### Chain Tools (3)

| Tool | Description |
|------|-------------|
| `sam_chain_list` | List supported chains |
| `sam_chain_current` | View active chain |
| `sam_chain_switch` | Switch active chain |

### Plugin Tools (2)

| Tool | Description |
|------|-------------|
| `sam_plugin_list` | List installed plugins |
| `sam_plugin_actions` | List all plugin actions |

---

## Appendix: Quick Start Guide

### 1. Create Your First Workflow

```bash
# Start tracking a token
sam_token_track(tokenAddress: "0x4200000000000000000000000000000000000006")

# Create a stop-loss order
sam order create stop-loss \
  --token 0x4200000000000000000000000000000000000006 \
  --trigger-price 2800 \
  --sell-percent 100

# Check your orders
sam order list --status active
```

### 2. Order Management

```bash
# View order details
sam order get <orderId>

# Pause an order
sam order pause <orderId>

# Resume an order
sam order resume <orderId>

# Cancel an order
sam order cancel <orderId>
```

### 3. Flow Engine Configuration Tips

```typescript
// Reduce check interval (faster response, more API calls)
const templates = createOrderTemplates({
  flowGenerator: {
    defaultCheckInterval: 15000,    // 15 seconds (default: 30s)
    defaultReceiveToken: 'USDC',
    defaultChainId: 'base',
  },
});
```

---

> **Disclaimer:** The strategies in this document are for educational purposes. Trading involves financial risk. Automated trading bots can lead to unexpected losses. Do your own research and practice risk management.
