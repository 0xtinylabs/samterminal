# @samterminal/cli

Command-line interface for SamTerminal - Create and manage SamTerminal agents.

## Installation

```bash
# Global installation
npm install -g @samterminal/cli

# Or use with npx
npx @samterminal/cli init my-agent
```

## Quick Start

```bash
# Create a new project
sam init my-agent

# Navigate to project
cd my-agent

# Start development
sam dev
```

## Commands

### `sam init [name]`

Create a new SamTerminal project.

```bash
# Interactive mode
sam init

# With name
sam init my-agent

# With template
sam init my-agent --template telegram-bot

# With plugins
sam init my-agent --plugins telegram ai

# JavaScript instead of TypeScript
sam init my-agent --no-typescript
```

**Options:**

| Option | Description |
|--------|-------------|
| `-t, --template <type>` | Template: basic, telegram-bot, web3-agent, custom |
| `--typescript` | Use TypeScript (default) |
| `--no-typescript` | Use JavaScript |
| `-p, --plugins <plugins...>` | Plugins to include |
| `--skip-install` | Skip npm install |
| `--pm <manager>` | Package manager: npm, pnpm, yarn |

### `sam run`

Start the SamTerminal agent.

```bash
# Start agent
sam run

# With environment
sam run --env production

# With watch mode
sam run --watch
```

**Options:**

| Option | Description |
|--------|-------------|
| `-c, --config <path>` | Config file path |
| `-e, --env <env>` | Environment (development, production) |
| `-w, --watch` | Enable watch mode |
| `-p, --port <port>` | Port override |

### `sam dev`

Start the agent in development mode (watch mode enabled).

```bash
sam dev
```

### `sam setup`

Setup the SamTerminal development environment. This command automates the entire setup process.

```bash
# Full setup
sam setup

# Skip specific steps
sam setup --skip-install      # Skip pnpm install
sam setup --skip-build        # Skip building packages
sam setup --skip-migrate      # Skip database migrations
sam setup --skip-env-check    # Skip .env file check

# Verbose output
sam setup -v
```

**What it does:**

1. Checks prerequisites (Node.js, pnpm, Go, protoc)
2. Creates `.env` from `.env.example` if missing
3. Runs `pnpm install`
4. Generates protobuf code (`pnpm proto:gen`)
5. Builds all packages (`pnpm build`)
6. Runs database migrations (`pnpm db:migrate`)

**Options:**

| Option | Description |
|--------|-------------|
| `--skip-install` | Skip dependency installation |
| `--skip-build` | Skip building packages |
| `--skip-migrate` | Skip database migrations |
| `--skip-env-check` | Skip .env file check |

### `sam plugin`

Manage SamTerminal plugins.

#### `sam plugin install <plugin>`

```bash
# Install by shorthand
sam plugin install telegram

# Install by full name
sam plugin install @samterminal/plugin-ai

# With version
sam plugin install telegram --version 1.0.0
```

#### `sam plugin remove <plugin>`

```bash
sam plugin remove telegram
```

#### `sam plugin list`

```bash
sam plugin list
```

#### `sam plugin enable <plugin>`

```bash
sam plugin enable telegram
```

#### `sam plugin disable <plugin>`

```bash
sam plugin disable telegram
```

### `sam info`

Display environment and project information.

```bash
sam info
```

## Templates

### basic

Minimal SamTerminal agent with no plugins.

### telegram-bot

Telegram bot with AI capabilities. Includes:
- @samterminal/plugin-telegram
- @samterminal/plugin-ai
- @samterminal/plugin-onboarding

### web3-agent

Web3 agent with token/wallet data and swap support. Includes:
- @samterminal/plugin-tokendata
- @samterminal/plugin-walletdata
- @samterminal/plugin-swap
- @samterminal/plugin-telegram

### custom

Select your own plugins during setup.

## Available Plugins

| Plugin | Description |
|--------|-------------|
| `telegram` | Telegram bot integration |
| `ai` | AI/LLM integration (OpenAI, Anthropic) |
| `tokendata` | Token data and prices |
| `walletdata` | Wallet balances and transactions |
| `swap` | Token swap functionality |
| `onboarding` | User onboarding flows |

## Project Structure

```
my-agent/
├── src/
│   └── index.ts      # Entry point
├── samterminal.config.json # SamTerminal configuration
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

## Configuration

The `samterminal.config.json` file contains project configuration:

```json
{
  "name": "my-agent",
  "version": "1.0.0",
  "samterminalVersion": "^1.0.0",
  "plugins": [
    {
      "name": "@samterminal/plugin-telegram",
      "enabled": true
    }
  ],
  "runtime": {
    "logLevel": "info",
    "hotReload": true
  }
}
```

## Global Options

| Option | Description |
|--------|-------------|
| `-v, --verbose` | Enable verbose output |
| `-V, --version` | Show version |
| `-h, --help` | Show help |

## Programmatic Usage

```typescript
import {
  initCommand,
  runCommand,
  setupCommand,
  pluginInstall,
  getCLIContext,
} from '@samterminal/cli';

// Create a new project
await initCommand('my-agent', {
  template: 'basic',
  typescript: true,
  plugins: ['telegram'],
});

// Setup development environment
await setupCommand({
  skipInstall: false,
  skipBuild: false,
  skipMigrate: false,
});

// Get project context
const context = await getCLIContext();
console.log(context.config);

// Install a plugin
await pluginInstall('ai');
```

## License

MIT
