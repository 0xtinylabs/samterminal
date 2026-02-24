# Getting Started with SAM Terminal

## Introduction

SAM Terminal is a modular, plugin-based autonomous trading agent framework designed for EVM ecosystems. Built with TypeScript and powered by a Turborepo monorepo architecture, it combines the flexibility of microservices with the robustness of enterprise-grade infrastructure.

**Who is SAM Terminal for?**

- Blockchain developers building trading bots and automation tools
- DeFi projects requiring programmatic trading capabilities
- Teams building agent-based systems for token tracking, portfolio management, and automated trading
- Developers who want a production-ready framework instead of building from scratch

SAM Terminal provides a plugin ecosystem that handles the complex parts (chain interactions, data providers, swap execution) so you can focus on your agent's business logic.

## Prerequisites

Before installing SAM Terminal, ensure you have the following installed:

**Required:**
- **Node.js 18+** - JavaScript runtime ([download](https://nodejs.org))
- **pnpm** - Fast, disk space efficient package manager (`npm install -g pnpm`)
- **Docker** - For running PostgreSQL, Redis, and microservices ([download](https://docker.com))
- **Git** - Version control system

**Optional but recommended:**
- **Docker Compose** (usually included with Docker Desktop)
- A code editor (VS Code, Cursor, etc.)
- Basic understanding of TypeScript and blockchain concepts

**Verify your installation:**

```bash
node --version  # Should be v18.0.0 or higher
pnpm --version  # Should be 9.0.0 or higher
docker --version
git --version
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/samterminal/samterminal.git
cd samterminal
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs all packages across the monorepo using pnpm workspaces.

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys (we'll cover this in detail later):

```bash
# Required for most plugins
ALCHEMY_API_KEY=your_alchemy_key
MORALIS_API_KEY=your_moralis_key

# Optional: For AI features
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Optional: For Telegram notifications
MAIN_BOT_TOKEN=your_telegram_bot_token

# Optional: For swap functionality
MATCHA_API_KEY=your_0x_api_key

# Database (defaults work for local development)
DATABASE_URL=postgresql://user:password@localhost:5432/samterminal
REDIS_URL=redis://localhost:6379
```

### 4. Setup Development Environment

SAM Terminal provides a convenient command to setup everything:

```bash
npx sam setup
```

This command will:
- Install all dependencies
- Build all packages
- Run database migrations
- Verify Docker services

Alternatively, you can run these steps manually:

```bash
pnpm install
pnpm build
docker compose up -d
pnpm db:migrate
```

## Quick Start with CLI

SAM Terminal includes a powerful CLI that streamlines agent creation and management.

### Creating Your First Agent

**Option 1: Using a Template**

```bash
npx sam init my-trading-agent --template web3-agent
```

Available templates:
- `basic` - Minimal setup with core functionality
- `telegram-bot` - Agent with Telegram notification support
- `web3-agent` - Full-featured trading agent with swap capabilities
- `custom` - Start from scratch

**Option 2: Interactive Wizard Mode (Recommended for beginners)**

```bash
npx sam init my-agent --wizard
```

The wizard will guide you through:

1. **Profile Selection:**
   - `minimal` - Core functionality only
   - `trader` - Token tracking + swap capabilities
   - `notifier` - Token tracking + Telegram notifications
   - `full` - All plugins enabled
   - `custom` - Pick and choose

2. **Chain Selection:**
   - Base (default, L2 with low fees)
   - Ethereum Mainnet
   - Arbitrum
   - Polygon
   - Optimism
   - BSC

3. **API Key Validation:** The wizard validates your API keys before proceeding

4. **Package Manager:** Choose between pnpm, npm, or yarn

**Option 3: Full Custom Configuration**

```bash
npx sam init my-agent \
  --template custom \
  --plugins tokendata,walletdata,swap,ai \
  --typescript \
  --pm pnpm \
  --skip-install
```

Available CLI options:
- `--template <name>` - Use a predefined template
- `--typescript / --no-typescript` - Enable/disable TypeScript
- `--plugins <list>` - Comma-separated plugin list
- `--skip-install` - Don't run package installation
- `--pm <manager>` - Package manager (pnpm/npm/yarn)
- `--wizard` - Interactive setup mode

## Project Structure

After running `sam init`, you'll get a project structure like this:

```
my-trading-agent/
├── samterminal.config.json  # Main configuration file
├── .env                     # Environment variables
├── .env.example            # Template for required env vars
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
├── src/
│   ├── index.ts            # Main entry point
│   ├── agents/             # Your agent implementations
│   │   └── basic.ts        # Example agent
│   └── examples/           # Usage examples
│       ├── ai-chat.ts
│       ├── token-tracker.ts
│       └── onboarding.ts
└── node_modules/
```

**Key files explained:**

- `samterminal.config.json` - Defines your agent's plugins, chains, and behavior
- `src/index.ts` - Entry point where your agent starts
- `src/agents/` - Your custom agent logic lives here
- `.env` - Sensitive configuration (never commit this!)

## Configuration

The `samterminal.config.json` file is the heart of your agent configuration:

```json
{
  "name": "my-trading-agent",
  "version": "1.0.0",
  "plugins": [
    "@samterminal/plugin-tokendata",
    "@samterminal/plugin-walletdata",
    "@samterminal/plugin-swap",
    "@samterminal/plugin-ai"
  ],
  "chains": {
    "default": "base",
    "enabled": ["base", "ethereum", "arbitrum"],
    "rpc": {
      "base": "https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}",
      "ethereum": "https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}",
      "arbitrum": "https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}"
    }
  },
  "agent": {
    "maxConcurrentTasks": 5,
    "retryAttempts": 3,
    "timeout": 30000
  }
}
```

**Configuration sections:**

- `plugins` - Array of plugin package names to load
- `chains.default` - Primary blockchain for operations
- `chains.enabled` - List of chains your agent can interact with
- `chains.rpc` - RPC endpoints (supports env variable interpolation)
- `agent` - Runtime behavior settings

## Starting Services

SAM Terminal requires several backend services. Start them using Docker Compose:

```bash
docker compose up -d
```

This starts:

**Databases:**
- **PostgreSQL** (port 5432) - Main database for persistent storage
- **Redis** (port 6379) - Caching and pub/sub messaging

**Go Microservices:**
- **tokendata** - Token price feeds, metadata, security analysis
- **walletdata** - Portfolio tracking, transaction history, NFTs

**NestJS Services:**
- **main** - Core API gateway and orchestration
- **notification** - Push notifications and alerts
- **swap** - DEX swap execution and routing
- **transactions** - Transaction monitoring and indexing
**Verify services are running:**

```bash
docker compose ps
```

All services should show status "Up".

**Useful Docker commands:**

```bash
# View logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f tokendata

# Restart a service
docker compose restart swap

# Stop all services
docker compose down

# Stop and remove all data (careful!)
docker compose down -v
```

## Running Your Agent

### Development Mode (Recommended)

```bash
npx sam dev
```

This runs your agent with:
- Hot reload on file changes
- Verbose logging
- Auto-restart on crashes

### Production Mode

```bash
npx sam run
```

**Advanced run options:**

```bash
# Use a custom config file
npx sam run --config ./config/production.json

# Use a different environment file
npx sam run --env .env.production

# Enable watch mode manually
npx sam run --watch

# Run on a specific port
npx sam run --port 3001
```

**Monitoring your agent:**

Your agent will log to console. Look for:
- Plugin initialization messages
- Chain connection confirmations
- Active tasks and their status
- Errors and warnings

Example output:
```
[SAM Terminal] Starting agent: my-trading-agent
[Plugins] Loading @samterminal/plugin-tokendata
[Plugins] Loading @samterminal/plugin-swap
[Chains] Connected to Base (chainId: 8453)
[Agent] Ready - listening for tasks
```

## Installing Plugins

SAM Terminal's plugin system provides modular functionality.

### Available Plugins

**@samterminal/plugin-tokendata**
- Real-time token prices (CoinGecko, DexScreener)
- Token search and metadata
- Security analysis and risk scoring
- Liquidity pool information
- **Required API Keys:** MORALIS_API_KEY, ALCHEMY_API_KEY

**@samterminal/plugin-walletdata**
- Portfolio tracking and valuation
- Token balance queries
- NFT holdings
- Transaction history and indexing
- Approval management
- **Required API Keys:** MORALIS_API_KEY, ALCHEMY_API_KEY

**@samterminal/plugin-swap**
- DEX swap execution via 0x Protocol
- Multi-hop routing for best prices
- Slippage protection
- Gas optimization
- Token approval management
- **Required API Keys:** ALCHEMY_API_KEY
- **Optional:** ZEROX_API_KEY (for higher rate limits)

**@samterminal/plugin-ai**
- Multi-provider AI support (OpenAI, Anthropic)
- Chat completions for natural language interfaces
- Text classification and extraction
- Content generation and summarization
- Embeddings for semantic search
- **Required API Keys:** OPENAI_API_KEY or ANTHROPIC_API_KEY

**@samterminal/plugin-telegram**
- Send notifications to Telegram
- Bot-based user interactions
- Command handling
- Toggle notifications on/off
- **Required API Keys:** MAIN_BOT_TOKEN

**@samterminal/plugin-onboarding**
- User onboarding workflow management
- Step completion tracking
- Progress monitoring
- Custom user data storage
- **No API keys required**

### Installing Plugins via CLI

```bash
# Install a single plugin
npx sam plugin install tokendata

# Install multiple plugins at once
npx sam plugin install tokendata walletdata swap

# List installed plugins
npx sam plugin list

# Remove a plugin
npx sam plugin remove ai

# Enable a disabled plugin
npx sam plugin enable telegram

# Disable a plugin without removing it
npx sam plugin disable telegram
```

### Installing Plugins via Config

Edit `samterminal.config.json`:

```json
{
  "plugins": [
    "@samterminal/plugin-tokendata",
    "@samterminal/plugin-walletdata",
    "@samterminal/plugin-swap"
  ]
}
```

Then reinstall dependencies:

```bash
pnpm install
```

## API Keys Setup

### Alchemy (Required for most plugins)

Alchemy provides RPC endpoints for blockchain interaction.

1. Sign up at [alchemy.com](https://www.alchemy.com)
2. Create a new app
3. Select your chains (Base, Ethereum, Arbitrum, etc.)
4. Copy your API key
5. Add to `.env`: `ALCHEMY_API_KEY=your_key_here`

**Used by:** tokendata, walletdata, swap

### Moralis (Required for tokendata and walletdata)

Moralis provides enriched blockchain data APIs.

1. Sign up at [moralis.io](https://moralis.io)
2. Go to Account Settings > Keys
3. Copy your Web3 API key
4. Add to `.env`: `MORALIS_API_KEY=your_key_here`

**Used by:** tokendata, walletdata

### 0x API Key (Optional, for swap)

The 0x Protocol powers DEX aggregation.

1. Sign up at [0x.org/docs](https://0x.org/docs)
2. Generate an API key
3. Add to `.env`: `ZEROX_API_KEY=your_key_here`

**Benefits:** Higher rate limits, better pricing
**Used by:** swap plugin

### OpenAI (Optional, for AI features)

1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Go to API Keys section
3. Create a new secret key
4. Add to `.env`: `OPENAI_API_KEY=your_key_here`

**Used by:** ai plugin

### Anthropic (Alternative to OpenAI)

1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Generate an API key
3. Add to `.env`: `ANTHROPIC_API_KEY=your_key_here`

**Used by:** ai plugin (alternative to OpenAI)

### Telegram Bot Token (Optional, for notifications)

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the instructions
3. Copy the bot token
4. Add to `.env`: `MAIN_BOT_TOKEN=your_token_here`

**Used by:** telegram plugin

## Verifying Setup

SAM Terminal includes a diagnostic tool to verify your setup:

```bash
npx sam doctor
```

This command checks:

1. **Prerequisites:**
   - Node.js version
   - pnpm installation
   - Docker availability

2. **Services:**
   - PostgreSQL connection
   - Redis connection
   - Microservice health

3. **API Keys:**
   - Validates each configured API key
   - Tests connectivity to external APIs
   - Reports which plugins are ready

4. **Configuration:**
   - Validates samterminal.config.json syntax
   - Checks for missing required fields
   - Warns about deprecated options

**Example output:**

```
SAM Terminal Doctor

Prerequisites:
✓ Node.js v20.10.0
✓ pnpm 8.15.0
✓ Docker 24.0.6

Services:
✓ PostgreSQL (localhost:5432)
✓ Redis (localhost:6379)
✓ Tokendata service (healthy)
✓ Swap service (healthy)

API Keys:
✓ ALCHEMY_API_KEY (valid)
✓ MORALIS_API_KEY (valid)
⚠ ZEROX_API_KEY (not configured - optional)
✓ OPENAI_API_KEY (valid)
✗ MAIN_BOT_TOKEN (invalid or expired)

Configuration:
✓ samterminal.config.json (valid)
✓ 4 plugins configured
✓ 3 chains enabled

Status: Ready with warnings
```

## Additional CLI Commands

### Order Management

SAM Terminal supports creating and managing automated trading orders:

```bash
# Create a new order from a template
npx sam order create --template dca

# List all active orders
npx sam order list

# Get details for a specific order
npx sam order get <order-id>

# Cancel an order
npx sam order cancel <order-id>

# Pause an order temporarily
npx sam order pause <order-id>

# Resume a paused order
npx sam order resume <order-id>
```

### Environment Information

```bash
# Display current environment configuration
npx sam info
```

This shows:
- Project name and version
- Active plugins
- Configured chains
- Service endpoints
- Runtime environment

## Next Steps

Congratulations! You now have SAM Terminal up and running.

**Continue your journey:**

- [Building Trading Agents](/docs/building-trading-agents) - Create autonomous trading strategies
- [Plugin Development Guide](/docs/plugin-development) - Create your own plugins
- [MCP Setup Guide](/docs/mcp-setup-guide) - Integrate with Claude Desktop
- [OpenClaw Skills](/docs/openclaw-skills) - Teach AI assistants to operate your agent

**Community:**

- [GitHub Repository](https://github.com/samterminal/samterminal) - Star, fork, contribute
- [X (Twitter)](https://x.com/samterminalcom) - Follow for updates

**Need help?**

- Run `npx sam doctor` to diagnose issues
- Check the logs: `docker compose logs -f`
- Review `.env` for missing API keys
- Check the [MCP Setup Guide](/docs/mcp-setup-guide) for integration details

Happy building with SAM Terminal!
