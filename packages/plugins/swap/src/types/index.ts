/**
 * Swap types for @samterminal/plugin-swap
 */

import type { ChainId } from '@samterminal/plugin-tokendata';

/**
 * Native token addresses (treated as ETH)
 */
export const NATIVE_TOKEN_ADDRESSES = [
  '0x0000000000000000000000000000000000000000',
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
] as const;

/**
 * Well-known contract addresses
 */
export const CONTRACTS = {
  PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  ZERO_X_EXCHANGE_PROXY: '0xDef1C0ded9bec7F1a1670819833240f027b25EfF',
} as const;

/**
 * Swap request input
 */
export interface SwapRequest {
  /** Source token address */
  fromToken: string;
  /** Destination token address */
  toToken: string;
  /** Amount to swap (in token units, not wei) */
  amount: number;
  /** Chain to execute on */
  chainId?: ChainId;
  /** Private key for signing (required for execution) */
  privateKey?: string;
  /** Slippage tolerance in basis points (e.g., 100 = 1%) */
  slippageBps?: number;
  /** Recipient address (defaults to sender) */
  recipient?: string;
  /** Gas price in gwei (optional, uses current if not provided) */
  gasPrice?: string;
}

/**
 * Swap quote response
 */
export interface SwapQuote {
  /** Source token address */
  fromToken: string;
  /** Destination token address */
  toToken: string;
  /** Amount being sold (in token units) */
  sellAmount: string;
  /** Amount being bought (in token units) */
  buyAmount: string;
  /** Sell amount in USD */
  sellAmountUsd?: number;
  /** Buy amount in USD */
  buyAmountUsd?: number;
  /** Price of sell token in buy tokens */
  price: number;
  /** Price impact percentage */
  priceImpact?: number;
  /** Gas estimate in units */
  gasEstimate: string;
  /** Gas price in gwei */
  gasPrice: string;
  /** Estimated gas cost in native token */
  gasCostNative: string;
  /** Estimated gas cost in USD */
  gasCostUsd?: number;
  /** Minimum amount out after slippage */
  minimumBuyAmount: string;
  /** Slippage in basis points */
  slippageBps: number;
  /** Route/sources used */
  sources: SwapSource[];
  /** Allowance target for token approval */
  allowanceTarget: string;
  /** Transaction data for execution */
  transaction?: SwapTransaction;
  /** Permit data for Permit2 */
  permit?: PermitData;
  /** Quote expiry timestamp */
  expiresAt: number;
  /** Quote timestamp */
  timestamp: number;
}

/**
 * Swap source/route
 */
export interface SwapSource {
  name: string;
  proportion: number;
}

/**
 * Transaction data for swap execution
 */
export interface SwapTransaction {
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
}

/**
 * Permit2 data
 */
export interface PermitData {
  eip712: Eip712TypedData;
  signature?: string;
}

/**
 * EIP-712 typed data
 */
export interface Eip712TypedData {
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  domain: {
    name: string;
    chainId: number;
    verifyingContract: string;
  };
  message: Record<string, unknown>;
}

/**
 * Swap execution result
 */
export interface SwapResult {
  success: boolean;
  /** Transaction hash */
  txHash?: string;
  /** Actual sell amount */
  sellAmount?: string;
  /** Actual buy amount */
  buyAmount?: string;
  /** Platform fee taken */
  fee?: string;
  /** Error message if failed */
  error?: string;
  /** Block number of transaction */
  blockNumber?: number;
  /** Timestamp of execution */
  timestamp: number;
}

/**
 * Token allowance info
 */
export interface TokenAllowance {
  token: string;
  owner: string;
  spender: string;
  allowance: string;
  isUnlimited: boolean;
}

/**
 * Token approval request
 */
export interface ApprovalRequest {
  token: string;
  spender: string;
  amount?: string;
  privateKey: string;
  chainId?: ChainId;
}

/**
 * Approval result
 */
export interface ApprovalResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Plugin configuration
 */
export interface SwapPluginConfig {
  /** Default chain for swaps */
  defaultChain?: ChainId;

  /** 0x API key */
  zeroXApiKey?: string;

  /** 0x API URL (default: https://api.0x.org) */
  zeroXApiUrl?: string;

  /** Default slippage in basis points (default: 100 = 1%) */
  defaultSlippageBps?: number;

  /** Platform fee in basis points */
  feeBps?: number;

  /** Fee recipient address */
  feeRecipient?: string;

  /** Token to receive fees in */
  feeToken?: string;

  /** Default private key for swap execution (falls back to WALLET_PRIVATE_KEY env) */
  defaultPrivateKey?: string;

  /** Custom RPC URLs per chain */
  rpcUrls?: Partial<Record<ChainId, string>>;

  /** Alchemy API key for RPC */
  alchemyApiKey?: string;

  /** Cache TTL in milliseconds (default: 10000) */
  cacheTtl?: number;

  /** Enable caching (default: true) */
  enableCache?: boolean;

  /** Request timeout in milliseconds (default: 30000) */
  requestTimeout?: number;

  /** Permit swap executor contract address */
  permitSwapAddress?: string;

  /** Permit2 contract address (default: universal Permit2) */
  permit2Address?: string;

  /** Default permit deadline in seconds (default: 60 for secure) */
  permitDeadlineSeconds?: number;

  /** Default gas limit for transactions */
  defaultGasLimit?: bigint;
}

/**
 * Quote request parameters
 */
export interface QuoteRequest {
  fromToken: string;
  toToken: string;
  amount: number;
  chainId?: ChainId;
  slippageBps?: number;
  taker?: string;
  includeFee?: boolean;
}

/**
 * 0x API quote response
 */
export interface ZeroXQuoteResponse {
  blockNumber: string;
  buyAmount: string;
  buyToken: string;
  fees: {
    integratorFee: {
      amount: string;
      token: string;
      type: string;
    } | null;
    zeroExFee: {
      amount: string;
      token: string;
      type: string;
    } | null;
    gasFee: {
      amount: string;
      token: string;
      type: string;
    } | null;
  };
  issues: {
    allowance: {
      actual: string;
      spender: string;
    } | null;
    balance: {
      token: string;
      actual: string;
      expected: string;
    } | null;
    simulationIncomplete: boolean;
    invalidSourcesPassed: string[];
  };
  liquidityAvailable: boolean;
  minBuyAmount: string;
  route: {
    fills: Array<{
      from: string;
      to: string;
      source: string;
      proportionBps: string;
    }>;
    tokens: Array<{
      address: string;
      symbol: string;
    }>;
  };
  sellAmount: string;
  sellToken: string;
  tokenMetadata: {
    buyToken: {
      buyTaxBps: string | null;
      sellTaxBps: string | null;
    };
    sellToken: {
      buyTaxBps: string | null;
      sellTaxBps: string | null;
    };
  };
  totalNetworkFee: string;
  transaction: {
    to: string;
    data: string;
    gas: string;
    gasPrice: string;
    value: string;
  };
  permit2?: {
    type: string;
    hash: string;
    eip712: Eip712TypedData;
  };
  zid: string;
}

/**
 * 0x API price response (indicative quote)
 */
export interface ZeroXPriceResponse {
  blockNumber: string;
  buyAmount: string;
  buyToken: string;
  fees: {
    integratorFee: { amount: string } | null;
    zeroExFee: { amount: string } | null;
    gasFee: { amount: string } | null;
  };
  gas: string;
  gasPrice: string;
  liquidityAvailable: boolean;
  minBuyAmount: string;
  route: {
    fills: Array<{
      from: string;
      to: string;
      source: string;
      proportionBps: string;
    }>;
    tokens: Array<{
      address: string;
      symbol: string;
    }>;
  };
  sellAmount: string;
  sellToken: string;
  totalNetworkFee: string;
  zid: string;
}

/**
 * Swap history entry
 */
export interface SwapHistoryEntry {
  id: string;
  fromToken: string;
  fromTokenSymbol?: string;
  toToken: string;
  toTokenSymbol?: string;
  sellAmount: string;
  buyAmount: string;
  txHash: string;
  chainId: ChainId;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  fee?: string;
}

/**
 * Database adapter for swap tracking
 */
export interface SwapDatabaseAdapter {
  /** Log a successful swap */
  logSwap(swap: Omit<SwapHistoryEntry, 'id'>): Promise<string>;

  /** Log a swap error */
  logError(walletAddress: string, error: string): Promise<void>;

  /** Get swap history for a wallet */
  getSwapHistory(
    walletAddress: string,
    options?: {
      limit?: number;
      offset?: number;
      chainId?: ChainId;
    },
  ): Promise<SwapHistoryEntry[]>;

  /** Get swap count for a wallet */
  getSwapCount(walletAddress: string, period?: 'day' | 'week' | 'month' | 'year'): Promise<number>;

  /** Update swap status */
  updateSwapStatus(txHash: string, status: SwapHistoryEntry['status']): Promise<void>;
}

/**
 * Check if address is native token
 */
export function isNativeToken(address: string): boolean {
  return NATIVE_TOKEN_ADDRESSES.includes(
    address.toLowerCase() as (typeof NATIVE_TOKEN_ADDRESSES)[number],
  );
}

/**
 * Get wrapped native token address for chain
 */
export function getWrappedNativeToken(chainId: ChainId): string {
  const wrapped: Partial<Record<ChainId, string>> = {
    base: '0x4200000000000000000000000000000000000006', // WETH on Base
    ethereum: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH on Ethereum
    arbitrum: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH on Arbitrum
    polygon: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC on Polygon
    optimism: '0x4200000000000000000000000000000000000006', // WETH on Optimism
    bsc: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB on BSC
  };

  return wrapped[chainId] ?? '';
}
