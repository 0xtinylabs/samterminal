/**
 * Swap quote fixtures for testing
 */

/**
 * Swap source info
 */
export interface SwapSourceFixture {
  name: string;
  proportion: number;
}

/**
 * Swap quote fixture
 */
export interface SwapQuoteFixture {
  fromToken: string;
  toToken: string;
  sellAmount: string;
  buyAmount: string;
  price: number;
  gasEstimate: string;
  gasPrice: string;
  gasCostNative: string;
  minimumBuyAmount: string;
  slippageBps: number;
  sources: SwapSourceFixture[];
  allowanceTarget: string;
  expiresAt: number;
  timestamp: number;
}

/**
 * Swap request fixture
 */
export interface SwapRequestFixture {
  fromToken: string;
  toToken: string;
  amount: number;
  chainId?: string;
  slippageBps?: number;
  privateKey?: string;
  recipient?: string;
  gasPrice?: string;
}

/**
 * Swap result fixture
 */
export interface SwapResultFixture {
  success: boolean;
  txHash?: string;
  sellAmount?: string;
  buyAmount?: string;
  timestamp?: number;
  error?: string;
}

// PERMIT2_ADDRESS is exported from permit2.ts
import { PERMIT2_ADDRESS } from './permit2.js';

/**
 * Default ETH->USDC swap quote on Base
 */
export const QUOTE_ETH_TO_USDC: SwapQuoteFixture = {
  fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  sellAmount: '1',
  buyAmount: '3250',
  price: 3250,
  gasEstimate: '200000',
  gasPrice: '1000000',
  gasCostNative: '0.0002',
  minimumBuyAmount: '3217.5',
  slippageBps: 100,
  sources: [{ name: 'Uniswap_V3', proportion: 1 }],
  allowanceTarget: PERMIT2_ADDRESS,
  expiresAt: Date.now() + 30000,
  timestamp: Date.now(),
};

/**
 * USDC->WETH swap quote on Base
 */
export const QUOTE_USDC_TO_WETH: SwapQuoteFixture = {
  fromToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  toToken: '0x4200000000000000000000000000000000000006',
  sellAmount: '1000',
  buyAmount: '0.307692',
  price: 0.000307692,
  gasEstimate: '250000',
  gasPrice: '1000000',
  gasCostNative: '0.00025',
  minimumBuyAmount: '0.304615',
  slippageBps: 100,
  sources: [
    { name: 'Uniswap_V3', proportion: 0.6 },
    { name: 'Aerodrome', proportion: 0.4 },
  ],
  allowanceTarget: PERMIT2_ADDRESS,
  expiresAt: Date.now() + 30000,
  timestamp: Date.now(),
};

/**
 * Default swap request (ETH->USDC)
 */
export const SWAP_REQUEST_ETH_USDC: SwapRequestFixture = {
  fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  amount: 1,
  chainId: 'base',
  slippageBps: 100,
};

/**
 * Successful swap result
 */
export const SWAP_RESULT_SUCCESS: SwapResultFixture = {
  success: true,
  txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
  sellAmount: '1',
  buyAmount: '3250',
  timestamp: Date.now(),
};

/**
 * Failed swap result - insufficient balance
 */
export const SWAP_RESULT_INSUFFICIENT_BALANCE: SwapResultFixture = {
  success: false,
  error: 'Insufficient balance. Have: 0.5, Need: 1',
};

/**
 * Failed swap result - no liquidity
 */
export const SWAP_RESULT_NO_LIQUIDITY: SwapResultFixture = {
  success: false,
  error: 'No liquidity available for this swap',
};

/**
 * Create custom swap quote
 */
export function createSwapQuote(
  overrides: Partial<SwapQuoteFixture>,
): SwapQuoteFixture {
  return {
    ...QUOTE_ETH_TO_USDC,
    expiresAt: Date.now() + 30000,
    timestamp: Date.now(),
    ...overrides,
  };
}

/**
 * Create custom swap request
 */
export function createSwapRequest(
  overrides: Partial<SwapRequestFixture>,
): SwapRequestFixture {
  return {
    ...SWAP_REQUEST_ETH_USDC,
    ...overrides,
  };
}

/**
 * Create custom swap result
 */
export function createSwapResult(
  overrides: Partial<SwapResultFixture>,
): SwapResultFixture {
  return {
    ...SWAP_RESULT_SUCCESS,
    timestamp: Date.now(),
    ...overrides,
  };
}

/**
 * Test private keys (DO NOT USE IN PRODUCTION)
 * These are well-known Hardhat/Foundry test account private keys
 */
export const TEST_PRIVATE_KEYS = {
  ACCOUNT_0:
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  ACCOUNT_1:
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  ACCOUNT_2:
    '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
} as const;

/**
 * Test wallet addresses (corresponding to TEST_PRIVATE_KEYS)
 */
export const TEST_ADDRESSES = {
  ACCOUNT_0: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  ACCOUNT_1: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  ACCOUNT_2: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
} as const;
