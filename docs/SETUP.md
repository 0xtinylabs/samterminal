# SamTerminal Local Development Setup Guide

**Version:** 1.1.0
**Last Updated:** January 30, 2026

This guide will help you set up a local development environment for SamTerminal.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
   - [Option 1: Docker (Recommended)](#option-1-docker-recommended)
   - [Option 2: Docker + Local Development](#option-2-docker--local-development)
   - [Option 3: Make Commands](#option-3-make-commands)
   - [Option 4: Manual Setup](#option-4-manual-setup)
3. [Docker Setup](#docker-setup)
4. [Detailed Setup](#detailed-setup)
   - [Step 1: Clone Repository](#step-1-clone-repository)
   - [Step 2: Install Dependencies](#step-2-install-dependencies)
   - [Step 3: Environment Variables](#step-3-environment-variables)
   - [Step 4: Database Setup](#step-4-database-setup)
   - [Step 5: Prisma Generation](#step-5-prisma-generation)
   - [Step 6: Proto Generation](#step-6-proto-generation)
   - [Step 7: Build](#step-7-build)
   - [Step 8: Run Development Server](#step-8-run-development-server)
4. [Service Architecture](#service-architecture)
5. [Port Reference](#port-reference)
6. [API Keys & External Services](#api-keys--external-services)
7. [IDE Setup](#ide-setup)
8. [Common Commands](#common-commands)
9. [Troubleshooting](#troubleshooting)
10. [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) or use nvm |
| **pnpm** | 9.15.0+ | `npm install -g pnpm@9.15.0` (recommended) |
| **npm** | 10+ | Included with Node.js (alternative to pnpm) |
| **Docker** | Latest | [docker.com](https://www.docker.com/get-started/) (for PostgreSQL & Redis) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

> **Note:** Docker is used to run PostgreSQL and Redis in development. If you prefer a local PostgreSQL installation, see [Option 4: Manual Setup](#option-4-manual-setup-without-docker). Both pnpm and npm are supported. pnpm is recommended for faster installs and better disk usage.

### Optional (for Go services)

| Software | Version | Installation |
|----------|---------|--------------|
| **Go** | 1.24+ | [go.dev](https://go.dev/dl/) |
| **protoc** | 3.x | [Protocol Buffers](https://grpc.io/docs/protoc-installation/) |

### Verify Installation

```bash
# Check Node.js
node --version
# Expected: v18.0.0 or higher

# Check pnpm
pnpm --version
# Expected: 9.15.0 or higher

# Check PostgreSQL
psql --version
# Expected: psql (PostgreSQL) 16.x

# Check Git
git --version
# Expected: git version 2.x.x

# Optional: Check Go
go version
# Expected: go1.24.x

# Optional: Check protoc
protoc --version
# Expected: libprotoc 3.x.x
```

---

## Quick Start

### Option 1: Local Development (Recommended)

Database in Docker, services on host with hot-reload. This is the recommended approach for development.

```bash
# Clone and setup
git clone https://github.com/0xtinylabs/samterminal.git
cd samterminal
cp .env.example .env
# Edit .env with your API keys (Alchemy, Moralis, etc.)

# Start PostgreSQL + Redis in Docker
docker compose -f docker-compose.dev.yml up -d

# Install dependencies
pnpm install

# Generate gRPC clients from proto files
pnpm proto:gen

# Build all packages (respects dependency order via Turborepo)
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
- **Adminer (DB GUI):** http://localhost:8080 (Server: postgres, User: postgres, Password: postgres)

> **Note:** The `docker-compose.dev.yml` starts PostgreSQL 16, Redis 7, and Adminer. Database password defaults to `postgres`. Make sure your `.env` database URLs use this password (e.g., `postgresql://postgres:postgres@localhost:5432/samterminal_user`).

### Option 2: Make Commands

```bash
git clone https://github.com/0xtinylabs/samterminal.git
cd samterminal
cp .env.example .env

# Full setup with one command (install + proto + build + db-start + migrate)
make setup

# Start development (starts DB + all services)
make dev

# Or step by step:
make install      # Install dependencies
make dev-db       # Start PostgreSQL + Redis in Docker
make db-migrate   # Run Prisma migrations
make dev          # Start database + all services
```

### Option 3: Docker Production

All services run in containers. Requires `POSTGRES_PASSWORD` env var.

```bash
git clone https://github.com/0xtinylabs/samterminal.git
cd samterminal
cp .env.example .env
# Edit .env with your API keys

# Set the required password and start all containers
export POSTGRES_PASSWORD=your_secure_password
docker compose up -d
```

> **Note:** The production `docker-compose.yml` builds and runs all NestJS and Go services in Docker containers. This approach does not support hot-reload.

### Option 4: Manual Setup (Without Docker)

For those who prefer a local PostgreSQL installation without Docker:

```bash
# 1. Clone repository
git clone https://github.com/0xtinylabs/samterminal.git
cd samterminal

# 2. Install dependencies
pnpm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your API keys and database URLs

# 4. Setup databases (requires local PostgreSQL)
./scripts/init-user-db.sh  # Creates samterminal_user DB + schemas
createdb "scanner-token"
createdb "scanner-wallet"

# 5. Generate proto and Prisma clients
pnpm proto:gen
pnpm db:generate

# 6. Build all packages
pnpm build

# 7. Run database migrations
pnpm db:migrate

# 8. Start development
pnpm dev
```

---

## Docker Setup

SamTerminal provides Docker Compose configurations for easy deployment.

### Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Production: All services in containers |
| `docker-compose.dev.yml` | Development: Database + Redis + Adminer only |
| `docker/nestjs.Dockerfile` | NestJS service image |
| `docker/go.Dockerfile` | Go service image |
| `Makefile` | Convenient commands |

### Production Mode

Start all services in containers. Requires `POSTGRES_PASSWORD` environment variable:

```bash
# Set required password
export POSTGRES_PASSWORD=your_secure_password

# Build and start
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

### Development Mode

Start only database (services run on host for hot-reload):

```bash
# Start database
docker compose -f docker-compose.dev.yml up -d

# Access Adminer (Database GUI)
# http://localhost:8080
# Server: postgres
# User: postgres
# Password: postgres

# Stop database
docker compose -f docker-compose.dev.yml down
```

### Container Ports

| Service | Port | Protocol |
|---------|------|----------|
| Main | 50060 | gRPC |
| Swap | 50059 | gRPC |
| Notification | 50056 | gRPC |
| Transactions | 50054 | gRPC |
| TokenData | 50061 / 8081 | gRPC / HTTP |
| WalletData | 50062 / 8082 | gRPC / HTTP |
| PostgreSQL | 5432 | SQL |
| Redis | 6379 | Redis |
| Adminer (dev) | 8080 | HTTP |

### Make Commands

```bash
make help         # Show all commands
make setup        # Full setup
make dev          # Start development mode
make dev-db       # Start database only
make start        # Start production containers
make stop         # Stop containers
make logs         # View logs
make db-migrate   # Run migrations
make db-fresh     # Reset all databases and run migrations from scratch
make db-reset     # Reset databases (CAUTION!)
make clean        # Clean everything
```

---

## Detailed Setup

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/0xtinylabs/samterminal.git

# Navigate to the project directory
cd samterminal

# Verify you're on the main branch
git branch
# * main
```

### Step 2: Install Dependencies

SamTerminal uses pnpm workspaces for monorepo management. npm is also supported.

```bash
# Install all dependencies (pnpm recommended)
pnpm install

# Or with npm (npm workspaces are configured)
npm install

# This will install dependencies for:
# - Root workspace
# - packages/core
# - packages/cli
# - packages/plugins/*
# - services/nestjs/*
# - apps/*
```

**Expected output (pnpm):**

```
Packages: +XXX
++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved XXX, reused XXX, downloaded X, added XXX
Done in X.Xs
```

> **Note:** While both package managers are supported, pnpm is recommended for faster installs and better disk usage. The `setup:quick` script uses `npx pnpm` to ensure Turborepo compatibility regardless of which package manager you prefer.

### Step 3: Environment Variables

#### Create Environment File

```bash
# Copy the example file
cp .env.example .env

# Open in your editor
code .env  # or vim, nano, etc.
```

#### Required Variables

Edit `.env` and fill in the following:

```bash
# ============================================================
# ENVIRONMENT
# ============================================================
NODE_ENV=development

# ============================================================
# BLOCKCHAIN - RPC PROVIDERS
# ============================================================
# Get from: https://dashboard.alchemy.com/
RPC_URL_BASE=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
RPC_WS_URL_BASE=wss://base-mainnet.g.alchemy.com/v2/YOUR_KEY

# ============================================================
# API KEYS - BLOCKCHAIN DATA
# ============================================================
# Alchemy - https://dashboard.alchemy.com/
ALCHEMY_API_KEY=your_alchemy_api_key

# Moralis - https://admin.moralis.com/web3apis
MORALIS_API_KEY=your_moralis_api_key

# CoinGecko Pro - https://www.coingecko.com/en/api/pricing
COINGECKO_API_KEY=your_coingecko_api_key

# ============================================================
# API KEYS - SWAP AGGREGATORS
# ============================================================
# 0x (Matcha) - https://dashboard.0x.org/
MATCHA_API_KEY=your_0x_matcha_api_key

# ============================================================
# MICROSERVICES
# ============================================================
MICROSERVICES_HOST=localhost

# ============================================================
# TELEGRAM BOT (Optional)
# ============================================================
# Get from: https://t.me/BotFather
MAIN_BOT_TOKEN=your_telegram_bot_token
```

#### Single Root Environment File

All services read from the **single root `.env` file**. Service-specific variables use prefixes:

```bash
# User Database (unified for notification, swap, transactions)
USER_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/samterminal_user

# Service-specific variables in root .env:
SWAP_PORT=50059
# Database: Uses USER_DATABASE_URL with 'swap' schema

NOTIFICATION_PORT=50056
# Database: Uses USER_DATABASE_URL with 'notification' schema

TRANSACTIONS_PORT=50054
# Database: Uses USER_DATABASE_URL with 'transactions' schema

# Separate databases for other services:
TOKENDATA_DATABASE_URL=postgresql://...
WALLETDATA_DATABASE_URL=postgresql://...
```

> **Note:** notification, swap, and transactions services share a single database (`samterminal_user`) with separate PostgreSQL schemas for isolation.

### Step 4: Database Setup

SamTerminal uses **3 PostgreSQL databases**:
- `samterminal_user` - Unified user database (notification, swap, transactions schemas)
- `scanner-token` - Token metadata (Go service)
- `scanner-wallet` - Wallet balances (Go service)

#### Option A: Using Init Script (Recommended)

```bash
# Run the init script
./scripts/init-user-db.sh

# This creates:
# - samterminal_user database
# - notification, swap, transactions schemas
```

#### Option B: Manual Creation

```bash
# Create databases
createdb samterminal_user
createdb "scanner-token"
createdb "scanner-wallet"

# Create schemas in samterminal_user
psql samterminal_user -c "CREATE SCHEMA notification; CREATE SCHEMA swap; CREATE SCHEMA transactions;"
```

#### Option C: Docker (Auto-created)

If using `docker-compose.dev.yml`, databases are automatically created:

```bash
docker compose -f docker-compose.dev.yml up -d
```

#### Verify Databases

```bash
psql -l | grep -E "samterminal_user|scanner"
psql samterminal_user -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('notification', 'swap', 'transactions');"
```

### Step 5: Prisma Generation

Generate Prisma clients for all services:

```bash
# Generate all Prisma clients
pnpm db:generate

# Or generate individually
cd services/nestjs/notification && pnpm db:generate && cd ../../..
cd services/nestjs/swap && pnpm db:generate && cd ../../..
cd services/nestjs/transactions && pnpm db:generate && cd ../../..
```

#### Apply Migrations (if available)

```bash
# Push schema to database (development)
pnpm db:push

# Or run migrations (production)
pnpm db:migrate
```

### Step 6: Proto Generation

Generate gRPC clients from proto files:

```bash
# Generate proto files
pnpm proto:gen
```

This generates TypeScript clients from `.proto` files in the `proto/` directory.

**Proto File Structure:**

```
proto/
├── common/
│   └── common.proto      # Shared types (CHAIN, Token, Wallet, WalletToken)
├── token/
│   ├── messages.proto    # Token request/response messages
│   └── token.proto       # ScannerToken service definition
├── wallet/
│   ├── messages.proto    # Wallet request/response messages
│   └── wallet.proto      # ScannerWallet service definition
├── index.proto           # Main Scanner service definition
├── notification.proto    # NotificationService
├── swap.proto            # SwapService
└── transactions.proto    # TransactionService
```

### Step 7: Build

Build all packages and services:

```bash
# Build everything
pnpm build

# This runs turbo build which:
# - Builds packages/core
# - Builds packages/cli
# - Builds packages/plugins/*
# - Builds services/nestjs/*
# - Respects dependency order
```

**Verify build:**

```bash
# Check for dist directories
ls packages/core/dist
ls packages/plugins/swap/dist
ls services/nestjs/main/dist
```

### Step 8: Run Development Server

#### Start All Services

```bash
# Start all services in development mode
pnpm dev
```

This uses Turbo to run all services with hot-reload.

#### Start Specific Services

```bash
# Start only the main service
cd services/nestjs/main && pnpm dev

# Start only the swap service
cd services/nestjs/swap && pnpm dev

# Start multiple services (in separate terminals)
# Terminal 1: pnpm --filter @samterminal/main dev
# Terminal 2: pnpm --filter @samterminal/swap dev
```

#### Verify Services Are Running

```bash
# Check main service (gRPC)
grpcurl -plaintext localhost:50060 list

# Check if ports are listening
lsof -i :50060  # Main
lsof -i :50059  # Swap
lsof -i :50056  # Notification
```

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SAMTERMINAL SERVICE ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              CORE PACKAGES                                   │
│                                                                              │
│   packages/                                                                  │
│   ├── core/              @samterminal/core         Runtime, plugins, flows       │
│   ├── cli/               @samterminal/cli          Command-line interface        │
│   ├── eslint-config/     @samterminal/eslint-config  Shared ESLint config        │
│   ├── tsconfig/          @samterminal/tsconfig     Shared TypeScript config      │
│   ├── testing-utils/     @samterminal/testing-utils  Test utilities              │
│   └── plugins/                                                               │
│       ├── ai/            @samterminal/plugin-ai        LLM integration           │
│       ├── swap/          @samterminal/plugin-swap      DEX swaps                 │
│       ├── telegram/      @samterminal/plugin-telegram  Telegram bot              │
│       ├── tokendata/     @samterminal/plugin-tokendata Token data                │
│       ├── walletdata/    @samterminal/plugin-walletdata Wallet data              │
│       └── onboarding/    @samterminal/plugin-onboarding User onboarding          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Uses
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            NESTJS MICROSERVICES                              │
│                                                                              │
│   services/nestjs/                                                           │
│   ├── main/              Port: 50060    Scanner hub, orchestration          │
│   ├── notification/      Port: 50056    Telegram/Farcaster notifications    │
│   ├── swap/              Port: 50059    Token swap execution                │
│   └── transactions/      Port: 50054    Transaction logging                 │

│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ gRPC
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GO SERVICES                                     │
│                                                                              │
│   services/go/                                                               │
│   ├── tokendata/         Port: 50061    DEX pool watching, token data       │
│   └── walletdata/        Port: 50062    Wallet balances, portfolio          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ SQL
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASES                                       │
│                                                                              │
│   PostgreSQL                                                                 │
│   ├── samterminal_user   (shared DB, schema isolation)                      │
│   │   ├── notification   User bots, messages                                │
│   │   ├── swap           Swap transactions                                  │
│   │   └── transactions   Transaction logs                                   │
│   ├── scanner-token      Token metadata, pools                              │
│   └── scanner-wallet     Wallet balances, history                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Port Reference

### Service Ports

| Service | Port | Protocol | Database |
|---------|------|----------|----------|
| **Main (Scanner)** | 50060 | gRPC | - |
| **Transactions** | 50054 | gRPC | transactions |
| **Notification** | 50056 | gRPC | notification |
| **Swap** | 50059 | gRPC | swap |
| **TokenData (Go)** | 50061 | gRPC | scanner-token |
| **WalletData (Go)** | 50062 | gRPC | scanner-wallet |

### Database Ports

| Database | Port | Default |
|----------|------|---------|
| PostgreSQL | 5432 | Standard |

### Development Ports

| Service | Port | Purpose |
|---------|------|---------|
| Playground | 3000 | Example app |

---

## API Keys & External Services

### Required API Keys

| Service | Purpose | Get From |
|---------|---------|----------|
| **Alchemy** | RPC Provider | [dashboard.alchemy.com](https://dashboard.alchemy.com/) |
| **Moralis** | Token & Wallet Data | [admin.moralis.com](https://admin.moralis.com/web3apis) |

### Recommended API Keys

| Service | Purpose | Get From |
|---------|---------|----------|
| **CoinGecko Pro** | Token Prices | [coingecko.com/api](https://www.coingecko.com/en/api/pricing) |
| **0x (Matcha)** | Swap Quotes | [dashboard.0x.org](https://dashboard.0x.org/) |

| **Etherscan** | Chain Explorer | [etherscan.io/myapikey](https://etherscan.io/myapikey) |

### Optional Services

| Service | Purpose | Get From |
|---------|---------|----------|
| **Telegram Bot** | Notifications | [t.me/BotFather](https://t.me/BotFather) |
| **OpenAI** | AI Features | [platform.openai.com](https://platform.openai.com/) |
| **Anthropic** | AI Features | [console.anthropic.com](https://console.anthropic.com/) |

---

## IDE Setup

### VS Code (Recommended)

#### Extensions

Install the following extensions:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "zxh404.vscode-proto3",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "golang.go"
  ]
}
```

#### Settings

Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  },
  "[proto3]": {
    "editor.defaultFormatter": "zxh404.vscode-proto3"
  }
}
```

### JetBrains (WebStorm/GoLand)

1. Enable ESLint: `Preferences > Languages > JavaScript > Code Quality Tools > ESLint`
2. Enable Prettier: `Preferences > Languages > JavaScript > Prettier`
3. Install Prisma plugin from marketplace
4. Install Protocol Buffers plugin from marketplace

---

## Common Commands

> **Note:** All commands shown use pnpm. If using npm, replace `pnpm` with `npm run` (e.g., `npm run dev`, `npm run build`). For filter commands, npm workspaces use `-w` flag instead of `--filter`.

### Development

```bash
# Start development (all services)
pnpm dev
# or: npm run dev

# Start specific workspace
pnpm --filter @samterminal/core dev
# npm: npm run dev -w @samterminal/core

# Watch mode for packages
pnpm --filter @samterminal/core dev
```

### Building

```bash
# Build all
pnpm build
# or: npm run build

# Build specific package
pnpm --filter @samterminal/core build
# npm: npm run build -w @samterminal/core

# Clean and rebuild
pnpm clean && pnpm build
# or: npm run clean && npm run build
```

### Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:cov

# Watch mode
pnpm test:watch

# Test specific package
pnpm --filter @samterminal/core test
```

### Database

```bash
# Generate Prisma clients
pnpm db:generate

# Push schema changes (development)
pnpm db:push

# Run migrations (production)
pnpm db:migrate

# Open Prisma Studio
cd services/nestjs/notification && npx prisma studio
```

### Linting & Formatting

```bash
# Lint all
pnpm lint

# Fix lint issues
pnpm lint --fix

# Format with Prettier
pnpm format
```

### Cleaning

```bash
# Clean all build artifacts
pnpm clean
# or: npm run clean

# Clean node_modules (for pnpm)
rm -rf node_modules
rm -rf packages/*/node_modules
rm -rf services/*/node_modules
pnpm install

# Clean node_modules (for npm)
rm -rf node_modules
rm -rf package-lock.json
npm install
```

---

## Troubleshooting

### Common Issues

#### 1. pnpm install fails

**Symptom:** Error during dependency installation

**Solution:**
```bash
# Clear pnpm cache
pnpm store prune

# Remove lockfile and reinstall
rm pnpm-lock.yaml
pnpm install
```

#### 1b. npm install fails

**Symptom:** Error during npm dependency installation

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove lockfile and reinstall
rm package-lock.json
rm -rf node_modules
npm install

# If using npm, the setup:quick script is recommended
npm run setup:quick
```

> **Note:** The `setup:quick` script uses `npx pnpm` internally which provides better Turborepo compatibility.

#### 2. Database connection refused

**Symptom:** `ECONNREFUSED` or `Connection refused`

**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS)
brew services start postgresql@16

# Start PostgreSQL (Linux)
sudo systemctl start postgresql

# Check connection string in .env
# DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
```

#### 3. Prisma client not generated

**Symptom:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
# Generate Prisma clients
pnpm db:generate

# Or manually
cd services/nestjs/notification
npx prisma generate
```

#### 4. Port already in use

**Symptom:** `EADDRINUSE: address already in use`

**Solution:**
```bash
# Find process using port
lsof -i :50060

# Kill process
kill -9 <PID>

# Or use different port
PORT=50070 pnpm dev
```

#### 5. gRPC connection failed

**Symptom:** `Failed to connect to all addresses`

**Solution:**
```bash
# Check if service is running
lsof -i :50060

# Check service logs
cd services/nestjs/main && pnpm dev

# Verify proto files are generated
ls proto/*.proto
pnpm proto:gen
```

#### 6. TypeScript errors after pull

**Symptom:** Type errors in IDE or build

**Solution:**
```bash
# Rebuild all packages
pnpm clean
pnpm install
pnpm build

# Restart TypeScript server in VS Code
# Cmd+Shift+P > TypeScript: Restart TS Server
```

#### 7. Environment variables not loaded

**Symptom:** `undefined` values for env vars

**Solution:**
```bash
# Check .env file exists
ls -la .env

# Check variable is exported
grep "ALCHEMY_API_KEY" .env

# Check dotenv is loading
# Add at top of entry file:
# import 'dotenv/config';
```

#### 8. Go services won't start

**Symptom:** Error starting Go services

**Solution:**
```bash
# Check Go version
go version  # Should be 1.24+

# Install dependencies
cd services/go/tokendata
go mod download

# Check for compilation errors
go build ./...
```

### Debug Mode

Enable verbose logging:

```bash
# Set debug environment
DEBUG=* pnpm dev

# Or for specific service
cd services/nestjs/main
DEBUG=sam:* pnpm dev
```

### Getting Help

1. Check [existing issues](https://github.com/samterminal/samterminal/issues)
2. Join [Discord community](https://discord.gg/samterminal)
3. Open a [new issue](https://github.com/samterminal/samterminal/issues/new)

---

## Next Steps

After completing setup:

1. **Explore the Playground**
   ```bash
   cd apps/playground
   pnpm dev
   ```

2. **Read the Documentation**
   - [Architecture Overview](./ARCHITECTURE.md)
   - [API Documentation](./API.md)
   - [Plugin Development](./PLUGIN_DEVELOPMENT.md)

3. **Create Your First Plugin**
   - Follow the [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md#quick-start)

4. **Join the Community**
   - [Discord](https://discord.gg/samterminal)
   - [GitHub Discussions](https://github.com/samterminal/samterminal/discussions)

---

## Appendix

### Directory Structure

```
samterminal/
├── .github/                    # GitHub configuration
│   ├── ISSUE_TEMPLATE/         # Issue templates
│   └── workflows/              # CI/CD workflows
├── apps/                       # Applications
│   └── playground/             # Example application
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── PLUGIN_DEVELOPMENT.md
│   └── SETUP.md
├── packages/                   # Core packages
│   ├── core/                   # Runtime engine
│   ├── cli/                    # CLI tool
│   ├── eslint-config/          # ESLint config
│   ├── plugins/                # Official plugins
│   ├── testing-utils/          # Test utilities
│   └── tsconfig/               # TypeScript config
├── proto/                      # Protocol Buffer files
├── services/                   # Microservices
│   ├── go/                     # Go services
│   └── nestjs/                 # NestJS services
├── scripts/                    # Utility scripts
├── .env.example                # Environment template
├── package.json                # Root package
├── pnpm-workspace.yaml         # Workspace config
├── turbo.json                  # Turbo config
└── LICENSE                     # MIT License
```

### Minimum System Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| **CPU** | 2 cores | 4+ cores |
| **RAM** | 8 GB | 16 GB |
| **Disk** | 10 GB | 20 GB |
| **OS** | macOS 12+, Ubuntu 20.04+, Windows 10+ | macOS 14+, Ubuntu 22.04+ |

---

*For additional help, please open an issue on GitHub.*
