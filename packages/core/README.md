# @samterminal/core

SamTerminal Core is a plugin-based framework for building Web3 agents and automation. Inspired by ElizaOS, it provides a flexible architecture for creating blockchain-aware applications.

## Features

- **Plugin System**: Extensible plugin architecture with dependency management
- **Multi-Chain Support**: Built-in support for EVM chains
- **Flow Engine**: Visual workflow builder for automation
- **Hooks System**: Event-driven architecture with lifecycle hooks
- **Runtime Engine**: Task management, scheduling, and execution
- **Order Templates**: Pre-built trading automation (stop-loss, DCA, etc.)

## Installation

```bash
pnpm add @samterminal/core
```

## Quick Start

```typescript
import { createCore } from '@samterminal/core';

// Create core instance
const core = createCore({
  plugins: ['@samterminal/plugin-telegram', '@samterminal/plugin-tokendata'],
  defaultChainId: 8453, // Base
});

// Initialize and start
await core.initialize();
await core.start();

// Create an agent
const agent = await core.createAgent({
  name: 'My Agent',
  plugins: ['@samterminal/plugin-telegram'],
});

// Execute an action
const result = await core.runtime.executeAction('telegram:send', {
  chatId: '123',
  message: 'Hello from SamTerminal!',
});

// Get data from a provider
const tokenData = await core.runtime.getData('tokendata:price', {
  address: '0x...',
  chainId: 8453,
});

// Stop when done
await core.stop();
```

## Creating Plugins

```typescript
import { BasePlugin, createPlugin } from '@samterminal/core';

// Using class-based approach
class MyPlugin extends BasePlugin {
  readonly name = '@my/plugin';
  readonly version = '1.0.0';

  protected async onInit(): Promise<void> {
    // Initialize plugin
    this.registerAction({
      name: 'my:action',
      execute: async (ctx) => {
        return { success: true, data: 'Hello!' };
      },
    });
  }
}

// Using factory function
const myPlugin = createPlugin({
  name: '@my/plugin',
  version: '1.0.0',
  actions: [
    {
      name: 'my:action',
      execute: async (ctx) => ({ success: true, data: 'Hello!' }),
    },
  ],
});
```

## Architecture

```
@samterminal/core
├── runtime/      # Task execution and scheduling
├── flow/         # Visual workflow engine
├── hooks/        # Event-driven hooks system
├── plugins/      # Plugin management
├── chains/       # Multi-chain support
├── order/        # Order template system
├── types/        # TypeScript type definitions
├── interfaces/   # Core interfaces
└── utils/        # Utility functions
```

## API Reference

### Core

- `createCore(config?)` - Create a new SamTerminal core instance
- `core.initialize()` - Initialize the core
- `core.start()` - Start the runtime and plugins
- `core.stop()` - Stop and cleanup

### Runtime

- `core.runtime.executeAction(name, input)` - Execute an action
- `core.runtime.getData(name, query)` - Get data from a provider
- `core.runtime.evaluate(name, condition, data)` - Evaluate a condition

### Plugins

- `core.plugins.register(plugin)` - Register a plugin
- `core.plugins.load(name)` - Load a plugin by name
- `core.plugins.unload(name)` - Unload a plugin

### Flow

- `core.flow.create(flow)` - Create a new flow
- `core.flow.execute(flowId, input)` - Execute a flow
- `core.flow.validate(flow)` - Validate a flow

### Hooks

- `core.hooks.on(event, handler)` - Subscribe to an event
- `core.hooks.emit(event, data)` - Emit an event
- `core.hooks.register(hook)` - Register a hook

### Chains

- `core.chains.register(chain)` - Register a chain
- `core.chains.get(chainId)` - Get chain configuration
- `core.chains.setCurrentChain(chainId)` - Set active chain

### Order Templates

```typescript
import { OrderTemplates, createOrderTemplates } from '@samterminal/core/order';

const templates = createOrderTemplates();

// Create a stop-loss order
const { order, flow } = await templates.create('stop-loss', {
  token: 'ETH',
  triggerPrice: 3000,
  sellPercent: 100,
});

// Create a DCA order
await templates.create('dca', {
  token: 'ETH',
  buyToken: 'ETH',
  sellToken: 'USDC',
  amountPerExecution: 100,
  interval: 'weekly',
});

// List orders
const orders = templates.list({ status: 'active' });

// Cancel an order
await templates.cancel(order.id);
```

**Available Order Types:**
- `stop-loss` - Sell when price drops below trigger
- `take-profit` - Sell when price rises above trigger
- `conditional-sell` - Sell when custom conditions are met
- `conditional-buy` - Buy when custom conditions are met
- `dca` - Dollar-cost averaging with optional conditions
- `twap` - Time-weighted average price execution
- `trailing-stop` - Dynamic stop-loss that follows price up
- `dual-protection` - Combined stop-loss and take-profit
- `smart-entry` - Buy when multiple conditions align

## License

MIT
