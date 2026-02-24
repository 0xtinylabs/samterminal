# Architecture Deep Dive

SAM Terminal is a plugin-based, workflow-driven automation platform for Web3 trading and agent orchestration. This guide walks through every layer of the system — from the runtime engine that orchestrates execution, to the plugin system that extends capabilities, to the workflow engine that powers autonomous trading strategies.

---

## System Overview

```
┌──────────────────────────────────────────────────┐
│           User Applications (Agents)             │
├──────────────────────────────────────────────────┤
│ Workflow Engine │  Order Templates  │  Hooks      │
├──────────────────────────────────────────────────┤
│        Runtime Engine (Orchestration)            │
├──────────────────────────────────────────────────┤
│  Plugin System  │  Service Registry  │  Chains   │
├──────────────────────────────────────────────────┤
│         gRPC Layer (MCP Server)                  │
├──────────────────────────────────────────────────┤
│        Go / NestJS Microservices                 │
└──────────────────────────────────────────────────┘
```

**Bottom-up:** Microservices handle blockchain data and swap execution. The gRPC layer exposes them as RPC calls. The plugin system wraps these into actions, providers, and evaluators. The runtime engine orchestrates plugin lifecycle and execution. The workflow engine chains operations into DAG workflows. User applications (agents) sit on top and define intent.

---

## Runtime Engine

The runtime engine is the core orchestrator. It manages every subsystem and enforces valid state transitions through a state machine.

### State Machine

```
uninitialized → initializing → loading_plugins → ready ⟷ running → shutdown
                      │                                        │
                      └──────────── error ─────────────────────┘
```

**Transitions:**

| From | To | Trigger |
|------|----|---------|
| `uninitialized` | `initializing` | `initialize(config)` called |
| `initializing` | `loading_plugins` | Config validated, subsystems created |
| `loading_plugins` | `ready` | All plugins loaded and initialized |
| `ready` | `running` | `start()` called, scheduler activated |
| `running` | `ready` | `pause()` — scheduler paused |
| `running` | `shutdown` | `stop()` called |
| `ready` | `shutdown` | `stop()` called before start |
| any | `error` | Unrecoverable failure |
| `error` | `shutdown` | Cleanup after failure |
| `shutdown` | `uninitialized` | Full reset complete |

Each transition is logged with a timestamp. The state machine rejects invalid transitions and throws, preventing the system from entering an inconsistent state.

### Managed Subsystems

The runtime creates and coordinates these components:

- **StateMachine** — enforces valid state transitions
- **ServiceRegistry** — maps action/provider/evaluator names to implementations
- **PluginLifecycle** — loads, initializes, destroys plugins in dependency order
- **FlowEngine** — executes DAG-based workflows
- **TaskManager** — queue system with configurable concurrency (default: 10)
- **Scheduler** — runs interval and cron-based tasks
- **ChainManager** — manages blockchain configurations and active chain
- **HooksService** — event system for plugin communication
- **EventEmitter** — typed system events

### Execution Interface

```typescript
// Execute a plugin action
runtime.executeAction('swap:execute', {
  fromToken: '0x...',
  toToken: '0x...',
  amount: '1000000'
})

// Fetch data from a provider
runtime.getData('tokendata:price', { symbol: 'ETH' })

// Evaluate a condition
runtime.evaluate('tokendata:priceAbove', {
  symbol: 'ETH',
  threshold: 3000
})
```

All calls go through the service registry, which resolves the `pluginName:serviceName` key to the registered implementation.

---

## Plugin System

Everything in SAM Terminal is a plugin. The core is an orchestrator — all business logic lives in plugins.

### Plugin Contract

Every plugin implements this interface:

```typescript
interface SamTerminalPlugin {
  name: string                      // Unique identifier
  version: string                   // SemVer

  init(core: SamTerminalCore): Promise<void>   // Required
  destroy?(): Promise<void>                     // Optional

  actions?: Action[]                // Executable operations
  providers?: Provider[]            // Data sources
  evaluators?: Evaluator[]          // Condition checkers
  hooks?: Hook[]                    // Event subscriptions
  chains?: Chain[]                  // Blockchain configs

  dependencies?: string[]           // Required plugins
  optionalDependencies?: string[]   // Nice-to-have plugins
}
```

### Plugin Lifecycle

Plugins go through four stages:

```
Load → Register → Initialize → Destroy
```

**1. Load** (`PluginLoader`)

The loader supports four source types:

| Source | Description |
|--------|------------|
| `instance` | Direct plugin object |
| `factory` | Function that returns a plugin |
| `module` | ES module with default export |
| `package` | npm package name |

Loaded plugins are cached by path/package name to prevent duplicate imports.

**2. Register** (`PluginRegistry`)

The registry validates the plugin structure, stores metadata, and calculates load order using **topological sort** on the dependency graph. Circular dependencies are detected and rejected at this stage.

Plugin states in the registry:

```
registered → initializing → active
                  │
                error
                  │
              destroyed
```

**3. Initialize** (`PluginLifecycle`)

Initialization follows dependency order (depth-first). For each plugin:

1. Check all `dependencies` are already active
2. Call `plugin.init(core)` — the plugin receives the full core API
3. Register all actions, providers, evaluators with the service registry
4. Register hooks with the hook service
5. Register chains with the chain manager
6. Mark status as `active`

If initialization fails, the plugin enters `error` state but other plugins continue loading.

**4. Destroy**

Destruction runs in **reverse dependency order** — dependents are destroyed before their dependencies. Each plugin's `destroy()` method is called, resources are cleaned up, and services are unregistered.

### Actions, Providers, Evaluators

These are the three building blocks every plugin can register:

**Actions** — operations that change state or trigger side effects:

```typescript
{
  name: 'execute',
  description: 'Execute a token swap',
  schema: z.object({
    fromToken: z.string(),
    toToken: z.string(),
    amount: z.string()
  }),
  handler: async (input, context) => {
    // Execute swap logic
    return { txHash: '0x...' }
  }
}
```

**Providers** — read-only data sources:

```typescript
{
  name: 'price',
  description: 'Get token price',
  handler: async (input, context) => {
    return { price: 3245.67, symbol: 'ETH' }
  }
}
```

**Evaluators** — boolean condition checkers used by the workflow engine:

```typescript
{
  name: 'priceAbove',
  description: 'Check if price exceeds threshold',
  handler: async (input, context) => {
    const price = await getPrice(input.symbol)
    return price > input.threshold
  }
}
```

All three are accessed via the `pluginName:serviceName` convention: `swap:execute`, `tokendata:price`, `tokendata:priceAbove`.

### Cross-Plugin Communication

Plugins interact through the core API, never directly:

```typescript
// Plugin A calls Plugin B's action
const result = await core.runtime.executeAction('pluginB:someAction', data)

// Plugin A reads Plugin B's data
const info = await core.runtime.getData('pluginB:someProvider', query)

// Plugin A emits event, Plugin B listens
core.hooks.emit('custom:priceAlert', { symbol: 'ETH', price: 4000 })
```

This keeps plugins decoupled. A plugin only knows about action/provider names, not implementations.

---

## Workflow Engine

The workflow engine executes workflows as Directed Acyclic Graphs (DAGs). Each workflow is a graph of nodes connected by edges.

### Node Types

| Type | Purpose |
|------|---------|
| `trigger` | Entry point — schedule, manual, event, or webhook |
| `action` | Execute a plugin action |
| `condition` | Boolean evaluation with branching |
| `delay` | Wait for fixed or random duration |
| `loop` | Iterate by count, forEach, or while |
| `subflow` | Execute another workflow |
| `output` | Route results — return, log, notify, or store |

### Execution Workflow

```
Start
  │
  ▼
Find trigger node
  │
  ▼
Execute trigger → populate initial variables
  │
  ▼
Follow outgoing edges
  │
  ▼
For each target node:
  ├── Resolve parameters (variable substitution)
  ├── Execute by node type
  ├── Store result in context.nodeResults[nodeId]
  ├── On error → follow error edges (if defined)
  └── Continue to next nodes based on edges
  │
  ▼
All nodes complete → return execution context
```

### Execution Context

Every workflow execution creates a context that carries state between nodes:

```typescript
{
  flowId: 'uuid',
  executionId: 'uuid',
  status: 'running' | 'completed' | 'failed' | 'cancelled',
  variables: Record<string, unknown>,
  nodeResults: Record<string, { output, duration, status }>,
  startedAt: Date,
  completedAt: Date
}
```

### Variable Substitution

Nodes reference data from previous nodes using `{{ path.to.value }}` syntax:

```
Node A (action: tokendata:price) → output: { price: 3245.67 }
Node B params: { amount: "{{ nodeA.price }}" }
                  ↓ resolved to
                { amount: 3245.67 }
```

The engine navigates nested paths safely — missing keys resolve to `undefined` without throwing.

### Condition System

Condition nodes evaluate expressions and branch the workflow:

**Operators:**

| Operator | Description |
|----------|------------|
| `eq` / `neq` | Equal / not equal |
| `gt` / `gte` | Greater than / greater or equal |
| `lt` / `lte` | Less than / less or equal |
| `contains` | String/array contains value |
| `startsWith` / `endsWith` | String prefix/suffix |
| `in` / `notIn` | Value in array |
| `isNull` / `isNotNull` | Null check |

**Grouping:** Conditions can be grouped with `AND` / `OR` logic for complex expressions.

**Branching:** Condition nodes have two outgoing paths — `true` and `false`. The workflow follows the matching path.

### Edge Routing

Edges define the graph connections:

```typescript
{
  id: 'edge-1',
  source: 'nodeA',
  target: 'nodeB',
  sourceHandle: 'default'  // or 'true', 'false', 'error'
}
```

- **Default edges** — normal execution path
- **Conditional edges** — `true` / `false` from condition nodes
- **Error edges** — `sourceHandle: 'error'` routes to error handler nodes

When an error edge exists, the workflow doesn't fail — it follows the error path instead. The error details are available as `{{ _error.message }}` and `{{ _error.nodeId }}`.

### Loop Patterns

Loop nodes support three iteration modes:

- **count** — execute N times: `{ type: 'count', count: 10 }`
- **forEach** — iterate over array: `{ type: 'forEach', items: '{{ data.tokens }}' }`
- **while** — repeat while condition true: `{ type: 'while', condition: { ... } }`

---

## Order Templates

Order templates provide a high-level API for common trading strategies. They abstract the complexity of workflow creation into simple parameter objects.

### Available Templates

| Template | Strategy |
|----------|----------|
| `stop-loss` | Sell when price drops below trigger |
| `take-profit` | Sell when price reaches target |
| `conditional-buy` | Buy when conditions are met |
| `conditional-sell` | Sell when conditions are met |
| `dca` | Dollar-cost averaging on schedule |
| `smart-entry` | Budget-limited buys with cooldown |
| `trailing-stop` | Dynamic stop that follows price up |
| `dual-protection` | Combined stop-loss + take-profit |
| `twap` | Time-weighted average price execution |
| `whale-copy` | Mirror whale wallet transactions |

### From Order to Workflow

When you create an order, the system generates a complete workflow behind the scenes:

```
OrderTemplates.create('stop-loss', params)
        │
        ▼
FlowGenerator.generate(template, params)
        │
        ▼
Workflow DAG created:
  trigger(30s) → getData(token) → condition(price <= trigger)
       │                                │
       │                          true  │  false
       │                                │
       │                    swap → notify → output
       │                                │
       └────────────── loop ────────────┘
        │
        ▼
core.flow.create(flow)
core.flow.execute(flowId)
```

### Order Status Lifecycle

```
created → active → triggered → completed
              │                    │
              ├── paused           └── failed
              └── cancelled
```

---

## Event System

SAM Terminal uses a two-layer event architecture for system communication.

### Layer 1: Typed Event Emitter

System-wide events with typed payloads. Every significant operation emits an event:

| Category | Events |
|----------|--------|
| System | `system:init`, `system:ready`, `system:shutdown` |
| Agent | `agent:start`, `agent:stop`, `agent:error` |
| Plugin | `plugin:load`, `plugin:unload`, `plugin:error` |
| Workflow | `flow:start`, `flow:complete`, `flow:error`, `flow:node:before`, `flow:node:after` |
| Action | `action:before`, `action:after`, `action:error` |
| Chain | `chain:switch`, `chain:transaction:sent`, `chain:transaction:confirmed` |
| Custom | `custom:*` — user-defined events |

The emitter also supports `waitFor(event, timeoutMs)` for promise-based event waiting.

### Layer 2: Hooks Service

Plugin-level event subscriptions with priority ordering:

```typescript
{
  event: 'flow:complete',
  priority: 10,           // Higher = executes first
  once: false,            // Auto-unsubscribe after first call
  handler: async (data) => {
    // React to workflow completion
  }
}
```

Features:
- **Priority ordering** — higher priority hooks execute first
- **One-time hooks** — auto-unsubscribe after first trigger
- **Timeout per hook** — prevents hung handlers from blocking
- **Stop on error** — optionally halt remaining hooks on failure
- **Execution results** — track success, duration, errors per hook
- **Bulk unregister** — remove all hooks for a plugin at once

---

## Chain Management

The chain manager abstracts blockchain interaction across multiple networks.

### Supported Chains

| Chain | ID |
|-------|----|
| Base | 8453 |
| Ethereum | 1 |
| Arbitrum | 42161 |
| Polygon | 137 |
| Optimism | 10 |
| BSC | 56 |

Each chain configuration includes: chain ID, RPC URL, explorer URL, native token info, and network-specific parameters.

Plugins register their supported chains during initialization. The chain manager tracks which chain is currently active and handles switching.

---

## gRPC / MCP Layer

The MCP (Model Context Protocol) server bridges the core engine to AI assistants and external clients via gRPC.

### Service Architecture

```
AI Assistant (Claude, Cursor)
        │
        ▼
   MCP Server (40+ tools)
        │
        ▼ gRPC
   ┌────┴─────────────────────────────┐
   │  Go Services    NestJS Services  │
   │  ┌──────────┐  ┌──────────────┐  │
   │  │ tokendata│  │ main         │  │
   │  │ walletdata│  │ notification│  │
   │  └──────────┘  │ swap        │  │
   │                │ transactions│  │
   │                └──────────────┘  │
   └──────────────────────────────────┘
```

### Service Ports

| Service | Port | Stack |
|---------|------|-------|
| tokendata | 50061 | Go |
| walletdata | 50062 | Go |
| swap | 50059 | NestJS |
| main | 50060 | NestJS |
| notification | 50056 | NestJS |
| transactions | 50054 | NestJS |

### MCP Tool Categories

The MCP server exposes 40+ tools across 9 categories:

| Category | Tools | Examples |
|----------|-------|---------|
| Token | 7 | `sam_get_token_price`, `sam_token_track` |
| Wallet | 7 | `sam_get_wallet_details`, `sam_wallet_track` |
| Workflow | 7 | `sam_flow_create`, `sam_flow_execute` |
| Swap | 3 | `sam_swap_execute`, `sam_swap_quote` |
| AI | 3 | `sam_ai_chat`, `sam_ai_classify` |
| Notification | 4 | `sam_notification_send` |
| Scheduler | 4 | `sam_schedule_create` |
| Chain | 3 | `sam_chain_switch` |
| Plugin | 2 | `sam_plugin_list` |

Each tool maps to a gRPC call to the appropriate microservice. The MCP server handles proto loading, client caching, and request/response marshaling.

---

## Concurrency & Scheduling

### Task Manager

The task manager provides a bounded queue for concurrent execution:

- **Concurrency limit:** configurable, default 10
- **Priority support:** higher priority tasks execute first
- **Timeout per task:** prevents hung operations
- **Queue interface:** `enqueue(fn, options): Promise<T>`

### Scheduler

Two scheduling modes:

- **Interval:** `{ interval: 30000 }` — every 30 seconds
- **Cron:** `{ cron: '0 */6 * * *' }` — every 6 hours

Options:
- `runOnce: true` — execute once and stop
- Tasks persist across runtime pause/resume cycles

---

## Error Handling

Errors are isolated at each layer to prevent cascading failures:

| Layer | Behavior |
|-------|----------|
| Plugin load | Logged, plugin skipped, others continue |
| Plugin init | Status → `error`, lifecycle event emitted, others continue |
| Action/Provider | Error thrown to caller (workflow or direct call) |
| Workflow node | Caught by engine, follows error edges if defined |
| Runtime | State machine transitions to `error`, triggers shutdown |

### Workflow Error Handling

When a workflow node fails:

1. Engine checks for outgoing error edges (`sourceHandle: 'error'`)
2. If found — follows error path, sets `{{ _error }}` variable
3. If not found — workflow status becomes `failed`, execution stops

This enables resilient workflows where errors are handled gracefully within the workflow itself.

---

## Design Patterns

| Pattern | Where | Why |
|---------|-------|-----|
| **State Machine** | Runtime engine | Prevents invalid state transitions |
| **Registry** | Plugin registry, service registry | Decoupled service discovery |
| **Topological Sort** | Plugin dependency resolution | Correct initialization order |
| **DAG Execution** | Workflow engine | Flexible, composable workflows |
| **Observer** | Event emitter, hooks service | Loose coupling between plugins |
| **Factory** | Plugin loader | Multiple plugin source types |
| **Dependency Injection** | `plugin.init(core)` | Plugins receive capabilities |
| **Template Method** | BasePlugin | Consistent plugin structure |

---

## Data Workflow Example: Stop-Loss Order

End-to-end walkthrough of a stop-loss order:

```
1. User creates order
   sam order create stop-loss --token USDT --trigger 0.99 --sell-percent 100

2. OrderTemplates.create() called
   - Validates parameters
   - Calls FlowGenerator.generate('stop-loss', params)

3. FlowGenerator creates DAG
   ┌─────────┐    ┌───────────┐    ┌───────────┐
   │ trigger │───▶│ get price │───▶│ condition │
   │  (30s)  │    │           │    │ p <= 0.99 │
   └─────────┘    └───────────┘    └─────┬─────┘
                                    true │ false
                                         │   │
                                   ┌─────▼┐  └── (loop back)
                                   │ swap │
                                   └──┬───┘
                                      │
                                   ┌──▼────┐
                                   │notify │
                                   └──┬────┘
                                      │
                                   ┌──▼────┐
                                   │output │
                                   └───────┘

4. Workflow registered and executed
   core.flow.create(flow) → core.flow.execute(flowId)

5. Every 30 seconds
   - Trigger fires
   - tokendata:getMarket fetches price
   - Condition evaluates: price <= 0.99?
   - If false: loop back, wait 30s
   - If true: swap:execute sells token
   - telegram:send notifies user
   - Output stores result

6. Events emitted at each step
   flow:start → flow:node:before → flow:node:after → ...
   action:before → action:after
   flow:complete

7. Hooks react
   Plugins listening on flow:complete process workflow results
```

---

## Core Interface

The `SamTerminalCore` interface is the central contract binding all subsystems:

```typescript
interface SamTerminalCore {
  runtime: RuntimeEngine      // Action/provider execution
  flow: FlowEngine            // DAG workflow engine
  hooks: HookManager          // Event subscriptions
  services: ServiceRegistry   // Service discovery
  plugins: PluginManager      // Plugin lifecycle
  chains: ChainManager        // Blockchain management
  events: EventEmitter        // System events
  agent?: Agent               // Current agent instance

  initialize(config): Promise<void>
  start(): Promise<void>
  stop(): Promise<void>
  createAgent(config): Promise<Agent>
}
```

Every plugin receives this interface during `init()`. This single entry point provides access to the entire platform.

---

## Next Steps

- [Getting Started](/docs/getting-started) — Set up your first SAM Terminal agent
- [Plugin Development](/docs/plugin-development) — Build custom plugins
- [Building Trading Agents](/docs/building-trading-agents) — Order templates and workflow strategies
- [MCP Setup Guide](/docs/mcp-setup-guide) — Connect to AI assistants
