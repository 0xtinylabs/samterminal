/**
 * Agent Lifecycle E2E Tests
 * Tests full agent lifecycle with real blockchain connections
 *
 * Uses Base Mainnet RPC and real API calls
 */


import { createCore, SamTerminalCore, SamTerminalPlugin, Agent, AgentConfig, BASE } from '../index.js';
import type { Action, ActionResult, ActionContext } from '../interfaces/action.interface.js';
import type { Provider, ProviderResult, ProviderContext } from '../interfaces/provider.interface.js';

// Base Mainnet RPC endpoint
const BASE_RPC_URL = 'https://mainnet.base.org';

// Known addresses for testing
const KNOWN_ADDRESSES = {
  WETH: '0x4200000000000000000000000000000000000006',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
};

// DexScreener API (free, no key needed)
const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex';

/**
 * Helper to fetch JSON from URL
 */
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

/**
 * Create a real blockchain plugin for testing
 */
function createBlockchainPlugin(): SamTerminalPlugin {
  const balanceProvider: Provider = {
    name: 'blockchain:balance',
    type: 'wallet',
    description: 'Get native balance from Base mainnet',
    get: async (ctx: ProviderContext): Promise<ProviderResult> => {
      const { address } = ctx.query as { address: string };

      try {
        const response = await fetch(BASE_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getBalance',
            params: [address, 'latest'],
          }),
        });

        const data = await response.json() as { result: string };
        const balanceWei = BigInt(data.result);
        const balanceEth = Number(balanceWei) / 1e18;

        return {
          success: true,
          data: {
            address,
            balanceWei: balanceWei.toString(),
            balanceEth,
            chain: 'base',
            chainId: 8453,
          },
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get balance',
          timestamp: new Date(),
        };
      }
    },
  };

  const blockNumberProvider: Provider = {
    name: 'blockchain:blockNumber',
    type: 'chain',
    description: 'Get current block number from Base mainnet',
    get: async (): Promise<ProviderResult> => {
      try {
        const response = await fetch(BASE_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_blockNumber',
            params: [],
          }),
        });

        const data = await response.json() as { result: string };
        const blockNumber = parseInt(data.result, 16);

        return {
          success: true,
          data: {
            blockNumber,
            chain: 'base',
            chainId: 8453,
          },
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get block number',
          timestamp: new Date(),
        };
      }
    },
  };

  const gasProvider: Provider = {
    name: 'blockchain:gas',
    type: 'chain',
    description: 'Get gas price from Base mainnet',
    get: async (): Promise<ProviderResult> => {
      try {
        const response = await fetch(BASE_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_gasPrice',
            params: [],
          }),
        });

        const data = await response.json() as { result: string };
        const gasPriceWei = BigInt(data.result);
        const gasPriceGwei = Number(gasPriceWei) / 1e9;

        return {
          success: true,
          data: {
            gasPriceWei: gasPriceWei.toString(),
            gasPriceGwei,
            chain: 'base',
            chainId: 8453,
          },
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get gas price',
          timestamp: new Date(),
        };
      }
    },
  };

  return {
    name: '@test/blockchain-plugin',
    version: '1.0.0',
    description: 'Real blockchain interaction plugin for Base mainnet',
    providers: [balanceProvider, blockNumberProvider, gasProvider],
    actions: [],
    init: async (core: SamTerminalCore) => {
      core.services.registerProvider(balanceProvider, '@test/blockchain-plugin');
      core.services.registerProvider(blockNumberProvider, '@test/blockchain-plugin');
      core.services.registerProvider(gasProvider, '@test/blockchain-plugin');
    },
    destroy: async () => {
      // Cleanup
    },
  };
}

/**
 * Create a DexScreener plugin for real token data
 */
function createDexScreenerPlugin(): SamTerminalPlugin {
  const tokenPriceProvider: Provider = {
    name: 'dexscreener:price',
    type: 'token',
    description: 'Get real token price from DexScreener',
    get: async (ctx: ProviderContext): Promise<ProviderResult> => {
      const { tokenAddress, chainId = 'base' } = ctx.query as {
        tokenAddress: string;
        chainId?: string;
      };

      try {
        const url = `${DEXSCREENER_API}/tokens/${tokenAddress}`;
        const data = await fetchJson<{
          pairs?: Array<{
            priceUsd: string;
            priceNative: string;
            baseToken: { symbol: string; name: string };
            volume: { h24: number };
            liquidity: { usd: number };
          }>;
        }>(url);

        if (!data.pairs || data.pairs.length === 0) {
          return {
            success: false,
            error: 'No pairs found for token',
            timestamp: new Date(),
          };
        }

        const pair = data.pairs[0];
        return {
          success: true,
          data: {
            tokenAddress,
            symbol: pair.baseToken.symbol,
            name: pair.baseToken.name,
            priceUsd: parseFloat(pair.priceUsd),
            priceNative: parseFloat(pair.priceNative),
            volume24h: pair.volume.h24,
            liquidity: pair.liquidity.usd,
          },
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get token price',
          timestamp: new Date(),
        };
      }
    },
  };

  const searchAction: Action = {
    name: 'dexscreener:search',
    description: 'Search tokens on DexScreener',
    execute: async (ctx: ActionContext): Promise<ActionResult> => {
      const { query } = ctx.input as { query: string };

      try {
        const url = `${DEXSCREENER_API}/search?q=${encodeURIComponent(query)}`;
        const data = await fetchJson<{
          pairs?: Array<{
            baseToken: { address: string; symbol: string; name: string };
            priceUsd: string;
            chainId: string;
          }>;
        }>(url);

        return {
          success: true,
          data: {
            query,
            results:
              data.pairs?.slice(0, 10).map((p) => ({
                address: p.baseToken.address,
                symbol: p.baseToken.symbol,
                name: p.baseToken.name,
                priceUsd: parseFloat(p.priceUsd),
                chainId: p.chainId,
              })) ?? [],
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Search failed',
        };
      }
    },
  };

  return {
    name: '@test/dexscreener-plugin',
    version: '1.0.0',
    description: 'DexScreener integration for real token data',
    providers: [tokenPriceProvider],
    actions: [searchAction],
    init: async (core: SamTerminalCore) => {
      core.services.registerProvider(tokenPriceProvider, '@test/dexscreener-plugin');
      core.services.registerAction(searchAction, '@test/dexscreener-plugin');
    },
    destroy: async () => {},
  };
}

describe('Agent Lifecycle E2E Tests', () => {
  let core: SamTerminalCore;

  beforeEach(async () => {
    core = createCore();
  });

  afterEach(async () => {
    if (core) {
      await core.stop();
    }
  });

  describe('Agent Creation', () => {
    it('should create SamTerminal core instance', () => {
      expect(core).toBeDefined();
      expect(core.getVersion()).toBe('1.0.0');
    });

    it('should initialize core with plugins', async () => {
      const blockchainPlugin = createBlockchainPlugin();
      const dexPlugin = createDexScreenerPlugin();

      await core.plugins.register(blockchainPlugin);
      await core.plugins.register(dexPlugin);

      await core.initialize();

      expect(core.plugins.has('@test/blockchain-plugin')).toBe(true);
      expect(core.plugins.has('@test/dexscreener-plugin')).toBe(true);
    });

    it('should create agent with configuration', async () => {
      await core.initialize();
      await core.start();

      const agentConfig: AgentConfig = {
        name: 'TestAgent',
        description: 'E2E test agent for Base mainnet',
        plugins: [],
        chains: [8453], // Base mainnet
      };

      const agent = await core.createAgent(agentConfig);

      expect(agent).toBeDefined();
      expect(agent.name).toBe('TestAgent');
      expect(agent.id).toBeDefined();
      expect(agent.status).toBe('idle');
    });
  });

  describe('Agent Initialization', () => {
    it('should initialize agent with blockchain plugin', async () => {
      const blockchainPlugin = createBlockchainPlugin();

      await core.plugins.register(blockchainPlugin);
      await core.initialize();
      await core.start();

      // Verify plugin is active and services are registered
      expect(core.plugins.has('@test/blockchain-plugin')).toBe(true);

      // Create agent
      const agent = await core.createAgent({
        name: 'BlockchainAgent',
        description: 'Agent with blockchain capabilities',
      });

      expect(agent).toBeDefined();
      expect(agent.createdAt).toBeInstanceOf(Date);
    });

    it('should initialize agent with multiple plugins', async () => {
      const blockchainPlugin = createBlockchainPlugin();
      const dexPlugin = createDexScreenerPlugin();

      await core.plugins.register(blockchainPlugin);
      await core.plugins.register(dexPlugin);
      await core.initialize();
      await core.start();

      const allPlugins = core.plugins.getAll();
      expect(allPlugins.length).toBe(2);

      const agent = await core.createAgent({
        name: 'MultiPluginAgent',
        description: 'Agent with multiple plugins',
      });

      expect(agent).toBeDefined();
    });

    it('should register Base chain configuration', async () => {
      await core.initialize();

      core.chains.register(BASE);

      const baseChain = core.chains.get(8453);
      expect(baseChain).toBeDefined();
      expect(baseChain?.name).toBe('Base');
      expect(baseChain?.rpcUrls).toContain('https://mainnet.base.org');
    });
  });

  describe('Agent Execution', () => {
    it('should execute blockchain provider - get block number', async () => {
      const blockchainPlugin = createBlockchainPlugin();

      await core.plugins.register(blockchainPlugin);
      await core.initialize();
      await core.start();

      await core.createAgent({ name: 'BlockchainAgent' });

      const result = await core.runtime.getData('blockchain:blockNumber', {});
      const data = result as { blockNumber: number; chain: string };

      expect(data.blockNumber).toBeGreaterThan(0);
      expect(data.chain).toBe('base');
      expect(data.blockNumber).toBeGreaterThan(10000000); // Base has many blocks
    }, 30000); // 30s timeout for real API call

    it('should execute blockchain provider - get gas price', async () => {
      const blockchainPlugin = createBlockchainPlugin();

      await core.plugins.register(blockchainPlugin);
      await core.initialize();
      await core.start();

      await core.createAgent({ name: 'GasAgent' });

      const result = await core.runtime.getData('blockchain:gas', {});
      const data = result as { gasPriceGwei: number };

      expect(data.gasPriceGwei).toBeGreaterThan(0);
      expect(data.gasPriceGwei).toBeLessThan(1000); // Reasonable gas price
    }, 30000);

    it('should execute blockchain provider - get balance of known address', async () => {
      const blockchainPlugin = createBlockchainPlugin();

      await core.plugins.register(blockchainPlugin);
      await core.initialize();
      await core.start();

      await core.createAgent({ name: 'BalanceAgent' });

      // Check WETH contract balance (should have some ETH)
      const result = await core.runtime.getData('blockchain:balance', {
        address: KNOWN_ADDRESSES.WETH,
      });
      const data = result as { balanceEth: number; address: string };

      expect(data.address).toBe(KNOWN_ADDRESSES.WETH);
      expect(data.balanceEth).toBeGreaterThanOrEqual(0);
    }, 30000);

    it('should execute DexScreener provider - get token price', async () => {
      const dexPlugin = createDexScreenerPlugin();

      await core.plugins.register(dexPlugin);
      await core.initialize();
      await core.start();

      await core.createAgent({ name: 'PriceAgent' });

      // Get USDC price on Base
      const result = await core.runtime.getData('dexscreener:price', {
        tokenAddress: KNOWN_ADDRESSES.USDC,
      });
      const data = result as { symbol: string; priceUsd: number };

      // USDC should be ~$1
      expect(data.priceUsd).toBeGreaterThan(0.9);
      expect(data.priceUsd).toBeLessThan(1.1);
    }, 30000);

    it('should execute DexScreener action - search tokens', async () => {
      const dexPlugin = createDexScreenerPlugin();

      await core.plugins.register(dexPlugin);
      await core.initialize();
      await core.start();

      await core.createAgent({ name: 'SearchAgent' });

      const result = await core.runtime.executeAction('dexscreener:search', {
        query: 'ETH',
      });
      const data = result as { results: Array<{ symbol: string }> };

      expect(data.results.length).toBeGreaterThan(0);
    }, 30000);

    it('should execute multiple providers in sequence', async () => {
      const blockchainPlugin = createBlockchainPlugin();
      const dexPlugin = createDexScreenerPlugin();

      await core.plugins.register(blockchainPlugin);
      await core.plugins.register(dexPlugin);
      await core.initialize();
      await core.start();

      await core.createAgent({ name: 'MultiExecAgent' });

      // Get block number
      const blockResult = await core.runtime.getData('blockchain:blockNumber', {});
      const blockData = blockResult as { blockNumber: number };

      // Get gas price
      const gasResult = await core.runtime.getData('blockchain:gas', {});
      const gasData = gasResult as { gasPriceGwei: number };

      // Get token price
      const priceResult = await core.runtime.getData('dexscreener:price', {
        tokenAddress: KNOWN_ADDRESSES.USDC,
      });
      const priceData = priceResult as { priceUsd: number };

      expect(blockData.blockNumber).toBeGreaterThan(0);
      expect(gasData.gasPriceGwei).toBeGreaterThan(0);
      expect(priceData.priceUsd).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Agent Shutdown', () => {
    it('should shutdown agent and core gracefully', async () => {
      const blockchainPlugin = createBlockchainPlugin();

      await core.plugins.register(blockchainPlugin);
      await core.initialize();
      await core.start();

      const agent = await core.createAgent({ name: 'ShutdownAgent' });
      expect(agent).toBeDefined();

      // Stop core - should cleanup everything
      await core.stop();

      // Core should be stopped (can't execute actions anymore)
      // Reinitializing would be needed
    });

    it('should cleanup plugin resources on shutdown', async () => {
      const destroyCalled = { value: false };

      const testPlugin: SamTerminalPlugin = {
        name: '@test/cleanup-plugin',
        version: '1.0.0',
        description: 'Plugin that tracks cleanup',
        init: async () => {},
        destroy: async () => {
          destroyCalled.value = true;
        },
      };

      await core.plugins.register(testPlugin);
      await core.initialize();
      await core.start();

      await core.createAgent({ name: 'CleanupAgent' });

      await core.stop();

      expect(destroyCalled.value).toBe(true);
    });

    it('should handle multiple shutdown calls gracefully', async () => {
      await core.initialize();
      await core.start();

      await core.createAgent({ name: 'MultiShutdownAgent' });

      await core.stop();
      await core.stop(); // Should not throw

      // Second stop should be safe
    });
  });

  describe('Full Agent Lifecycle', () => {
    it('should complete full lifecycle: create -> init -> execute -> shutdown', async () => {
      const lifecycleEvents: string[] = [];

      const lifecyclePlugin: SamTerminalPlugin = {
        name: '@test/lifecycle-plugin',
        version: '1.0.0',
        description: 'Tracks lifecycle events',
        providers: [
          {
            name: 'lifecycle:status',
            type: 'custom',
            get: async () => ({
              success: true,
              data: { events: lifecycleEvents },
              timestamp: new Date(),
            }),
          },
        ],
        init: async (core: SamTerminalCore) => {
          lifecycleEvents.push('plugin:init');
          core.services.registerProvider(
            {
              name: 'lifecycle:status',
              type: 'custom',
              get: async () => ({
                success: true,
                data: { events: lifecycleEvents },
                timestamp: new Date(),
              }),
            },
            '@test/lifecycle-plugin',
          );
        },
        destroy: async () => {
          lifecycleEvents.push('plugin:destroy');
        },
      };

      const blockchainPlugin = createBlockchainPlugin();

      // 1. Create core
      lifecycleEvents.push('core:create');

      // 2. Register plugins
      await core.plugins.register(lifecyclePlugin);
      await core.plugins.register(blockchainPlugin);
      lifecycleEvents.push('plugins:registered');

      // 3. Initialize
      await core.initialize();
      lifecycleEvents.push('core:initialized');

      // 4. Start
      await core.start();
      lifecycleEvents.push('core:started');

      // 5. Create agent
      const agent = await core.createAgent({
        name: 'FullLifecycleAgent',
        description: 'Tests complete lifecycle',
      });
      lifecycleEvents.push('agent:created');

      // 6. Execute - get real blockchain data
      const blockResult = await core.runtime.getData('blockchain:blockNumber', {});
      const blockData = blockResult as { blockNumber: number };
      expect(blockData.blockNumber).toBeGreaterThan(0);
      lifecycleEvents.push('action:executed');

      // 7. Shutdown
      await core.stop();
      lifecycleEvents.push('core:stopped');

      // Verify lifecycle
      expect(lifecycleEvents).toContain('core:create');
      expect(lifecycleEvents).toContain('plugins:registered');
      expect(lifecycleEvents).toContain('plugin:init');
      expect(lifecycleEvents).toContain('core:initialized');
      expect(lifecycleEvents).toContain('core:started');
      expect(lifecycleEvents).toContain('agent:created');
      expect(lifecycleEvents).toContain('action:executed');
      expect(lifecycleEvents).toContain('plugin:destroy');
      expect(lifecycleEvents).toContain('core:stopped');
    }, 60000);
  });
});
