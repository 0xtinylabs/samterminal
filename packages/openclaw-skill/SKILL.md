---
name: sam-terminal
description: Full onchain trading infrastructure -- swap, track tokens/wallets, build workflows, get alerts, manage portfolios across EVM
homepage: https://samterminal.com
metadata: {"openclaw":{"requires":{"env":["SAM_GRPC_HOST"]},"primaryEnv":"SAM_GRPC_HOST"}}
---

# SAM Terminal -- Onchain Trading Infrastructure

You have access to SAM Terminal's full trading and automation infrastructure through MCP tools. Use these tools to help users manage tokens, wallets, execute swaps, build automated workflows, schedule tasks, and receive notifications across EVM chains.

## Token Operations

### Get Token Data
- **sam_get_token_price** -- Get current price and volume for a token by address
- **sam_get_token_info** -- Get full token details (name, symbol, supply, pool, price)
- **sam_get_tokens** -- Get multiple tokens at once (pass addresses or empty for all tracked)
- **sam_token_search** -- Search tokens by name, symbol, or address

### Token Tracking
- **sam_token_track** -- Start tracking a token (price monitoring, alerts)
- **sam_token_untrack** -- Stop tracking a token
- **sam_token_blacklist** -- Blacklist tokens to exclude from results

**Example flow:**
```
User: "What's the price of DEGEN?"
1. sam_token_search({ query: "DEGEN" }) → find address
2. sam_get_token_price({ tokenAddress: "0x..." }) → get price
```

## Wallet Operations

### Wallet Data
- **sam_get_wallet** -- Get wallet summary (native balance, total value, token list)
- **sam_get_wallet_tokens** -- Get detailed token holdings with USD values
- **sam_get_wallet_details** -- Get complete wallet info (balance + all holdings)

### Wallet Management
- **sam_wallet_track** -- Start tracking a wallet
- **sam_wallet_update_portfolio** -- Update cached portfolio value
- **sam_wallet_label** -- Assign a label to a wallet (e.g., "Main Wallet")
- **sam_wallet_tracked_list** -- List all tracked wallets

**Example flow:**
```
User: "Show my Base wallet holdings"
1. sam_get_wallet_details({ walletAddress: "0x...", chain: "BASE" })
```

## Trading (Swap)

### Swap Flow
1. **sam_swap_quote** -- Get fee estimate first
2. **sam_swap_approve** -- Approve ERC20 token spending (skip for native tokens)
3. **sam_swap_execute** -- Execute the swap

### Safety Rules
- **ALWAYS** get a quote before executing a swap
- **ALWAYS** confirm with the user before executing -- show them the quote, amounts, and estimated fees
- **NEVER** execute a swap without explicit user confirmation
- For ERC20 tokens, approve before swap. Native tokens (ETH) don't need approval
- Default slippage: warn if > 3%, refuse if > 10% unless user explicitly overrides
- For large trades (> $1000), add extra confirmation step with price impact warning

**Example flow:**
```
User: "Swap 0.1 ETH for USDC on Base"
1. sam_swap_quote({ to: "0x...", value: "0.1" }) → show fee
2. Confirm with user: "Swap 0.1 ETH → ~XXX USDC, fee: X. Proceed?"
3. sam_swap_execute({ fromTokenAddress: "0x...", toTokenAddress: "0x...", amount: 0.1, chain: "BASE", privateKey: "..." })
```

## Workflows (Flows)

### Flow Management
- **sam_flow_list** -- List all workflows
- **sam_flow_get** -- Get workflow details (nodes, edges, config)
- **sam_flow_templates** -- List available templates
- **sam_flow_create_from_template** -- Create from template (simple-action, conditional, error-handling, scheduled)
- **sam_flow_create** -- Create custom workflow with nodes and edges
- **sam_flow_execute** -- Run a workflow
- **sam_flow_status** -- Check execution status

### Node Types
- **trigger** -- Entry point (manual or schedule-based)
- **action** -- Execute a plugin action (e.g., get price, send notification)
- **condition** -- Conditional branching (if/else based on data)
- **loop** -- Iteration (count, forEach, while)
- **delay** -- Wait/pause
- **subflow** -- Execute another workflow
- **output** -- Return values

### Variable System
Nodes can reference variables using `{{ path.to.variable }}` syntax:
- Input variables from execution
- Output from previous nodes
- Loop variables: `_loopIndex`, `_loopItem`
- Condition results: `_conditionResult`
- Error info: `_error.message`, `_error.nodeId`

**Example -- Price Alert Workflow:**
```
User: "Create a workflow: check ETH price every hour, notify me on Telegram if below $3000"
1. sam_flow_create({
     name: "ETH Price Alert",
     nodes: [
       { type: "trigger", data: { triggerType: "schedule", config: { cron: "0 * * * *" } } },
       { type: "action", data: { actionName: "tokendata:getPrice", params: { tokenAddress: "0x..." } } },
       { type: "condition", data: { conditions: [{ field: "price", operator: "lt", value: "3000" }] } },
       { type: "action", data: { actionName: "notification:send", params: { message: "ETH is below $3000! Current: {{ price }}", type: "TELEGRAM" } } }
     ],
     edges: [...]
   })
```

## Notifications

- **sam_notify_send** -- Send notification (Telegram or Farcaster)
- **sam_notify_bot_url** -- Get bot connection URL for user setup
- **sam_notify_bot_state** -- Check which channels are active
- **sam_notify_toggle** -- Enable/disable a notification channel

**Supported channels:** Telegram, Farcaster

## AI Tools

- **sam_ai_generate** -- Generate text (trading analysis, summaries)
- **sam_ai_generate_json** -- Generate structured JSON (parsed data, configs)
- **sam_ai_chat** -- Multi-turn conversation with context

## Scheduling

- **sam_schedule_create** -- Create cron or interval-based recurring task
- **sam_schedule_list** -- List all scheduled tasks
- **sam_schedule_toggle** -- Enable/disable a task
- **sam_schedule_delete** -- Remove a task

### Cron Presets
- `@yearly` / `@monthly` / `@weekly` / `@daily` / `@hourly` / `@minutely`
- Standard cron: `0 * * * *` (hourly), `0 9 * * *` (daily at 9am)

**Example -- DCA Schedule:**
```
User: "Buy $50 of ETH every day"
1. sam_schedule_create({
     name: "Daily ETH DCA",
     cron: "@daily",
     action: "swap:execute",
     actionInput: { fromTokenAddress: "USDC_ADDRESS", toTokenAddress: "ETH_ADDRESS", amount: 50 }
   })
```

## Chain Management

- **sam_chain_list** -- List supported chains
- **sam_chain_current** -- Get active chain
- **sam_chain_switch** -- Switch active chain

### Supported Chains
- **BASE** (default) -- EVM L2

Always check/confirm the active chain before executing transactions.

## Plugin & Action Discovery

- **sam_plugin_list** -- List installed plugins and their capabilities
- **sam_plugin_actions** -- List all available actions (useful for building workflows)

## Orders & Payments

- **sam_order_create** -- Create payment order
- **sam_order_confirm** -- Confirm with tx hash
- **sam_order_list** -- View order history

## Common Workflow Patterns

### 1. Price Alert
Trigger (schedule) → Get Price → Condition (price < threshold) → Notify

### 2. DCA (Dollar Cost Average)
Schedule (daily/weekly) → Swap (fixed amount) → Notify result

### 3. Portfolio Rebalance
Trigger → Get Wallet Details → Check allocations → Swap to rebalance → Notify

### 4. Whale Tracking
Schedule → Get Wallet Tokens (whale address) → Compare with previous → Notify changes

### 5. Smart Buy/Sell
Trigger → AI Analysis → Condition (bullish/bearish) → Swap → Notify

## General Guidelines

1. **Chain awareness** -- Always confirm which chain before transactions
2. **User confirmation** -- Always confirm before swaps, approvals, and scheduled tasks
3. **Error handling** -- If a tool fails, explain the error clearly and suggest next steps
4. **Cost awareness** -- Mention gas fees and trading fees when relevant
5. **Security** -- Never log or display private keys. Handle them only when needed for transactions
