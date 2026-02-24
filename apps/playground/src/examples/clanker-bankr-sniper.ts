/**
 * Clanker & Bankr Token Sniper
 *
 * Monitors newly discovered Clanker and Bankr tokens from the tokendata service.
 * When a token's market cap exceeds $50k, triggers a conditional-buy order.
 *
 * Flow per token:
 *   1. Token discovered via tokendata HTTP endpoint (reason=clanker|bankr)
 *   2. OrderTemplates creates a conditional-buy order with mcap > 50k condition
 *   3. FlowGenerator converts order → Flow DAG (Trigger → GetData → Condition → Swap → Notify)
 *   4. Periodic evaluation checks mcap condition
 *   5. When met → execute swap (dry run mode by default)
 *
 * Usage:
 *   cd apps/playground && pnpm tsx src/examples/clanker-bankr-sniper.ts
 */

import {
  FlowGenerator,
  ConditionEvaluator,
  type TokenDataSnapshot,
  type ConditionalBuyParams,
} from '@samterminal/core';

// ============================================================
// Configuration
// ============================================================

const CONFIG = {
  /** Minimum market cap to trigger buy ($) */
  minMcap: 50_000,
  /** Amount of USDC to spend per buy ($) */
  spendAmountUSDC: 10,
  /** USDC address on Base */
  usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  /** Tokendata HTTP endpoint */
  tokendataUrl: 'http://localhost:8081/tokens',
  /** Poll interval for new tokens (ms) */
  pollInterval: 10_000,
  /** Condition check interval (ms) */
  checkInterval: 15_000,
  /** Max tokens to track simultaneously */
  maxTrackedTokens: 50,
  /** Token sources to watch */
  sources: ['clanker', 'bankr'] as string[],
  /** Chain */
  chainId: 'base',
  /** Dry run mode */
  dryRun: true,
};

// ============================================================
// Types
// ============================================================

interface TokenInfo {
  name: string;
  symbol: string;
  address: string;
  reason: string;
  price: string;
  poolAddress?: string;
  pairAddress?: string;
}

interface TrackedToken {
  token: TokenInfo;
  orderId: string;
  flowId: string;
  status: 'watching' | 'triggered' | 'executed' | 'failed';
  discoveredAt: Date;
  lastMcap: number;
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║       Clanker & Bankr Token Sniper              ║');
  console.log('║       SAM Terminal - Condition-Based Workflow    ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log();
  console.log(`  Min Mcap:     $${CONFIG.minMcap.toLocaleString()}`);
  console.log(`  Spend/Buy:    $${CONFIG.spendAmountUSDC} USDC`);
  console.log(`  Sources:      ${CONFIG.sources.join(', ')}`);
  console.log(`  Dry Run:      ${CONFIG.dryRun ? 'YES (no real swaps)' : 'NO (live trading!)'}`);
  console.log(`  Poll:         ${CONFIG.pollInterval / 1000}s`);
  console.log();

  // Initialize order system (standalone, no core dependency)
  const flowGenerator = new FlowGenerator({
    defaultCheckInterval: CONFIG.checkInterval,
    defaultReceiveToken: 'USDC',
    defaultChainId: CONFIG.chainId,
  });

  const conditionEvaluator = new ConditionEvaluator({
    collectDetails: true,
  });

  // State
  const knownAddresses = new Set<string>();
  const trackedTokens = new Map<string, TrackedToken>();
  let totalDiscovered = 0;
  let totalOrdersCreated = 0;
  let totalTriggered = 0;

  // ============================================================
  // Token Discovery
  // ============================================================
  async function pollNewTokens() {
    try {
      const response = await fetch(CONFIG.tokendataUrl);
      const data = (await response.json()) as { tokens: TokenInfo[] };
      const tokens = data.tokens ?? [];

      for (const token of tokens) {
        if (knownAddresses.has(token.address)) continue;
        knownAddresses.add(token.address);
        if (!CONFIG.sources.includes(token.reason)) continue;
        if (trackedTokens.size >= CONFIG.maxTrackedTokens) continue;

        totalDiscovered++;

        console.log(
          `[DISCOVERED] ${token.reason.toUpperCase().padEnd(7)} | ${token.symbol.padEnd(20)} | ${token.address.slice(0, 10)}...`,
        );

        // Create conditional-buy order
        const orderId = `snipe-${token.reason}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        try {
          // Generate flow from order using FlowGenerator
          const flow = flowGenerator.generate({
            id: orderId,
            type: 'conditional-buy',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            params: {
              token: token.address,
              buyToken: token.address,
              sellToken: CONFIG.usdcAddress,
              chainId: CONFIG.chainId,
              spendAmount: CONFIG.spendAmountUSDC,
              conditions: {
                operator: 'AND',
                conditions: [
                  { field: 'mcap', operator: 'gt', value: CONFIG.minMcap },
                ],
              },
            } as ConditionalBuyParams,
          });

          totalOrdersCreated++;

          trackedTokens.set(token.address, {
            token,
            orderId,
            flowId: flow.id,
            status: 'watching',
            discoveredAt: new Date(),
            lastMcap: 0,
          });

          console.log(
            `           → Order created: mcap > $${CONFIG.minMcap.toLocaleString()} → buy $${CONFIG.spendAmountUSDC} USDC`,
          );
          console.log(
            `           → Flow: ${flow.nodes.length} nodes, ${flow.edges.length} edges`,
          );
        } catch (err) {
          console.error(`           → Error: ${(err as Error).message}`);
        }
      }
    } catch (_err) {
      // Silently retry
    }
  }

  // ============================================================
  // Condition Evaluation (simulated market data from DexScreener)
  // ============================================================
  async function evaluateConditions() {
    const watchingTokens = [...trackedTokens.entries()].filter(([, t]) => t.status === 'watching');
    if (watchingTokens.length === 0) return;

    // Batch fetch market data from DexScreener
    const addresses = watchingTokens.map(([addr]) => addr);

    for (const [address, tracked] of watchingTokens) {
      try {
        // Fetch from DexScreener directly
        const resp = await fetch(
          `https://api.dexscreener.com/token-pairs/v1/base/${address}`,
          { signal: AbortSignal.timeout(5000) },
        );

        if (!resp.ok) continue;

        const pairs = (await resp.json()) as Array<{
          priceUsd?: string;
          marketCap?: number;
          fdv?: number;
          volume?: { h24?: number };
          liquidity?: { usd?: number };
        }>;

        if (!pairs || pairs.length === 0) continue;

        const pair = pairs[0];
        const mcap = pair.marketCap ?? pair.fdv ?? 0;
        const price = parseFloat(pair.priceUsd ?? '0');
        const volume = pair.volume?.h24 ?? 0;
        const liquidity = pair.liquidity?.usd ?? 0;

        tracked.lastMcap = mcap;

        // Build token data snapshot for condition evaluation
        const snapshot: TokenDataSnapshot = {
          price,
          mcap,
          fdv: pair.fdv ?? 0,
          volume24h: volume,
          liquidity,
        };

        // Evaluate condition using ConditionEvaluator
        const result = conditionEvaluator.evaluate(
          {
            operator: 'AND',
            conditions: [
              { field: 'mcap', operator: 'gt', value: CONFIG.minMcap },
            ],
          },
          snapshot,
          address,
        );

        if (result.met) {
          tracked.status = 'triggered';
          totalTriggered++;

          console.log();
          console.log(`  ┌─────────────────────────────────────────────────────────┐`);
          console.log(`  │  CONDITION MET                                          │`);
          console.log(`  │  Token:   ${(tracked.token.symbol + ' (' + tracked.token.name + ')').padEnd(46)} │`);
          console.log(`  │  Source:  ${tracked.token.reason.toUpperCase().padEnd(46)} │`);
          console.log(`  │  Mcap:   $${mcap.toLocaleString().padEnd(45)} │`);
          console.log(`  │  Price:  $${price.toFixed(8).padEnd(45)} │`);
          console.log(`  │  Volume: $${volume.toLocaleString().padEnd(45)} │`);
          console.log(`  │  Liq:    $${liquidity.toLocaleString().padEnd(45)} │`);
          console.log(`  └─────────────────────────────────────────────────────────┘`);

          if (CONFIG.dryRun) {
            console.log(`  [DRY RUN] Would swap: $${CONFIG.spendAmountUSDC} USDC → ${tracked.token.symbol}`);
            console.log(`  [DRY RUN] Token: ${address}`);
            tracked.status = 'executed';
          } else {
            console.log(`  [LIVE] Executing swap: $${CONFIG.spendAmountUSDC} USDC → ${tracked.token.symbol}...`);
            // In live mode, this would call the swap service via gRPC
            tracked.status = 'executed';
          }
          console.log();
        }
      } catch (_err) {
        // Skip on errors (rate limiting, network, etc.)
      }

      // Small delay between DexScreener requests to avoid rate limiting
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  // ============================================================
  // Status Display
  // ============================================================
  function printStatus() {
    const watching = [...trackedTokens.values()].filter((t) => t.status === 'watching').length;
    const triggered = [...trackedTokens.values()].filter(
      (t) => t.status === 'triggered' || t.status === 'executed',
    ).length;
    const time = new Date().toLocaleTimeString();

    // Show top mcap tokens
    const topTokens = [...trackedTokens.values()]
      .filter((t) => t.lastMcap > 0)
      .sort((a, b) => b.lastMcap - a.lastMcap)
      .slice(0, 5);

    console.log(
      `[${time}] Discovered: ${totalDiscovered} | Orders: ${totalOrdersCreated} | Watching: ${watching} | Triggered: ${triggered}`,
    );

    if (topTokens.length > 0) {
      console.log(`  Top mcap: ${topTokens.map((t) => `${t.token.symbol}=$${(t.lastMcap / 1000).toFixed(1)}k`).join(', ')}`);
    }
  }

  // ============================================================
  // Start
  // ============================================================
  await pollNewTokens();

  const discoveryTimer = setInterval(pollNewTokens, CONFIG.pollInterval);
  const evalTimer = setInterval(evaluateConditions, CONFIG.checkInterval);
  const statusTimer = setInterval(printStatus, 30_000);

  // First evaluation after 5s
  setTimeout(evaluateConditions, 5000);

  console.log();
  console.log('Sniper active. Watching for new tokens...');
  console.log('Press Ctrl+C to stop.');
  console.log();

  // Graceful shutdown
  const shutdown = async () => {
    clearInterval(discoveryTimer);
    clearInterval(evalTimer);
    clearInterval(statusTimer);

    console.log();
    console.log('═'.repeat(60));
    console.log('                    SESSION SUMMARY');
    console.log('═'.repeat(60));
    console.log(`  Total Discovered:     ${totalDiscovered}`);
    console.log(`  Orders Created:       ${totalOrdersCreated}`);
    console.log(`  Conditions Triggered: ${totalTriggered}`);
    console.log();

    const triggeredTokens = [...trackedTokens.values()].filter(
      (t) => t.status === 'triggered' || t.status === 'executed',
    );

    if (triggeredTokens.length > 0) {
      console.log('  Triggered Tokens (mcap > $50k):');
      for (const t of triggeredTokens) {
        console.log(
          `    ${t.token.reason.toUpperCase().padEnd(7)} | ${t.token.symbol.padEnd(15)} | mcap: $${t.lastMcap.toLocaleString()} | ${t.status}`,
        );
      }
    } else {
      console.log('  No tokens reached $50k mcap threshold.');
    }

    // Show all tokens with their mcap
    const allWithMcap = [...trackedTokens.values()]
      .filter((t) => t.lastMcap > 0)
      .sort((a, b) => b.lastMcap - a.lastMcap);

    if (allWithMcap.length > 0) {
      console.log();
      console.log(`  All tokens with market data (${allWithMcap.length}):`);
      for (const t of allWithMcap.slice(0, 20)) {
        const mcapStr = t.lastMcap >= 1000 ? `$${(t.lastMcap / 1000).toFixed(1)}k` : `$${t.lastMcap.toFixed(0)}`;
        const statusIcon = t.lastMcap > CONFIG.minMcap ? '>' : ' ';
        console.log(
          `    ${statusIcon} ${t.token.reason.toUpperCase().padEnd(7)} | ${t.token.symbol.padEnd(15)} | mcap: ${mcapStr.padEnd(10)} | ${t.token.address.slice(0, 10)}...`,
        );
      }
    }

    console.log('═'.repeat(60));
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
