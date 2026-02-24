# OpenClaw Skills: Teaching AI to Operate SAM Terminal

OpenClaw Skills represent a paradigm shift in how AI assistants interact with software projects. Rather than relying on generic prompts and trial-and-error, skills provide structured, project-specific knowledge that enables AI assistants to operate autonomously and effectively.

## What Are OpenClaw Skills?

An OpenClaw Skill is a structured markdown document (typically named `SKILL.md` or `CLAUDE.md`) that serves as a comprehensive instruction manual for AI assistants. Think of it as an onboarding guide that teaches an AI:

- What tools and commands are available
- How to execute common workflows
- Project-specific conventions and architecture
- Error handling and troubleshooting steps
- Configuration requirements and environment setup

Unlike traditional documentation written for human developers, skill files are optimized for AI consumption. They combine reference material, procedural knowledge, and contextual examples in a format that language models can efficiently parse and apply.

**Why Skills Matter:**

1. **Autonomy** - AI can complete complex multi-step tasks without constant human guidance
2. **Accuracy** - Reduces hallucination by providing authoritative command references
3. **Efficiency** - AI doesn't need to explore or guess; it knows exactly what tools exist
4. **Consistency** - Ensures AI follows project conventions and best practices
5. **Safety** - Documents destructive operations and required approval steps

For SAM Terminal, skills are particularly powerful because they bridge three layers of functionality:
- CLI commands (`pnpm sam run`, `pnpm sam dev`, etc.)
- MCP tools (40+ tools for token, wallet, workflow operations)
- Plugin configurations and order templates

## How Skills Work

A skill file is structured markdown with specific sections that map to different aspects of operating a project. Here's the anatomy of an effective skill:

### Core Sections

**1. Project Overview**
```markdown
# SAM Terminal Skill

SAM Terminal is a Web3 automation framework...
Stack: TypeScript, NestJS, Go, gRPC
Networks: Base, Ethereum, Arbitrum, Polygon, Optimism, BSC
```

**2. Tool Reference**
```markdown
## CLI Commands

### pnpm sam run <agent>
Execute agent with live plugins

### pnpm sam dev <agent>
Development mode with hot reload
```

**3. Workflow Patterns**
```markdown
## Common Workflows

### Setting Up Trading Agent
1. Clone: git clone https://github.com/0xtinylabs/samterminal.git && cd samterminal
2. Configure: cp .env.example .env and add RPC_URL, PRIVATE_KEY
3. Install and build: pnpm install && pnpm build
4. Edit samterminal.config.json to enable swap plugin
5. Test: pnpm sam dev
```

**4. Configuration Reference**
```markdown
## Required Environment Variables

RPC_URL - Ethereum RPC endpoint
PRIVATE_KEY - Wallet private key (never commit)
TELEGRAM_BOT_TOKEN - For notifications (optional)
```

**5. Troubleshooting**
```markdown
## Common Issues

Error: "Plugin not found"
Solution: Run pnpm sam plugin install <name>

Error: "Insufficient gas"
Solution: Check wallet balance with sam_get_wallet
```

When an AI assistant loads a skill file, it gains instant expertise in the project. Instead of asking "What commands are available?" or making incorrect API calls, it can directly execute correct operations.

## SAM Terminal's Skill File

SAM Terminal's official skill file (`skill.md`) is a 500+ line document that covers the entire platform. Here's what it includes:

### CLI Command Reference

Complete documentation of all SAM Terminal CLI commands:

```bash
# Project Management
pnpm sam dev <agent>               # Development mode with hot reload
pnpm sam run <agent>               # Production execution
pnpm sam doctor                    # Diagnose installation issues

# Plugin Management
pnpm sam plugin list               # Show installed plugins
pnpm sam plugin install <name>     # Install plugin
pnpm sam plugin remove <name>      # Uninstall plugin

# Order Management
pnpm sam order create <type>       # Create trading order
pnpm sam order list                # List active orders
pnpm sam order cancel <id>         # Cancel order
pnpm sam order status <id>         # Check order status
```

### MCP Tools Catalog

All 40 MCP tools organized by category:

**Token Tools (7)**
- `sam_get_tokens` - List all tracked tokens
- `sam_get_token_price` - Real-time price data
- `sam_get_token_info` - Metadata, contract, decimals
- `sam_token_track` - Start monitoring token
- `sam_token_untrack` - Stop monitoring
- `sam_token_blacklist` - Block suspicious tokens
- `sam_token_search` - Search by symbol/address

**Wallet Tools (7)**
- `sam_get_wallet` - Get wallet balance and address
- `sam_get_wallet_tokens` - List token holdings
- `sam_get_wallet_details` - Full portfolio breakdown
- `sam_wallet_track` - Monitor external wallet
- `sam_wallet_update_portfolio` - Refresh holdings cache
- `sam_wallet_label` - Tag wallet with custom label
- `sam_wallet_tracked_list` - List all monitored wallets

**Workflow Tools (7)**
- `sam_flow_list` - List all workflows
- `sam_flow_get` - Get workflow definition
- `sam_flow_create` - Create custom workflow
- `sam_flow_create_from_template` - Use predefined template
- `sam_flow_execute` - Run workflow immediately
- `sam_flow_status` - Check execution status
- `sam_flow_templates` - List available templates

**Swap Tools (3)**
- `sam_swap_quote` - Get swap quote with route
- `sam_swap_execute` - Execute token swap
- `sam_swap_approve` - Approve token spending

**AI Tools (3)**
- `sam_ai_chat` - Conversational AI for strategy advice
- `sam_ai_classify` - Classify intent or sentiment
- `sam_ai_extract` - Extract structured data from text

**Notification Tools (4)**
- `sam_notification_send` - Send alert via Telegram
- `sam_notification_configure` - Set up notification channels
- `sam_notification_subscribe` - Subscribe to event types
- `sam_notification_history` - View past notifications

**Scheduler Tools (4)**
- `sam_scheduler_create` - Schedule recurring task
- `sam_scheduler_list` - List scheduled jobs
- `sam_scheduler_cancel` - Remove scheduled job
- `sam_scheduler_update` - Modify job parameters

**Chain Tools (3)**
- `sam_chain_info` - Get blockchain info (height, gas)
- `sam_chain_tx_status` - Check transaction status
- `sam_chain_gas_estimate` - Estimate gas for operation

**Plugin Tools (2)**
- `sam_plugin_list` - List installed plugins
- `sam_plugin_config` - Get/set plugin configuration

### Order Templates

Complete reference for all 10 order types:

```markdown
## Stop Loss
Automatically sell when price drops below threshold
Parameters: token, triggerPrice, sellAmount, minOutput

## Take Profit
Lock in gains when price reaches target
Parameters: token, targetPrice, sellAmount

## DCA (Dollar Cost Average)
Buy fixed amount at regular intervals
Parameters: token, amountPerPurchase, interval, totalPurchases

## Conditional Buy
Buy when condition is met (price, volume, etc.)
Parameters: token, condition, amount, maxPrice

## Conditional Sell
Sell when condition is met
Parameters: token, condition, amount, minPrice

## Smart Entry
Buy at optimal entry point using AI analysis
Parameters: token, budget, confidence, timeWindow

## Trailing Stop
Dynamic stop loss that follows price movements
Parameters: token, trailPercent, activationPrice

## Dual Protection
Combines stop loss and take profit
Parameters: token, stopLoss, takeProfit, amount

## TWAP (Time-Weighted Average Price)
Execute large order gradually to minimize slippage
Parameters: token, totalAmount, duration, intervals

## Whale Copy
Replicate trades from specified wallet
Parameters: walletAddress, copyRatio, maxOrderSize
```

### Plugin Configuration

Details on configuring each plugin:

```typescript
// @samterminal/plugin-swap plugin
{
  "name": "@samterminal/plugin-swap",
  "config": {
    "defaultSlippage": 0.5,
    "autoApprove": false,
    "preferredDex": "uniswap",
    "maxGasPrice": "100"
  }
}

// @samterminal/plugin-telegram plugin
{
  "name": "@samterminal/plugin-telegram",
  "config": {
    "botToken": "env:TELEGRAM_BOT_TOKEN",
    "chatId": "env:TELEGRAM_CHAT_ID",
    "notifyOnExecution": true,
    "notifyOnError": true
  }
}
```

### Troubleshooting Guide

Common errors and resolutions:

```markdown
Error: "RPC_URL not configured"
Fix: Add RPC_URL=https://... to .env

Error: "Insufficient balance for gas"
Fix: Check wallet balance with sam_get_wallet, fund wallet

Error: "Transaction reverted"
Fix: Check token approval with sam_swap_approve first

Error: "Plugin initialization failed"
Fix: Verify plugin config in samterminal.config.json
```

## Setting Up Skills

Different AI assistants require different setup approaches. Here's how to configure skills for popular platforms:

### Claude Desktop

Claude Desktop supports skill files through the system prompt configuration:

1. Place `skill.md` in your project root
2. Open Claude Desktop settings
3. Navigate to Developer settings
4. Add to system prompt:
```
When working on SAM Terminal, reference /path/to/samterminal/skill.md for complete command and tool documentation.
```

Alternatively, you can attach the skill file to each conversation:
- Click the attachment icon
- Select `skill.md`
- The skill content is now available for the conversation

### Claude Code

Claude Code automatically detects `CLAUDE.md` in the project root:

1. Rename `skill.md` to `CLAUDE.md`
2. Place in project root directory
3. Claude Code loads it automatically on project open

No additional configuration needed. Claude Code reads CLAUDE.md on startup and maintains context throughout the session.

### Cursor

Cursor uses workspace context:

1. Place `skill.md` in `.cursor/` directory
2. Or add to workspace settings:
```json
{
  "cursor.context.files": [
    "skill.md"
  ]
}
```

Cursor will include the skill file in the context window for all AI interactions within the workspace.

### Generic MCP Clients

For other MCP-compatible clients:

1. Check if the client supports context files or system prompts
2. If yes, reference the skill file location
3. If no, you can manually paste relevant sections when starting conversations

Some MCP clients allow adding context via server configuration:
```json
{
  "mcpServers": {
    "samterminal": {
      "command": "node",
      "args": ["path/to/samterminal/packages/mcp-server/dist/index.js"],
      "context": ["skill.md"]
    }
  }
}
```

## Writing a Custom Skill File

While SAM Terminal provides an official skill file, you may want to create project-specific skills for:
- Custom plugins you've developed
- Team-specific workflows and conventions
- Internal tooling and scripts
- Company-specific deployment procedures

Here's a step-by-step guide to writing effective skill files:

### Step 1: Project Overview Section

Start with a clear, concise overview:

```markdown
# [Project Name] Skill

[Project Name] is a [brief description]...

**Stack:** [technologies]
**Purpose:** [what it does]
**Repository:** [git url]

## Key Concepts

- **Concept 1:** [explanation]
- **Concept 2:** [explanation]
```

### Step 2: CLI Commands Section

Document every command with parameters and examples:

```markdown
## CLI Commands

### command-name [required] <optional>
Description of what the command does

**Parameters:**
- required: Description
- optional: Description (default: value)

**Example:**
`command-name my-value --option`

**Output:**
[expected output]
```

### Step 3: MCP Tool Categories Section

Group tools by functionality:

```markdown
## MCP Tools

### Category Name

#### tool_name
**Purpose:** What it does
**Parameters:**
- param1 (type): Description
- param2 (type, optional): Description

**Example:**
\`\`\`json
{
  "param1": "value",
  "param2": "value"
}
\`\`\`

**Returns:**
[description of return value]
```

### Step 4: Configuration Reference

Document all configuration options:

```markdown
## Configuration

### Environment Variables

**Required:**
- VAR_NAME: Description, where to obtain

**Optional:**
- VAR_NAME: Description (default: value)

### Config File

Location: ./config/app.config.json

\`\`\`json
{
  "setting": "value",
  "nested": {
    "option": true
  }
}
\`\`\`
```

### Step 5: Common Workflows Section

Provide end-to-end examples:

```markdown
## Common Workflows

### Workflow Name

Goal: [what user wants to achieve]

**Steps:**
1. Run `command one`
2. Verify output contains [expected value]
3. Run `tool_name` with params: [...]
4. Confirm success message

**Expected Duration:** ~2 minutes
```

### Step 6: Troubleshooting Section

Anticipate common failures:

```markdown
## Troubleshooting

### Error Message: "Exact error text"

**Cause:** Why this happens
**Solution:** Step-by-step fix
**Prevention:** How to avoid in future

### Performance Issues

**Symptoms:** [observable behavior]
**Diagnosis:** How to confirm the issue
**Fix:** Remediation steps
```

## Skill File Best Practices

Based on extensive testing with Claude and other AI assistants, here are proven best practices:

### Keep It Concise But Complete

AI assistants have context windows, but shorter is better for:
- Faster parsing and retrieval
- Reduced token usage
- Better focus on relevant information

**Good:**
```markdown
### pnpm sam dev <agent>
Development mode with hot reload
Options: --port (number), --watch (boolean)
Example: pnpm sam dev my-agent
```

**Too Verbose:**
```markdown
### pnpm sam dev
The pnpm sam dev command is used to start an agent in development mode. You can optionally provide an agent name to run. If no name is provided, the default agent is used. There are several options available...
[continues for 10 more lines]
```

### Include Example Commands With Expected Outputs

AI assistants learn best from examples:

```markdown
### sam_get_token_price

\`\`\`json
{
  "symbol": "ETH"
}
\`\`\`

Returns:
\`\`\`json
{
  "symbol": "ETH",
  "price": 3245.67,
  "change24h": 2.3,
  "volume24h": 15678900000
}
\`\`\`
```

This helps AI understand:
- Exact parameter format
- Expected response structure
- Data types and units

### Document Environment Variables

Critical for AI to help with setup:

```markdown
## Environment Variables

**RPC_URL**
- Purpose: Ethereum node endpoint
- Obtain from: Alchemy, Infura, or QuickNode
- Example: https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY
- Required for: All chain interactions

**PRIVATE_KEY**
- Purpose: Wallet private key for signing transactions
- Format: 0x prefixed hex string (64 characters)
- Security: Never commit to git, use .env only
- Required for: Swap, order execution
```

### Version Alongside Code

Keep skill files in sync with code:

```markdown
# SAM Terminal Skill
Version: 1.2.0
Last Updated: 2026-02-15
Compatible with: SAM Terminal >= 1.0.0
```

Use git to track changes:
```bash
git log skill.md
```

When releasing new CLI commands or MCP tools, update the skill file in the same commit.

### Include Error Recovery Steps

Teach AI how to handle failures:

```markdown
## Error Recovery

### Transaction Failed

1. Check transaction hash with sam_chain_tx_status
2. If "insufficient gas", increase gas limit by 20%
3. If "token not approved", run sam_swap_approve first
4. Retry original operation

### Plugin Crash

1. Check logs: ~/.sam/logs/plugin-[name].log
2. Verify plugin config in samterminal.config.json
3. Try: pnpm sam plugin remove [name] && pnpm sam plugin install [name]
4. If persistent, report issue with log excerpt
```

## Real-World Examples

Let's see how skills enable AI to complete complex tasks autonomously.

### Example 1: Setting Up a New Trading Agent

**User:** "Set up a new trading agent for Ethereum with stop-loss protection"

**AI with Skills:**

```
I'll help you set up a trading agent with stop-loss capabilities.

Step 1: Clone and setup project
> git clone https://github.com/0xtinylabs/samterminal.git eth-trader
> cd eth-trader
> cp .env.example .env
> pnpm install && pnpm build

Step 2: Enable required plugins in samterminal.config.json
Add to plugins array: @samterminal/plugin-swap, @samterminal/plugin-tokendata, @samterminal/plugin-telegram

Step 3: Configuration needed
I need some information to complete the setup:
- RPC_URL for Ethereum (Alchemy/Infura)
- PRIVATE_KEY for your trading wallet
- TELEGRAM_BOT_TOKEN for notifications (optional)

Please create a .env file with these values.

Step 4: Create agent file
I'll create the agent with stop-loss logic...
```

The AI knows:
- Exact command syntax (from skill)
- Which plugins are needed (from tool reference)
- Required environment variables (from config section)
- Proper project structure (from workflow examples)

### Example 2: Token Tracking and Price Alerts

**User:** "Track ETH and alert me when it drops below $3000"

**AI with Skills:**

```
I'll set up ETH tracking with a price alert.

Step 1: Start tracking ETH
> sam_token_track {"symbol": "ETH"}

Response: ETH tracking enabled

Step 2: Create price alert workflow
I'm creating a workflow that monitors ETH price and notifies when it drops below $3000.

> sam_flow_create_from_template {
  "template": "price-alert",
  "params": {
    "token": "ETH",
    "condition": "below",
    "threshold": 3000,
    "notification": "telegram"
  }
}

Workflow created: flow_eth_alert_001

The alert is now active. You'll receive a Telegram notification when ETH drops below $3000.
```

The AI:
- Used correct MCP tool (`sam_token_track`)
- Selected appropriate template (`price-alert`)
- Configured parameters correctly
- Explained the outcome

### Example 3: Portfolio Analysis and Rebalancing

**User:** "Show my portfolio and suggest rebalancing"

**AI with Skills:**

```
Let me analyze your portfolio.

Step 1: Fetch portfolio details
> sam_get_wallet_details {}

Current Holdings:
- ETH: 2.5 ($8,114 | 45%)
- USDC: 5,000 ($5,000 | 28%)
- UNI: 800 ($4,800 | 27%)

Total Value: $17,914

Step 2: AI analysis
> sam_ai_chat {
  "message": "Analyze this portfolio: 45% ETH, 28% USDC, 27% UNI.
               Suggest rebalancing for moderate risk tolerance.",
  "context": {"portfolio": [...]}
}

AI Recommendation:
- Current allocation is ETH-heavy (45% in single asset)
- Suggested target: 35% ETH, 35% stablecoins, 30% altcoins
- Action: Sell 0.6 ETH for USDC ($1,948)

Would you like me to create this rebalancing order?
```

The AI:
- Called appropriate MCP tools sequentially
- Used AI tool for strategic analysis
- Presented data clearly
- Offered actionable next steps

### Example 4: DCA Strategy Creation

**User:** "Create a DCA strategy to buy $100 of ETH every week for 10 weeks"

**AI with Skills:**

```
I'll create a DCA (Dollar Cost Average) order for ETH.

> pnpm sam order create dca \
  --token ETH \
  --amount 100 \
  --interval 1w \
  --count 10

Order Created: order_dca_eth_001

Details:
- Token: ETH (Ethereum)
- Amount per purchase: $100
- Interval: Every 7 days
- Total purchases: 10
- Total investment: $1,000
- Start: 2026-02-16
- End: 2026-04-27

The order will execute automatically every week. You'll receive notifications
before each purchase and can cancel anytime with:

> pnpm sam order cancel order_dca_eth_001

Track status with:
> pnpm sam order status order_dca_eth_001
```

The AI:
- Knew the exact order type (`dca`)
- Formatted parameters correctly
- Calculated dates automatically
- Provided follow-up commands

## Extending Skills for Teams

Organizations can create specialized skill files for internal tools and conventions.

### Team-Specific Workflows

```markdown
## Team Workflows

### Deploying to Staging

1. Ensure tests pass: `npm test`
2. Build: `npm run build`
3. Deploy: `pnpm sam deploy staging --approve`
4. Run smoke tests: `npm run test:smoke staging`
5. Notify in #deployments Slack channel

### Creating New Plugin

1. Generate scaffold: `pnpm sam plugin create <name>`
2. Implement IPlugin interface
3. Add tests in `src/__tests__/`
4. Document in `README.md`
5. Submit PR with label `plugin`
6. Tag @platform-team for review
```

### Company Conventions

```markdown
## Naming Conventions

**Agents:** verb-noun format (e.g., track-wallet, alert-price)
**Flows:** [purpose]-[asset]-[condition] (e.g., stop-loss-eth-3000)
**Environment variables:** UPPERCASE_SNAKE_CASE with SAM_ prefix

## Code Review Requirements

- All PRs require 2 approvals
- Include test coverage report
- Update CHANGELOG.md
- Run `pnpm sam doctor` before submitting
```

### Internal Tool Integration

```markdown
## Internal Tools

### Deployment Dashboard
URL: https://dashboard.internal/sam
Use `pnpm sam deploy` command, then verify in dashboard

### Monitoring
All agents automatically report to DataDog
View: https://datadog.internal/sam-terminal

### Cost Tracking
RPC and gas costs tracked in finance.internal
Run `pnpm sam cost-report` for monthly summary
```

## Skills + MCP Integration

Skills and MCP are complementary technologies:

**MCP Provides:**
- Standardized tool interface
- Bidirectional communication
- Real-time data access
- Secure execution environment

**Skills Provide:**
- Context on when to use which tools
- Workflow patterns and best practices
- Error handling strategies
- Project-specific knowledge

Together, they enable truly autonomous AI agents:

1. **AI reads skill** - Understands project capabilities
2. **AI plans approach** - Selects appropriate tools and order
3. **AI executes via MCP** - Calls tools with correct parameters
4. **AI interprets results** - Uses skill knowledge to validate and proceed
5. **AI handles errors** - Follows troubleshooting steps from skill

Without skills, AI would need to:
- Explore available tools through trial and error
- Guess at parameter formats
- Lack context on project conventions
- Struggle with error recovery

Without MCP, AI would be limited to:
- Generating code snippets for humans to run
- Providing advice without execution capability
- Operating through CLI only (no programmatic access)

## Comparing Approaches

### Skills vs Raw MCP

**Raw MCP (No Skill File):**
```
User: "Track ETH"
AI: Let me see what tools are available...
    [queries tool list]
    I found sam_token_track. Let me check its parameters...
    [trial and error with parameters]
    [possibly incorrect format]
    Error: Invalid parameters
    [tries again]
    Success after 3 attempts
```

**Skills + MCP:**
```
User: "Track ETH"
AI: [reads skill, knows sam_token_track exists and parameter format]
    > sam_token_track {"symbol": "ETH"}
    Success on first attempt
```

**Time saved:** 60-80% reduction in interactions

### When to Use Skills

**Use Skills When:**
- You have defined CLI commands or APIs
- Workflows follow standard patterns
- You want AI to operate autonomously
- Multiple team members use AI assistants
- You need consistent AI behavior

**Skip Skills When:**
- Project is simple (1-2 commands)
- You want exploratory AI behavior
- Tools change very frequently
- One-off personal project

## Next Steps

Now that you understand OpenClaw Skills, here are resources to explore:

**Getting Started:**
- [SAM Terminal Documentation](/docs/getting-started) - Install and setup
- [MCP Setup Guide](/docs/mcp-setup-guide) - Connect AI assistants

**Advanced Topics:**
- [Trading Automation](/docs/openclaw-trading-automation) - Build autonomous trading agents
- [Plugin Development](/docs/plugin-development) - Create custom plugins

**Community:**
- [GitHub Repository](https://github.com/0xtinylabs/samterminal) - Star, fork, contribute
- [X (Twitter)](https://x.com/samterminalcom) - Follow for updates

Start by downloading SAM Terminal's official skill file, loading it into your AI assistant, and trying the examples from this guide. As you become comfortable, create custom skill files for your specific use cases and share them with the community.

Skills transform AI assistants from suggestion engines into autonomous operators. With the right skill file, your AI becomes an expert teammate who can execute complex workflows independently, recover from errors gracefully, and follow project conventions consistently.
