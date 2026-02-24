# SAM Terminal — AI Agent Skill Guide

> This file teaches AI assistants how to operate SAM Terminal projects. Use it as context for Claude, Cursor, or any MCP-compatible assistant.

## CLI Commands

### Setup
```bash
# Clone and setup
git clone https://github.com/0xtinylabs/samterminal.git
cd samterminal && cp .env.example .env
pnpm install && pnpm build
pnpm dev                       # Start in dev mode (hot reload)
```

## Configuration

Config file: `samterminal.config.json`

```json
{
  "name": "my-agent",
  "plugins": [
    "@samterminal/plugin-tokendata",
    "@samterminal/plugin-swap",
    "@samterminal/plugin-walletdata",
    "@samterminal/plugin-ai",
    "@samterminal/plugin-telegram"
  ],
  "chains": {
    "default": "base",
    "supported": ["base", "ethereum", "arbitrum", "polygon", "optimism", "bsc"]
  },
  "runtime": {
    "port": 3000,
    "logLevel": "info"
  }
}
```

## Available Plugins

| Plugin | Package | Description |
|--------|---------|-------------|
| TokenData | `@samterminal/plugin-tokendata` | Token prices, metadata, search, security, pools, market data |
| Swap | `@samterminal/plugin-swap` | DEX swap execution via 0x API, quotes, allowances |
| WalletData | `@samterminal/plugin-walletdata` | Portfolio, token balances, NFTs, transactions, approvals |
| AI | `@samterminal/plugin-ai` | Multi-provider AI (OpenAI, Anthropic, Ollama) — chat, classify, generate, summarize |
| Telegram | `@samterminal/plugin-telegram` | Telegram bot notifications and alerts |
| Onboarding | `@samterminal/plugin-onboarding` | User onboarding flows and progress tracking |

## Environment Variables

```bash
# Core
SAM_GRPC_HOST=localhost
SAM_LOG_LEVEL=info

# Database
USER_DATABASE_URL=postgresql://user:pass@localhost:5432/samterminal_user
REDIS_URL=redis://localhost:6379

# Plugin: TokenData
MORALIS_API_KEY=your_moralis_key
COINGECKO_API_KEY=your_coingecko_key

# Plugin: Swap
MATCHA_API_KEY=your_0x_key

# Plugin: AI
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Plugin: Telegram
MAIN_BOT_TOKEN=your_bot_token

# MCP Server
SAM_MCP_PORT=3001
```

## Programmatic API

```typescript
import { SAMTerminal } from '@samterminal/core';
import { TokenDataPlugin } from '@samterminal/plugin-tokendata';
import { SwapPlugin } from '@samterminal/plugin-swap';

// Initialize
const agent = new SAMTerminal({
  name: 'my-agent',
  plugins: [
    new TokenDataPlugin({ moralisApiKey: process.env.MORALIS_API_KEY }),
    new SwapPlugin({ matchaApiKey: process.env.MATCHA_API_KEY }),
  ],
  chains: { default: 'base' },
});

// Start the agent
await agent.start();

// Execute actions
const price = await agent.execute('tokendata:get-price', { symbol: 'ETH' });
const quote = await agent.execute('swap:get-quote', {
  fromToken: 'USDC',
  toToken: 'ETH',
  amount: '100',
  chain: 'base',
});

// Create and run flows
const flow = agent.createFlow({
  name: 'my-flow',
  nodes: [
    { id: 'step1', type: 'action', data: { plugin: 'tokendata', action: 'getPrice', params: { symbol: 'ETH' } } },
    { id: 'step2', type: 'action', data: { plugin: 'ai', action: 'classify', params: { input: '{{step1.result}}', categories: ['buy', 'hold', 'sell'] } } },
  ],
  edges: [
    { source: 'step1', target: 'step2' },
  ],
});
await flow.execute();

// Schedule recurring tasks
agent.schedule({ name: 'hourly-check', cron: '0 * * * *', flow: 'my-flow' });

// Shutdown gracefully
await agent.shutdown();
```

## MCP Server Setup

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sam-terminal": {
      "command": "node",
      "args": ["path/to/samterminal/packages/mcp-server/dist/index.js"],
      "env": {
        "SAM_GRPC_HOST": "localhost",
        "SAM_MAIN_PORT": "50060",
        "SAM_TOKEN_PORT": "50061",
        "SAM_WALLET_PORT": "50062",
        "SAM_SWAP_PORT": "50059",
        "SAM_NOTIFICATION_PORT": "50056"
      }
    }
  }
}
```

The MCP server exposes 40 tools across 9 categories: Token, Wallet, Flow, Swap, AI, Notification, Scheduler, Chain, Plugin.

## Project Structure

```
samterminal/
├── packages/
│   ├── core/              # Runtime engine, plugin system, workflow engine
│   ├── cli/               # CLI tool (sam init, run, dev, plugin, order)
│   ├── mcp-server/        # MCP protocol server (40+ tools)
│   └── plugins/
│       ├── ai/            # AI provider (OpenAI, Anthropic, Ollama)
│       ├── tokendata/     # Token prices and market data
│       ├── walletdata/    # Wallet portfolio and transactions
│       ├── swap/          # DEX swap execution
│       ├── telegram/      # Telegram notifications
│       └── onboarding/    # User onboarding flows
├── services/
│   ├── nestjs/            # NestJS microservices (TypeScript)
│   └── go/                # Go microservices (high-performance)
├── apps/
│   └── playground/        # Example agents and usage demos
├── proto/                 # gRPC Protocol Buffer definitions
└── docker-compose.yml     # Full stack orchestration
```

## Common Workflows

### New Agent Setup
1. `git clone https://github.com/0xtinylabs/samterminal.git`
2. `cd samterminal && cp .env.example .env`
3. Edit `.env` with your API keys
4. `pnpm install && pnpm build`
5. `pnpm dev` — start in development mode

### Adding a Plugin
1. Add plugin to `samterminal.config.json`
2. Add config in `samterminal.config.json`
3. Set required env vars
4. Restart agent

### Running with Docker
```bash
git clone https://github.com/0xtinylabs/samterminal.git
cd samterminal && cp .env.example .env
docker compose up -d
```
