/**
 * Flow Execution E2E Tests
 * Tests complete flow execution from start to finish with real API calls
 *
 * Uses Base Mainnet RPC and real API calls
 */


import { createCore, SamTerminalCore, SamTerminalPlugin } from '../index.js';
import type { Flow, FlowNode, FlowEdge, FlowExecutionContext } from '../types/index.js';
import type { Action, ActionResult, ActionContext } from '../interfaces/action.interface.js';
import type { Provider, ProviderResult, ProviderContext } from '../interfaces/provider.interface.js';

// Base Mainnet RPC endpoint
const BASE_RPC_URL = 'https://mainnet.base.org';

// Known addresses for testing
const KNOWN_ADDRESSES = {
  WETH: '0x4200000000000000000000000000000000000006',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

// DexScreener API
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
 * Create blockchain plugin with real RPC calls
 */
function createBlockchainPlugin(): SamTerminalPlugin {
  const getBlockAction: Action = {
    name: '@test/blockchain:getBlock',
    description: 'Get current block number from Base mainnet',
    execute: async (): Promise<ActionResult> => {
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

        const data = (await response.json()) as { result: string };
        const blockNumber = parseInt(data.result, 16);

        return {
          success: true,
          data: { blockNumber, chain: 'base', chainId: 8453 },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get block',
        };
      }
    },
  };

  const getGasAction: Action = {
    name: '@test/blockchain:getGas',
    description: 'Get gas price from Base mainnet',
    execute: async (): Promise<ActionResult> => {
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

        const data = (await response.json()) as { result: string };
        const gasPriceWei = BigInt(data.result);
        const gasPriceGwei = Number(gasPriceWei) / 1e9;

        return {
          success: true,
          data: { gasPriceWei: gasPriceWei.toString(), gasPriceGwei },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get gas',
        };
      }
    },
  };

  const getBalanceAction: Action = {
    name: '@test/blockchain:getBalance',
    description: 'Get balance for an address',
    execute: async (ctx: ActionContext): Promise<ActionResult> => {
      const { address } = ctx.input as { address: string };

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

        const data = (await response.json()) as { result: string };
        const balanceWei = BigInt(data.result);
        const balanceEth = Number(balanceWei) / 1e18;

        return {
          success: true,
          data: { address, balanceWei: balanceWei.toString(), balanceEth },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get balance',
        };
      }
    },
  };

  return {
    name: '@test/blockchain',
    version: '1.0.0',
    description: 'Blockchain plugin for Base mainnet',
    actions: [getBlockAction, getGasAction, getBalanceAction],
    init: async (core: SamTerminalCore) => {
      core.services.registerAction(getBlockAction, '@test/blockchain');
      core.services.registerAction(getGasAction, '@test/blockchain');
      core.services.registerAction(getBalanceAction, '@test/blockchain');
    },
    destroy: async () => {},
  };
}

/**
 * Create DexScreener plugin with real API calls
 */
function createDexScreenerPlugin(): SamTerminalPlugin {
  const getPriceAction: Action = {
    name: '@test/dexscreener:getPrice',
    description: 'Get token price from DexScreener',
    execute: async (ctx: ActionContext): Promise<ActionResult> => {
      const { tokenAddress } = ctx.input as { tokenAddress: string };

      try {
        const url = `${DEXSCREENER_API}/tokens/${tokenAddress}`;
        const data = await fetchJson<{
          pairs?: Array<{
            priceUsd: string;
            baseToken: { symbol: string; name: string };
          }>;
        }>(url);

        if (!data.pairs || data.pairs.length === 0) {
          return {
            success: false,
            error: 'No pairs found',
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
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get price',
        };
      }
    },
  };

  return {
    name: '@test/dexscreener',
    version: '1.0.0',
    description: 'DexScreener plugin',
    actions: [getPriceAction],
    init: async (core: SamTerminalCore) => {
      core.services.registerAction(getPriceAction, '@test/dexscreener');
    },
    destroy: async () => {},
  };
}

/**
 * Create a simple computation plugin
 */
function createComputePlugin(): SamTerminalPlugin {
  const multiplyAction: Action = {
    name: '@test/compute:multiply',
    description: 'Multiply two numbers',
    execute: async (ctx: ActionContext): Promise<ActionResult> => {
      const { a, b } = ctx.input as { a: number; b: number };
      return {
        success: true,
        data: { result: a * b },
      };
    },
  };

  const compareAction: Action = {
    name: '@test/compute:compare',
    description: 'Compare two values',
    execute: async (ctx: ActionContext): Promise<ActionResult> => {
      const { left, right, operator } = ctx.input as {
        left: number;
        right: number;
        operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
      };

      let result: boolean;
      switch (operator) {
        case 'gt':
          result = left > right;
          break;
        case 'lt':
          result = left < right;
          break;
        case 'eq':
          result = left === right;
          break;
        case 'gte':
          result = left >= right;
          break;
        case 'lte':
          result = left <= right;
          break;
        default:
          result = false;
      }

      return {
        success: true,
        data: { result, left, right, operator },
      };
    },
  };

  return {
    name: '@test/compute',
    version: '1.0.0',
    description: 'Computation plugin',
    actions: [multiplyAction, compareAction],
    init: async (core: SamTerminalCore) => {
      core.services.registerAction(multiplyAction, '@test/compute');
      core.services.registerAction(compareAction, '@test/compute');
    },
    destroy: async () => {},
  };
}

describe('Flow Execution E2E Tests', () => {
  let core: SamTerminalCore;

  beforeEach(async () => {
    core = createCore();
  });

  afterEach(async () => {
    if (core) {
      await core.stop();
    }
  });

  describe('Complete Flow from Start to Finish', () => {
    it('should execute simple single-action flow', async () => {
      const blockchainPlugin = createBlockchainPlugin();

      await core.plugins.register(blockchainPlugin);
      await core.initialize();
      await core.start();

      // Create a simple flow with trigger -> action -> output
      const flow = core.flow.create({
        name: 'SimpleBlockFlow',
        description: 'Get block number',
        version: '1.0.0',
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            name: 'Start',
            position: { x: 0, y: 0 },
            data: { triggerType: 'manual' },
          },
          {
            id: 'action-1',
            type: 'action',
            name: 'Get Block',
            position: { x: 200, y: 0 },
            data: {
              pluginName: '@test/blockchain',
              actionName: 'getBlock',
              params: {},
            },
          },
          {
            id: 'output-1',
            type: 'output',
            name: 'Result',
            position: { x: 400, y: 0 },
            data: {},
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'action-1' },
          { id: 'e2', source: 'action-1', target: 'output-1' },
        ],
      });

      const execution = await core.flow.execute(flow.id);

      expect(execution.status).toBe('completed');
      expect(execution.nodeResults['action-1'].status).toBe('completed');

      // Flow engine returns just the data from executeAction
      const actionOutput = execution.nodeResults['action-1'].output as {
        blockNumber: number;
        chain: string;
        chainId: number;
      };
      expect(actionOutput.blockNumber).toBeGreaterThan(10000000);
      expect(actionOutput.chain).toBe('base');
    }, 30000);

    it('should execute flow with real blockchain and DexScreener data', async () => {
      const blockchainPlugin = createBlockchainPlugin();
      const dexPlugin = createDexScreenerPlugin();

      await core.plugins.register(blockchainPlugin);
      await core.plugins.register(dexPlugin);
      await core.initialize();
      await core.start();

      const flow = core.flow.create({
        name: 'BlockchainAndPrice',
        description: 'Get block and token price',
        version: '1.0.0',
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            name: 'Start',
            position: { x: 0, y: 0 },
            data: { triggerType: 'manual' },
          },
          {
            id: 'action-block',
            type: 'action',
            name: 'Get Block',
            position: { x: 200, y: -50 },
            data: {
              pluginName: '@test/blockchain',
              actionName: 'getBlock',
              params: {},
            },
          },
          {
            id: 'action-price',
            type: 'action',
            name: 'Get USDC Price',
            position: { x: 200, y: 50 },
            data: {
              pluginName: '@test/dexscreener',
              actionName: 'getPrice',
              params: { tokenAddress: KNOWN_ADDRESSES.USDC },
            },
          },
          {
            id: 'output-1',
            type: 'output',
            name: 'Result',
            position: { x: 400, y: 0 },
            data: {},
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'action-block' },
          { id: 'e2', source: 'action-block', target: 'action-price' },
          { id: 'e3', source: 'action-price', target: 'output-1' },
        ],
      });

      const execution = await core.flow.execute(flow.id);

      expect(execution.status).toBe('completed');

      // Verify blockchain action (flow engine returns just data)
      const blockOutput = execution.nodeResults['action-block'].output as {
        blockNumber: number;
      };
      expect(blockOutput.blockNumber).toBeGreaterThan(0);

      // Verify price action
      const priceOutput = execution.nodeResults['action-price'].output as {
        priceUsd: number;
      };
      // USDC should be ~$1
      expect(priceOutput.priceUsd).toBeGreaterThan(0.9);
      expect(priceOutput.priceUsd).toBeLessThan(1.1);
    }, 60000);
  });

  describe('Multi-Node Flow Execution', () => {
    it('should execute flow with multiple sequential actions', async () => {
      const blockchainPlugin = createBlockchainPlugin();

      await core.plugins.register(blockchainPlugin);
      await core.initialize();
      await core.start();

      const flow = core.flow.create({
        name: 'MultiActionFlow',
        description: 'Multiple blockchain queries',
        version: '1.0.0',
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            name: 'Start',
            position: { x: 0, y: 0 },
            data: { triggerType: 'manual' },
          },
          {
            id: 'action-block',
            type: 'action',
            name: 'Get Block',
            position: { x: 150, y: 0 },
            data: {
              pluginName: '@test/blockchain',
              actionName: 'getBlock',
              params: {},
            },
          },
          {
            id: 'action-gas',
            type: 'action',
            name: 'Get Gas',
            position: { x: 300, y: 0 },
            data: {
              pluginName: '@test/blockchain',
              actionName: 'getGas',
              params: {},
            },
          },
          {
            id: 'action-balance',
            type: 'action',
            name: 'Get Balance',
            position: { x: 450, y: 0 },
            data: {
              pluginName: '@test/blockchain',
              actionName: 'getBalance',
              params: { address: KNOWN_ADDRESSES.WETH },
            },
          },
          {
            id: 'output-1',
            type: 'output',
            name: 'Result',
            position: { x: 600, y: 0 },
            data: {},
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'action-block' },
          { id: 'e2', source: 'action-block', target: 'action-gas' },
          { id: 'e3', source: 'action-gas', target: 'action-balance' },
          { id: 'e4', source: 'action-balance', target: 'output-1' },
        ],
      });

      const execution = await core.flow.execute(flow.id);

      expect(execution.status).toBe('completed');

      // All actions should complete
      expect(execution.nodeResults['action-block'].status).toBe('completed');
      expect(execution.nodeResults['action-gas'].status).toBe('completed');
      expect(execution.nodeResults['action-balance'].status).toBe('completed');

      // Verify data (flow engine returns just data)
      const blockOutput = execution.nodeResults['action-block'].output as {
        blockNumber: number;
      };
      expect(blockOutput.blockNumber).toBeGreaterThan(0);

      const gasOutput = execution.nodeResults['action-gas'].output as {
        gasPriceGwei: number;
      };
      expect(gasOutput.gasPriceGwei).toBeGreaterThan(0);

      const balanceOutput = execution.nodeResults['action-balance'].output as {
        balanceEth: number;
      };
      expect(balanceOutput.balanceEth).toBeGreaterThanOrEqual(0);
    }, 60000);

    it('should execute flow with condition branching', async () => {
      const computePlugin = createComputePlugin();

      await core.plugins.register(computePlugin);
      await core.initialize();
      await core.start();

      const flow = core.flow.create({
        name: 'ConditionalFlow',
        description: 'Flow with condition',
        version: '1.0.0',
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            name: 'Start',
            position: { x: 0, y: 0 },
            data: { triggerType: 'manual' },
          },
          {
            id: 'condition-1',
            type: 'condition',
            name: 'Check Value',
            position: { x: 200, y: 0 },
            data: {
              conditions: [{ field: 'value', operator: 'gt', value: 50 }],
              operator: 'and',
            },
          },
          {
            id: 'action-high',
            type: 'action',
            name: 'High Value',
            position: { x: 400, y: -50 },
            data: {
              pluginName: '@test/compute',
              actionName: 'multiply',
              params: { a: 10, b: 2 },
            },
          },
          {
            id: 'action-low',
            type: 'action',
            name: 'Low Value',
            position: { x: 400, y: 50 },
            data: {
              pluginName: '@test/compute',
              actionName: 'multiply',
              params: { a: 5, b: 2 },
            },
          },
          {
            id: 'output-1',
            type: 'output',
            name: 'Result',
            position: { x: 600, y: 0 },
            data: {},
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'condition-1' },
          { id: 'e2', source: 'condition-1', target: 'action-high', sourceHandle: 'true' },
          { id: 'e3', source: 'condition-1', target: 'action-low', sourceHandle: 'false' },
          { id: 'e4', source: 'action-high', target: 'output-1' },
          { id: 'e5', source: 'action-low', target: 'output-1' },
        ],
      });

      // Execute with value > 50 (should take high branch)
      const execution1 = await core.flow.execute(flow.id, { value: 75 });
      expect(execution1.status).toBe('completed');
      expect(execution1.nodeResults['action-high']).toBeDefined();
      expect(execution1.nodeResults['action-high'].status).toBe('completed');

      // Create another flow for low value test
      const flow2 = core.flow.create({
        name: 'ConditionalFlow2',
        description: 'Flow with condition (low)',
        version: '1.0.0',
        nodes: flow.nodes,
        edges: flow.edges,
      });

      // Execute with value < 50 (should take low branch)
      const execution2 = await core.flow.execute(flow2.id, { value: 25 });
      expect(execution2.status).toBe('completed');
      expect(execution2.nodeResults['action-low']).toBeDefined();
      expect(execution2.nodeResults['action-low'].status).toBe('completed');
    }, 30000);

    it('should execute flow with loop node', async () => {
      const computePlugin = createComputePlugin();

      await core.plugins.register(computePlugin);
      await core.initialize();
      await core.start();

      const flow = core.flow.create({
        name: 'LoopFlow',
        description: 'Flow with loop',
        version: '1.0.0',
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            name: 'Start',
            position: { x: 0, y: 0 },
            data: { triggerType: 'manual' },
          },
          {
            id: 'loop-1',
            type: 'loop',
            name: 'Count Loop',
            position: { x: 200, y: 0 },
            data: {
              loopType: 'count',
              config: { count: 3 },
            },
          },
          {
            id: 'output-1',
            type: 'output',
            name: 'Result',
            position: { x: 400, y: 0 },
            data: {},
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'loop-1' },
          { id: 'e2', source: 'loop-1', target: 'output-1' },
        ],
      });

      const execution = await core.flow.execute(flow.id);

      expect(execution.status).toBe('completed');
      expect(execution.nodeResults['loop-1'].status).toBe('completed');

      const loopOutput = execution.nodeResults['loop-1'].output as number[];
      expect(loopOutput).toHaveLength(3);
      expect(loopOutput).toEqual([0, 1, 2]);
    }, 30000);

    it('should execute flow with delay node', async () => {
      await core.initialize();
      await core.start();

      const flow = core.flow.create({
        name: 'DelayFlow',
        description: 'Flow with delay',
        version: '1.0.0',
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            name: 'Start',
            position: { x: 0, y: 0 },
            data: { triggerType: 'manual' },
          },
          {
            id: 'delay-1',
            type: 'delay',
            name: 'Wait',
            position: { x: 200, y: 0 },
            data: {
              delayType: 'fixed',
              delayMs: 100, // Short delay for test
            },
          },
          {
            id: 'output-1',
            type: 'output',
            name: 'Result',
            position: { x: 400, y: 0 },
            data: {},
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'delay-1' },
          { id: 'e2', source: 'delay-1', target: 'output-1' },
        ],
      });

      const startTime = Date.now();
      const execution = await core.flow.execute(flow.id);
      const endTime = Date.now();

      expect(execution.status).toBe('completed');
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    }, 30000);
  });

  describe('Flow Error Recovery', () => {
    it('should handle action failure gracefully', async () => {
      // Create plugin with failing action
      const failingPlugin: SamTerminalPlugin = {
        name: '@test/failing',
        version: '1.0.0',
        description: 'Plugin with failing action',
        actions: [
          {
            name: '@test/failing:alwaysFail',
            description: 'Always fails',
            execute: async (): Promise<ActionResult> => {
              throw new Error('Intentional failure');
            },
          },
        ],
        init: async (c: SamTerminalCore) => {
          c.services.registerAction(
            {
              name: '@test/failing:alwaysFail',
              description: 'Always fails',
              execute: async (): Promise<ActionResult> => {
                throw new Error('Intentional failure');
              },
            },
            '@test/failing',
          );
        },
        destroy: async () => {},
      };

      await core.plugins.register(failingPlugin);
      await core.initialize();
      await core.start();

      const flow = core.flow.create({
        name: 'FailingFlow',
        description: 'Flow that fails',
        version: '1.0.0',
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            name: 'Start',
            position: { x: 0, y: 0 },
            data: { triggerType: 'manual' },
          },
          {
            id: 'action-1',
            type: 'action',
            name: 'Failing Action',
            position: { x: 200, y: 0 },
            data: {
              pluginName: '@test/failing',
              actionName: 'alwaysFail',
              params: {},
            },
          },
          {
            id: 'output-1',
            type: 'output',
            name: 'Result',
            position: { x: 400, y: 0 },
            data: {},
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'action-1' },
          { id: 'e2', source: 'action-1', target: 'output-1' },
        ],
      });

      // Flow should throw due to unhandled error
      await expect(core.flow.execute(flow.id)).rejects.toThrow('Intentional failure');
    }, 30000);

    it('should execute error handler edge on failure', async () => {
      let errorHandled = false;

      const failingPlugin: SamTerminalPlugin = {
        name: '@test/failing-handled',
        version: '1.0.0',
        description: 'Plugin with failing action and handler',
        actions: [
          {
            name: '@test/failing-handled:fail',
            description: 'Fails',
            execute: async (): Promise<ActionResult> => {
              throw new Error('Test failure');
            },
          },
          {
            name: '@test/failing-handled:handleError',
            description: 'Handles error',
            execute: async (): Promise<ActionResult> => {
              errorHandled = true;
              return { success: true, data: { handled: true } };
            },
          },
        ],
        init: async (c: SamTerminalCore) => {
          c.services.registerAction(
            {
              name: '@test/failing-handled:fail',
              description: 'Fails',
              execute: async (): Promise<ActionResult> => {
                throw new Error('Test failure');
              },
            },
            '@test/failing-handled',
          );
          c.services.registerAction(
            {
              name: '@test/failing-handled:handleError',
              description: 'Handles error',
              execute: async (): Promise<ActionResult> => {
                errorHandled = true;
                return { success: true, data: { handled: true } };
              },
            },
            '@test/failing-handled',
          );
        },
        destroy: async () => {},
      };

      await core.plugins.register(failingPlugin);
      await core.initialize();
      await core.start();

      const flow = core.flow.create({
        name: 'ErrorHandledFlow',
        description: 'Flow with error handler',
        version: '1.0.0',
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            name: 'Start',
            position: { x: 0, y: 0 },
            data: { triggerType: 'manual' },
          },
          {
            id: 'action-1',
            type: 'action',
            name: 'Failing Action',
            position: { x: 200, y: 0 },
            data: {
              pluginName: '@test/failing-handled',
              actionName: 'fail',
              params: {},
            },
          },
          {
            id: 'error-handler',
            type: 'action',
            name: 'Error Handler',
            position: { x: 200, y: 100 },
            data: {
              pluginName: '@test/failing-handled',
              actionName: 'handleError',
              params: {},
            },
          },
          {
            id: 'output-1',
            type: 'output',
            name: 'Result',
            position: { x: 400, y: 0 },
            data: {},
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'action-1' },
          { id: 'e2', source: 'action-1', target: 'output-1' },
          {
            id: 'e-error',
            source: 'action-1',
            target: 'error-handler',
            sourceHandle: 'error',
            type: 'failure',
          },
          { id: 'e3', source: 'error-handler', target: 'output-1' },
        ],
      });

      const execution = await core.flow.execute(flow.id);

      expect(execution.status).toBe('completed');
      expect(errorHandled).toBe(true);
      expect(execution.nodeResults['error-handler'].status).toBe('completed');
    }, 30000);

    it('should continue flow after recoverable error', async () => {
      let callCount = 0;

      const retryPlugin: SamTerminalPlugin = {
        name: '@test/retry',
        version: '1.0.0',
        description: 'Plugin that succeeds on retry',
        actions: [
          {
            name: '@test/retry:mayFail',
            description: 'Fails first time, succeeds after',
            execute: async (): Promise<ActionResult> => {
              callCount++;
              if (callCount === 1) {
                throw new Error('First call fails');
              }
              return { success: true, data: { callCount } };
            },
          },
        ],
        init: async (c: SamTerminalCore) => {
          c.services.registerAction(
            {
              name: '@test/retry:mayFail',
              description: 'May fail',
              execute: async (): Promise<ActionResult> => {
                callCount++;
                if (callCount === 1) {
                  throw new Error('First call fails');
                }
                return { success: true, data: { callCount } };
              },
            },
            '@test/retry',
          );
        },
        destroy: async () => {},
      };

      await core.plugins.register(retryPlugin);
      await core.initialize();
      await core.start();

      // First flow will fail
      const flow1 = core.flow.create({
        name: 'RetryFlow1',
        version: '1.0.0',
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            name: 'Start',
            position: { x: 0, y: 0 },
            data: { triggerType: 'manual' },
          },
          {
            id: 'action-1',
            type: 'action',
            name: 'May Fail',
            position: { x: 200, y: 0 },
            data: {
              pluginName: '@test/retry',
              actionName: 'mayFail',
              params: {},
            },
          },
          {
            id: 'output-1',
            type: 'output',
            name: 'Result',
            position: { x: 400, y: 0 },
            data: {},
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'action-1' },
          { id: 'e2', source: 'action-1', target: 'output-1' },
        ],
      });

      // First execution fails
      await expect(core.flow.execute(flow1.id)).rejects.toThrow();

      // Second flow should succeed
      const flow2 = core.flow.create({
        name: 'RetryFlow2',
        version: '1.0.0',
        nodes: flow1.nodes,
        edges: flow1.edges,
      });

      const execution2 = await core.flow.execute(flow2.id);
      expect(execution2.status).toBe('completed');
    }, 30000);
  });

  describe('Flow with Real Data Transformations', () => {
    it('should pass data between nodes using variables', async () => {
      const blockchainPlugin = createBlockchainPlugin();

      await core.plugins.register(blockchainPlugin);
      await core.initialize();
      await core.start();

      const flow = core.flow.create({
        name: 'DataTransformFlow',
        description: 'Flow that transforms data',
        version: '1.0.0',
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            name: 'Start',
            position: { x: 0, y: 0 },
            data: { triggerType: 'manual' },
          },
          {
            id: 'action-block',
            type: 'action',
            name: 'Get Block',
            position: { x: 200, y: 0 },
            data: {
              pluginName: '@test/blockchain',
              actionName: 'getBlock',
              params: {},
            },
          },
          {
            id: 'output-1',
            type: 'output',
            name: 'Result',
            position: { x: 400, y: 0 },
            data: {},
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'action-block' },
          { id: 'e2', source: 'action-block', target: 'output-1' },
        ],
      });

      const execution = await core.flow.execute(flow.id, {
        initialValue: 'test',
      });

      expect(execution.status).toBe('completed');
      expect(execution.variables['initialValue']).toBe('test');
      expect(execution.variables['_lastOutput']).toBeDefined();
    }, 30000);
  });
});
