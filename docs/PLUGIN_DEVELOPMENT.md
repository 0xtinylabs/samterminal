# SamTerminal Plugin Development Guide

**Version:** 1.0.0
**Last Updated:** January 26, 2026
**Status:** Active Development

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Plugin Interface Specification](#plugin-interface-specification)
   - [SamTerminalPlugin Interface](#samterminalplugin-interface)
   - [Action Interface](#action-interface)
   - [Provider Interface](#provider-interface)
   - [Evaluator Interface](#evaluator-interface)
   - [Hook Interface](#hook-interface)
4. [Creating a Plugin](#creating-a-plugin)
   - [Project Setup](#project-setup)
   - [Plugin Structure](#plugin-structure)
   - [Using BasePlugin](#using-baseplugin)
   - [Using createPlugin Factory](#using-createplugin-factory)
5. [Plugin Lifecycle](#plugin-lifecycle)
   - [Lifecycle States](#lifecycle-states)
   - [Initialization Flow](#initialization-flow)
   - [Destruction Flow](#destruction-flow)
   - [Lifecycle Events](#lifecycle-events)
6. [Configuration](#configuration)
   - [Constructor Options](#constructor-options)
   - [Environment Variables](#environment-variables)
   - [Runtime Configuration](#runtime-configuration)
7. [Multi-Chain Development](#multi-chain-development)
   - [Chain Configuration](#chain-configuration)
   - [Chain-Specific Logic](#chain-specific-logic)
   - [Multi-Chain Examples](#multi-chain-examples)
8. [Testing Plugins](#testing-plugins)
   - [Unit Testing](#unit-testing)
   - [Integration Testing](#integration-testing)
   - [Test Utilities](#test-utilities)
9. [Publishing Plugins](#publishing-plugins)
   - [Package Structure](#package-structure)
   - [Versioning](#versioning)
   - [NPM Publishing](#npm-publishing)
10. [Best Practices](#best-practices)
11. [Examples](#examples)
12. [Troubleshooting](#troubleshooting)
13. [API Reference](#api-reference)

---

## Overview

SamTerminal plugins are modular extensions that add capabilities to the SamTerminal runtime. Each plugin can provide:

- **Actions**: Executable operations (e.g., swap tokens, send notifications)
- **Providers**: Data sources (e.g., token prices, wallet balances)
- **Evaluators**: Condition checkers for flow logic
- **Hooks**: Event listeners for lifecycle events

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SAMTERMINAL CORE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        PLUGIN MANAGER                                    ││
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────────┐││
│  │  │   Registry    │  │    Loader     │  │     Lifecycle Manager         │││
│  │  │               │  │               │  │                               │││
│  │  │ - Register    │  │ - Package     │  │ - Init / Destroy              │││
│  │  │ - Lookup      │  │ - Module      │  │ - State Transitions           │││
│  │  │ - Dependencies│  │ - Factory     │  │ - Event Emission              │││
│  │  └───────────────┘  └───────────────┘  └───────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                     │                                        │
│                                     ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                            PLUGINS                                       ││
│  │                                                                          ││
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ ││
│  │   │    AI    │  │   Swap   │  │ Telegram │  │TokenData │  │  Custom  │ ││
│  │   │          │  │          │  │          │  │          │  │          │ ││
│  │   │ Actions: │  │ Actions: │  │ Actions: │  │Providers:│  │ Actions  │ ││
│  │   │ generate │  │ execute  │  │ send     │  │ price    │  │ Providers│ ││
│  │   │ classify │  │ approve  │  │ verify   │  │ search   │  │ Hooks    │ ││
│  │   └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why Plugins?

| Benefit | Description |
|---------|-------------|
| **Modularity** | Each plugin is self-contained with clear boundaries |
| **Extensibility** | Add capabilities without modifying core |
| **Testability** | Plugins can be tested in isolation |
| **Reusability** | Share plugins across projects via npm |
| **Maintainability** | Changes to one plugin don't affect others |

---

## Quick Start

### 1. Create Plugin Package

```bash
mkdir my-plugin && cd my-plugin
pnpm init
```

### 2. Install Dependencies

```bash
pnpm add -D @samterminal/core @samterminal/tsconfig typescript tsup
```

### 3. Create Plugin

```typescript
// src/index.ts
import { SamTerminalPlugin, SamTerminalCore, Action, ActionContext } from '@samterminal/core';

export class MyPlugin implements SamTerminalPlugin {
  readonly name = '@myorg/plugin-hello';
  readonly version = '1.0.0';
  readonly description = 'A simple hello world plugin';

  actions: Action[] = [];
  private core: SamTerminalCore | null = null;

  async init(core: SamTerminalCore): Promise<void> {
    this.core = core;

    // Register actions
    this.actions = [
      {
        name: 'hello:say',
        description: 'Says hello to someone',
        async execute(context: ActionContext) {
          const name = (context.input as { name: string }).name;
          return {
            success: true,
            data: `Hello, ${name}!`,
          };
        },
      },
    ];

    // Register with core
    for (const action of this.actions) {
      core.services.registerAction(action, this.name);
    }

    console.log(`${this.name} initialized`);
  }

  async destroy(): Promise<void> {
    if (this.core) {
      this.core.services.unregisterPlugin(this.name);
    }
    this.core = null;
    console.log(`${this.name} destroyed`);
  }
}

export default new MyPlugin();
```

### 4. Build & Use

```bash
pnpm build

# In your SamTerminal project
import myPlugin from '@myorg/plugin-hello';

const core = createSamTerminalCore();
await core.plugins.register(myPlugin);
await core.plugins.initAll();

// Execute action
const result = await core.runtime.executeAction('hello:say', { name: 'World' });
console.log(result.data); // "Hello, World!"
```

---

## Plugin Interface Specification

### SamTerminalPlugin Interface

The core interface that all plugins must implement:

```typescript
interface SamTerminalPlugin {
  // ═══════════════════════════════════════════════════════════════════════
  // REQUIRED PROPERTIES
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Unique plugin identifier
   * Convention: @scope/plugin-name or plugin-name
   * Examples: "@samterminal/plugin-swap", "my-custom-plugin"
   */
  readonly name: string;

  /**
   * Semantic version (semver)
   * Examples: "1.0.0", "2.1.3-beta.1"
   */
  readonly version: string;

  // ═══════════════════════════════════════════════════════════════════════
  // OPTIONAL PROPERTIES
  // ═══════════════════════════════════════════════════════════════════════

  /** Human-readable description */
  readonly description?: string;

  /** Plugin author */
  readonly author?: string;

  /** Additional metadata */
  metadata?: PluginMetadata;

  // ═══════════════════════════════════════════════════════════════════════
  // LIFECYCLE METHODS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * REQUIRED: Called when plugin is loaded
   * Use for initialization, resource allocation, service registration
   */
  init(core: SamTerminalCore): Promise<void>;

  /**
   * OPTIONAL: Called when plugin is unloaded
   * Use for cleanup, resource deallocation, service unregistration
   */
  destroy?(): Promise<void>;

  // ═══════════════════════════════════════════════════════════════════════
  // CAPABILITIES
  // ═══════════════════════════════════════════════════════════════════════

  /** Executable operations */
  actions?: Action[];

  /** Data sources */
  providers?: Provider[];

  /** Condition evaluators */
  evaluators?: Evaluator[];

  /** Event listeners */
  hooks?: Hook[];

  // ═══════════════════════════════════════════════════════════════════════
  // CHAIN SUPPORT
  // ═══════════════════════════════════════════════════════════════════════

  /** Supported blockchain networks */
  chains?: Chain[];

  /** Chain-specific configuration */
  chainConfig?: ChainConfig;

  // ═══════════════════════════════════════════════════════════════════════
  // DEPENDENCY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  /** Required plugins (must be loaded before this plugin) */
  dependencies?: string[];

  /** Optional enhancements (loaded if available) */
  optionalDependencies?: string[];
}
```

### Plugin Metadata

```typescript
interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  repository?: string;
  homepage?: string;
  keywords?: string[];
  [key: string]: unknown;
}
```

---

### Action Interface

Actions are executable operations that can be triggered by users or flows.

```typescript
interface Action {
  // ═══════════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Unique action name
   * Convention: plugin:operation
   * Examples: "swap:execute", "telegram:send", "ai:generate"
   */
  readonly name: string;

  /** Human-readable description */
  readonly description?: string;

  /** Categorization for UI grouping */
  readonly category?: string;

  /** Tags for filtering/search */
  readonly tags?: string[];

  // ═══════════════════════════════════════════════════════════════════════
  // EXECUTION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Main execution method
   * @param context - Execution context with input and metadata
   * @returns ActionResult with success status and data
   */
  execute(context: ActionContext): Promise<ActionResult>;

  /**
   * Optional input validation
   * Called before execute() if defined
   */
  validate?(input: unknown): ValidationResult;

  // ═══════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════

  /** Supported blockchain networks */
  readonly chains?: ChainId[];

  /** True if action modifies state (default: true) */
  readonly mutates?: boolean;

  /** True if user confirmation required */
  readonly requiresConfirmation?: boolean;

  /** Estimated gas for blockchain operations */
  readonly estimatedGas?: bigint;

  /** JSON Schema for input validation */
  readonly inputSchema?: ActionSchema;

  /** JSON Schema for output documentation */
  readonly outputSchema?: ActionSchema;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPPORTING TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ActionContext {
  /** Input data from caller */
  input: unknown;

  /** Plugin name executing this action */
  pluginName: string;

  /** Current agent/user ID */
  agentId: string;

  /** Current blockchain (if applicable) */
  chainId?: ChainId;

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** Plugin configuration */
  config?: Record<string, unknown>;
}

interface ActionResult {
  /** Whether action succeeded */
  success: boolean;

  /** Result data on success */
  data?: unknown;

  /** Error message on failure */
  error?: string;

  /** Additional result metadata */
  metadata?: Record<string, unknown>;
}

interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}
```

#### Action Example

```typescript
const swapAction: Action = {
  name: 'swap:execute',
  description: 'Executes a token swap on a DEX',
  category: 'defi',
  tags: ['swap', 'dex', 'trading'],
  chains: [8453, 1], // Base, Ethereum
  mutates: true,
  requiresConfirmation: true,

  async execute(context: ActionContext): Promise<ActionResult> {
    const { fromToken, toToken, amount } = context.input as SwapInput;

    try {
      // Execute swap logic
      const result = await executeSwap(fromToken, toToken, amount, context.chainId);

      return {
        success: true,
        data: {
          txHash: result.hash,
          amountOut: result.amountOut,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  validate(input: unknown): ValidationResult {
    const { fromToken, toToken, amount } = input as any;

    if (!fromToken || !toToken) {
      return { valid: false, errors: [{ message: 'fromToken and toToken required' }] };
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return { valid: false, errors: [{ message: 'amount must be positive number' }] };
    }

    return { valid: true };
  },
};
```

---

### Provider Interface

Providers are data sources that fetch and return information.

```typescript
type ProviderType =
  | 'token'        // Token metadata, prices
  | 'wallet'       // Wallet balances, history
  | 'transaction'  // Transaction data
  | 'yield'        // DeFi yields
  | 'market'       // Market data
  | 'nft'          // NFT data
  | 'social'       // Social data
  | 'analytics'    // Analytics data
  | 'custom';      // Custom type

interface Provider {
  // ═══════════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Unique provider name
   * Convention: plugin:resource
   * Examples: "tokendata:price", "wallet:balance"
   */
  readonly name: string;

  /** Provider type for categorization */
  readonly type: ProviderType;

  /** Human-readable description */
  readonly description?: string;

  /** Tags for filtering/search */
  readonly tags?: string[];

  // ═══════════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Fetch data based on query
   * @param context - Query context with parameters
   * @returns ProviderResult with data
   */
  get(context: ProviderContext): Promise<ProviderResult>;

  // ═══════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════

  /** Supported blockchain networks */
  readonly chains?: ChainId[];

  /** Cache configuration */
  readonly cacheConfig?: CacheConfig;

  /** Rate limiting configuration */
  readonly rateLimit?: RateLimitConfig;

  /** JSON Schema for query validation */
  readonly querySchema?: ProviderSchema;

  /** JSON Schema for response documentation */
  readonly responseSchema?: ProviderSchema;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPPORTING TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ProviderContext {
  /** Query parameters */
  query: unknown;

  /** Plugin name */
  pluginName: string;

  /** Agent/user ID */
  agentId: string;

  /** Target blockchain */
  chainId?: ChainId;

  /** Plugin configuration */
  config?: Record<string, unknown>;
}

interface ProviderResult {
  /** Whether fetch succeeded */
  success: boolean;

  /** Fetched data */
  data?: unknown;

  /** Error message on failure */
  error?: string;

  /** Whether result was from cache */
  cached?: boolean;

  /** When data was fetched */
  timestamp: Date;
}

interface CacheConfig {
  /** Time-to-live in milliseconds */
  ttl: number;

  /** Cache key generator */
  keyGenerator?: (query: unknown) => string;

  /** Whether to serve stale while revalidating */
  staleWhileRevalidate?: boolean;
}

interface RateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number;

  /** Window size in milliseconds */
  windowMs: number;

  /** Whether to queue exceeded requests */
  queue?: boolean;
}
```

#### Provider Example

```typescript
const priceProvider: Provider = {
  name: 'tokendata:price',
  type: 'token',
  description: 'Fetches current token price from multiple sources',
  chains: [8453, 1, 137], // Base, Ethereum, Polygon

  cacheConfig: {
    ttl: 10000, // 10 seconds
    keyGenerator: (query) => `price:${query.tokenAddress}:${query.chainId}`,
  },

  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
    queue: true,
  },

  async get(context: ProviderContext): Promise<ProviderResult> {
    const { tokenAddress } = context.query as { tokenAddress: string };

    try {
      const price = await fetchTokenPrice(tokenAddress, context.chainId);

      return {
        success: true,
        data: {
          price: price.usd,
          change24h: price.change24h,
          volume24h: price.volume24h,
        },
        cached: false,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  },
};
```

---

### Evaluator Interface

Evaluators check conditions for flow logic and automation.

```typescript
interface Evaluator {
  // ═══════════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Unique evaluator name
   * Convention: category:condition
   * Examples: "balance:check", "price:threshold"
   */
  readonly name: string;

  /** Human-readable description */
  readonly description?: string;

  /** Categorization */
  readonly category?: string;

  /** Tags for filtering */
  readonly tags?: string[];

  // ═══════════════════════════════════════════════════════════════════════
  // EVALUATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Evaluate condition against data
   * @param context - Condition and data to evaluate
   * @returns boolean result
   */
  evaluate(context: EvaluatorContext): Promise<boolean>;

  // ═══════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════

  /** Supported comparison operators */
  readonly supportedOperators?: ConditionOperator[];

  /** JSON Schema for condition validation */
  readonly conditionSchema?: EvaluatorSchema;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPPORTING TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface EvaluatorContext {
  /** Condition to evaluate */
  condition: unknown;

  /** Data to evaluate against */
  data: unknown;

  /** Plugin name */
  pluginName: string;

  /** Agent/user ID */
  agentId: string;

  /** Plugin configuration */
  config?: Record<string, unknown>;
}

// Predefined operators
const CONDITION_OPERATORS = {
  EQ: 'eq',              // equals
  NEQ: 'neq',            // not equals
  GT: 'gt',              // greater than
  GTE: 'gte',            // greater than or equal
  LT: 'lt',              // less than
  LTE: 'lte',            // less than or equal
  CONTAINS: 'contains',  // string/array contains
  STARTS_WITH: 'startsWith',
  ENDS_WITH: 'endsWith',
  IN: 'in',              // value in array
  NOT_IN: 'notIn',
  IS_NULL: 'isNull',
  IS_NOT_NULL: 'isNotNull',
  IS_EMPTY: 'isEmpty',
  IS_NOT_EMPTY: 'isNotEmpty',
} as const;

type ConditionOperator = typeof CONDITION_OPERATORS[keyof typeof CONDITION_OPERATORS];
```

#### Evaluator Example

```typescript
const priceThresholdEvaluator: Evaluator = {
  name: 'price:threshold',
  description: 'Checks if token price meets threshold condition',
  category: 'market',
  supportedOperators: ['gt', 'gte', 'lt', 'lte', 'eq'],

  async evaluate(context: EvaluatorContext): Promise<boolean> {
    const condition = context.condition as {
      operator: ConditionOperator;
      threshold: number;
    };
    const data = context.data as { price: number };

    switch (condition.operator) {
      case 'gt':
        return data.price > condition.threshold;
      case 'gte':
        return data.price >= condition.threshold;
      case 'lt':
        return data.price < condition.threshold;
      case 'lte':
        return data.price <= condition.threshold;
      case 'eq':
        return data.price === condition.threshold;
      default:
        return false;
    }
  },
};
```

---

### Hook Interface

Hooks are event listeners that react to lifecycle and runtime events.

```typescript
interface Hook {
  // ═══════════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Unique hook name
   * Convention: plugin:purpose
   * Examples: "logger:transaction", "notify:error"
   */
  readonly name: string;

  /** Event to subscribe to */
  readonly event: HookEventType;

  /** Human-readable description */
  readonly description?: string;

  /** Tags for filtering */
  readonly tags?: string[];

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Event handler function
   * @param context - Event context with payload
   */
  handler(context: HookContext): Promise<void>;

  /**
   * Optional filter to conditionally execute
   * @param payload - Event payload
   * @returns true to execute handler
   */
  filter?(payload: unknown): boolean;

  // ═══════════════════════════════════════════════════════════════════════
  // OPTIONS
  // ═══════════════════════════════════════════════════════════════════════

  /** Execution priority (higher = earlier) */
  readonly priority?: number;

  /** Execute only once then unsubscribe */
  readonly once?: boolean;

  /** Handler timeout in milliseconds */
  readonly timeout?: number;

  /** Stop other hooks if this one fails */
  readonly stopOnError?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK EVENTS
// ═══════════════════════════════════════════════════════════════════════════

type HookEventType =
  // Agent lifecycle
  | 'agent:initializing'
  | 'agent:started'
  | 'agent:stopping'
  | 'agent:stopped'
  // Plugin lifecycle
  | 'plugin:registering'
  | 'plugin:loaded'
  | 'plugin:unloading'
  | 'plugin:unloaded'
  // Task events
  | 'task:started'
  | 'task:completed'
  | 'task:failed'
  | 'task:timeout'
  // Flow events
  | 'flow:started'
  | 'flow:node:executed'
  | 'flow:completed'
  | 'flow:failed'
  // Action events
  | 'action:before'
  | 'action:after'
  | 'action:error'
  // Custom events
  | string;

interface HookContext {
  /** Event that triggered this hook */
  event: string;

  /** Event payload */
  data: unknown;

  /** When event occurred */
  timestamp: Date;

  /** Plugin name */
  pluginName: string;

  /** Agent/user ID */
  agentId: string;
}
```

#### Hook Example

```typescript
const transactionLoggerHook: Hook = {
  name: 'logger:transaction',
  event: 'action:after',
  description: 'Logs all transaction-related actions',
  priority: 100, // High priority

  filter(payload: unknown): boolean {
    const data = payload as { actionName: string };
    return data.actionName.includes('swap') || data.actionName.includes('transfer');
  },

  async handler(context: HookContext): Promise<void> {
    const { actionName, result } = context.data as ActionAfterPayload;

    await logToDatabase({
      action: actionName,
      success: result.success,
      timestamp: context.timestamp,
      agentId: context.agentId,
      data: result.data,
    });
  },
};
```

---

## Creating a Plugin

### Project Setup

#### 1. Initialize Package

```bash
mkdir @myorg/plugin-awesome
cd @myorg/plugin-awesome

# Initialize package
pnpm init

# Install dependencies
pnpm add -D \
  @samterminal/core \
  @samterminal/tsconfig \
  @samterminal/eslint-config \
  typescript \
  tsup \
  vitest
```

#### 2. Configure TypeScript

```json
// tsconfig.json
{
  "extends": "@samterminal/tsconfig/plugin.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

#### 3. Configure Build

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'types/index': 'src/types/index.ts',
    'actions/index': 'src/actions/index.ts',
    'providers/index': 'src/providers/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  minify: false,
  target: 'node18',
  outDir: 'dist',
  external: ['@samterminal/core'],
});
```

#### 4. Configure Package.json

```json
{
  "name": "@myorg/plugin-awesome",
  "version": "1.0.0",
  "type": "module",
  "description": "An awesome SamTerminal plugin",
  "author": "Your Name",
  "license": "MIT",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./types": {
      "import": "./dist/types/index.js",
      "types": "./dist/types/index.d.ts"
    },
    "./actions": {
      "import": "./dist/actions/index.js",
      "types": "./dist/actions/index.d.ts"
    },
    "./providers": {
      "import": "./dist/providers/index.js",
      "types": "./dist/providers/index.d.ts"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "peerDependencies": {
    "@samterminal/core": "^1.0.0"
  },
  "devDependencies": {
    "@samterminal/core": "workspace:*",
    "@samterminal/tsconfig": "workspace:*",
    "@samterminal/eslint-config": "workspace:*",
    "tsup": "^8.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.0.0"
  },
  "keywords": ["samterminal", "plugin", "web3"]
}
```

---

### Plugin Structure

Recommended directory structure for plugins:

```
@myorg/plugin-awesome/
├── src/
│   ├── index.ts              # Main entry point & exports
│   ├── plugin.ts             # Plugin class implementation
│   │
│   ├── types/                # TypeScript types
│   │   ├── index.ts          # Type exports
│   │   ├── config.ts         # Configuration types
│   │   └── models.ts         # Data models
│   │
│   ├── actions/              # Action implementations
│   │   ├── index.ts          # Action exports
│   │   ├── do-something.ts   # Individual action
│   │   └── do-another.ts
│   │
│   ├── providers/            # Provider implementations
│   │   ├── index.ts          # Provider exports
│   │   └── data-provider.ts
│   │
│   ├── evaluators/           # Evaluator implementations
│   │   ├── index.ts
│   │   └── condition-eval.ts
│   │
│   ├── hooks/                # Hook implementations
│   │   ├── index.ts
│   │   └── event-hook.ts
│   │
│   ├── utils/                # Utility functions
│   │   ├── index.ts
│   │   ├── helpers.ts
│   │   └── validators.ts
│   │
│   └── constants/            # Constants & configs
│       ├── index.ts
│       └── chains.ts
│
├── tests/                    # Test files
│   ├── plugin.test.ts
│   ├── actions/
│   └── providers/
│
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── package.json
└── README.md
```

---

### Using BasePlugin

The `BasePlugin` abstract class provides common functionality:

```typescript
// src/plugin.ts
import {
  BasePlugin,
  SamTerminalCore,
  Action,
  Provider,
  Hook,
} from '@samterminal/core';
import { AwesomePluginConfig, AwesomePluginOptions } from './types';
import { createDoSomethingAction } from './actions/do-something';
import { createDataProvider } from './providers/data-provider';

export class AwesomePlugin extends BasePlugin {
  // ═══════════════════════════════════════════════════════════════════════
  // REQUIRED PROPERTIES
  // ═══════════════════════════════════════════════════════════════════════

  readonly name = '@myorg/plugin-awesome';
  readonly version = '1.0.0';
  readonly description = 'An awesome plugin for SamTerminal';
  readonly author = 'Your Name';

  // ═══════════════════════════════════════════════════════════════════════
  // DEPENDENCIES
  // ═══════════════════════════════════════════════════════════════════════

  readonly dependencies = ['@samterminal/plugin-tokendata']; // Required
  readonly optionalDependencies = ['@samterminal/plugin-telegram']; // Optional

  // ═══════════════════════════════════════════════════════════════════════
  // INTERNAL STATE
  // ═══════════════════════════════════════════════════════════════════════

  private config: AwesomePluginConfig;
  private apiClient: ApiClient | null = null;

  // ═══════════════════════════════════════════════════════════════════════
  // CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════════════════

  constructor(options: AwesomePluginOptions = {}) {
    super();

    // Merge options with defaults and env vars
    this.config = {
      apiKey: options.apiKey ?? process.env.AWESOME_API_KEY ?? '',
      baseUrl: options.baseUrl ?? 'https://api.awesome.io',
      cacheTtl: options.cacheTtl ?? 30000,
      debug: options.debug ?? false,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LIFECYCLE: INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════

  protected async onInit(): Promise<void> {
    this.logger.info('Initializing plugin...');

    // Validate configuration
    if (!this.config.apiKey) {
      throw new Error('API key is required');
    }

    // Initialize API client
    this.apiClient = new ApiClient(this.config);

    // Create and register actions
    this.actions = [
      createDoSomethingAction(() => this.apiClient!, this.config),
    ];

    // Create and register providers
    this.providers = [
      createDataProvider(() => this.apiClient!, this.config),
    ];

    // Create and register hooks
    this.hooks = [
      {
        name: 'awesome:log',
        event: 'action:after',
        handler: async (ctx) => {
          this.logger.debug('Action executed', ctx.data);
        },
      },
    ];

    // Register with core
    const core = this.getCore();
    for (const action of this.actions) {
      core.services.registerAction(action, this.name);
    }
    for (const provider of this.providers) {
      core.services.registerProvider(provider, this.name);
    }
    for (const hook of this.hooks) {
      core.hooks.register(hook, this.name);
    }

    // Emit loaded event
    await this.emit('plugin:loaded', { plugin: this.name });

    this.logger.info('Plugin initialized successfully');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LIFECYCLE: DESTRUCTION
  // ═══════════════════════════════════════════════════════════════════════

  protected async onDestroy(): Promise<void> {
    this.logger.info('Destroying plugin...');

    // Cleanup API client
    if (this.apiClient) {
      await this.apiClient.disconnect();
      this.apiClient = null;
    }

    // Unregister from core
    const core = this.getCore();
    core.services.unregisterPlugin(this.name);
    core.hooks.unregisterPlugin(this.name);

    this.logger.info('Plugin destroyed');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Update configuration at runtime
   */
  updateConfig(config: Partial<AwesomePluginConfig>): void {
    this.config = { ...this.config, ...config };

    // Reinitialize affected components
    if (this.apiClient && (config.apiKey || config.baseUrl)) {
      this.apiClient.updateConfig(this.config);
    }
  }

  /**
   * Get current configuration (read-only)
   */
  getConfig(): Readonly<AwesomePluginConfig> {
    return { ...this.config };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

// Export plugin class
export { AwesomePlugin };

// Export factory function
export function createAwesomePlugin(options?: AwesomePluginOptions): AwesomePlugin {
  return new AwesomePlugin(options);
}

// Default export
export default createAwesomePlugin;
```

---

### Using createPlugin Factory

For simpler plugins, use the `createPlugin` factory:

```typescript
// src/plugin.ts
import { createPlugin, SamTerminalCore } from '@samterminal/core';

// Simple plugin without class
export const mySimplePlugin = createPlugin({
  name: '@myorg/plugin-simple',
  version: '1.0.0',
  description: 'A simple plugin',

  actions: [
    {
      name: 'simple:greet',
      async execute(context) {
        const name = (context.input as { name: string }).name;
        return { success: true, data: `Hello, ${name}!` };
      },
    },
  ],

  providers: [
    {
      name: 'simple:data',
      type: 'custom',
      async get(context) {
        return {
          success: true,
          data: { value: 42 },
          timestamp: new Date(),
        };
      },
    },
  ],

  async init(core: SamTerminalCore) {
    console.log('Simple plugin initialized');
  },

  async destroy() {
    console.log('Simple plugin destroyed');
  },
});

export default mySimplePlugin;
```

---

## Plugin Lifecycle

### Lifecycle States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PLUGIN LIFECYCLE STATES                             │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │   UNREGISTERED   │
                              │                  │
                              │  Plugin not in   │
                              │  registry yet    │
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
                  │  Fully ready     │                │
                  │  services regist.│                │
                  └────────┬─────────┘                │
                           │                          │
                           │ unload()                 │ reload()
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
```

### Initialization Flow

```typescript
// Internal initialization sequence

async initPlugin(name: string): Promise<void> {
  const plugin = this.registry.get(name);

  // 1. Check dependencies
  const missing = this.registry.getMissingDependencies(name);
  if (missing.length > 0) {
    throw new Error(`Missing dependencies: ${missing.join(', ')}`);
  }

  // 2. Initialize dependencies first (recursive)
  const deps = plugin.dependencies || [];
  for (const dep of deps) {
    if (!this.isActive(dep)) {
      await this.initPlugin(dep);
    }
  }

  // 3. Emit beforeInit event
  await this.emitLifecycle('beforeInit', plugin);

  // 4. Update status
  this.registry.updateStatus(name, 'initializing');

  // 5. Call plugin.init()
  await plugin.init(this.core);

  // 6. Register services with core
  this.registerPluginServices(plugin);

  // 7. Update status
  this.registry.updateStatus(name, 'active');

  // 8. Emit afterInit event
  await this.emitLifecycle('afterInit', plugin);
}
```

### Destruction Flow

```typescript
// Internal destruction sequence

async destroyPlugin(name: string): Promise<void> {
  const plugin = this.registry.get(name);

  // 1. Check dependents (plugins depending on this one)
  const dependents = this.registry.getDependents(name);
  if (dependents.length > 0) {
    // Destroy dependents first
    for (const dep of dependents) {
      await this.destroyPlugin(dep);
    }
  }

  // 2. Emit beforeDestroy event
  await this.emitLifecycle('beforeDestroy', plugin);

  // 3. Unregister services from core
  this.unregisterPluginServices(plugin);

  // 4. Call plugin.destroy() if defined
  if (plugin.destroy) {
    await plugin.destroy();
  }

  // 5. Update status
  this.registry.updateStatus(name, 'destroyed');

  // 6. Emit afterDestroy event
  await this.emitLifecycle('afterDestroy', plugin);
}
```

### Lifecycle Events

```typescript
// Available lifecycle events

type LifecycleEvent =
  | 'beforeInit'    // Before init() is called
  | 'afterInit'     // After init() completes successfully
  | 'beforeDestroy' // Before destroy() is called
  | 'afterDestroy'  // After destroy() completes
  | 'error';        // On any lifecycle error

// Subscribe to lifecycle events
lifecycle.onLifecycle((event, plugin, error) => {
  console.log(`Plugin ${plugin.name}: ${event}`);
  if (error) {
    console.error('Error:', error);
  }
});
```

---

## Configuration

### Constructor Options

```typescript
// types/config.ts
export interface AwesomePluginOptions {
  // API Configuration
  apiKey?: string;
  baseUrl?: string;

  // Cache Configuration
  cacheTtl?: number;
  cacheMax?: number;

  // Chain Configuration
  defaultChain?: ChainId;
  supportedChains?: ChainId[];

  // Feature Flags
  debug?: boolean;
  enableMetrics?: boolean;

  // Database (optional)
  database?: DatabaseAdapter;
}

export interface AwesomePluginConfig extends Required<Omit<AwesomePluginOptions, 'database'>> {
  database?: DatabaseAdapter;
}
```

### Environment Variables

```typescript
// Priority: Constructor > Environment > Defaults

constructor(options: AwesomePluginOptions = {}) {
  this.config = {
    // 1. Constructor option (highest priority)
    // 2. Environment variable
    // 3. Default value (lowest priority)
    apiKey: options.apiKey
      ?? process.env.AWESOME_API_KEY
      ?? '',

    baseUrl: options.baseUrl
      ?? process.env.AWESOME_BASE_URL
      ?? 'https://api.awesome.io',

    cacheTtl: options.cacheTtl
      ?? parseInt(process.env.AWESOME_CACHE_TTL || '30000'),

    debug: options.debug
      ?? process.env.AWESOME_DEBUG === 'true'
      ?? false,

    defaultChain: options.defaultChain
      ?? (process.env.AWESOME_CHAIN as ChainId)
      ?? 8453, // Base
  };
}
```

### Runtime Configuration

```typescript
// Allow runtime updates for non-critical config

class AwesomePlugin extends BasePlugin {
  private config: AwesomePluginConfig;

  /**
   * Update configuration at runtime
   * Only non-critical settings can be changed
   */
  updateConfig(update: Partial<AwesomePluginConfig>): void {
    // Prevent critical changes that require restart
    if (update.apiKey || update.baseUrl) {
      this.logger.warn('API configuration changes require plugin reload');
    }

    // Apply safe updates
    this.config = {
      ...this.config,
      cacheTtl: update.cacheTtl ?? this.config.cacheTtl,
      debug: update.debug ?? this.config.debug,
      defaultChain: update.defaultChain ?? this.config.defaultChain,
    };

    // Notify components of config change
    this.emit('config:updated', this.config);
  }

  /**
   * Set database adapter
   * Can be called before or after init
   */
  setDatabase(adapter: DatabaseAdapter): void {
    this.config.database = adapter;
    this.logger.info('Database adapter configured');
  }
}
```

---

## Multi-Chain Development

### Chain Configuration

```typescript
// types/chain.ts
import { Chain, ChainId, ChainType } from '@samterminal/core';

// Define supported chains
export const SUPPORTED_CHAINS: Chain[] = [
  {
    id: 8453,
    name: 'Base',
    type: 'evm',
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 1,
    name: 'Ethereum',
    type: 'evm',
    rpcUrls: ['https://eth.llamarpc.com'],
    blockExplorerUrls: ['https://etherscan.io'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
];

// Chain-specific configuration
export interface ChainSpecificConfig {
  [chainId: ChainId]: {
    contractAddress?: string;
    apiEndpoint?: string;
    gasMultiplier?: number;
  };
}

export const CHAIN_CONFIG: ChainSpecificConfig = {
  8453: {
    contractAddress: '0x1234...',
    apiEndpoint: 'https://api.base.awesome.io',
    gasMultiplier: 1.1,
  },
  1: {
    contractAddress: '0x5678...',
    apiEndpoint: 'https://api.eth.awesome.io',
    gasMultiplier: 1.2,
  },
};
```

### Chain-Specific Logic

```typescript
// utils/chain-handler.ts
import { ChainId, ChainType } from '@samterminal/core';
import { CHAIN_CONFIG } from '../constants/chains';

export class ChainHandler {
  private chainId: ChainId;
  private chainType: ChainType;

  constructor(chainId: ChainId) {
    this.chainId = chainId;
    this.chainType = 'evm';
  }

  async executeTransaction(params: TransactionParams): Promise<TransactionResult> {
    return this.executeEVMTransaction(params);
  }

  private async executeEVMTransaction(params: TransactionParams): Promise<TransactionResult> {
    const config = CHAIN_CONFIG[this.chainId];

    // EVM-specific logic
    const { createPublicClient, createWalletClient, http } = await import('viem');
    const { base, mainnet } = await import('viem/chains');

    const chain = this.chainId === 8453 ? base : mainnet;
    const client = createPublicClient({
      chain,
      transport: http(config.apiEndpoint),
    });

    // ... EVM transaction logic
  }
}
```

### Multi-Chain Examples

```typescript
// actions/multi-chain-action.ts
import { Action, ActionContext, ActionResult, ChainId } from '@samterminal/core';
import { ChainHandler } from '../utils/chain-handler';

export function createMultiChainAction(): Action {
  return {
    name: 'awesome:execute',
    description: 'Execute operation on any supported chain',
    chains: [8453, 1], // Base, Ethereum

    async execute(context: ActionContext): Promise<ActionResult> {
      const { operation, data } = context.input as {
        operation: string;
        data: unknown;
      };

      // Get chain from context or use default
      const chainId = context.chainId ?? 8453;

      // Create chain-specific handler
      const handler = new ChainHandler(chainId);

      try {
        // Execute chain-agnostic operation
        const result = await handler.executeTransaction({
          operation,
          data,
        });

        return {
          success: true,
          data: result,
          metadata: {
            chainId,
            chainType: 'evm',
          },
        };
      } catch (error) {
        return {
          success: false,
          error: `Chain ${chainId}: ${error.message}`,
        };
      }
    },

    validate(input: unknown) {
      const { operation } = input as { operation?: string };
      if (!operation) {
        return { valid: false, errors: [{ message: 'operation required' }] };
      }
      return { valid: true };
    },
  };
}
```

---

## Testing Plugins

### Unit Testing

```typescript
// tests/plugin.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SamTerminalCore } from '@samterminal/core';
import { AwesomePlugin } from '../src/plugin';

describe('AwesomePlugin', () => {
  let plugin: AwesomePlugin;
  let mockCore: SamTerminalCore;

  beforeEach(() => {
    // Create plugin instance
    plugin = new AwesomePlugin({
      apiKey: 'test-api-key',
      debug: true,
    });

    // Create mock core
    mockCore = {
      services: {
        registerAction: vi.fn(),
        registerProvider: vi.fn(),
        unregisterPlugin: vi.fn(),
      },
      hooks: {
        register: vi.fn(),
        emit: vi.fn(),
        unregisterPlugin: vi.fn(),
      },
      runtime: {
        executeAction: vi.fn(),
        getData: vi.fn(),
      },
    } as unknown as SamTerminalCore;
  });

  describe('initialization', () => {
    it('should initialize successfully with valid config', async () => {
      await plugin.init(mockCore);

      expect(mockCore.services.registerAction).toHaveBeenCalled();
      expect(mockCore.services.registerProvider).toHaveBeenCalled();
    });

    it('should throw error without API key', async () => {
      const invalidPlugin = new AwesomePlugin({ apiKey: '' });

      await expect(invalidPlugin.init(mockCore)).rejects.toThrow(
        'API key is required'
      );
    });

    it('should register all actions', async () => {
      await plugin.init(mockCore);

      expect(mockCore.services.registerAction).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'awesome:do-something' }),
        '@myorg/plugin-awesome'
      );
    });
  });

  describe('destruction', () => {
    it('should cleanup resources on destroy', async () => {
      await plugin.init(mockCore);
      await plugin.destroy();

      expect(mockCore.services.unregisterPlugin).toHaveBeenCalledWith(
        '@myorg/plugin-awesome'
      );
    });
  });

  describe('configuration', () => {
    it('should update config at runtime', async () => {
      await plugin.init(mockCore);

      plugin.updateConfig({ cacheTtl: 60000 });

      expect(plugin.getConfig().cacheTtl).toBe(60000);
    });
  });
});
```

### Action Testing

```typescript
// tests/actions/do-something.test.ts
import { describe, it, expect, vi } from 'vitest';
import { ActionContext } from '@samterminal/core';
import { createDoSomethingAction } from '../../src/actions/do-something';

describe('do-something action', () => {
  const mockApiClient = {
    doSomething: vi.fn(),
  };

  const action = createDoSomethingAction(
    () => mockApiClient,
    { debug: false }
  );

  const createContext = (input: unknown): ActionContext => ({
    input,
    pluginName: 'test-plugin',
    agentId: 'test-agent',
    chainId: 8453,
  });

  it('should execute successfully with valid input', async () => {
    mockApiClient.doSomething.mockResolvedValue({ result: 'success' });

    const result = await action.execute(
      createContext({ param: 'value' })
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ result: 'success' });
  });

  it('should return error on API failure', async () => {
    mockApiClient.doSomething.mockRejectedValue(new Error('API error'));

    const result = await action.execute(
      createContext({ param: 'value' })
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('API error');
  });

  describe('validation', () => {
    it('should validate required fields', () => {
      const result = action.validate!({});

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: expect.stringContaining('param') })
      );
    });

    it('should pass with valid input', () => {
      const result = action.validate!({ param: 'value' });

      expect(result.valid).toBe(true);
    });
  });
});
```

### Integration Testing

```typescript
// tests/integration/plugin.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createSamTerminalCore, SamTerminalCore } from '@samterminal/core';
import { AwesomePlugin } from '../../src/plugin';

describe('AwesomePlugin Integration', () => {
  let core: SamTerminalCore;
  let plugin: AwesomePlugin;

  beforeAll(async () => {
    // Create real core
    core = createSamTerminalCore({
      debug: true,
    });

    // Create and register plugin
    plugin = new AwesomePlugin({
      apiKey: process.env.TEST_API_KEY!,
      baseUrl: process.env.TEST_API_URL,
    });

    await core.plugins.register(plugin);
    await core.plugins.initAll();
  });

  afterAll(async () => {
    await core.shutdown();
  });

  it('should execute action through core', async () => {
    const result = await core.runtime.executeAction('awesome:do-something', {
      param: 'test-value',
    });

    expect(result.success).toBe(true);
  });

  it('should fetch data through provider', async () => {
    const result = await core.runtime.getData('awesome:data', {
      query: 'test',
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should work with other plugins', async () => {
    // Test cross-plugin functionality
    const tokenData = await core.runtime.getData('tokendata:price', {
      tokenAddress: '0x...',
    });

    const result = await core.runtime.executeAction('awesome:process', {
      price: tokenData.data.price,
    });

    expect(result.success).toBe(true);
  });
});
```

### Test Utilities

```typescript
// tests/utils/test-helpers.ts
import { SamTerminalCore, SamTerminalPlugin, ActionContext, ProviderContext } from '@samterminal/core';
import { vi } from 'vitest';

/**
 * Create mock SamTerminalCore for testing
 */
export function createMockCore(): SamTerminalCore {
  return {
    services: {
      registerAction: vi.fn(),
      registerProvider: vi.fn(),
      registerEvaluator: vi.fn(),
      unregisterPlugin: vi.fn(),
      getAction: vi.fn(),
      getProvider: vi.fn(),
    },
    hooks: {
      register: vi.fn(),
      emit: vi.fn().mockResolvedValue([]),
      unregisterPlugin: vi.fn(),
    },
    runtime: {
      executeAction: vi.fn().mockResolvedValue({ success: true }),
      getData: vi.fn().mockResolvedValue({ success: true, data: {} }),
    },
    plugins: {
      get: vi.fn(),
      getAll: vi.fn().mockReturnValue([]),
    },
    chains: {
      getChain: vi.fn(),
      getDefaultChain: vi.fn().mockReturnValue(8453),
    },
  } as unknown as SamTerminalCore;
}

/**
 * Create action context for testing
 */
export function createActionContext(
  input: unknown,
  overrides: Partial<ActionContext> = {}
): ActionContext {
  return {
    input,
    pluginName: 'test-plugin',
    agentId: 'test-agent-123',
    chainId: 8453,
    metadata: {},
    config: {},
    ...overrides,
  };
}

/**
 * Create provider context for testing
 */
export function createProviderContext(
  query: unknown,
  overrides: Partial<ProviderContext> = {}
): ProviderContext {
  return {
    query,
    pluginName: 'test-plugin',
    agentId: 'test-agent-123',
    chainId: 8453,
    config: {},
    ...overrides,
  };
}

/**
 * Wait for plugin to be fully initialized
 */
export async function waitForPluginInit(
  plugin: SamTerminalPlugin,
  core: SamTerminalCore,
  timeout = 5000
): Promise<void> {
  await plugin.init(core);
  // Add any async initialization checks here
}
```

---

## Publishing Plugins

### Package Structure

```json
// package.json (production-ready)
{
  "name": "@myorg/plugin-awesome",
  "version": "1.0.0",
  "type": "module",
  "description": "An awesome SamTerminal plugin for X functionality",
  "author": "Your Name <your@email.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/myorg/plugin-awesome"
  },
  "homepage": "https://github.com/myorg/plugin-awesome#readme",
  "bugs": {
    "url": "https://github.com/myorg/plugin-awesome/issues"
  },
  "keywords": [
    "samterminal",
    "plugin",
    "web3",
    "blockchain",
    "defi"
  ],
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./types": {
      "import": "./dist/types/index.js",
      "types": "./dist/types/index.d.ts"
    }
  },
  "files": [
    "dist",
    "README.md",
    "CHANGELOG.md"
  ],
  "engines": {
    "node": ">=18.0.0"
  },
  "peerDependencies": {
    "@samterminal/core": "^1.0.0"
  },
  "scripts": {
    "build": "tsup",
    "prepublishOnly": "pnpm build && pnpm test"
  }
}
```

### Versioning

Follow Semantic Versioning (semver):

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes
  - Removed/renamed actions, providers
  - Changed interface signatures
  - Incompatible configuration changes

MINOR: New features (backward compatible)
  - New actions or providers
  - New optional configuration
  - Enhanced functionality

PATCH: Bug fixes (backward compatible)
  - Bug fixes
  - Performance improvements
  - Documentation updates
```

#### Version Examples

```bash
# Initial release
1.0.0

# Bug fix
1.0.1

# New feature (new action added)
1.1.0

# Breaking change (action renamed)
2.0.0

# Pre-release versions
1.0.0-alpha.1
1.0.0-beta.1
1.0.0-rc.1
```

### NPM Publishing

```bash
# 1. Login to npm
npm login

# 2. Build and test
pnpm build
pnpm test

# 3. Update version
npm version patch  # or minor, major

# 4. Publish
npm publish --access public

# For scoped packages
npm publish --access public --scope=@myorg
```

### Documentation Requirements

Every published plugin should include:

```markdown
# @myorg/plugin-awesome

Brief description of what this plugin does.

## Installation

\`\`\`bash
npm install @myorg/plugin-awesome
\`\`\`

## Quick Start

\`\`\`typescript
import { createAwesomePlugin } from '@myorg/plugin-awesome';

const plugin = createAwesomePlugin({
  apiKey: process.env.AWESOME_API_KEY,
});
\`\`\`

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | - | API key (required) |
| `baseUrl` | string | `https://...` | API base URL |

## Actions

### awesome:do-something

Description of what this action does.

**Input:**
\`\`\`typescript
{
  param: string;
  optional?: number;
}
\`\`\`

**Output:**
\`\`\`typescript
{
  result: string;
}
\`\`\`

## Providers

### awesome:data

Description of what data this provides.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `AWESOME_API_KEY` | API key for authentication |

## License

MIT
```

---

## Best Practices

### 1. Type Safety

```typescript
// DO: Use strict types
interface SwapInput {
  fromToken: string;
  toToken: string;
  amount: number;
}

async execute(context: ActionContext): Promise<ActionResult> {
  const input = context.input as SwapInput;
  // TypeScript knows input.fromToken, input.toToken, input.amount
}

// DON'T: Use any
async execute(context: ActionContext): Promise<ActionResult> {
  const input = context.input as any; // No type safety
}
```

### 2. Configuration Priority

```typescript
// DO: Constructor > Environment > Defaults
constructor(options: PluginOptions = {}) {
  this.config = {
    apiKey: options.apiKey ?? process.env.API_KEY ?? '',
    timeout: options.timeout ?? 30000,
  };
}

// DON'T: Hardcode values
constructor() {
  this.config = {
    apiKey: 'hardcoded-key', // Security risk!
  };
}
```

### 3. Dependency Injection via Thunks

```typescript
// DO: Use thunks for lazy initialization
export function createAction(
  getClient: () => ApiClient,  // Thunk
  config: Config,
): Action {
  return {
    name: 'my:action',
    async execute(context) {
      const client = getClient(); // Called when needed
      return client.doSomething();
    },
  };
}

// In plugin
this.actions = [
  createAction(() => this.apiClient!, this.config),
];

// DON'T: Pass null-able instances directly
this.actions = [
  createAction(this.apiClient, this.config), // May be null!
];
```

### 4. Resource Cleanup

```typescript
// DO: Clean up all resources
protected async onDestroy(): Promise<void> {
  // Close connections
  if (this.apiClient) {
    await this.apiClient.disconnect();
    this.apiClient = null;
  }

  // Clear caches
  this.cache.clear();

  // Unsubscribe from events
  this.eventSubscriptions.forEach(unsub => unsub());

  // Unregister from core
  const core = this.getCore();
  core.services.unregisterPlugin(this.name);
  core.hooks.unregisterPlugin(this.name);
}

// DON'T: Leave resources dangling
protected async onDestroy(): Promise<void> {
  // Nothing cleaned up - memory leak!
}
```

### 5. Error Handling

```typescript
// DO: Handle errors gracefully
async execute(context: ActionContext): Promise<ActionResult> {
  try {
    const result = await this.apiClient.call(context.input);
    return { success: true, data: result };
  } catch (error) {
    this.logger.error('Action failed', { error, input: context.input });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// DON'T: Let errors propagate unhandled
async execute(context: ActionContext): Promise<ActionResult> {
  const result = await this.apiClient.call(context.input); // May throw!
  return { success: true, data: result };
}
```

### 6. Logging

```typescript
// DO: Use structured logging
this.logger.info('Operation completed', {
  action: 'swap:execute',
  input: { fromToken, toToken, amount },
  result: { txHash, amountOut },
  duration: Date.now() - startTime,
});

// DON'T: Use console.log
console.log('Done!', result); // Not structured, not controllable
```

### 7. Naming Conventions

```typescript
// Plugin names: @scope/plugin-name
readonly name = '@myorg/plugin-awesome';

// Action names: plugin:operation
const action: Action = { name: 'awesome:execute' };

// Provider names: plugin:resource
const provider: Provider = { name: 'awesome:data' };

// Hook names: plugin:purpose
const hook: Hook = { name: 'awesome:logger' };
```

### 8. Module Exports

```typescript
// src/index.ts - Export everything needed

// Plugin class and factory
export { AwesomePlugin } from './plugin';
export { createAwesomePlugin } from './plugin';
export default createAwesomePlugin;

// Types
export type {
  AwesomePluginOptions,
  AwesomePluginConfig,
} from './types';

// Actions (for direct use)
export { createDoSomethingAction } from './actions/do-something';

// Providers (for direct use)
export { createDataProvider } from './providers/data-provider';

// Constants
export { SUPPORTED_CHAINS } from './constants/chains';
```

---

## Examples

### Complete Plugin Example

See the full example in the repository:
- `packages/plugins/swap/` - Full-featured swap plugin
- `packages/plugins/tokendata/` - Data provider plugin
- `packages/plugins/telegram/` - Notification plugin

### Minimal Plugin

```typescript
// A minimal but complete plugin
import { SamTerminalPlugin, SamTerminalCore, Action } from '@samterminal/core';

export class MinimalPlugin implements SamTerminalPlugin {
  readonly name = 'minimal-plugin';
  readonly version = '1.0.0';

  actions: Action[] = [
    {
      name: 'minimal:hello',
      async execute(ctx) {
        return { success: true, data: 'Hello!' };
      },
    },
  ];

  async init(core: SamTerminalCore): Promise<void> {
    for (const action of this.actions) {
      core.services.registerAction(action, this.name);
    }
  }

  async destroy(): Promise<void> {
    // Cleanup if needed
  }
}

export default new MinimalPlugin();
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Plugin not loading | Missing name or version | Ensure `name` and `version` are defined |
| Circular dependency | Plugin A depends on B, B depends on A | Refactor to remove cycle or use optional dependency |
| Init hangs | Unresolved promise in init() | Ensure all async operations are awaited |
| Config not applied | Options passed to init() instead of constructor | Pass config to constructor |
| Memory leak | Resources not cleaned in destroy() | Null out references, close connections |
| Types not found | Missing exports in package.json | Add entries to `exports` field |
| Action not found | Not registered with core | Call `core.services.registerAction()` in init() |

### Debug Mode

```typescript
// Enable debug logging
const plugin = new AwesomePlugin({
  debug: true, // Enables verbose logging
});

// Or via environment
process.env.AWESOME_DEBUG = 'true';
```

### Checking Plugin Status

```typescript
// Check if plugin is active
const isActive = core.plugins.lifecycle.isActive('@myorg/plugin-awesome');

// Get plugin status
const status = core.plugins.lifecycle.getStatus('@myorg/plugin-awesome');
console.log(status); // 'active', 'error', etc.

// Get plugin state
const state = core.plugins.registry.getState('@myorg/plugin-awesome');
console.log(state.error); // Last error if any
```

---

## API Reference

### BasePlugin Methods

| Method | Description |
|--------|-------------|
| `init(core)` | Initialize plugin (calls `onInit()`) |
| `destroy()` | Destroy plugin (calls `onDestroy()`) |
| `getCore()` | Get SamTerminalCore instance |
| `isInitialized()` | Check if plugin is initialized |
| `registerAction(action)` | Add action to plugin |
| `registerProvider(provider)` | Add provider to plugin |
| `registerEvaluator(evaluator)` | Add evaluator to plugin |
| `registerHook(hook)` | Add hook to plugin |
| `executeAction(name, input)` | Execute another plugin's action |
| `getData(name, query)` | Get data from another plugin's provider |
| `emit(event, data)` | Emit an event |
| `getInfo()` | Get plugin metadata |

### PluginLifecycle Methods

| Method | Description |
|--------|-------------|
| `loadPlugin(source)` | Load plugin from source |
| `initPlugin(name)` | Initialize specific plugin |
| `initAll()` | Initialize all registered plugins |
| `destroyPlugin(name)` | Destroy specific plugin |
| `destroyAll()` | Destroy all plugins |
| `reloadPlugin(name)` | Reload plugin (destroy + init) |
| `getStatus(name)` | Get plugin status |
| `isActive(name)` | Check if plugin is active |

### PluginRegistry Methods

| Method | Description |
|--------|-------------|
| `register(plugin, options)` | Register plugin |
| `get(name)` | Get plugin by name |
| `has(name)` | Check if plugin exists |
| `getAll()` | Get all plugins |
| `getLoadOrder()` | Get topologically sorted names |
| `getDependents(name)` | Get plugins depending on this one |
| `unregister(name)` | Remove plugin from registry |

---

*This documentation is maintained as part of the SamTerminal project. For questions or contributions, please open an issue or PR.*
