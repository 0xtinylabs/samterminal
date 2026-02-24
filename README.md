# SAM Terminal

**Onchain Trading Agent Framework** -- Modular, plugin-based autonomous trading agent platform for EVM ecosystems.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/samterminal/samterminal/ci.yml?branch=main&label=CI)](https://github.com/samterminal/samterminal/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Go](https://img.shields.io/badge/Go-1.24+-00ADD8.svg)](https://go.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-9.15+-orange.svg)](https://pnpm.io/)

---

## Overview

SAM Terminal is a modular trading agent framework that enables building autonomous Web3 trading agents with plugin-based architecture. It provides a core runtime engine with state machines, task management, flow orchestration, and a plugin lifecycle system. Agents can execute token swaps, track prices, manage portfolios, automate trading strategies across multiple blockchains, communicate via Telegram, and leverage AI models for decision-making.

```
┌─────────────────────────────────────────────────────┐
│                   SAM Terminal CLI                    │
├─────────────────────────────────────────────────────┤
│                   Core Runtime                      │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │
│  │  Engine   │ │  State   │ │   Flow Engine     │   │
│  │          │ │  Machine │ │   (DAG-based)     │   │
│  └──────────┘ └──────────┘ └───────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │
│  │  Task    │ │ Scheduler│ │  Plugin Lifecycle  │   │
│  │  Manager │ │  (Cron)  │ │                   │   │
│  └──────────┘ └──────────┘ └───────────────────┘   │
├─────────────────────────────────────────────────────┤
│                    Plugins                          │
│  ┌─────┐ ┌──────────┐ ┌────┐ ┌─────────┐ ┌─────┐  │
│  │ AI  │ │ Telegram │ │Swap│ │TokenData│ │Wallet│  │
│  └─────┘ └──────────┘ └────┘ └─────────┘ └─────┘  │
├─────────────────────────────────────────────────────┤
│              NestJS Microservices (gRPC)            │
│  ┌──────┐ ┌────────┐ ┌──────┐ ┌──────┐              │
│  │ Main │ │  Swap  │ │Notif.│ │Trans.│              │
│  └──────┘ └────────┘ └──────┘ └──────┘              │
├─────────────────────────────────────────────────────┤
│              Go Services (gRPC)                     │
│  ┌───────────────┐ ┌────────────────┐              │
│  │  TokenData    │ │   WalletData   │              │
│  └───────────────┘ └────────────────┘              │
└─────────────────────────────────────────────────────┘
```

> For a deep dive into the system design, see [Architecture Documentation](docs/ARCHITECTURE.md).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5.7+ (strict), Go 1.24+ |
| Runtime | Node.js 18+, Go 1.24+ |
| Monorepo | pnpm workspaces + Turborepo 2.x (npm also supported) |
| Core Framework | Custom plugin-based runtime engine |
| Blockchain | viem 2.39, ethers 6.15 |
| Backend | NestJS 11, gRPC, Protocol Buffers |
| Database | PostgreSQL 16 via Prisma 6 |
| AI | OpenAI, Anthropic SDKs |
| Messaging | Telegram Bot API (telegraf) |
| Testing | Jest 30 (ESM preset), Go testing |
| CLI | Commander.js, Inquirer, Ora |

---

## Project Structure

```
samterminal/
├── apps/
│   └── playground/            # Example application
├── packages/
│   ├── core/                  # Runtime engine, state machine, flow engine, plugins
│   ├── cli/                   # CLI tool (init, run, dev, plugin management)
│   ├── mcp-server/            # MCP server integration
│   ├── eslint-config/         # Shared ESLint config
│   ├── tsconfig/              # Shared TypeScript config
│   ├── testing-utils/         # Test utilities
│   ├── shared-deps/           # Shared dependencies
│   └── plugins/
│       ├── ai/                # OpenAI & Anthropic integration
│       ├── telegram/          # Telegram bot plugin
│       ├── swap/              # Token swap (0x/Matcha)
│       ├── tokendata/         # Token price & market data
│       ├── walletdata/        # Wallet portfolio & balance data
│       └── onboarding/        # User onboarding flows
├── services/
│   ├── nestjs/
│   │   ├── main/              # Main orchestrator service
│   │   ├── swap/              # Swap execution service
│   │   ├── notification/      # Notification delivery service
│   │   └── transactions/      # Transaction tracking service
│   └── go/
│       ├── tokendata/         # Token data aggregation (Go)
│       └── walletdata/        # Wallet data aggregation (Go)
├── proto/                     # Protocol Buffer definitions
├── docs/                      # Documentation
├── scripts/                   # Utility scripts
├── turbo.json                 # Turborepo pipeline config
└── package.json               # Root workspace config
```

---

## Quick Start

### Option 1: Local Development (Recommended)

Database in Docker, services on host with hot-reload.

**Prerequisites:** Node.js 18+, pnpm 9.15+, Docker, Git

```bash
# Clone and setup
git clone https://github.com/0xtinylabs/samterminal.git
cd samterminal
cp .env.example .env
# Edit .env with your API keys (Alchemy, Moralis, etc.)

# Start PostgreSQL + Redis in Docker
docker compose -f docker-compose.dev.yml up -d

# Install, generate, build
pnpm install
pnpm proto:gen
pnpm build

# Run database migrations
make db-migrate

# Start all services in development mode
pnpm dev
```

Services will be running at:
- **Main:** localhost:50060 (gRPC)
- **Swap:** localhost:50059 (gRPC)
- **Notification:** localhost:50056 (gRPC)
- **Transactions:** localhost:50054 (gRPC)
- **TokenData:** localhost:50061 (gRPC), localhost:8081 (HTTP)
- **WalletData:** localhost:50062 (gRPC), localhost:8082 (HTTP)
- **Adminer (DB GUI):** http://localhost:8080

### Option 2: Make Commands

```bash
git clone https://github.com/0xtinylabs/samterminal.git
cd samterminal
cp .env.example .env

# Full setup with one command (install + proto + build + db + migrate)
make setup

# Start development
make dev
```

### Option 3: Docker Production

All services run in containers. Requires `POSTGRES_PASSWORD` env var.

```bash
git clone https://github.com/0xtinylabs/samterminal.git
cd samterminal
cp .env.example .env
# Edit .env with your API keys

# Set the required password and start
export POSTGRES_PASSWORD=your_secure_password
docker compose up -d
```

> For the full setup guide including database configuration, environment variables, and troubleshooting, see [Setup Documentation](docs/SETUP.md).

---

## CLI Usage

The SAM Terminal CLI provides project scaffolding and management:

```bash
# Create a new trading agent
sam init my-agent

# Add a plugin
sam plugin add @samterminal/plugin-telegram

# Run the agent
sam run

# Run in watch mode
sam run --watch

# Run with custom port and environment
sam run --port 4000 --env production
```

---

## Plugin System

SAM Terminal uses a modular plugin architecture. Each plugin implements a standard lifecycle interface and can register actions, providers, and event handlers.

### Available Plugins

| Plugin | Package | Description |
|--------|---------|-------------|
| AI | `@samterminal/plugin-ai` | OpenAI and Anthropic model integration for trading decisions |
| Telegram | `@samterminal/plugin-telegram` | Telegram bot with message handling, commands, and callbacks |
| Swap | `@samterminal/plugin-swap` | Token swaps via 0x/Matcha API |
| TokenData | `@samterminal/plugin-tokendata` | Token prices, market data from DexScreener, Moralis, CoinGecko |
| WalletData | `@samterminal/plugin-walletdata` | Wallet balances, portfolio tracking, transaction history |
| Onboarding | `@samterminal/plugin-onboarding` | User onboarding and wallet creation flows |

### Creating a Plugin

```typescript
import { SamTerminalPlugin } from '@samterminal/core';

const myPlugin: SamTerminalPlugin = {
  name: 'my-plugin',
  version: '1.0.0',

  async init(core) {
    // Setup logic — register actions, providers, hooks
    core.registerAction({
      name: 'my-action',
      description: 'Does something useful',
      async handler(params) {
        // Action logic
      },
    });
  },

  async destroy() {
    // Cleanup logic
  },
};
```

> For the complete plugin development guide including lifecycle hooks, configuration, multi-chain support, and testing patterns, see [Plugin Development](docs/PLUGIN_DEVELOPMENT.md).

---

## Microservices

The backend consists of NestJS (TypeScript) and Go microservices communicating over gRPC.

### Service Ports

| Service | Port | Language | Description |
|---------|------|----------|-------------|
| Main | 50060 | TypeScript | Orchestrator, user management |
| Transactions | 50054 | TypeScript | Transaction tracking and history |
| Notification | 50056 | TypeScript | Notification delivery (Telegram, etc.) |
| Swap | 50059 | TypeScript | Swap execution and quote management |
| TokenData | 50061 | Go | Token price aggregation |
| WalletData | 50062 | Go | Wallet balance aggregation |

> For the full API reference including gRPC endpoints, request/response schemas, and authentication, see [API Documentation](docs/API.md).

---

## Development

### Commands

```bash
# Build all packages
pnpm build

# Development mode (watch)
pnpm dev

# Run all tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run tests in watch mode
pnpm test:watch

# Lint all packages
pnpm lint

# Clean build artifacts
pnpm clean

# Generate protobuf code
pnpm proto:gen
```

### Environment Variables

Key environment variables (see `.env.example` for the full list):

| Variable | Description |
|----------|-------------|
| `ALCHEMY_API_KEY` | Alchemy RPC provider key |
| `MORALIS_API_KEY` | Moralis data API key |
| `COINGECKO_API_KEY` | CoinGecko price data key |
| `MATCHA_API_KEY` | 0x/Matcha swap API key |

| `MAIN_BOT_TOKEN` | Telegram bot token (main bot) |
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `USER_DATABASE_URL` | Unified user database (notification, swap, transactions schemas) |
| `TOKENDATA_DATABASE_URL` | TokenData Go service database |
| `WALLETDATA_DATABASE_URL` | WalletData Go service database |
| `MICROSERVICES_HOST` | gRPC services host (default: `localhost`) |

### Supported Chains

- Base (primary)
- Ethereum Mainnet
- Arbitrum
- Polygon
- Optimism
- BSC

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design, component diagrams, data flow, design decisions |
| [API Reference](docs/API.md) | gRPC endpoints, schemas, authentication, code examples |
| [Setup Guide](docs/SETUP.md) | Prerequisites, installation, database setup, troubleshooting |
| [Plugin Development](docs/PLUGIN_DEVELOPMENT.md) | Plugin interface, lifecycle, multi-chain, testing, publishing |
| [Trading Workflows](docs/TRADING_WORKFLOWS.md) | Order templates, trading strategies, workflow examples |
| [Security](docs/SECURITY.md) | Security policy, vulnerability reporting, best practices |

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on:

- Submitting bug reports and feature requests
- Development workflow and coding standards
- Pull request process

---

## Security

If you discover a security vulnerability, please report it responsibly. See [SECURITY.md](docs/SECURITY.md) for details.

**Do not open public issues for security vulnerabilities.**

---

## Testing

The project uses Jest 30 with ESM support across all TypeScript packages and Go's built-in testing for Go services.

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @samterminal/core test
pnpm --filter @samterminal/plugin-swap test

# Run with coverage
pnpm test:cov
```

ESM mocking pattern used throughout:

```typescript
jest.unstable_mockModule('module-name', () => ({
  exportedFunction: jest.fn(),
}));

const { myFunction } = await import('./my-module.js');
```

---

## Roadmap

- [ ] Authentication layer for NestJS microservices
- [ ] Enhanced security hardening (CLI input sanitization, tx simulation)
- [ ] npm package publishing (@samterminal/*)
- [ ] Additional chain support (Avalanche, zkSync)
- [ ] Web dashboard for agent monitoring
- [ ] Community plugins marketplace

---

## License

[MIT](LICENSE) - Copyright (c) 2026 SAM Terminal Contributors
