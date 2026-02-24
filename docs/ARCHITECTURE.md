# SamTerminal Architecture

**Version:** 1.0.0
**Last Updated:** January 30, 2026
**Status:** Active Development

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [High-Level Architecture](#high-level-architecture)
3. [Technology Stack](#technology-stack)
4. [Core Components](#core-components)
   - [Runtime Engine](#runtime-engine)
   - [Flow Engine](#flow-engine)
   - [Plugin System](#plugin-system)
   - [Service Registry](#service-registry)
   - [Chain Manager](#chain-manager)
   - [Hooks System](#hooks-system)
   - [Order Template System](#order-template-system)
5. [Services Architecture](#services-architecture)
   - [NestJS Microservices](#nestjs-microservices)
   - [Go Services](#go-services)
   - [gRPC Communication](#grpc-communication)
6. [Data Flow](#data-flow)
   - [Request Flow](#request-flow)
   - [Plugin Communication](#plugin-communication)
   - [Flow Execution](#flow-execution)
7. [State Machines](#state-machines)
   - [Runtime States](#runtime-states)
   - [Flow Execution States](#flow-execution-states)
   - [Plugin Lifecycle States](#plugin-lifecycle-states)
8. [Design Decisions](#design-decisions)
9. [Deployment Architecture](#deployment-architecture)
10. [Appendix](#appendix)

---

## Executive Summary

SamTerminal is a **plugin-based, modular framework** designed for building Web3 agents and automation systems. The architecture follows a microservices pattern with a monorepo structure, combining TypeScript (core, plugins, CLI) and Go (data services) components coordinated through gRPC for inter-service communication.

### Key Architectural Principles

- **Plugin-First**: All capabilities are delivered through plugins with clear contracts
- **Modularity**: Loosely coupled components with well-defined interfaces
- **Extensibility**: Easy to add new capabilities without modifying core code
- **Type Safety**: Full TypeScript strict mode throughout the codebase
- **Scalability**: Microservices architecture enabling horizontal scaling
- **Multi-Chain**: Native support for EVM chains

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SAMTERMINAL ECOSYSTEM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         CLIENT LAYER                                    │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────┐ │ │
│  │  │ @samterminal/cli │    │ Playground  │    │    Third-Party Clients      │ │ │
│  │  └─────────────┘    └─────────────┘    └─────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          CORE LAYER                                     │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐ │ │
│  │  │                      @samterminal/core                                  │ │ │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │ │ │
│  │  │  │Runtime Engine│  │ Flow Engine  │  │    Plugin Manager        │ │ │ │
│  │  │  │  - Executor  │  │  - Nodes     │  │  - Registry              │ │ │ │
│  │  │  │  - Tasks     │  │  - Edges     │  │  - Loader                │ │ │ │
│  │  │  │  - Scheduler │  │  - Execution │  │  - Lifecycle             │ │ │ │
│  │  │  └──────────────┘  └──────────────┘  └──────────────────────────┘ │ │ │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │ │ │
│  │  │  │Service Regis.│  │ Chain Manager│  │    Hooks System          │ │ │ │
│  │  │  │  - Actions   │  │  - EVM       │  │  - Events                │ │ │ │
│  │  │  │  - Providers │  │  - Config    │  │  - Subscriptions         │ │ │ │
│  │  │  │  - Evaluators│  │              │  │  - Priorities            │ │ │ │
│  │  │  └──────────────┘  └──────────────┘  └──────────────────────────┘ │ │ │
│  │  └───────────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         PLUGIN LAYER                                    │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │ │
│  │  │    AI    │ │ Telegram │ │   Swap   │ │TokenData │ │  WalletData  │ │ │
│  │  │ OpenAI   │ │   Bot    │ │   DEX    │ │  Prices  │ │  Portfolio   │ │ │
│  │  │ Claude   │ │  Notif.  │ │  0x API  │ │  Pools   │ │  Balances    │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        SERVICES LAYER                                   │ │
│  │  ┌─────────────────────────────────┐  ┌─────────────────────────────┐  │ │
│  │  │      NestJS Microservices       │  │       Go Services           │  │ │
│  │  │  ┌─────────┐  ┌─────────────┐   │  │  ┌───────────┐ ┌─────────┐  │  │ │
│  │  │  │  Main   │  │Notification │   │  │  │ TokenData │ │WalletDt │  │  │ │
│  │  │  │ Scanner │  │  Telegram   │   │  │  │   Pools   │ │Balances │  │  │ │
│  │  │  └─────────┘  └─────────────┘   │  │  └───────────┘ └─────────┘  │  │ │
│  │  │  ┌─────────┐  ┌─────────────┐   │  │                              │  │ │
│  │  │  │  Swap   │  │ Transactions│   │  │          gRPC API            │  │ │
│  │  │  │ Permit2 │  │   Logging   │   │  │                              │  │ │
│  │  │  └─────────┘  └─────────────┘   │  │                              │  │ │
│  │  └─────────────────────────────────┘  └─────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         DATA LAYER                                      │ │
│  │  ┌────────────────────────────────────────┐  ┌──────────────────────┐ │ │
│  │  │         samterminal_user (Unified)          │  │      Separate DBs    │ │ │
│  │  │  ┌────────────┬────────┬────────────┐  │  │  ┌────────────────┐  │ │ │
│  │  │  │notification│  swap  │transactions│  │  │  │scanner-tok │  │ │ │
│  │  │  │   schema   │ schema │   schema   │  │  │  │scanner-wal │  │ │ │
│  │  │  └────────────┴────────┴────────────┘  │  │  └────────────────┘  │ │ │
│  │  └────────────────────────────────────────┘  │                        │ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Core Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Language** | TypeScript | 5.7+ | Core, plugins, CLI |
| **Language** | Go | 1.24+ | Data services |
| **Runtime** | Node.js | 18+ | JavaScript execution |
| **Package Manager** | pnpm | 9.15+ | Dependency management |
| **Monorepo** | Turborepo | 2.x | Build orchestration |

### Backend Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | NestJS 11 | Microservices framework |
| **ORM** | Prisma 6 | Database access |
| **Database** | PostgreSQL 16 | Data persistence |
| **Protocol** | gRPC | Inter-service communication |
| **Serialization** | Protocol Buffers 3 | Message format |

### Web3 Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **EVM** | viem, ethers.js | Ethereum interactions |
| **DEX** | 0x, 1inch | Swap aggregation |

### Quality & Testing

| Tool | Purpose |
|------|---------|
| Jest 30 | Test framework |
| ESLint 9 | Code linting |
| Prettier 3 | Code formatting |
| ts-jest | TypeScript compilation |

---

## Core Components

### Runtime Engine

The Runtime Engine is the central orchestrator responsible for managing the entire lifecycle of a SamTerminal agent.

```
┌─────────────────────────────────────────────────────────────────┐
│                        RUNTIME ENGINE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐     ┌────────────────┐     ┌──────────────┐ │
│  │  State Machine │────▶│  Task Manager  │────▶│   Executor   │ │
│  │                │     │                │     │              │ │
│  │  - States      │     │  - Queue       │     │  - Actions   │ │
│  │  - Transitions │     │  - Concurrency │     │  - Providers │ │
│  │  - Validation  │     │  - Scheduling  │     │  - Evaluators│ │
│  └────────────────┘     └────────────────┘     └──────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                         Scheduler                           │ │
│  │  - Interval-based scheduling                                │ │
│  │  - Cron expression support                                  │ │
│  │  - Task prioritization                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Key Responsibilities

1. **Lifecycle Management**: Initialize, start, stop, shutdown agents
2. **Task Orchestration**: Manage concurrent task execution (default: 10 concurrent)
3. **Plugin Coordination**: Load, initialize, and manage plugin lifecycles
4. **State Management**: Maintain valid state transitions
5. **Scheduling**: Handle interval and cron-based task scheduling

#### Configuration Options

```typescript
interface RuntimeConfig {
  debug: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  defaultChain: ChainType;
  supportedChains: ChainType[];
  maxConcurrentTasks: number;  // default: 10
  taskTimeout: number;         // in milliseconds
}
```

---

### Flow Engine

The Flow Engine enables visual workflow creation and execution through a graph-based system.

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLOW ENGINE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │    Nodes     │    │    Edges     │    │   Validation     │  │
│  │              │    │              │    │                  │  │
│  │  - Trigger   │───▶│  - Source    │───▶│  - DAG Check     │  │
│  │  - Action    │    │  - Target    │    │  - Node Types    │  │
│  │  - Condition │    │  - Condition │    │  - Edge Rules    │  │
│  │  - Loop      │    │  - Priority  │    │  - Connectivity  │  │
│  │  - Delay     │    │              │    │                  │  │
│  │  - Subflow   │    │              │    │                  │  │
│  │  - Output    │    │              │    │                  │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     Execution Engine                        │ │
│  │                                                             │ │
│  │   1. Parse Flow Definition                                  │ │
│  │   2. Generate Topological Order                             │ │
│  │   3. Execute Nodes in Order                                 │ │
│  │   4. Evaluate Conditions                                    │ │
│  │   5. Handle Loops                                           │ │
│  │   6. Collect Results                                        │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Supported Node Types

| Node Type | Description | Use Case |
|-----------|-------------|----------|
| **Trigger** | Entry point for flow execution | Manual, schedule, event, webhook |
| **Action** | Executes plugin actions | API calls, blockchain operations |
| **Condition** | Logical branching | if/else, switch logic |
| **Loop** | Iteration constructs | forEach, while, count loops |
| **Delay** | Pause execution | Rate limiting, timing |
| **Subflow** | Nested flow execution | Modular flow composition |
| **Output** | Flow output/results | Return values |

#### Edge Connection Rules

```
Trigger   → [Action, Condition, Delay, Subflow]
Action    → [Action, Condition, Delay, Loop, Subflow, Output]
Condition → [Action, Condition, Delay, Loop, Subflow, Output]
Loop      → [Action, Condition, Delay, Subflow, Output]
Delay     → [Action, Condition, Loop, Subflow, Output]
Subflow   → [Action, Condition, Delay, Loop, Subflow, Output]
Output    → [] (terminal node)
```

---

### Plugin System

The Plugin System provides a modular, extensible architecture for adding capabilities.

```
┌─────────────────────────────────────────────────────────────────┐
│                        PLUGIN SYSTEM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Plugin Manager                         │   │
│  │  ┌───────────┐  ┌───────────┐  ┌──────────────────────┐  │   │
│  │  │  Registry │  │  Loader   │  │  Lifecycle Manager   │  │   │
│  │  │           │  │           │  │                      │  │   │
│  │  │ - Map     │  │ - Dynamic │  │ - Init               │  │   │
│  │  │ - Lookup  │  │ - Package │  │ - Destroy            │  │   │
│  │  │ - Track   │  │ - Path    │  │ - Events             │  │   │
│  │  └───────────┘  └───────────┘  └──────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Plugin Contract                         │   │
│  │                                                           │   │
│  │  interface SamTerminalPlugin {                                 │   │
│  │    name: string;                                          │   │
│  │    version: string;                                       │   │
│  │    description?: string;                                  │   │
│  │                                                           │   │
│  │    // Lifecycle                                           │   │
│  │    init(core: SamTerminalCore): Promise<void>;                 │   │
│  │    destroy?(): Promise<void>;                             │   │
│  │                                                           │   │
│  │    // Capabilities                                        │   │
│  │    actions?: Action[];                                    │   │
│  │    providers?: Provider[];                                │   │
│  │    evaluators?: Evaluator[];                              │   │
│  │    hooks?: Hook[];                                        │   │
│  │    chains?: Chain[];                                      │   │
│  │  }                                                        │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Available Plugins

| Plugin | Package | Capabilities |
|--------|---------|--------------|
| **AI** | `@samterminal/plugin-ai` | LLM integration (OpenAI, Claude) |
| **Telegram** | `@samterminal/plugin-telegram` | Bot, notifications |
| **Swap** | `@samterminal/plugin-swap` | DEX aggregation, swaps |
| **TokenData** | `@samterminal/plugin-tokendata` | Prices, pools, metadata |
| **WalletData** | `@samterminal/plugin-walletdata` | Portfolio, balances |
| **Onboarding** | `@samterminal/plugin-onboarding` | User onboarding flows |

#### Plugin Capabilities

- **Actions**: Executable operations (e.g., `swap.execute`, `ai.generateText`)
- **Providers**: Data sources (e.g., `tokendata.getPrice`, `walletdata.getBalance`)
- **Evaluators**: Decision logic (e.g., `condition.evaluate`)
- **Hooks**: Event handlers for lifecycle events
- **Chains**: Blockchain network configurations

---

### Service Registry

The Service Registry maintains a centralized catalog of all available actions, providers, and evaluators.

```
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE REGISTRY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                        Actions                              │ │
│  │  Map<string, Action>                                        │ │
│  │                                                             │ │
│  │  "ai.generateText"     → AIPlugin.generateText              │ │
│  │  "swap.execute"        → SwapPlugin.execute                 │ │
│  │  "telegram.send"       → TelegramPlugin.send                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                       Providers                             │ │
│  │  Map<string, Provider>                                      │ │
│  │                                                             │ │
│  │  "tokendata.price"     → TokenDataPlugin.priceProvider      │ │
│  │  "walletdata.balance"  → WalletDataPlugin.balanceProvider   │ │
│  │  "tokendata.pools"     → TokenDataPlugin.poolsProvider      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      Evaluators                             │ │
│  │  Map<string, Evaluator>                                     │ │
│  │                                                             │ │
│  │  "condition.price"     → PriceConditionEvaluator            │ │
│  │  "condition.balance"   → BalanceConditionEvaluator          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Chain Manager

The Chain Manager handles multi-chain support for EVM networks.

```
┌─────────────────────────────────────────────────────────────────┐
│                       CHAIN MANAGER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    EVM Manager                               │ │
│  │                                                              │ │
│  │  Supported Chains:                                           │ │
│  │  - Ethereum (1)                                              │ │
│  │  - Base (8453)                                               │ │
│  │  - Arbitrum (42161)                                          │ │
│  │  - Optimism (10)                                             │ │
│  │  - Polygon (137)                                             │ │
│  │  - BSC (56)                                                  │ │
│  │                                                              │ │
│  │  Features:                                                   │ │
│  │  - RPC management                                            │ │
│  │  - Gas estimation                                            │ │
│  │  - Tx signing                                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Chain Configuration                       │ │
│  │                                                             │ │
│  │  interface ChainConfig {                                    │ │
│  │    id: number | string;                                     │ │
│  │    name: string;                                            │ │
│  │    type: 'evm' | 'solana';                                  │ │
│  │    rpcUrl: string;                                          │ │
│  │    nativeCurrency: { name, symbol, decimals };              │ │
│  │    blockExplorer?: string;                                  │ │
│  │  }                                                          │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Hooks System

The Hooks System provides event-driven programming capabilities throughout the framework.

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOOKS SYSTEM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Event Emitter                            │ │
│  │                                                             │ │
│  │  Lifecycle Events:                                          │ │
│  │  ├── agent:initializing                                     │ │
│  │  ├── agent:started                                          │ │
│  │  ├── agent:stopping                                         │ │
│  │  └── agent:stopped                                          │ │
│  │                                                             │ │
│  │  Plugin Events:                                             │ │
│  │  ├── plugin:registering                                     │ │
│  │  ├── plugin:loaded                                          │ │
│  │  ├── plugin:unloading                                       │ │
│  │  └── plugin:unloaded                                        │ │
│  │                                                             │ │
│  │  Task Events:                                               │ │
│  │  ├── task:started                                           │ │
│  │  ├── task:completed                                         │ │
│  │  ├── task:failed                                            │ │
│  │  └── task:timeout                                           │ │
│  │                                                             │ │
│  │  Flow Events:                                               │ │
│  │  ├── flow:started                                           │ │
│  │  ├── flow:node:executed                                     │ │
│  │  ├── flow:completed                                         │ │
│  │  └── flow:failed                                            │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Hook Options                             │ │
│  │                                                             │ │
│  │  - priority: number (higher = first)                        │ │
│  │  - once: boolean (auto-unsubscribe after first call)        │ │
│  │  - timeout: number (max execution time in ms)               │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Order Template System

The Order Template System provides pre-built trading automation templates with a rich condition system.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORDER TEMPLATE SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Condition System                          │ │
│  │                                                             │ │
│  │  Data Fields:                                               │ │
│  │  - price, priceChange1h/24h/7d                             │ │
│  │  - mcap, fdv, volume24h, liquidity                         │ │
│  │  - holders, tokenAge, txCount24h                           │ │
│  │  - buyPressure, sellPressure                               │ │
│  │                                                             │ │
│  │  Operators:                                                 │ │
│  │  - eq, neq, gt, gte, lt, lte, between, change             │ │
│  │                                                             │ │
│  │  Logic:                                                     │ │
│  │  - AND / OR grouping                                        │ │
│  │  - Nested condition groups                                  │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Order Templates                           │ │
│  │                                                             │ │
│  │  Sell Templates:                                            │ │
│  │  - stop-loss         (price trigger)                       │ │
│  │  - take-profit       (price trigger)                       │ │
│  │  - conditional-sell  (custom conditions)                   │ │
│  │  - trailing-stop     (dynamic stop-loss)                   │ │
│  │                                                             │ │
│  │  Buy Templates:                                             │ │
│  │  - conditional-buy   (custom conditions)                   │ │
│  │  - smart-entry       (multi-condition entry)               │ │
│  │                                                             │ │
│  │  Periodic Templates:                                        │ │
│  │  - dca               (dollar-cost averaging)               │ │
│  │  - twap              (time-weighted average)               │ │
│  │                                                             │ │
│  │  Combo Templates:                                           │ │
│  │  - dual-protection   (stop-loss + take-profit)             │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Flow Generation                           │ │
│  │                                                             │ │
│  │  Order Template ──▶ Flow Definition ──▶ Flow Engine        │ │
│  │                                                             │ │
│  │  Generated Flow Structure:                                  │ │
│  │  1. Trigger (schedule/interval)                            │ │
│  │  2. Action (get token data)                                │ │
│  │  3. Condition (evaluate conditions)                        │ │
│  │  4. Action (execute swap)                                  │ │
│  │  5. Output (notify/complete)                               │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Order Lifecycle

```
created ──▶ active ──▶ triggered ──▶ executing ──▶ completed
                │                                      │
                ├──▶ paused ──▶ active                │
                │                                      │
                └──▶ cancelled                         └──▶ failed
```

#### CLI Commands

| Command | Description |
|---------|-------------|
| `sam order create <type>` | Create a new order |
| `sam order list` | List orders |
| `sam order get <id>` | Get order details |
| `sam order cancel <id>` | Cancel an order |
| `sam order pause <id>` | Pause an order |
| `sam order resume <id>` | Resume a paused order |

#### AI Chat Actions

| Action | Description |
|--------|-------------|
| `order:create` | Create order from template |
| `order:list` | List orders with filters |
| `order:get` | Get order details |
| `order:cancel` | Cancel an order |
| `order:pause` | Pause an order |
| `order:resume` | Resume an order |
| `order:stats` | Get order statistics |

---

## Services Architecture

### NestJS Microservices

```
┌─────────────────────────────────────────────────────────────────┐
│                   NESTJS MICROSERVICES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Main Service                          │    │
│  │                    Port: 50060                           │    │
│  │                                                          │    │
│  │  - Scanner Hub                                           │    │
│  │  - Token/Wallet Microservice Coordination                │    │
│  │  - gRPC Client to Other Services                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐                          │
│  │  Notification  │  │      Swap      │                          │
│  │  Port: 50056   │  │  Port: 50059   │                          │
│  │                │  │                │                          │
│  │  - Telegram    │  │  - DEX Agg.    │                          │
│  │  - Farcaster   │  │  - Permit2     │                          │
│  │  - Alerts      │  │  - Permit2     │                          │
│  └────────────────┘  └────────────────┘                          │
│                                                                  │
│  ┌────────────────┐                                              │
│  │  Transactions  │                                              │
│  │  Port: 50054   │                                              │
│  │                │                                              │
│  │  - Tx Logging  │                                              │
│  │  - History     │                                              │
│  │  - Status      │                                              │
│  └────────────────┘                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Service Details

| Service | Port | Database | Purpose |
|---------|------|----------|---------|
| **main** | 50060 | - | Orchestration, scanner hub |
| **notification** | 50056 | notification | Telegram/Farcaster notifications |
| **swap** | 50059 | swap | Token swap execution |
| **transactions** | 50054 | transactions | Transaction logging |

---

### Go Services

```
┌─────────────────────────────────────────────────────────────────┐
│                       GO SERVICES                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐ │
│  │         TokenData            │  │        WalletData        │ │
│  │         Port: 50061          │  │        Port: 50062       │ │
│  │                              │  │                          │ │
│  │  Features:                   │  │  Features:               │ │
│  │  - DEX Pool Watching         │  │  - Wallet Balances       │ │
│  │  - Real-time Token Data      │  │  - Transaction History   │ │
│  │  - Price Feeds               │  │  - Portfolio Tracking    │ │
│  │  - Pool Analytics            │  │  - Multi-chain Support   │ │
│  │                              │  │                          │ │
│  │  Database:                   │  │  Database:               │ │
│  │  - scanner-token         │  │  - scanner-wallet    │ │
│  │                              │  │                          │ │
│  │  API:                        │  │  API:                    │ │
│  │  - gRPC Server               │  │  - gRPC Server           │ │
│  │  - HTTP API (optional)       │  │  - HTTP API (optional)   │ │
│  │                              │  │                          │ │
│  └──────────────────────────────┘  └──────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Go Stack                                 │ │
│  │                                                             │ │
│  │  - Go 1.24+                                                 │ │
│  │  - Prisma Go Client                                         │ │
│  │  - gRPC + Protocol Buffers                                  │ │
│  │  - go-ethereum                                              │ │
│  │  - Concurrent goroutines for pool watching                  │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### gRPC Communication

```
┌─────────────────────────────────────────────────────────────────┐
│                    gRPC COMMUNICATION                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Proto Files (proto/):                                          │
│                                                                  │
│  Core Proto Files:                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  index.proto    │  │common/common    │  │token/messages   │ │
│  │                 │  │                 │  │                 │ │
│  │  Scanner:   │  │  Common Types:  │  │  Token Messages:│ │
│  │  - getToken     │  │  - CHAIN enum   │  │  - AddToken     │ │
│  │  - addToken     │  │  - Token        │  │  - GetToken     │ │
│  │  - addWallet    │  │  - Wallet       │  │  - RemoveToken  │ │
│  │  - getWallet    │  │  - WalletToken  │  │  - GetTokens    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                  │
│  Service Proto Files:                                            │
│  ┌─────────────────┐  ┌─────────────────┐                    │
│  │   swap.proto    │  │notification     │                    │
│  │                 │  │                 │                    │
│  │  SwapService:   │  │  NotifService:  │                    │
│  │  - getQuote     │  │  - send         │                    │
│  │  - approve      │  │  - getUserBotURL│                    │
│  │  - swap         │  │  - toggleState  │                    │
│  └─────────────────┘  └─────────────────┘                    │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ transactions    │  │token/token.proto│  │wallet/wallet    │ │
│  │                 │  │                 │  │                 │ │
│  │  TxService:     │  │  TokenService:  │  │  WalletService: │ │
│  │  - logTx        │  │  - getToken     │  │  - addWallet    │ │
│  │  - updateTx     │  │  - getTokens    │  │  - getWallet    │ │
│  │  - getTx        │  │  - addBlacklist │  │  - getDetails   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Communication Pattern                      │ │
│  │                                                             │ │
│  │  NestJS Service ──gRPC Request──▶ Go Service               │ │
│  │                                                             │ │
│  │  Client (NestJS)     ◀──gRPC Response──  Server (Go)       │ │
│  │                                                             │ │
│  │  Message Format: Protocol Buffers 3                         │ │
│  │  Features: Streaming, Deadlines, Metadata                   │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Request Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              REQUEST FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

User Request
     │
     ▼
┌────────────────┐
│   CLI / API    │
└───────┬────────┘
        │
        ▼
┌────────────────┐     ┌────────────────┐
│  SamTerminal Core   │────▶│ Service Regis. │
│                │     │  (Find Action) │
└───────┬────────┘     └────────────────┘
        │
        ▼
┌────────────────┐
│    Executor    │
│  (Run Action)  │
└───────┬────────┘
        │
        ├──────────────┬──────────────┬──────────────┐
        ▼              ▼              ▼              ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│  AI Plugin   ││ Swap Plugin  ││Token Plugin  ││Wallet Plugin │
│              ││              ││              ││              │
│  - OpenAI    ││  - 0x/1inch  ││  - gRPC to   ││  - gRPC to   │
│  - Claude    ││  - Permit2   ││  - Go Svc    ││  - Go Svc    │
└──────────────┘└──────────────┘└──────────────┘└──────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│External APIs ││ Blockchain   ││ TokenData    ││ WalletData   │
│ (LLM)        ││   (DEX)      ││   (Go)       ││   (Go)       │
└──────────────┘└──────────────┘└──────────────┘└──────────────┘
        │              │              │              │
        └──────────────┴──────────────┴──────────────┘
                              │
                              ▼
                    ┌────────────────┐
                    │    Response    │
                    └────────────────┘
```

---

### Plugin Communication

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PLUGIN COMMUNICATION                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              SamTerminal Core                                     │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Service Registry                             │    │
│  │                                                                      │    │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │    │
│  │   │   Actions   │  │  Providers  │  │  Evaluators │                 │    │
│  │   └─────────────┘  └─────────────┘  └─────────────┘                 │    │
│  │          ▲               ▲               ▲                          │    │
│  └──────────┼───────────────┼───────────────┼──────────────────────────┘    │
│             │               │               │                               │
│  ┌──────────┴───────────────┴───────────────┴──────────────────────────┐    │
│  │                                                                      │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────┐ │    │
│  │  │  AI Plugin │  │Swap Plugin │  │Token Plugin│  │ Wallet Plugin  │ │    │
│  │  │            │  │            │  │            │  │                │ │    │
│  │  │ Registers: │  │ Registers: │  │ Registers: │  │  Registers:    │ │    │
│  │  │ - Actions  │  │ - Actions  │  │ - Providers│  │  - Providers   │ │    │
│  │  │ - Providers│  │ - Providers│  │ - Evaluator│  │                │ │    │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────────┘ │    │
│  │                                                                      │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Cross-Plugin Communication:                                                 │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                                                                     │     │
│  │  Plugin A                    Service Registry                       │     │
│  │     │                              │                                │     │
│  │     │  1. Request Provider         │                                │     │
│  │     │─────────────────────────────▶│                                │     │
│  │     │                              │                                │     │
│  │     │  2. Return Provider Ref      │                                │     │
│  │     │◀─────────────────────────────│                                │     │
│  │     │                              │                                │     │
│  │     │  3. Call Provider            │         Plugin B               │     │
│  │     │─────────────────────────────────────────▶│                    │     │
│  │     │                                          │                    │     │
│  │     │  4. Return Data                          │                    │     │
│  │     │◀─────────────────────────────────────────│                    │     │
│  │                                                                     │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Flow Execution

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FLOW EXECUTION                                    │
└─────────────────────────────────────────────────────────────────────────────┘

Flow Definition
      │
      ▼
┌────────────────────┐
│  Parse & Validate  │
│  - Check DAG       │
│  - Validate nodes  │
│  - Validate edges  │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Topological Sort   │
│ - Order nodes      │
│ - Resolve deps     │
└─────────┬──────────┘
          │
          ▼
┌────────────────────────────────────────────────────────────────────┐
│                        EXECUTION LOOP                               │
│                                                                     │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐       │
│   │ Trigger  │──▶│  Action  │──▶│Condition │──▶│  Action  │       │
│   │          │   │          │   │          │   │          │       │
│   │ manual   │   │ api call │   │ if/else  │   │ process  │       │
│   └──────────┘   └──────────┘   └────┬─────┘   └──────────┘       │
│                                      │                              │
│                            ┌─────────┴─────────┐                   │
│                            ▼                   ▼                   │
│                      ┌──────────┐        ┌──────────┐              │
│                      │  Loop    │        │  Delay   │              │
│                      │          │        │          │              │
│                      │ forEach  │        │  wait    │              │
│                      └────┬─────┘        └────┬─────┘              │
│                           │                   │                    │
│                           └─────────┬─────────┘                    │
│                                     ▼                              │
│                              ┌──────────┐                          │
│                              │  Output  │                          │
│                              │          │                          │
│                              │ results  │                          │
│                              └──────────┘                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────┐
│   Collect Results  │
│   - Execution log  │
│   - Output data    │
│   - Errors         │
└────────────────────┘
```

---

## State Machines

### Runtime States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RUNTIME STATE MACHINE                               │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │  UNINITIALIZED   │
                              │                  │
                              │  Initial state   │
                              └────────┬─────────┘
                                       │
                                       │ initialize()
                                       ▼
                              ┌──────────────────┐
                              │   INITIALIZING   │
                              │                  │
                              │  Setting up      │
                              │  components      │
                              └────────┬─────────┘
                                       │
                                       │ (auto)
                                       ▼
                              ┌──────────────────┐
                              │ LOADING_PLUGINS  │
                              │                  │
                              │  Loading and     │
                              │  init plugins    │
                              └────────┬─────────┘
                                       │
                                       │ (auto)
                                       ▼
                              ┌──────────────────┐
                              │      READY       │
                              │                  │
                              │  All plugins     │
                              │  loaded          │
                              └────────┬─────────┘
                                       │
                                       │ start()
                                       ▼
                              ┌──────────────────┐
           ┌─────────────────▶│     RUNNING      │◀─────────────────┐
           │                  │                  │                  │
           │                  │  Executing       │                  │
           │                  │  tasks/flows     │                  │
           │                  └────────┬─────────┘                  │
           │                           │                            │
           │ resume()                  │ stop()                     │ (after error
           │                           ▼                            │  recovery)
           │                  ┌──────────────────┐                  │
           │                  │     PAUSED       │──────────────────┘
           │                  │                  │
           └──────────────────│  Temporarily     │
                              │  halted          │
                              └────────┬─────────┘
                                       │
                                       │ shutdown()
                                       ▼
                              ┌──────────────────┐
                              │    SHUTDOWN      │
                              │                  │
                              │  Cleaning up     │
                              │  resources       │
                              └──────────────────┘


Valid Transitions:
───────────────────
UNINITIALIZED   → INITIALIZING
INITIALIZING    → LOADING_PLUGINS
LOADING_PLUGINS → READY
READY           → RUNNING
RUNNING         → PAUSED, SHUTDOWN
PAUSED          → RUNNING, SHUTDOWN
```

---

### Flow Execution States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FLOW EXECUTION STATE MACHINE                           │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │     PENDING      │
                              │                  │
                              │  Flow created    │
                              │  awaiting exec   │
                              └────────┬─────────┘
                                       │
                                       │ execute()
                                       ▼
                              ┌──────────────────┐
                              │   VALIDATING     │
                              │                  │
                              │  Checking flow   │
                              │  structure       │
                              └────────┬─────────┘
                                       │
                           ┌───────────┴───────────┐
                           │                       │
                           ▼                       ▼
                  ┌──────────────────┐    ┌──────────────────┐
                  │    EXECUTING     │    │     FAILED       │
                  │                  │    │                  │
                  │  Running nodes   │    │  Validation      │
                  │  in order        │    │  error           │
                  └────────┬─────────┘    └──────────────────┘
                           │
               ┌───────────┼───────────┐
               │           │           │
               ▼           ▼           ▼
      ┌──────────────┐ ┌──────────┐ ┌──────────────┐
      │  COMPLETED   │ │  FAILED  │ │   TIMEOUT    │
      │              │ │          │ │              │
      │  All nodes   │ │  Node    │ │  Execution   │
      │  executed    │ │  error   │ │  exceeded    │
      └──────────────┘ └──────────┘ └──────────────┘


Node Execution States:
──────────────────────
WAITING     → Node waiting for dependencies
EXECUTING   → Node currently running
COMPLETED   → Node finished successfully
FAILED      → Node encountered error
SKIPPED     → Node skipped (condition false)
```

---

### Plugin Lifecycle States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PLUGIN LIFECYCLE STATE MACHINE                         │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │   UNREGISTERED   │
                              │                  │
                              │  Plugin not yet  │
                              │  in registry     │
                              └────────┬─────────┘
                                       │
                                       │ register()
                                       ▼
                              ┌──────────────────┐
                              │   REGISTERED     │
                              │                  │
                              │  In registry     │
                              │  not loaded      │
                              └────────┬─────────┘
                                       │
                                       │ load()
                                       ▼
                              ┌──────────────────┐
                              │     LOADING      │
                              │                  │
                              │  Loading module  │
                              │  and deps        │
                              └────────┬─────────┘
                                       │
                           ┌───────────┴───────────┐
                           │                       │
                           ▼                       ▼
                  ┌──────────────────┐    ┌──────────────────┐
                  │   INITIALIZING   │    │   LOAD_FAILED    │
                  │                  │    │                  │
                  │  Running init()  │    │  Module error    │
                  │  method          │    │                  │
                  └────────┬─────────┘    └──────────────────┘
                           │
                           │ (success)
                           ▼
                  ┌──────────────────┐
                  │      ACTIVE      │◀───────────────┐
                  │                  │                │
                  │  Fully operational│               │
                  │  services ready  │                │
                  └────────┬─────────┘                │
                           │                          │
                           │ unload()                 │ (reload)
                           ▼                          │
                  ┌──────────────────┐                │
                  │    DESTROYING    │────────────────┘
                  │                  │
                  │  Running destroy()│
                  │  cleanup         │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │    DESTROYED     │
                  │                  │
                  │  Resources freed │
                  │  removed from reg│
                  └──────────────────┘


Lifecycle Hooks:
────────────────
plugin:registering  → Before adding to registry
plugin:registered   → After adding to registry
plugin:loading      → Before module load
plugin:loaded       → After successful load
plugin:initializing → Before init() call
plugin:initialized  → After init() success
plugin:unloading    → Before destroy() call
plugin:unloaded     → After destroy() complete
```

---

## Design Decisions

### 1. Why Plugin-Based Architecture?

**Decision**: All capabilities are delivered through plugins with a standardized interface.

**Rationale**:
- **Modularity**: Each plugin is self-contained with clear boundaries
- **Extensibility**: New capabilities can be added without modifying core
- **Testability**: Plugins can be tested in isolation
- **Maintainability**: Changes to one plugin don't affect others
- **Community**: Third-party developers can create plugins

**Trade-offs**:
- Increased complexity in plugin coordination
- Potential performance overhead from abstraction layers
- Learning curve for plugin development

---

### 2. Why Multi-Chain Support?

**Decision**: Native support for EVM chains (Ethereum, Base, etc.).

**Rationale**:
- **Market Coverage**: Support for the dominant EVM blockchain ecosystem
- **Flexibility**: Users can build agents for any supported chain
- **Future-Proof**: Easy to add new chains via Chain Manager
- **DeFi Access**: Access to liquidity across multiple chains

**Trade-offs**:
- Increased codebase complexity
- Different paradigms (account-based vs UTXO-like)
- Chain-specific testing requirements

---

### 3. Why ESM Only?

**Decision**: The project uses ECMAScript Modules (ESM) exclusively.

**Rationale**:
- **Modern Standard**: ESM is the JavaScript standard for modules
- **Tree Shaking**: Better dead code elimination
- **Async Loading**: Native support for dynamic imports
- **TypeScript Alignment**: Better interop with TypeScript

**Trade-offs**:
- Incompatibility with some legacy CommonJS packages
- Requires Node.js 18+ for full support
- Configuration complexity with dual package hazard

---

### 4. Why gRPC for Inter-Service Communication?

**Decision**: Use gRPC with Protocol Buffers for service communication.

**Rationale**:
- **Performance**: Binary serialization is faster than JSON
- **Type Safety**: Proto files provide schema enforcement
- **Streaming**: Native support for bidirectional streaming
- **Code Generation**: Auto-generate client/server stubs
- **Language Agnostic**: Works with TypeScript and Go

**Trade-offs**:
- Steeper learning curve than REST
- Harder to debug (binary format)
- Requires protoc toolchain
- Less browser-friendly

---

### 5. Why Microservices Architecture?

**Decision**: Separate services for different domains (swap, notification, etc.).

**Rationale**:
- **Scalability**: Scale individual services based on load
- **Isolation**: Failures don't cascade across services
- **Technology Freedom**: Use Go for performance-critical services
- **Team Autonomy**: Teams can work on services independently
- **Deployment Flexibility**: Deploy services independently

**Trade-offs**:
- Network latency between services
- Distributed system complexity
- Data consistency challenges
- Operational overhead

---

### 6. Why Prisma for ORM?

**Decision**: Use Prisma as the ORM for both TypeScript and Go services.

**Rationale**:
- **Type Safety**: Generated types from schema
- **Developer Experience**: Intuitive query API
- **Migrations**: Built-in migration system
- **Multi-Language**: Client for both TypeScript and Go
- **Schema First**: Single source of truth for data models

**Trade-offs**:
- Generated client size
- Limited raw SQL flexibility
- Query performance in complex scenarios

---

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEVELOPMENT ENVIRONMENT                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Local Machine                                                               │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                                                                     │     │
│  │  ┌──────────────────────────────────────────────────────────────┐  │     │
│  │  │                   Turbo Watch Mode                            │  │     │
│  │  │                                                               │  │     │
│  │  │  pnpm dev                                                     │  │     │
│  │  │  - Watches all packages                                       │  │     │
│  │  │  - Hot reloads on changes                                     │  │     │
│  │  │  - Runs all services locally                                  │  │     │
│  │  │                                                               │  │     │
│  │  └──────────────────────────────────────────────────────────────┘  │     │
│  │                                                                     │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │     │
│  │  │ PostgreSQL  │  │   Node.js   │  │         Go 1.24+            │ │     │
│  │  │    16       │  │   18.20+    │  │                             │ │     │
│  │  │  (3 DBs)    │  │  (Services) │  │  (tokendata, walletdata)    │ │     │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │     │
│  │                                                                     │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Production Environment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION ENVIRONMENT                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          Load Balancer                                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│              ┌─────────────────────┼─────────────────────┐                  │
│              ▼                     ▼                     ▼                  │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐            │
│  │  Kubernetes    │    │  Kubernetes    │    │  Kubernetes    │            │
│  │    Cluster     │    │    Cluster     │    │    Cluster     │            │
│  │                │    │                │    │                │            │
│  │ ┌────────────┐ │    │ ┌────────────┐ │    │ ┌────────────┐ │            │
│  │ │NestJS Pods │ │    │ │ Go Pods    │ │    │ │ Worker     │ │            │
│  │ │            │ │    │ │            │ │    │ │ Pods       │ │            │
│  │ │ - main     │ │    │ │ - tokendata│ │    │ │            │ │            │
│  │ │ - notif    │ │    │ │ - walletdt │ │    │ │ - Tasks    │ │            │
│  │ │ - swap     │ │    │ │            │ │    │ │ - Flows    │ │            │
│  │ │ - txns     │ │    │ │            │ │    │ │            │ │            │
│  │ └────────────┘ │    │ └────────────┘ │    │ └────────────┘ │            │
│  └────────────────┘    └────────────────┘    └────────────────┘            │
│                                    │                                         │
│              ┌─────────────────────┴─────────────────────┐                  │
│              ▼                                           ▼                  │
│  ┌────────────────────────────┐          ┌────────────────────────────┐    │
│  │       Managed PostgreSQL   │          │         Redis Cluster      │    │
│  │                            │          │                            │    │
│  │  samterminal_user:          │          │  - Session cache           │    │
│  │    notification, swap,     │          │  - Rate limiting           │    │
│  │    transactions (schemas)  │          │  - Pub/Sub                 │    │
│  │  scanner-token             │          │                            │    │
│  │  scanner-wallet            │          │                            │    │
│  │                            │          │                            │    │
│  └────────────────────────────┘          └────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix

### A. Port Assignments

| Service | Port | Protocol |
|---------|------|----------|
| main | 50060 | gRPC |
| transactions | 50054 | gRPC |
| notification | 50056 | gRPC |
| swap | 50059 | gRPC |
| tokendata | 50061 | gRPC |
| walletdata | 50062 | gRPC |

### B. Database Schema Overview

SamTerminal uses a unified database for user-related services with PostgreSQL schemas for isolation:

| Database | Schema | Owner Service | Purpose |
|----------|--------|---------------|---------|
| samterminal_user | notification | notification | User bots, messages |
| samterminal_user | swap | swap | Swap transactions |
| samterminal_user | transactions | transactions | Transaction logs |
| scanner-token | - | tokendata | Token metadata, pools |
| scanner-wallet | - | walletdata | Wallet balances, history |

**Benefits of unified user database:**
- Single connection string for user services
- Cross-schema JOINs possible
- Simplified backup/restore
- Reduced connection pool overhead

### C. Package Dependency Graph

```
@samterminal/playground (apps/playground)
    └── @samterminal/core
    └── @samterminal/plugin-* (all plugins)

@samterminal/core (packages/core)
    └── @samterminal/testing-utils (dev)
    └── @samterminal/eslint-config (dev)
    └── @samterminal/tsconfig (dev)

@samterminal/cli (packages/cli)
    └── @samterminal/core

@samterminal/plugin-* (packages/plugins/*)
    └── @samterminal/core (peer dependency)
```

### D. Key Interfaces

```typescript
// Core Interface
interface SamTerminalCore {
  runtime: RuntimeEngine;
  flow: FlowEngine;
  plugins: PluginManager;
  hooks: HookManager;
  services: ServiceRegistry;
  chains: ChainManager;
}

// Runtime Engine Interface
interface RuntimeEngine {
  state: RuntimeState;
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  shutdown(): Promise<void>;
  executeAction(name: string, params: unknown): Promise<unknown>;
  getProvider(name: string): Provider | undefined;
}

// Plugin Interface
interface SamTerminalPlugin {
  name: string;
  version: string;
  description?: string;
  init(core: SamTerminalCore): Promise<void>;
  destroy?(): Promise<void>;
  actions?: Action[];
  providers?: Provider[];
  evaluators?: Evaluator[];
  hooks?: Hook[];
  chains?: Chain[];
}

// Flow Definition Interface
interface FlowDefinition {
  id: string;
  name: string;
  description?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  variables?: Record<string, unknown>;
}
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-26 | SamTerminal Team | Initial architecture documentation |
| 1.1.0 | 2026-01-30 | SamTerminal Team | Added Order Template System documentation |

---

*This document is maintained as part of the SamTerminal project. For questions or suggestions, please open an issue in the repository.*
