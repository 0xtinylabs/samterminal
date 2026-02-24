# Real-Time Token Discovery: Catch New Tokens Before Everyone Else

Every day, hundreds of new tokens launch on Base through platforms like Clanker and Bankr. By the time they show up on aggregator sites, early opportunities are already gone. SAM Terminal now discovers these tokens the moment they're deployed -- automatically tracking prices, pool activity, and market data in real time.

This guide covers how real-time token discovery works, how to build condition-based strategies around newly launched tokens, and how to automate the entire workflow from detection to execution.

---

## What Changed

Previously, SAM Terminal only tracked tokens that users manually added. You had to know a token's contract address, search for it, and start tracking it yourself. That worked for established tokens, but missed the window on new launches entirely.

Now, the system runs two parallel discovery pipelines:

**Clanker Discovery** -- Polls the Clanker API every 5 seconds for newly deployed tokens on Base. Each poll returns the latest 20 tokens with metadata: name, symbol, image, pool address, and pair type.

**Bankr Discovery** -- Listens directly to the Bankr factory contract via WebSocket. Every time a new token is created on-chain, SAM Terminal receives the event within seconds -- no polling delay.

Both pipelines feed into the same tracking infrastructure: DexScreener for price and volume data, Uniswap pool watching for real-time swap events, and the full gRPC pipeline that powers MCP tools.

```
Clanker API (5s poll)     Bankr Factory (WebSocket)
        │                         │
        ▼                         ▼
   Filter & Dedup            Event Decode
        │                         │
        └────────┬────────────────┘
                 │
                 ▼
        DexScreener Batch
        (price, volume, pool)
                 │
                 ▼
        DB Insert + Pool Watch
        (real-time swap events)
                 │
                 ▼
        gRPC → MCP Tools
        (available to your agent)
```

The moment a token enters the system, it becomes queryable through all SAM Terminal tools -- `sam_get_token_price`, `sam_get_token_info`, `sam_token_search`, and the condition engine.

---

## How Discovery Works Under the Hood

### Clanker Pipeline

Clanker tokens come with rich metadata from the API -- name, symbol, image URL, pool address, and whether it's a V3 or V4 pool. SAM Terminal uses this directly instead of making additional API calls.

For market data (price, volume, liquidity), a single batch request goes to DexScreener for all new tokens in that poll cycle. One HTTP call for 20 tokens instead of 20 individual calls.

Tokens that DexScreener doesn't have data for yet (common for very fresh launches) are saved with price "0" and picked up by a background job that retries every 10 minutes.

### Bankr Pipeline

Bankr is more active -- roughly 6 new tokens per minute. Instead of polling an API, the system subscribes directly to the Bankr factory contract's `Create` event via WebSocket.

Since on-chain events don't include token metadata (just the contract address and pair), SAM Terminal reads `name()` and `symbol()` directly from the token contract via RPC. These calls run in parallel across all tokens in a batch for speed.

The WebSocket connection auto-reconnects with exponential backoff if the RPC provider drops the connection. No manual intervention needed.

### Shared Infrastructure

Both pipelines share:

- **Deduplication** -- In-memory cache (10-minute TTL) + database check prevents duplicate processing
- **DexScreener batching** -- Addresses are chunked into groups of 20 to stay within URL limits
- **Pool watching** -- Each new token gets a WebSocket subscription to its Uniswap pool for real-time swap events
- **Automatic cleanup** -- Tokens with no activity for 30 minutes are removed from active tracking, freeing up resources

---

## Building Strategies Around New Tokens

This is where it gets interesting. New token discovery becomes powerful when combined with SAM Terminal's condition engine and workflow system. Instead of manually checking every new launch, you define conditions -- and only get alerted (or execute trades) when those conditions are met.

### Strategy 1: New Launch Alert with Safety Filter

The simplest and most useful setup. Get notified about new tokens, but only the ones that pass basic safety checks.

```
User: "Alert me on Telegram when a new Clanker token launches
       with liquidity above $50K and more than 100 holders"
```

What the agent builds:

```
[Schedule: 30s]
      │
      ▼
[Get Recently Added Tokens (reason: "clanker")]
      │
      ▼
[For Each Token]
      │
      ▼
[Liquidity ≥ $50K AND Holders ≥ 100?]
      │                    │
     YES                   NO
      │                    │
      ▼                 [skip]
[Telegram: "New token: {name} ({symbol})
 Price: ${price} | Liquidity: ${liquidity}
 Address: {address}"]
```

Why this matters: Most new tokens have near-zero liquidity and are untradeable. Filtering by liquidity and holder count eliminates 90% of noise.

### Strategy 2: Momentum Sniper

Buy tokens that show early momentum signals -- price increase with volume to back it up.

```
User: "When a new Bankr token gains 50% in the first hour
       with volume above $100K, buy $200 worth"
```

```
[Schedule: 60s]
      │
      ▼
[Get Recently Added Tokens (reason: "bankr", age < 1 hour)]
      │
      ▼
[For Each Token]
      │
      ▼
[PriceChange1h ≥ 50% AND Volume24h ≥ $100K AND Liquidity ≥ $25K?]
      │                    │
     YES                   NO
      │                    │
      ▼                 [skip]
[Swap $200 USDC → Token]
      │
      ▼
[Set Trailing Stop: 20%]
      │
      ▼
[Telegram: "Sniped {symbol} at ${price}. Trailing stop set."]
```

The trailing stop is critical here. New tokens are volatile -- a 20% trailing stop locks in gains while giving room for upward movement.

### Strategy 3: Liquidity Growth Detector

Some tokens start small but grow steadily. This strategy watches for tokens where liquidity is consistently increasing -- a sign of organic growth rather than a pump.

```
User: "Track new Clanker tokens. If a token's liquidity doubles
       within the first 2 hours, alert me with full market data"
```

```
[Schedule: 5m]
      │
      ▼
[Get Tokens (reason: "clanker", age: 30min-2hr)]
      │
      ▼
[For Each Token]
      │
      ▼
[Current Liquidity ≥ 2x Initial Liquidity?]
      │                    │
     YES                   NO
      │                    │
      ▼                 [skip]
[Get Full Market Data]
      │
      ▼
[AI Analyze: "Is this organic growth or manipulation?"]
      │
      ▼
[Telegram: Formatted report with AI analysis]
```

Adding AI analysis helps filter out wash trading and artificial liquidity inflation.

### Strategy 4: Multi-Source Cross-Reference

The most sophisticated setup. A token launching on both Clanker and Bankr simultaneously (or being traded across both ecosystems) can signal legitimate demand.

```
User: "If a token appears on both Clanker and Bankr within 10 minutes,
       and has volume above $50K, buy $500 and notify me"
```

This uses the `reason` field in the database. Tokens discovered via Clanker are tagged `reason: "clanker"`, and Bankr tokens are tagged `reason: "bankr"`. Cross-referencing is a database query away.

### Strategy 5: Smart DCA on New Launches

Instead of buying once, spread your entry across multiple buys as the token proves itself.

```
User: "When a new token with $100K+ liquidity appears,
       buy $50 every 10 minutes for the next hour.
       Stop if price drops 30% from first buy."
```

```
[New Token Detected (liquidity ≥ $100K)]
      │
      ▼
[Buy $50 (1st entry)]
      │
      ▼
[Loop: every 10min, 5 more times]
      │
      ▼
[Price ≥ 70% of first buy price?]
      │                    │
     YES                   NO
      │                    │
      ▼                    ▼
[Buy $50]           [Stop DCA + Alert]
      │
      ▼
[After 6 buys: Set trailing stop 25%]
```

This limits downside while building a position in tokens that maintain momentum.

---

## Condition Fields for New Tokens

When building strategies around newly discovered tokens, these fields are available:

| Field | Description | Useful For |
|-------|-------------|-----------|
| `price` | Current USD price | Entry/exit triggers |
| `priceChange1h` | 1-hour change (%) | Momentum detection |
| `volume24h` | Trading volume | Confirming interest |
| `liquidity` | Pool liquidity ($) | Safety filtering |
| `holders` | Holder count | Legitimacy check |
| `reason` | Discovery source | Cross-referencing ("clanker", "bankr") |
| `age` | Time since deployment | Freshness filtering |
| `poolType` | V3 or V4 | Technical filtering |

### Recommended Safety Conditions

Always include at minimum:

```
Liquidity ≥ $10K
AND Volume24h ≥ $5K
AND TokenAge ≥ 5 minutes
```

The 5-minute age filter avoids buying into the initial deployment chaos where prices are extremely volatile and sandwich attacks are most common.

For larger positions ($500+), tighten the filters:

```
Liquidity ≥ $100K
AND Holders ≥ 500
AND Volume24h ≥ $50K
AND TokenAge ≥ 30 minutes
```

---

## Natural Language Examples

Here are ready-to-use prompts for your SAM Terminal agent:

**Alert only:**
```
"Notify me on Telegram when any new Clanker token reaches $100K market cap
 within its first hour"
```

**Alert + Analysis:**
```
"When a new Base token launches with more than $50K liquidity,
 analyze it with AI and send me a buy/skip recommendation on Telegram"
```

**Automated trading:**
```
"Automatically buy $100 of any new Bankr token that has:
 - More than $75K liquidity
 - More than 200 holders
 - Positive price movement in first 10 minutes
 Set a 25% trailing stop on every purchase"
```

**Portfolio-aware:**
```
"Track all new Clanker launches. If any token I already hold drops 40%
 from its peak, sell everything and alert me"
```

**Scheduled report:**
```
"Every evening at 8pm, send me a summary of all new tokens discovered today
 with their current price, volume, and price change since launch"
```

---

## Risk Considerations

New token trading carries significant risk. The discovery system gives you speed, but speed without discipline is dangerous.

**What SAM Terminal does to help:**

- Tokens with no activity are automatically cleaned up after 30 minutes
- DexScreener data provides liquidity and volume validation before trades
- The condition engine lets you enforce minimum safety thresholds
- Trailing stops and budget limits prevent unbounded losses
- All swaps require explicit confirmation unless overridden in a workflow

**What you should do:**

- Start with alerts only. Watch the patterns for a week before enabling auto-trading
- Never allocate more than 1-2% of your portfolio to any single new token
- Use trailing stops on every position. New tokens can drop 80% in minutes
- Set daily budget limits. Even with good filters, some trades will lose
- Diversify across multiple small positions rather than concentrating

**What the system won't protect you from:**

- Rug pulls where the deployer removes liquidity
- Tokens that pass all filters but have no real utility
- Smart contract vulnerabilities in the token itself
- Market-wide crashes that affect all tokens simultaneously

---

## Getting Started

If you already have SAM Terminal running:

1. **The discovery pipelines start automatically.** No configuration needed. When the token data service starts, Clanker polling and Bankr listening begin immediately.

2. **Check that tokens are being discovered:**
   ```
   "Show me the most recently tracked tokens"
   ```

3. **Start with a simple alert:**
   ```
   "Alert me when any new token launches with more than $50K liquidity"
   ```

4. **Layer in conditions over time** as you learn what patterns work for your trading style.

5. **Graduate to automated strategies** only after you're confident in your condition design.

The infrastructure is running. The tokens are flowing in. What you build on top of it is up to you.

---

**Related Guides:**

- [Building Trading Agents](/docs/building-trading-agents) -- Order templates, workflow engine, and strategy patterns
- [OpenClaw Trading Automation](/docs/openclaw-trading-automation) -- Natural language trading workflows
- [Getting Started](/docs/getting-started) -- First-time SAM Terminal setup
