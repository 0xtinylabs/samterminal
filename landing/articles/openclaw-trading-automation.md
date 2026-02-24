# OpenClaw + SAM Terminal: Turn Your AI Agent into an Onchain Trading Machine

Your AI agent already understands natural language. With SAM Terminal's OpenClaw skill, it can now understand onchain trading too. This guide walks you through connecting SAM Terminal to your OpenClaw-powered agent, setting up real trading infrastructure, and building production-grade automation workflows -- from simple price alerts to multi-condition DCA strategies.

By the end, your agent will be able to execute swaps, track wallets, monitor prices, schedule recurring strategies, and send Telegram alerts -- all through natural language commands.

---

## What You're Building

Here's what the end result looks like. A user talks to their AI agent:

```
User: "Track DEGEN on Base and alert me on Telegram if it drops below $0.01"

Agent:
  1. sam_token_search({ query: "DEGEN" })
  2. sam_token_track({ tokenAddress: "0x4ed4..." })
  3. sam_flow_create({
       name: "DEGEN Price Alert",
       nodes: [schedule, getPrice, condition, notify],
       edges: [...]
     })

Agent: "Done. I'm monitoring DEGEN every 30 seconds.
        You'll get a Telegram alert if it drops below $0.01."
```

No code written. No dashboard opened. Just a conversation.

---

## Architecture Overview

Before diving into setup, here's how the pieces connect:

```
┌──────────────────────────────────┐
│  AI Agent (Claude, GPT, etc.)    │
│  with OpenClaw Skill loaded      │
└──────────────┬───────────────────┘
               │ MCP Protocol (stdio)
               v
┌──────────────────────────────────┐
│  @samterminal/mcp-server         │
│  40 tools across 9 categories   │
└──────────────┬───────────────────┘
               │ gRPC
               v
┌──────────────────────────────────┐
│  SAM Terminal Backend            │
│  ┌─────────┐ ┌──────────┐       │
│  │ Token    │ │ Wallet   │       │
│  │ Service  │ │ Service  │       │
│  ├─────────┤ ├──────────┤       │
│  │ Swap     │ │ Notif.   │       │
│  │ Service  │ │ Service  │       │
│  ├─────────┤ ├──────────┤       │
│  │ AI       │                    │
│  │ Service  │                    │
│  └─────────┘                    │
│       PostgreSQL + Redis         │
└──────────────────────────────────┘
               │
               v
    Base, Ethereum, Arbitrum,
    Polygon, Optimism, BSC
```

The MCP server is the bridge. It translates natural language tool calls from your AI agent into gRPC calls to the backend microservices. Your agent never touches raw blockchain RPCs -- it works with high-level abstractions like `sam_swap_execute` and `sam_get_token_price`.

---

## Part 1: Setting Up SAM Terminal

### Prerequisites

- Node.js 18+ and pnpm
- Docker (for PostgreSQL and Redis)
- API keys: Alchemy (RPC), Moralis (data), and optionally Telegram bot token

### Step 1: Clone and Configure

```bash
git clone https://github.com/samterminal/samterminal.git
cd samterminal
cp .env.example .env
```

Edit `.env` with your keys:

```env
# Required for token/wallet data
ALCHEMY_API_KEY=your_alchemy_key
MORALIS_API_KEY=your_moralis_key

# Required for swap execution
MATCHA_API_KEY=your_0x_key

# Optional: Telegram notifications
MAIN_BOT_TOKEN=your_telegram_bot_token

# Optional: AI features
OPENAI_API_KEY=your_openai_key
```

> **Tip:** Run `sam doctor` after setup to validate all keys and check service connectivity.

### Step 2: Start Services

```bash
# Start PostgreSQL and Redis
docker compose -f docker-compose.dev.yml up -d

# Install, generate protos, build
pnpm install && pnpm proto:gen && pnpm build

# Run database migrations
make db-migrate

# Start all services in development mode
pnpm dev
```

At this point, the gRPC services are running on localhost with these default ports:

| Service | Port |
|---------|------|
| Token Data | 50061 |
| Wallet Data | 50062 |
| Swap | 50059 |
| Main | 50060 |
| Notification | 50056 |
| Transactions | 50054 |

### Step 3: Verify with Doctor

```bash
sam doctor
```

Expected output:

```
SAM Terminal Doctor
────────────────────────────────

System Prerequisites
  ✓ Node.js: v22.0.0
  ✓ pnpm: 9.15.0
  ✓ Docker: Docker version 27.x

Services
  ✓ PostgreSQL (localhost:5432): Reachable
  ✓ Redis (localhost:6379): Reachable
  ✓ Docker Engine: Running

API Keys
  ✓ Alchemy API Key: valid
  ✓ Moralis API Key: valid
  ✓ Telegram Bot Token: @my_bot
  ○ OpenAI API Key: Not set (optional)

All checks passed! (10 pass, 1 warnings)
```

---

## Part 2: Connecting Your OpenClaw Agent

### Option A: Claude Desktop

Add the MCP server to your Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "sam-terminal": {
      "command": "node",
      "args": ["./packages/mcp-server/dist/index.js"],
      "cwd": "/path/to/samterminal",
      "env": {
        "MICROSERVICES_HOST": "localhost"
      }
    }
  }
}
```

Restart Claude Desktop. You should see "sam-terminal" in the MCP tools list with 40 tools available.

### Option B: Using the OpenClaw Skill Package

If your platform supports OpenClaw skill discovery, the skill package at `packages/openclaw-skill/` provides everything automatically:

```json
{
  "name": "sam-terminal",
  "mcp": {
    "command": "npx",
    "args": ["@samterminal/mcp-server"],
    "env": {
      "SAM_GRPC_HOST": "localhost",
      "SAM_TOKEN_PORT": "50061",
      "SAM_WALLET_PORT": "50062",
      "SAM_SWAP_PORT": "50059"
    }
  }
}
```

The `SKILL.md` file teaches the agent what each tool does, when to use it, and critical safety rules. This is what makes the agent competent at trading -- not just capable.

### Option C: Cursor / Other MCP Clients

Any MCP-compatible client works. Point it to the MCP server binary and set the gRPC host environment variables. The server auto-discovers all backend services.

---

## Part 3: What Your Agent Can Do

Once connected, your agent has access to 40 tools across 9 categories. Here's what matters for trading:

### Token Intelligence

```
"What's BRETT trading at?"
→ sam_token_search + sam_get_token_price

"Give me full details on this token: 0x532f..."
→ sam_get_token_info (name, symbol, supply, pool, price, volume)

"Start tracking TOSHI"
→ sam_token_track (enables price monitoring and alerts)
```

### Wallet Management

```
"Show my Base wallet"
→ sam_get_wallet_details (all holdings with USD values)

"Label this wallet as 'DCA Bot'"
→ sam_wallet_label

"What wallets am I tracking?"
→ sam_wallet_tracked_list
```

### Swap Execution

```
"Swap 0.5 ETH to USDC on Base"
→ sam_swap_quote → user confirmation → sam_swap_execute
```

The SKILL.md enforces a strict safety protocol:

1. **Always quote first** -- show the user expected output and fees
2. **Always confirm** -- never execute without explicit "yes"
3. **Slippage guard** -- warn at >3%, refuse at >10%
4. **Large trade warning** -- extra confirmation for trades >$1000

### Notifications

```
"Send me a Telegram message when this is done"
→ sam_notify_send

"Set up my Telegram bot"
→ sam_notify_bot_url → user clicks link → sam_notify_bot_state to verify
```

### Scheduling

```
"Check ETH price every hour"
→ sam_schedule_create with cron: "0 * * * *"

"What schedules are running?"
→ sam_schedule_list
```

---

## Part 4: Trading Automation Workflows

This is where SAM Terminal really shines. The Workflow Engine lets your agent build DAG-based automation workflows through natural language.

### Workflow 1: Price Alert

**The conversation:**
```
User: "Alert me on Telegram if ETH drops below $3000"
```

**What the agent builds:**

```
[Schedule: 30s] → [Get ETH Price] → [Price < $3000?]
                                          │
                                   YES    │    NO
                                    │     │     │
                                    v     │  [wait]
                            [Telegram Alert]
```

**The tool calls:**
```
1. sam_token_search({ query: "ETH" })
2. sam_flow_create({
     name: "ETH Price Alert",
     nodes: [
       { type: "trigger", data: { triggerType: "schedule", config: { interval: 30000 } } },
       { type: "action", data: { pluginName: "tokendata", actionName: "getMarket", params: { address: "0x..." } } },
       { type: "condition", data: { conditions: [{ field: "price", operator: "lt", value: 3000 }] } },
       { type: "action", data: { pluginName: "telegram", actionName: "send", params: { message: "ETH is below $3000!" } } },
       { type: "output", data: { outputType: "return" } }
     ],
     edges: [...]
   })
```

### Workflow 2: Dollar-Cost Averaging (DCA)

**The conversation:**
```
User: "Buy $100 of ETH every day using USDC"
```

**What the agent builds:**

```
[Schedule: daily] → [Swap $100 USDC → ETH] → [Telegram: "DCA executed"]
```

**Best practice configuration:**
- Set `maxExecutions` to limit total buys (e.g., 30 for a month)
- Add conditions to skip buys during extreme volatility
- Use `sam_get_wallet_details` before each buy to verify USDC balance

### Workflow 3: Conditional DCA (Smart Buy)

**The conversation:**
```
User: "Buy $200 of ETH daily, but only when price is below $3500
       and 24h volume is above $1M. Max budget: $5000 total."
```

**What the agent builds:**

```
[Schedule: daily]
      │
      v
[Get ETH Market Data]
      │
      v
[Price < $3500 AND Volume > $1M?]
      │                │
     YES               NO
      │                │
      v            [skip]
[Swap $200 USDC → ETH]
  (maxTotal: $5000)
      │
      v
[Telegram: "Bought $200 ETH at $X"]
```

This uses the `smart-entry` order template under the hood with budget limits and cooldown protection.

### Workflow 4: Stop-Loss + Take-Profit (Dual Protection)

**The conversation:**
```
User: "I'm holding BRETT. Set a stop-loss at $0.05 and take-profit at $0.15.
       Sell everything on stop-loss, sell 50% on take-profit."
```

**What the agent builds:**

```
[Schedule: 30s]
      │
      v
[Get BRETT Price]
      │
      v
[Price ≤ $0.05?]──YES──→ [Sell 100%] → [Alert: "Stop-loss hit"]
      │
      NO
      │
      v
[Price ≥ $0.15?]──YES──→ [Sell 50%] → [Alert: "Take-profit hit"]
      │
      NO
      │
   [wait]
```

The stop-loss branch has priority -- if both trigger simultaneously, it sells everything first.

### Workflow 5: Whale Copy Trading

**The conversation:**
```
User: "Watch this wallet: 0xWhale...
       When they buy any token worth more than $5000, buy $500 of the same token."
```

**What the agent builds:**

```
[Schedule: 60s]
      │
      v
[Get Whale Wallet Tokens]
      │
      v
[Compare with Previous Snapshot]
      │
      v
[New Token > $5000 Purchase?]──YES──→ [Swap $500 → Same Token] → [Alert]
      │
      NO
      │
   [wait]
```

> **Risk warning:** Whale copy trading is inherently risky. The agent should warn the user about front-running risk, timing delays, and the fact that past performance doesn't predict future results.

### Workflow 6: Portfolio Rebalance Alert

**The conversation:**
```
User: "Every morning at 9am, check my portfolio and send me a summary
       on Telegram with each token's allocation percentage."
```

**What the agent builds:**

```
[Schedule: cron "0 9 * * *"]
      │
      v
[Get Wallet Details]
      │
      v
[AI Generate Summary]
      │
      v
[Telegram: formatted portfolio report]
```

This combines `sam_get_wallet_details` with `sam_ai_generate` to produce a human-readable daily briefing.

---

## Part 5: Best Practices

### Safety First

These rules are embedded in the SKILL.md file. Your agent should follow them automatically, but verify:

1. **Never auto-execute swaps.** Always show a quote and wait for explicit confirmation.
2. **Validate before trading.** Check token liquidity, holder count, and age before buying. Low liquidity = high slippage risk.
3. **Set budget limits.** Use `maxSpendTotal` on smart-entry and DCA orders. Unbounded strategies can drain wallets.
4. **Use cooldowns.** The `cooldownMinutes` parameter prevents rapid-fire trades during volatile periods.
5. **Monitor slippage.** Refuse trades with >10% slippage unless the user explicitly overrides.

### Condition Design

Good conditions prevent bad trades. Here are proven patterns:

**Safe token filter (use before any buy):**
```
Holders ≥ 1000 AND Liquidity ≥ $500K AND TokenAge ≥ 7 days AND Volume24h ≥ $100K
```

**Dip buy signal:**
```
PriceChange1h ≤ -5% AND Volume24h ≥ $1M AND BuyPressure ≥ 0.4
```

**Danger signal (trigger alerts):**
```
PriceChange24h ≤ -20% OR Liquidity < $50K OR SellPressure ≥ 0.8
```

### Available Condition Fields

| Field | What it measures |
|-------|-----------------|
| `price` | Current token price in USD |
| `priceChange1h` | 1-hour price change (%) |
| `priceChange24h` | 24-hour price change (%) |
| `priceChange7d` | 7-day price change (%) |
| `mcap` | Market capitalization ($) |
| `volume24h` | 24-hour trading volume ($) |
| `liquidity` | Liquidity pool size ($) |
| `holders` | Number of token holders |
| `txCount24h` | 24-hour transaction count |
| `buyPressure` | Buy pressure ratio (0-1) |
| `sellPressure` | Sell pressure ratio (0-1) |

### Operators

`eq` (equal), `neq` (not equal), `gt` (greater), `gte` (greater or equal), `lt` (less), `lte` (less or equal), `between` (range), `change` (% change from previous)

### Workflow Engine Tips

- **Check interval:** Default is 30 seconds. For price alerts, this is fine. For DCA, use the named intervals (`hourly`, `daily`, `weekly`).
- **Notifications:** Always add a notification node at the end of critical workflows. Silent failures are the worst kind.
- **Chain awareness:** Always specify `chainId` in workflow nodes. If omitted, it defaults to Base.
- **Template first:** Use `sam_flow_create_from_template` for standard patterns before building custom workflows.

### Monitoring Your Workflows

```
"What workflows are running?"       → sam_flow_list
"Show me details of workflow X"    → sam_flow_get
"What's the status of execution Y" → sam_flow_status
"List my active orders"            → sam order list --status active
```

Teach your agent to proactively check workflow status after creation and report any failures.

---

## Part 6: Operational Best Practices

### API Key Management

- **Never hardcode keys** in skill files or prompts. Use environment variables.
- **Rotate keys regularly.** If a key leaks, it has direct access to your trading infrastructure.
- **Use separate keys** for development and production.
- **Run `sam doctor` periodically** to verify all keys are still valid.

### Resource Management

- **Limit concurrent workflows.** Each active workflow makes periodic API calls. 50 workflows checking every 30 seconds = 100 API calls/minute.
- **Clean up completed orders.** Use `sam order list` and cancel stale ones.
- **Monitor schedule count.** Too many schedules can overwhelm the backend. Use `sam_schedule_list` to audit.

### Multi-Chain Considerations

- **Always verify the active chain** before executing a transaction: `sam_chain_current`
- **Switch explicitly** when needed: `sam_chain_switch({ chainId: "arbitrum" })`
- **Token addresses differ across chains.** USDC on Base is not the same contract as USDC on Ethereum.

### Testing Strategies

Before deploying a trading strategy with real funds:

1. **Start with alerts only.** Build the workflow but replace swap actions with notifications.
2. **Use small amounts.** Test with $1-5 trades to verify the workflow works end-to-end.
3. **Monitor for a day.** Watch how the workflow behaves across market conditions.
4. **Gradually increase.** Scale up amounts only after confirming correct behavior.

---

## Quick Reference: Essential Commands

| What you want | What to say to your agent |
|---------------|--------------------------|
| Check a token price | "What's the price of X?" |
| Track a token | "Start tracking X" |
| View wallet | "Show my wallet on Base" |
| Swap tokens | "Swap X for Y" |
| Set price alert | "Alert me if X drops below $Y" |
| Create DCA | "Buy $X of Y every day/week" |
| Set stop-loss | "Set stop-loss on X at $Y" |
| Set take-profit | "Sell half my X when it reaches $Y" |
| Portfolio report | "Give me a portfolio summary every morning" |
| Watch a whale | "Track wallet 0x... and copy trades above $X" |
| Check status | "What flows/orders/schedules are running?" |
| Switch chain | "Switch to Arbitrum" |

---

## Conclusion

SAM Terminal turns your OpenClaw agent from a chatbot into a trading operator. The combination of 40 MCP tools, a DAG-based workflow engine, 10 order templates, and a condition system with 11 data fields gives your agent everything it needs to execute sophisticated onchain strategies.

The key insight: **you don't need to be a developer to build trading automation.** If you can describe what you want in plain English, your agent can build it.

Start simple -- track a token, set a price alert. Then layer on complexity: add conditions, schedule DCA, set up dual protection. The infrastructure scales with your ambition.

**Resources:**

- [Getting Started](/docs/getting-started) -- First-time setup walkthrough
- [MCP Setup Guide](/docs/mcp-setup-guide) -- Detailed MCP configuration
- [OpenClaw Skills](/docs/openclaw-skills) -- How skill files work
- [Building Trading Agents](/docs/building-trading-agents) -- Advanced agent patterns
- [GitHub Repository](https://github.com/samterminal/samterminal) -- Source code and issues
