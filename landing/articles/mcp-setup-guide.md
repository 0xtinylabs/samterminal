# MCP Server Setup Guide

A comprehensive guide to setting up and using SAM Terminal's Model Context Protocol (MCP) server with Claude Desktop, Cursor, and Claude Code.

## What is MCP?

Model Context Protocol (MCP) is an open standard developed by Anthropic that enables AI assistants to securely connect to external data sources and tools. Instead of copying data into chat or building custom integrations, MCP provides a standardized way for AI models to access real-time data and execute actions through a unified interface.

SAM Terminal implements an MCP server that exposes blockchain operations, wallet management, token tracking, and workflow automation as structured tools that Claude can use during conversations.

## SAM Terminal MCP Server Overview

The SAM Terminal MCP server exposes **40+ tools** across **9 categories**, providing comprehensive blockchain automation capabilities:

- **Token Tools** (7) - Price tracking, search, monitoring
- **Wallet Tools** (7) - Portfolio management, balance tracking
- **Workflow Tools** (7) - Workflow creation and execution
- **Swap Tools** (3) - DEX trading operations
- **AI Tools** (3) - LLM-powered analysis
- **Notification Tools** (4) - Multi-channel alerts
- **Scheduler Tools** (4) - Automated task scheduling
- **Chain Tools** (3) - Multi-chain data access
- **Plugin Tools** (2) - Plugin management

### Architecture

The MCP server acts as a bridge between Claude and SAM Terminal's backend infrastructure:

```
Claude Desktop/Cursor
        ↓
   MCP Protocol
        ↓
SAM Terminal MCP Server (@samterminal/mcp-server)
        ↓
    gRPC Layer
        ↓
Backend Microservices (Go/NestJS)
        ↓
Blockchain Networks (Base, Ethereum, Arbitrum, Polygon, Optimism, BSC)
```

All tools communicate via gRPC with backend microservices, ensuring high performance and type safety.

## Installation

### Building from Source

Clone the repository and build the MCP server:

```bash
git clone https://github.com/0xtinylabs/samterminal.git
cd samterminal
pnpm install
pnpm build
```

The MCP server binary will be available at `packages/mcp-server/dist/index.js`. You can run it directly:

```bash
node packages/mcp-server/dist/index.js
```

## Claude Desktop Setup

### 1. Locate Configuration File

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### 2. Add MCP Server Configuration

Edit the configuration file and add the SAM Terminal MCP server:

```json
{
  "mcpServers": {
    "samterminal": {
      "command": "node",
      "args": ["path/to/samterminal/packages/mcp-server/dist/index.js"],
      "env": {
        "SAM_GRPC_HOST": "localhost",
        "SAM_MAIN_PORT": "50060",
        "SAM_TOKEN_PORT": "50061",
        "SAM_WALLET_PORT": "50062",
        "SAM_SWAP_PORT": "50059",
        "SAM_NOTIFICATION_PORT": "50056",
        "WALLET_PRIVATE_KEY": "your_private_key_here",
        "RPC_URL": "https://mainnet.base.org",
        "CHAIN_ID": "8453",
        "MATCHA_API_KEY": "your_0x_api_key",
        "COINGECKO_API_KEY": "your_coingecko_api_key",
        "MORALIS_API_KEY": "your_moralis_api_key",
        "OPENAI_API_KEY": "your_openai_api_key",
        "ANTHROPIC_API_KEY": "your_anthropic_api_key",
        "MAIN_BOT_TOKEN": "your_telegram_bot_token",
        "USER_DATABASE_URL": "postgresql://user:password@localhost:5432/samterminal_user"
      }
    }
  }
}
```

> **Note:** Replace `path/to/samterminal` with the absolute path to your cloned SAM Terminal repository.

### 3. Restart Claude Desktop

Quit Claude Desktop completely and relaunch. The MCP server will connect automatically.

### 4. Verify Connection

In Claude Desktop, look for the tools icon (hammer/wrench) in the chat interface. You should see 40+ SAM Terminal tools available.

## Cursor Setup

### 1. Open Cursor Settings

- Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
- Search for "MCP Settings"
- Select "Edit MCP Settings"

### 2. Add Configuration

Add the SAM Terminal MCP server to your settings:

```json
{
  "mcpServers": {
    "samterminal": {
      "command": "node",
      "args": ["path/to/samterminal/packages/mcp-server/dist/index.js"],
      "env": {
        "SAM_GRPC_HOST": "localhost",
        "SAM_MAIN_PORT": "50060",
        "SAM_TOKEN_PORT": "50061",
        "SAM_WALLET_PORT": "50062",
        "SAM_SWAP_PORT": "50059",
        "SAM_NOTIFICATION_PORT": "50056",
        "WALLET_PRIVATE_KEY": "your_private_key_here",
        "RPC_URL": "https://mainnet.base.org",
        "CHAIN_ID": "8453",
        "MATCHA_API_KEY": "your_0x_api_key",
        "COINGECKO_API_KEY": "your_coingecko_api_key",
        "MORALIS_API_KEY": "your_moralis_api_key",
        "OPENAI_API_KEY": "your_openai_api_key",
        "ANTHROPIC_API_KEY": "your_anthropic_api_key",
        "MAIN_BOT_TOKEN": "your_telegram_bot_token",
        "USER_DATABASE_URL": "postgresql://user:password@localhost:5432/samterminal_user"
      }
    }
  }
}
```

### 3. Reload Cursor

Reload the window or restart Cursor for changes to take effect.

### 4. Test Integration

Open Cursor's AI chat and try: "List available SAM Terminal tools"

## Claude Code Setup

### 1. Create Configuration Directory

```bash
mkdir -p ~/.claude
```

### 2. Create MCP Configuration

Create or edit `~/.claude/mcp_config.json`:

```json
{
  "mcpServers": {
    "samterminal": {
      "command": "node",
      "args": ["path/to/samterminal/packages/mcp-server/dist/index.js"],
      "env": {
        "SAM_GRPC_HOST": "localhost",
        "SAM_MAIN_PORT": "50060",
        "SAM_TOKEN_PORT": "50061",
        "SAM_WALLET_PORT": "50062",
        "SAM_SWAP_PORT": "50059",
        "SAM_NOTIFICATION_PORT": "50056",
        "WALLET_PRIVATE_KEY": "your_private_key_here",
        "RPC_URL": "https://mainnet.base.org",
        "CHAIN_ID": "8453",
        "MATCHA_API_KEY": "your_0x_api_key",
        "COINGECKO_API_KEY": "your_coingecko_api_key",
        "MORALIS_API_KEY": "your_moralis_api_key",
        "OPENAI_API_KEY": "your_openai_api_key",
        "ANTHROPIC_API_KEY": "your_anthropic_api_key",
        "MAIN_BOT_TOKEN": "your_telegram_bot_token",
        "USER_DATABASE_URL": "postgresql://user:password@localhost:5432/samterminal_user"
      }
    }
  }
}
```

### 3. Start Claude Code

```bash
claude
```

The MCP server will connect on startup.

## Available Tools Reference

### Token Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sam_get_tokens` | Get token list (all or filtered) | `addresses?: string[]` |
| `sam_get_token_price` | Get current price and volume | `contractAddress: string` |
| `sam_get_token_info` | Detailed token information | `contractAddress: string` |
| `sam_token_track` | Start tracking a token | `contractAddress: string, metadata?: object` |
| `sam_token_untrack` | Stop tracking a token | `contractAddress: string` |
| `sam_token_blacklist` | Blacklist token addresses | `addresses: string[]` |
| `sam_token_search` | Search tokens by name/symbol/address | `query: string` |

### Wallet Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sam_get_wallet` | Wallet summary (balance, total value) | `address: string, chain?: BASE` |
| `sam_get_wallet_tokens` | All token holdings with prices | `address: string, chain?: BASE` |
| `sam_get_wallet_details` | Full wallet details (summary + tokens) | `address: string, chain?: BASE` |
| `sam_wallet_track` | Start tracking a wallet | `address: string, chain?: BASE, label?: string` |
| `sam_wallet_update_portfolio` | Update cached portfolio value | `address: string, chain?: BASE` |
| `sam_wallet_label` | Assign label to wallet | `address: string, label: string` |
| `sam_wallet_tracked_list` | List all tracked wallets | `chain?: BASE` |

### Workflow Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sam_flow_list` | List all workflows | None |
| `sam_flow_get` | Get workflow details | `flowId: string` |
| `sam_flow_create` | Create custom workflow | `name: string, nodes: Node[], edges: Edge[]` |
| `sam_flow_create_from_template` | Create from template | `templateName: string, config: object` |
| `sam_flow_execute` | Execute workflow | `flowId: string, input?: object` |
| `sam_flow_status` | Get execution status | `executionId: string` |
| `sam_flow_templates` | List available templates | None |

**Workflow Node Types:** `trigger`, `action`, `condition`, `loop`, `delay`, `subflow`, `output`

**Workflow Edge Types:** `default`, `success`, `failure`, `conditional`

**Available Templates:** `simple-action`, `conditional`, `error-handling`, `scheduled`

### Swap Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sam_swap_quote` | Get swap quote | `fromToken: string, toToken: string, amount: string` |
| `sam_swap_execute` | Execute swap | `fromToken: string, toToken: string, amount: string, slippage?: number` |
| `sam_swap_approve` | Approve token spending | `tokenAddress: string, spender: string, amount: string` |

### AI Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sam_ai_chat` | Chat with AI models | `message: string, model?: string, context?: string` |
| `sam_ai_analyze` | Analyze token/wallet data | `data: object, analysisType: string` |
| `sam_ai_summarize` | Summarize blockchain data | `content: string, maxLength?: number` |

### Notification Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sam_notify_send` | Send notification | `channel: string, message: string, priority?: string` |
| `sam_notify_subscribe` | Subscribe to events | `eventType: string, channel: string, filters?: object` |
| `sam_notify_unsubscribe` | Unsubscribe from events | `subscriptionId: string` |
| `sam_notify_list` | List active subscriptions | None |

### Scheduler Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sam_schedule_create` | Create scheduled task | `cronExpression: string, action: string, params: object` |
| `sam_schedule_list` | List scheduled tasks | None |
| `sam_schedule_delete` | Delete scheduled task | `scheduleId: string` |
| `sam_schedule_pause` | Pause scheduled task | `scheduleId: string` |

### Chain Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sam_chain_info` | Get chain information | `chainId: number` |
| `sam_chain_gas` | Get current gas prices | `chainId: number` |
| `sam_chain_block` | Get block information | `chainId: number, blockNumber?: number` |

### Plugin Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sam_plugin_list` | List installed plugins | None |
| `sam_plugin_execute` | Execute plugin action | `pluginName: string, action: string, params: object` |

## Tool Usage Examples

### Example 1: Token Price Query

**User:** "What's the current price of USDC on Base?"

**Claude:** I'll check the USDC price for you.

```
Tool: sam_token_search
Input: { "query": "USDC" }
```

```
Tool: sam_get_token_price
Input: { "contractAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" }
```

**Response:** "USDC is currently trading at $1.00 with a 24h volume of $2.3M on Base."

### Example 2: Wallet Tracking

**User:** "Track this wallet and label it as 'Whale Wallet': 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

**Claude:** I'll track that wallet with the label you specified.

```
Tool: sam_wallet_track
Input: {
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "chain": "BASE",
  "label": "Whale Wallet"
}
```

**Response:** "Wallet tracked successfully. Current portfolio value: $1.2M across 15 tokens."

### Example 3: Portfolio Check

**User:** "Show me the full details of my wallet"

**Claude:** I'll retrieve your complete wallet details.

```
Tool: sam_get_wallet_details
Input: {
  "address": "0x...",
  "chain": "BASE"
}
```

**Response:** Displays native balance, total USD value, and complete token breakdown with prices.

### Example 4: Creating a Price Alert Workflow

**User:** "Create a workflow that sends me a Telegram alert when ETH drops below $2000"

**Claude:** I'll create a price monitoring workflow for you.

```
Tool: sam_flow_create
Input: {
  "name": "ETH Price Alert",
  "nodes": [
    {
      "id": "trigger-1",
      "type": "trigger",
      "config": {
        "eventType": "price_update",
        "filters": { "token": "ETH" }
      }
    },
    {
      "id": "condition-1",
      "type": "condition",
      "config": {
        "expression": "price < 2000"
      }
    },
    {
      "id": "action-1",
      "type": "action",
      "config": {
        "plugin": "telegram",
        "action": "sendMessage",
        "params": {
          "message": "ETH is below $2000!"
        }
      }
    }
  ],
  "edges": [
    { "from": "trigger-1", "to": "condition-1", "type": "default" },
    { "from": "condition-1", "to": "action-1", "type": "success" }
  ]
}
```

**Response:** "Price alert workflow created successfully. You'll receive a Telegram notification when ETH drops below $2000."

### Example 5: Token Swap

**User:** "Get me a quote to swap 100 USDC for ETH"

**Claude:** I'll get you a swap quote.

```
Tool: sam_swap_quote
Input: {
  "fromToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "toToken": "0x4200000000000000000000000000000000000006",
  "amount": "100000000"
}
```

**Response:** "You'll receive approximately 0.045 ETH for 100 USDC (current rate: $2222/ETH). Estimated gas: 0.0002 ETH."

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SAM_GRPC_HOST` | gRPC server host | `localhost` |
| `SAM_MAIN_PORT` | Main service gRPC port | `50060` |
| `SAM_TOKEN_PORT` | Token data service gRPC port | `50061` |
| `SAM_WALLET_PORT` | Wallet data service gRPC port | `50062` |
| `SAM_SWAP_PORT` | Swap service gRPC port | `50059` |
| `SAM_NOTIFICATION_PORT` | Notification service gRPC port | `50056` |
| `WALLET_PRIVATE_KEY` | Wallet private key for transactions | `0x...` |

> **Security Warning:** Never share your private key or commit it to version control. Use environment variables and consider using a dedicated hot wallet with limited funds for automated trading. For production, use a secure key management system (AWS KMS, HashiCorp Vault).

| `RPC_URL` | Blockchain RPC endpoint | `https://mainnet.base.org` |
| `CHAIN_ID` | Chain ID for transactions | `8453` (Base) |
| `USER_DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |

### Optional API Keys

| Variable | Description | Required For |
|----------|-------------|--------------|
| `MATCHA_API_KEY` | 0x Protocol API key | Swap operations |
| `COINGECKO_API_KEY` | CoinGecko API key | Token price data |
| `MORALIS_API_KEY` | Moralis API key | Wallet/token data |
| `OPENAI_API_KEY` | OpenAI API key | AI tools |
| `ANTHROPIC_API_KEY` | Anthropic API key | AI tools |
| `MAIN_BOT_TOKEN` | Telegram bot token | Telegram notifications |

### Chain ID Reference

- Base: `8453`
- Ethereum Mainnet: `1`
- Arbitrum: `42161`
- Optimism: `10`
- Polygon: `137`
- BSC: `56`

## Workflow Engine via MCP

The Workflow Engine allows you to create sophisticated automation workflows using a visual node-based system through MCP.

### Workflow Node Types

**Trigger Nodes**
- Start workflows based on events (price changes, transactions, time)

**Action Nodes**
- Execute operations (swaps, transfers, notifications)

**Condition Nodes**
- Branching logic based on boolean expressions

**Loop Nodes**
- Iterate over arrays or repeat actions

**Delay Nodes**
- Wait for specified duration

**Subflow Nodes**
- Execute nested workflows

**Output Nodes**
- Return values from workflow execution

### Creating a Workflow from Template

```
Tool: sam_flow_create_from_template
Input: {
  "templateName": "simple-action",
  "config": {
    "triggerType": "manual",
    "action": {
      "plugin": "walletdata",
      "action": "trackWallet",
      "params": {
        "address": "0x...",
        "chain": "BASE"
      }
    }
  }
}
```

### Executing a Workflow

```
Tool: sam_flow_execute
Input: {
  "flowId": "flow-123",
  "input": {
    "walletAddress": "0x...",
    "threshold": 1000
  }
}
```

### Monitoring Execution

```
Tool: sam_flow_status
Input: {
  "executionId": "exec-456"
}
```

Response includes execution state, current node, output, and error details if any.

## Troubleshooting

### MCP Server Not Connecting

**Issue:** Claude Desktop shows "Connection failed"

**Solutions:**
1. Verify backend services are running:
   ```bash
   docker compose up -d
   ```
2. Check gRPC port is accessible:
   ```bash
   nc -zv localhost 50051
   ```
3. Review Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`

### Tools Not Appearing

**Issue:** MCP tools don't show in Claude Desktop

**Solutions:**
1. Completely quit Claude Desktop (Cmd+Q on macOS)
2. Verify configuration file syntax (valid JSON)
3. Check for duplicate `mcpServers` keys
4. Restart after configuration changes

### Environment Variable Errors

**Issue:** Tools fail with "missing configuration"

**Solutions:**
1. Verify all required env vars are set in MCP config
2. Use absolute paths for file-based secrets
3. Ensure proper escaping for special characters in values
4. Check USER_DATABASE_URL format: `postgresql://user:pass@host:port/db`

### gRPC Connection Errors

**Issue:** "Connection refused" or "Unavailable"

**Solutions:**
1. Verify backend services status:
   ```bash
   docker compose ps
   ```
2. Check gRPC health:
   ```bash
   grpcurl -plaintext localhost:50051 list
   ```
3. Verify GRPC_HOST and GRPC_PORT in config
4. Check firewall rules for port 50051

### Transaction Failures

**Issue:** Swap/transfer operations fail

**Solutions:**
1. Verify wallet has sufficient native token for gas
2. Check WALLET_PRIVATE_KEY is correctly formatted (0x prefix)
3. Ensure RPC_URL is responsive and synced
4. Verify CHAIN_ID matches RPC_URL network
5. Check token approval before swaps

### API Rate Limits

**Issue:** "Rate limit exceeded" errors

**Solutions:**
1. Upgrade to paid API plans (CoinGecko, Moralis)
2. Implement caching for frequently accessed data
3. Use `sam_wallet_update_portfolio` to refresh cached data
4. Consider running your own RPC node for high-volume usage

### Database Connection Issues

**Issue:** "Connection pool exhausted" or timeouts

**Solutions:**
1. Verify PostgreSQL is running:
   ```bash
   docker compose ps postgres
   ```
2. Test database connectivity:
   ```bash
   psql $USER_DATABASE_URL -c "SELECT 1"
   ```
3. Check connection string format
4. Increase connection pool size in backend config

## Next Steps

- **Plugin Development:** Learn how to create custom plugins - see [Plugin Development Guide](/docs/plugin-development)
- **Workflow Automation:** Build advanced workflows - see [Trading Agents Guide](/docs/building-trading-agents)
## Support

- **GitHub Issues:** [github.com/0xtinylabs/samterminal](https://github.com/0xtinylabs/samterminal)
- **X (Twitter):** [@samterminalcom](https://x.com/samterminalcom)

---

**Last Updated:** February 16, 2026
