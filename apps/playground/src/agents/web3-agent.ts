/**
 * Web3 Agent Example
 *
 * This example demonstrates Web3 capabilities:
 * - Token data fetching
 * - Wallet tracking
 * - Swap functionality
 */

import { createCore, type AgentConfig } from '@samterminal/core';
import { TokenDataPlugin } from '@samterminal/plugin-tokendata';
import { WalletDataPlugin } from '@samterminal/plugin-walletdata';
import { SwapPlugin } from '@samterminal/plugin-swap';

// Example token addresses on Base
const EXAMPLE_TOKENS = {
  WETH: '0x4200000000000000000000000000000000000006',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  AERO: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
};

// Example wallet addresses
const EXAMPLE_WALLETS = [
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0Ab1D',
  '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
];

async function main() {
  console.log('=== SamTerminal Web3 Agent Example ===\n');

  // Create core
  const core = createCore({
    logLevel: 'info',
  });

  // Register token data plugin
  console.log('Registering TokenData plugin...');
  const tokenDataPlugin = new TokenDataPlugin();
  await core.plugins.register(tokenDataPlugin, {
    primarySource: 'dexscreener',
    fallbackSource: 'coingecko',
    cacheTtl: 30000, // 30 seconds
    chains: ['base', 'ethereum', 'arbitrum'],
  });

  // Register wallet data plugin
  console.log('Registering WalletData plugin...');
  const walletDataPlugin = new WalletDataPlugin();
  await core.plugins.register(walletDataPlugin, {
    defaultChain: 'base',
    rpcUrls: {
      base: process.env.RPC_URL_BASE ?? 'https://mainnet.base.org',
      ethereum: process.env.RPC_URL_ETHEREUM ?? 'https://eth.llamarpc.com',
    },
  });

  // Register swap plugin
  console.log('Registering Swap plugin...');
  const swapPlugin = new SwapPlugin();
  await core.plugins.register(swapPlugin, {
    defaultSlippage: 0.5,
    maxSlippage: 5,
    routers: {
      base: ['aerodrome', 'uniswap-v3'],
    },
  });

  // Initialize and start
  await core.initialize();
  await core.start();

  // Create agent
  const agentConfig: AgentConfig = {
    name: 'web3-agent',
    description: 'Web3 data and trading agent',
    plugins: ['tokendata', 'walletdata', 'swap'],
  };

  const agent = await core.createAgent(agentConfig);
  console.log(`\nAgent "${agent.name}" initialized!\n`);

  // Demo: Fetch token data using providers
  console.log('--- Token Data Demo ---\n');

  const tokenProvider = core.services.getProvider('tokendata:price');

  for (const [symbol, address] of Object.entries(EXAMPLE_TOKENS)) {
    try {
      console.log(`Fetching ${symbol} data...`);
      const tokenData = await core.runtime.getData('tokendata:price', {
        address,
        chainId: 'base',
      }) as { priceUsd?: number; priceChange24h?: number } | null;

      if (tokenData) {
        console.log(`  Price: $${tokenData.priceUsd?.toFixed(6) ?? 'N/A'}`);
        console.log(`  24h Change: ${tokenData.priceChange24h?.toFixed(2) ?? 'N/A'}%`);
        console.log('');
      }
    } catch (error) {
      console.log(`  Error fetching ${symbol}: ${(error as Error).message}\n`);
    }
  }

  // Demo: Wallet data
  console.log('--- Wallet Data Demo ---\n');

  for (const address of EXAMPLE_WALLETS) {
    try {
      console.log(`Fetching wallet ${address.slice(0, 10)}...`);
      const balance = await core.runtime.getData('walletdata:balance', {
        address,
        chain: 'base',
      }) as { native: string; tokens?: unknown[] };

      console.log(`  ETH Balance: ${balance.native} ETH`);
      console.log(`  Token Count: ${balance.tokens?.length ?? 0}`);
      console.log('');
    } catch (error) {
      console.log(`  Error: ${(error as Error).message}\n`);
    }
  }

  // Demo: Swap quote (read-only)
  console.log('--- Swap Quote Demo ---\n');

  try {
    console.log('Getting swap quote: 1 WETH -> USDC on Base...');
    const quote = await core.runtime.getData('swap:quote', {
      fromToken: EXAMPLE_TOKENS.WETH,
      toToken: EXAMPLE_TOKENS.USDC,
      amount: '1000000000000000000', // 1 ETH in wei
      chain: 'base',
      slippage: 0.5,
    }) as { router: string; expectedOutput: string; priceImpact: string; gasEstimate: string };

    console.log(`  Router: ${quote.router}`);
    console.log(`  Expected Output: ${quote.expectedOutput} USDC`);
    console.log(`  Price Impact: ${quote.priceImpact}%`);
    console.log(`  Gas Estimate: ${quote.gasEstimate}`);
    console.log('');
  } catch (error) {
    console.log(`  Error: ${(error as Error).message}\n`);
  }

  // Demo: Event-based price monitoring
  console.log('--- Price Monitoring Demo ---\n');
  console.log('Monitoring WETH price for 30 seconds...\n');

  const priceCheckInterval = setInterval(async () => {
    try {
      const tokenData = await core.runtime.getData('tokendata:price', {
        address: EXAMPLE_TOKENS.WETH,
        chainId: 'base',
      }) as { priceUsd?: number } | null;

      if (tokenData?.priceUsd) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] WETH: $${tokenData.priceUsd.toFixed(2)}`);
      }
    } catch (_error) {
      // Silently ignore errors during monitoring
    }
  }, 10000); // Check every 10 seconds

  // Stop monitoring after 30 seconds
  setTimeout(async () => {
    clearInterval(priceCheckInterval);
    console.log('\n--- Demo Complete ---\n');

    await core.stop();
    console.log('Agent stopped. Goodbye!');
    process.exit(0);
  }, 30000);

  // Handle Ctrl+C
  process.on('SIGINT', async () => {
    clearInterval(priceCheckInterval);
    console.log('\nStopping...');
    await core.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
