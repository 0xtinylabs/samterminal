/**
 * Token Tracker Example
 *
 * Demonstrates real-time token price monitoring with alerts
 * using the tokendata plugin.
 */

import { createCore } from '@samterminal/core';
import { TokenDataPlugin } from '@samterminal/plugin-tokendata';

// Tokens to track (Base chain)
const TRACKED_TOKENS = [
  {
    symbol: 'WETH',
    address: '0x4200000000000000000000000000000000000006',
    alertThreshold: 0.5, // Alert on 0.5% change
  },
  {
    symbol: 'USDC',
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    alertThreshold: 0.1, // Stablecoins need tighter thresholds
  },
  {
    symbol: 'AERO',
    address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
    alertThreshold: 2, // More volatile token
  },
];

interface TokenPrice {
  symbol: string;
  price: number;
  timestamp: Date;
}

async function main() {
  console.log('=== SamTerminal Token Tracker Example ===\n');

  const core = createCore({ logLevel: 'warn' });

  const tokenDataPlugin = new TokenDataPlugin();
  await core.plugins.register(tokenDataPlugin, {
    primarySource: 'dexscreener',
    cacheTtl: 15000, // 15 second cache
    chains: ['base'],
  });

  await core.initialize();
  await core.start();

  // Price history for each token
  const priceHistory: Map<string, TokenPrice[]> = new Map();
  const lastPrices: Map<string, number> = new Map();

  // Initialize price history
  TRACKED_TOKENS.forEach((token) => {
    priceHistory.set(token.symbol, []);
  });

  console.log('Tracking tokens on Base:');
  TRACKED_TOKENS.forEach((token) => {
    console.log(`  - ${token.symbol} (alert: ${token.alertThreshold}% change)`);
  });
  console.log('\nFetching initial prices...\n');
  console.log('─'.repeat(60));

  // Fetch initial prices using provider
  for (const token of TRACKED_TOKENS) {
    try {
      const data = await core.runtime.getData('tokendata:price', {
        address: token.address,
        chainId: 'base',
      }) as { priceUsd?: number } | null;

      if (data?.priceUsd) {
        lastPrices.set(token.symbol, data.priceUsd);
        priceHistory.get(token.symbol)?.push({
          symbol: token.symbol,
          price: data.priceUsd,
          timestamp: new Date(),
        });
        console.log(`${token.symbol}: $${data.priceUsd.toFixed(6)}`);
      }
    } catch (_error) {
      console.log(`${token.symbol}: Failed to fetch`);
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log('\nMonitoring prices (updates every 30 seconds)...');
  console.log('Press Ctrl+C to stop and see summary.\n');

  // Price monitoring loop
  const updateInterval = setInterval(async () => {
    const timestamp = new Date().toLocaleTimeString();
    let hasAlert = false;

    for (const token of TRACKED_TOKENS) {
      try {
        const data = await core.runtime.getData('tokendata:price', {
          address: token.address,
          chainId: 'base',
        }) as { priceUsd?: number } | null;

        if (data?.priceUsd) {
          const currentPrice = data.priceUsd;
          const lastPrice = lastPrices.get(token.symbol);

          // Calculate change
          let changePercent = 0;
          if (lastPrice) {
            changePercent = ((currentPrice - lastPrice) / lastPrice) * 100;
          }

          // Store price
          lastPrices.set(token.symbol, currentPrice);
          priceHistory.get(token.symbol)?.push({
            symbol: token.symbol,
            price: currentPrice,
            timestamp: new Date(),
          });

          // Check for alerts
          if (Math.abs(changePercent) >= token.alertThreshold) {
            hasAlert = true;
            const direction = changePercent > 0 ? '↑' : '↓';
            const alertType = changePercent > 0 ? 'PUMP' : 'DUMP';
            console.log(
              `[${timestamp}] 🚨 ${alertType} ALERT: ${token.symbol} ${direction} ${Math.abs(changePercent).toFixed(2)}% → $${currentPrice.toFixed(6)}`
            );
          }
        }
      } catch (_error) {
        // Silently ignore fetch errors during monitoring
      }
    }

    // Regular status update if no alerts
    if (!hasAlert) {
      const prices = TRACKED_TOKENS.map((token) => {
        const price = lastPrices.get(token.symbol);
        return `${token.symbol}: $${price?.toFixed(4) ?? 'N/A'}`;
      }).join(' | ');
      console.log(`[${timestamp}] ${prices}`);
    }
  }, 30000); // Update every 30 seconds

  // Handle shutdown
  const shutdown = async () => {
    clearInterval(updateInterval);

    console.log('\n\n' + '═'.repeat(60));
    console.log('                    SESSION SUMMARY');
    console.log('═'.repeat(60));

    for (const token of TRACKED_TOKENS) {
      const history = priceHistory.get(token.symbol) ?? [];

      if (history.length > 0) {
        const prices = history.map((h) => h.price);
        const high = Math.max(...prices);
        const low = Math.min(...prices);
        const first = history[0].price;
        const last = history[history.length - 1].price;
        const change = ((last - first) / first) * 100;

        console.log(`\n${token.symbol}:`);
        console.log(`  First: $${first.toFixed(6)}`);
        console.log(`  Last:  $${last.toFixed(6)}`);
        console.log(`  High:  $${high.toFixed(6)}`);
        console.log(`  Low:   $${low.toFixed(6)}`);
        console.log(`  Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`);
        console.log(`  Samples: ${history.length}`);
      }
    }

    console.log('\n' + '═'.repeat(60));

    await core.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
