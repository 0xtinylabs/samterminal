# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-16

### Added

- **Core Framework** (`@samterminal/core`)
  - Plugin-based runtime engine with lifecycle management
  - Flow engine for multi-step agent orchestration
  - Event-driven hook system
  - Plugin registry and dynamic loader
  - Order templates for declarative agent behavior
  - Structured logger with log levels

- **CLI** (`@samterminal/cli`)
  - `sam init` - Project scaffolding with interactive setup
  - `sam run` - Start agent runtime
  - `sam dev` - Development mode with hot reload
  - `sam plugin install/remove/list` - Plugin management
  - `sam order` - Execute order templates
  - `sam setup` - Environment configuration

- **MCP Server** (`@samterminal/mcp-server`)
  - Model Context Protocol server for AI assistant integration
  - 25+ tools across wallet, token, flow, and swap categories
  - Compatible with Claude, Cursor, and MCP-enabled clients

- **Plugins**
  - `@samterminal/plugin-ai` - Multi-provider AI completion (OpenAI, Anthropic), chat, classify, extract, summarize, generate actions
  - `@samterminal/plugin-swap` - DEX token swaps via 0x/Matcha aggregator, approval management, quote provider
  - `@samterminal/plugin-tokendata` - Token price, market data, metadata, pool info, security analysis (CoinGecko, DexScreener, Moralis)
  - `@samterminal/plugin-walletdata` - Portfolio tracking, NFTs, transactions, approvals, multi-chain wallet data (Moralis, RPC)
  - `@samterminal/plugin-telegram` - Telegram bot integration, message sending, notification toggles
  - `@samterminal/plugin-onboarding` - User onboarding flows, step tracking, progress management

- **Microservices**
  - NestJS services: main gateway, notification, swap, transactions
  - Go services: tokendata, walletdata (gRPC)
  - Protocol Buffers for service communication

- **Infrastructure**
  - Docker Compose setup (production and development)
  - PostgreSQL and Redis configuration
  - Turborepo build pipeline
  - GitHub Actions CI (lint, typecheck, test, build - Node 18/20/22)
  - Comprehensive test suite (unit, integration, e2e)

- **Documentation**
  - Architecture guide
  - API reference
  - Plugin development guide
  - Setup and deployment guide
  - Security policy
  - Contributing guidelines

- **Landing Page**
  - Terminal-themed responsive landing page
  - Article system with markdown rendering
  - OpenClaw skill guide for AI agents
