# Connecting Your OpenClaw Agent to SAM Terminal

A complete, step-by-step integration guide. By the end of this walkthrough, your OpenClaw-powered AI agent will have access to 40 blockchain tools -- token tracking, wallet monitoring, swap execution, workflow automation, notifications, and more -- all through natural language.

---

## What You'll Achieve

After following this guide, your AI agent will be able to handle conversations like this:

```
User: "What tokens am I holding on Base?"

Agent: [calls sam_get_wallet_details]
       "You have 5 tokens worth $12,340:
        - 2.1 ETH ($6,930)
        - 3,000 USDC ($3,000)
        - 50,000 DEGEN ($1,250)
        - 800 BRETT ($960)
        - 10,000 TOSHI ($200)"

User: "Set a stop-loss on BRETT at $0.80"

Agent: [calls sam_flow_create with condition nodes]
       "Done. Monitoring BRETT every 30 seconds.
        If price drops to $0.80, I'll sell your full position
        and notify you on Telegram."
```

No dashboards. No code. Just a conversation with an agent that has real onchain capabilities.

---

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** and **pnpm** installed
- **Docker** running (for PostgreSQL and Redis)
- **Go 1.21+** (for tokendata and walletdata services)
- API keys from at least one provider (see [API Keys](#step-2-configure-api-keys) below)
- An MCP-compatible AI client (Claude Desktop, Cursor, Claude Code, or any OpenClaw-compatible agent)

---

## Part 1: Setting Up SAM Terminal Backend

Your AI agent needs a running backend to connect to. SAM Terminal uses a microservices architecture where each service handles a specific domain.

### Step 1: Clone and Install

```bash
git clone https://github.com/0xtinylabs/samterminal.git
cd samterminal
cp .env.example .env
pnpm install
```

### Step 2: Configure API Keys

Edit the `.env` file with your API keys. Here's what each key enables:

| Key | Provider | Enables | Required? |
|-----|----------|---------|-----------|
| `ALCHEMY_API_KEY` | [alchemy.com](https://www.alchemy.com) | RPC access, blockchain reads | Yes |
| `MORALIS_API_KEY` | [moralis.io](https://moralis.io) | Wallet data, token metadata, security checks | Yes |
| `COINGECKO_API_KEY` | [coingecko.com](https://www.coingecko.com) | Token market data | Optional |
| `MATCHA_API_KEY` | [0x.org](https://0x.org) | DEX swap execution | For swaps |
| `MAIN_BOT_TOKEN` | [Telegram @BotFather](https://t.me/BotFather) | Telegram notifications | For alerts |
| `OPENAI_API_KEY` | [openai.com](https://platform.openai.com) | AI-powered analysis | For AI tools |
| `ANTHROPIC_API_KEY` | [anthropic.com](https://console.anthropic.com) | AI-powered analysis | For AI tools |

Minimum viable setup (token + wallet tracking only):

```env
# Blockchain RPC (Base Mainnet)
RPC_URL_BASE=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
ALCHEMY_API_KEY=YOUR_KEY

# Wallet and token data
MORALIS_API_KEY=YOUR_KEY
```

Full setup (all features):

```env
# Blockchain RPC
RPC_URL_BASE=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
RPC_WS_URL_BASE=wss://base-mainnet.g.alchemy.com/v2/YOUR_KEY
ALCHEMY_API_KEY=YOUR_KEY

# Data providers
MORALIS_API_KEY=YOUR_KEY
COINGECKO_API_KEY=YOUR_KEY

# Swap aggregator
MATCHA_API_KEY=YOUR_KEY

# Telegram notifications
MAIN_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN

# AI features
OPENAI_API_KEY=YOUR_KEY
```

### Step 3: Start Infrastructure

```bash
# Start PostgreSQL and Redis containers
docker compose up -d
```

Verify they're running:

```bash
docker compose ps
```

You should see `postgres` and `redis` containers with status `Up`.

### Step 4: Start Backend Services

SAM Terminal runs 6 microservices. Start them all:

```bash
# Build everything first
pnpm build

# Start all services (development mode)
pnpm dev
```

Or start services individually for more control:

```bash
# Go services (token and wallet data)
cd services/go/tokendata && go run . &
cd services/go/walletdata && go run . &

# NestJS services
cd services/nestjs/main && pnpm start:dev &
cd services/nestjs/swap && pnpm start:dev &
cd services/nestjs/notification && pnpm start:dev &
cd services/nestjs/transactions && pnpm start:dev &
```

### Step 5: Verify Services

Each service runs on a specific port:

| Service | Port | What It Does |
|---------|------|-------------|
| Token Data (Go) | 50061 | Token prices, metadata, pool watching, security checks |
| Wallet Data (Go) | 50062 | Wallet balances, token holdings, transaction history |
| Swap (NestJS) | 50059 | DEX swap quotes and execution via 0x/Matcha |
| Main Gateway (NestJS) | 50060 | API orchestration and routing |
| Notification (NestJS) | 50056 | Telegram and Farcaster notifications |
| Transactions (NestJS) | 50054 | Transaction tracking and history |

Quick health check:

```bash
# Check if token service is responding
curl -s http://localhost:8081/health

# Check if a gRPC port is open
nc -zv localhost 50061
nc -zv localhost 50062
```

> **Tip:** Run `pnpm sam doctor` for a comprehensive health check of all services, API keys, and database connections.

---

## Part 2: Connecting Your AI Agent via MCP

The MCP (Model Context Protocol) server is the bridge between your AI agent and SAM Terminal's backend. It exposes all 40 tools through the standardized MCP protocol.

### Architecture

```
┌─────────────────────────────────┐
│  Your AI Agent (OpenClaw)       │
│  Claude Desktop / Cursor / etc. │
└──────────────┬──────────────────┘
               │ MCP Protocol (stdio)
               v
┌─────────────────────────────────┐
│  @samterminal/mcp-server        │
│  40 tools · 9 categories        │
└──────────────┬──────────────────┘
               │ gRPC
               v
┌─────────────────────────────────┐
│  Backend Microservices          │
│  Token · Wallet · Swap · Notif  │
│  AI · Transactions              │
└──────────────┬──────────────────┘
               │
               v
     Base · Ethereum · Arbitrum
     Polygon · Optimism · BSC
```

### Option A: Claude Desktop

**1. Find the config file:**

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

**2. Add SAM Terminal MCP server:**

```json
{
  "mcpServers": {
    "sam-terminal": {
      "command": "node",
      "args": ["path/to/samterminal/packages/mcp-server/dist/index.js"],
      "env": {
        "MICROSERVICES_HOST": "localhost",
        "SAM_TOKEN_PORT": "50061",
        "SAM_WALLET_PORT": "50062",
        "SAM_SWAP_PORT": "50059",
        "SAM_MAIN_PORT": "50060",
        "SAM_NOTIFICATION_PORT": "50056"
      }
    }
  }
}
```

> **Note:** Replace `path/to/samterminal` with the absolute path to your cloned SAM Terminal repository.

**3. Restart Claude Desktop** completely (Cmd+Q on macOS, then relaunch).

**4. Verify:** Look for the tools icon in the chat interface. You should see 40 SAM Terminal tools.

### Option B: Claude Code

**1. Create MCP config:**

```bash
mkdir -p ~/.claude
```

**2. Edit `~/.claude/mcp_config.json`:**

```json
{
  "mcpServers": {
    "sam-terminal": {
      "command": "node",
      "args": ["path/to/samterminal/packages/mcp-server/dist/index.js"],
      "env": {
        "MICROSERVICES_HOST": "localhost",
        "SAM_TOKEN_PORT": "50061",
        "SAM_WALLET_PORT": "50062",
        "SAM_SWAP_PORT": "50059",
        "SAM_MAIN_PORT": "50060",
        "SAM_NOTIFICATION_PORT": "50056"
      }
    }
  }
}
```

**3. Start Claude Code** -- the MCP server connects automatically on startup.

### Option C: Cursor

**1. Open MCP settings:** Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux), search "MCP Settings".

**2. Add the same configuration** as Claude Desktop above.

**3. Reload Cursor** for changes to take effect.

### Option D: Any MCP-Compatible Client

Any client that supports the MCP protocol can connect. Point it to:

```bash
node path/to/samterminal/packages/mcp-server/dist/index.js
```

Set the environment variables for gRPC service ports. The server auto-discovers and registers all 40 tools on startup.

### Loading the Skill File

For best results, load SAM Terminal's skill file (`skill.md`) into your AI agent's context. This teaches the agent:

- What each tool does and when to use it
- Correct parameter formats and expected responses
- Safety rules for swap execution
- Workflow patterns and condition syntax

**Claude Desktop:** Attach `skill.md` to your conversation or add it to the system prompt in Developer settings.

**Claude Code:** Place `CLAUDE.md` (or `skill.md` renamed) in the project root -- it loads automatically.

**Cursor:** Place in `.cursor/` directory or add to `cursor.context.files` in workspace settings.

---

## Part 3: Complete Tool Reference

Once connected, your agent has access to 40 tools across 9 categories.

### Token Tools (7)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sam_get_tokens` | List all tracked tokens or filter by addresses | `tokenAddresses?: string[]` |
| `sam_get_token_price` | Get current price and 24h volume | `tokenAddress: string` |
| `sam_get_token_info` | Detailed metadata (name, symbol, supply, pool) | `tokenAddress: string` |
| `sam_token_track` | Start tracking a token | `tokenAddress: string` |
| `sam_token_untrack` | Stop tracking a token | `tokenAddress: string` |
| `sam_token_blacklist` | Block suspicious token addresses | `addresses: string[]` |
| `sam_token_search` | Search by name, symbol, or address | `query: string` |

### Wallet Tools (7)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sam_get_wallet` | Wallet summary (balance, total value) | `address: string, chain?: string` |
| `sam_get_wallet_tokens` | All token holdings with USD values | `address: string, chain?: string` |
| `sam_get_wallet_details` | Full breakdown (native + tokens) | `address: string, chain?: string` |
| `sam_wallet_track` | Start monitoring a wallet | `address: string, label?: string` |
| `sam_wallet_update_portfolio` | Refresh cached portfolio value | `address: string` |
| `sam_wallet_label` | Assign human-readable label | `address: string, label: string` |
| `sam_wallet_tracked_list` | List all monitored wallets | `chain?: string` |

### Swap Tools (3)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sam_swap_quote` | Get swap quote with fees and route | `fromToken, toToken, amount: string` |
| `sam_swap_execute` | Execute token swap | `fromToken, toToken, amount, slippage?: number` |
| `sam_swap_approve` | Approve ERC20 token spending | `tokenAddress, spender, amount: string` |

### Workflow Tools (7)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sam_flow_list` | List all workflows | -- |
| `sam_flow_get` | Get workflow definition and status | `flowId: string` |
| `sam_flow_create` | Create custom DAG workflow | `name, nodes[], edges[]` |
| `sam_flow_create_from_template` | Create from predefined template | `templateName, config: object` |
| `sam_flow_execute` | Run a workflow | `flowId: string, input?: object` |
| `sam_flow_status` | Check execution progress | `executionId: string` |
| `sam_flow_templates` | List available templates | -- |

### Notification Tools (4)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sam_notify_send` | Send notification (Telegram/Farcaster) | `channel, message: string` |
| `sam_notify_bot_url` | Get bot connection URLs | -- |
| `sam_notify_bot_state` | Check bot connection status | -- |
| `sam_notify_toggle` | Enable/disable notification channel | `channel: string, enabled: boolean` |

### AI Tools (3)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sam_ai_generate` | Generate text using LLM | `prompt, model?: string` |
| `sam_ai_generate_json` | Generate structured JSON output | `prompt, schema: object` |
| `sam_ai_chat` | Multi-turn chat conversation | `message, context?: string` |

### Scheduler Tools (4)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sam_schedule_create` | Create scheduled task | `cronExpression, action, params` |
| `sam_schedule_list` | List all scheduled tasks | -- |
| `sam_schedule_toggle` | Enable/disable a task | `scheduleId: string` |
| `sam_schedule_delete` | Remove a scheduled task | `scheduleId: string` |

### Chain Tools (3)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sam_chain_list` | List supported blockchains | -- |
| `sam_chain_current` | Get active chain | -- |
| `sam_chain_switch` | Switch active chain | `chainId: string` |

### Plugin Tools (2)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sam_plugin_list` | List installed plugins | -- |
| `sam_plugin_actions` | List available actions across plugins | -- |

---

## Part 4: End-to-End Examples

### Example 1: Token Research

```
User: "Tell me about this token: 0x532f27101965dd16442E59d40670FaF5eBB142E4"

Agent thinks:
  1. Get token info → sam_get_token_info
  2. Get price data → sam_get_token_price
  3. Combine and present

Agent calls:
  sam_get_token_info({ tokenAddress: "0x532f..." })
  sam_get_token_price({ tokenAddress: "0x532f..." })

Agent responds:
  "BRETT (Based Brett)
   Price: $0.12 | 24h Volume: $4.2M
   Market Cap: $156M | Liquidity: $8.3M
   Pool: 0xa8b2... on Uniswap V3"
```

### Example 2: Portfolio Check

```
User: "Show my wallet on Base"

Agent calls:
  sam_get_wallet_details({ address: "0xMyWallet...", chain: "BASE" })

Agent responds:
  "Your Base wallet (0xMyW...):
   Native: 2.1 ETH ($6,930)
   Tokens:
    - 3,000 USDC ($3,000)
    - 50,000 DEGEN ($1,250)
    - 800 BRETT ($960)
   Total: $12,140"
```

### Example 3: Swap Execution

```
User: "Swap 100 USDC to ETH"

Agent calls:
  sam_swap_quote({
    fromToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    toToken: "0x4200000000000000000000000000000000000006",
    amount: "100000000"
  })

Agent responds:
  "Quote: 100 USDC → 0.0303 ETH
   Rate: 1 ETH = $3,300
   Estimated gas: $0.12
   Slippage: 0.5%

   Shall I execute this swap?"

User: "Yes"

Agent calls:
  sam_swap_execute({ fromToken: "...", toToken: "...", amount: "100000000", slippage: 50 })

Agent responds:
  "Swap executed! TX: 0xabc123...
   Received: 0.0303 ETH"
```

### Example 4: Price Alert Workflow

```
User: "Alert me on Telegram if DEGEN drops below $0.01"

Agent calls:
  sam_token_search({ query: "DEGEN" })
  sam_flow_create({
    name: "DEGEN Price Alert",
    nodes: [
      { id: "t1", type: "trigger", config: { triggerType: "schedule", interval: 30000 } },
      { id: "a1", type: "action", config: { plugin: "tokendata", action: "getPrice", params: { address: "0x4ed4..." } } },
      { id: "c1", type: "condition", config: { conditions: [{ field: "price", operator: "lt", value: 0.01 }] } },
      { id: "a2", type: "action", config: { plugin: "telegram", action: "send", params: { message: "DEGEN dropped below $0.01!" } } },
      { id: "o1", type: "output", config: { outputType: "return" } }
    ],
    edges: [
      { from: "t1", to: "a1" },
      { from: "a1", to: "c1" },
      { from: "c1", to: "a2", type: "success" },
      { from: "c1", to: "o1", type: "failure" }
    ]
  })

Agent responds:
  "Done. Monitoring DEGEN every 30 seconds.
   You'll get a Telegram alert if price drops below $0.01."
```

### Example 5: DCA Strategy

```
User: "Buy $50 of ETH every day for 2 weeks"

Agent calls:
  sam_flow_create_from_template({
    templateName: "scheduled",
    config: {
      schedule: { cron: "0 9 * * *" },
      action: {
        plugin: "swap",
        action: "execute",
        params: {
          fromToken: "USDC",
          toToken: "ETH",
          amount: "50000000"
        }
      },
      maxExecutions: 14
    }
  })

Agent responds:
  "DCA strategy created. Buying $50 of ETH every day at 9:00 AM.
   Duration: 14 days | Total budget: $700
   You'll receive a Telegram notification after each purchase."
```

---

## Part 5: Troubleshooting

### MCP Server Won't Connect

**Symptom:** AI client shows "Connection failed" or tools don't appear.

**Check:**
1. Are backend services running?
   ```bash
   nc -zv localhost 50061  # Token service
   nc -zv localhost 50062  # Wallet service
   ```
2. Is the MCP config JSON valid? Use a JSON validator.
3. Did you restart the AI client after config changes?
4. Check Claude Desktop logs: `~/Library/Logs/Claude/` (macOS)

### Tools Appear But Return Errors

**Symptom:** Tools show in the list but fail when called.

**Check:**
1. Verify the specific backend service is running for the failing tool category
2. Check environment variables are set correctly
3. Test the service directly:
   ```bash
   curl http://localhost:8081/health      # Token service HTTP
   grpcurl -plaintext localhost:50061 list  # Token service gRPC
   ```

### "Connection Refused" on gRPC

**Symptom:** `UNAVAILABLE: Connection refused`

**Check:**
1. Service port matches MCP config port
2. No firewall blocking localhost ports
3. Docker containers are up: `docker compose ps`
4. Database is accessible: `psql $USER_DATABASE_URL -c "SELECT 1"`

### Swap Failures

**Symptom:** Swap quote works but execution fails.

**Check:**
1. Wallet has sufficient native token (ETH on Base) for gas
2. Token is approved for spending: use `sam_swap_approve` first
3. `MATCHA_API_KEY` is set and valid
4. Slippage is reasonable (default 0.5%, increase for volatile tokens)

### Missing Token Data

**Symptom:** `sam_get_token_price` returns empty or zero.

**Check:**
1. Token is being tracked: `sam_token_track` first
2. Token exists on the configured chain (default: Base)
3. Moralis/DexScreener APIs are reachable
4. Token has active trading pairs (new tokens may lack data)

---

## Part 6: Best Practices

### Security

- **Never expose private keys** in skill files, MCP configs, or conversation history
- **Use environment variables** for all secrets
- **Run `pnpm sam doctor`** periodically to validate API key health
- **Use a dedicated hot wallet** with limited funds for automated trading
- **Review swap quotes** before confirming -- never auto-execute large trades

### Performance

- **Limit concurrent workflows** -- each active workflow makes periodic API calls. 50 workflows at 30s intervals = 100 calls/minute
- **Clean up stale orders** with `sam_flow_list` and delete unused ones
- **Use appropriate check intervals** -- 30s for price alerts, daily for DCA, weekly for portfolio reports
- **Cache wallet data** -- use `sam_wallet_update_portfolio` instead of fetching from chain every time

### Multi-Chain Usage

- **Always verify the active chain** before transactions: `sam_chain_current`
- **Switch explicitly** when needed: `sam_chain_switch`
- **Remember token addresses differ across chains** -- USDC on Base is not USDC on Ethereum
- Supported chains: Base (8453), Ethereum (1), Arbitrum (42161), Polygon (137), Optimism (10), BSC (56)

### Workflow Design

- **Start with templates** (`sam_flow_create_from_template`) before building custom workflows
- **Always add notification nodes** at the end of critical workflows -- silent failures are dangerous
- **Set budget limits** on DCA and smart-entry strategies to prevent wallet drainage
- **Test with small amounts** ($1-5) before scaling up
- **Use cooldowns** to prevent rapid-fire trades during volatile periods

---

## What's Next

Now that your agent is connected, explore these resources:

- **[Getting Started](/docs/getting-started)** -- Full installation walkthrough
- **[MCP Setup Guide](/docs/mcp-setup-guide)** -- Advanced MCP configuration and troubleshooting
- **[OpenClaw Skills](/docs/openclaw-skills)** -- How skill files make your agent smarter
- **[Trading Automation](/docs/openclaw-trading-automation)** -- Build advanced trading workflows
- **[Plugin Development](/docs/plugin-development)** -- Create custom plugins for your agent
- **[Architecture Deep Dive](/docs/architecture)** -- Understand every layer of the system

---

**Last Updated:** February 18, 2026
