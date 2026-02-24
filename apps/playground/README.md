# SamTerminal Playground

Example agents and demos showcasing SamTerminal framework capabilities.

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# Then run any example:
pnpm basic        # Basic agent (no external deps)
pnpm telegram     # Telegram bot (needs TELEGRAM_BOT_TOKEN)
pnpm web3         # Web3 agent (uses public APIs)
```

## Available Examples

### Agents

| Command | Description | Requirements |
|---------|-------------|--------------|
| `pnpm basic` | Minimal SamTerminal setup | None |
| `pnpm telegram` | Telegram bot with AI | `TELEGRAM_BOT_TOKEN` |
| `pnpm web3` | Token/wallet tracking | None (uses public APIs) |

### Examples

| Command | Description | Requirements |
|---------|-------------|--------------|
| `pnpm example:onboarding` | Multi-step onboarding flow | None |
| `pnpm example:ai-chat` | Interactive AI chat | `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` |
| `pnpm example:token-tracker` | Real-time price monitoring | None |

## Configuration

### Environment Variables

```bash
# Telegram (for telegram bot)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# AI Providers (for AI chat)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Blockchain RPCs (optional - defaults to public RPCs)
RPC_URL_BASE=https://mainnet.base.org
RPC_URL_ETHEREUM=https://eth.llamarpc.com
```

### SamTerminal Config

See `samterminal.config.json` for agent configuration:

```json
{
  "agent": {
    "name": "playground-agent",
    "description": "SamTerminal Playground Agent"
  },
  "plugins": [
    "@samterminal/plugin-telegram",
    "@samterminal/plugin-ai",
    ...
  ],
  "chains": {
    "default": "base",
    "enabled": ["base", "ethereum", "arbitrum"]
  }
}
```

## Project Structure

```
apps/playground/
├── src/
│   ├── index.ts              # Main entry (all plugins)
│   ├── agents/
│   │   ├── basic.ts          # Minimal agent
│   │   ├── telegram-bot.ts   # Telegram bot
│   │   └── web3-agent.ts     # Web3 features
│   └── examples/
│       ├── onboarding.ts     # Onboarding flow
│       ├── ai-chat.ts        # AI chat demo
│       └── token-tracker.ts  # Price monitoring
├── package.json
├── tsconfig.json
├── samterminal.config.json
└── .env.example
```

## Plugins Used

| Plugin | Description |
|--------|-------------|
| `@samterminal/plugin-telegram` | Telegram bot & notifications |
| `@samterminal/plugin-ai` | AI/LLM integration (OpenAI, Anthropic) |
| `@samterminal/plugin-tokendata` | Token prices & market data |
| `@samterminal/plugin-walletdata` | Wallet balances & tracking |
| `@samterminal/plugin-swap` | DEX swap functionality |
| `@samterminal/plugin-onboarding` | User onboarding flows |

## Development

```bash
# Run with hot reload
pnpm dev

# Build TypeScript
pnpm build

# Clean build artifacts
pnpm clean
```

## Learn More

- [SamTerminal Core Documentation](../packages/core/README.md)
- [Plugin Development Guide](../packages/plugins/README.md)
- [CLI Reference](../packages/cli/README.md)
