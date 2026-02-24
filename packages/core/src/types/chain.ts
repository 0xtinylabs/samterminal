/**
 * Chain-related types for multi-chain support
 */

export type ChainType = 'evm' | 'cosmos';

export type ChainId = number | string;

export interface Chain {
  id: ChainId;
  name: string;
  type: ChainType;
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  testnet?: boolean;
}

export interface EVMChain extends Chain {
  type: 'evm';
  id: number;
  chainId: number;
}

export interface ChainConfig {
  defaultChain: ChainId;
  supportedChains: ChainId[];
  rpcOverrides?: Record<ChainId, string>;
}

export interface TokenInfo {
  address: string;
  chainId: ChainId;
  symbol: string;
  name: string;
  decimals: number;
  logoUri?: string;
}

export interface WalletInfo {
  address: string;
  chainId: ChainId;
  balance?: string;
  tokens?: TokenInfo[];
}

export interface TransactionRequest {
  chainId: ChainId;
  from: string;
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
}

export interface TransactionReceipt {
  hash: string;
  chainId: ChainId;
  from: string;
  to: string;
  status: 'success' | 'failed' | 'pending';
  blockNumber?: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
  logs?: TransactionLog[];
}

export interface TransactionLog {
  address: string;
  topics: string[];
  data: string;
  logIndex: number;
}

// Predefined chains
export const CHAINS = {
  // EVM Chains
  ETHEREUM: 1,
  BASE: 8453,
  BASE_SEPOLIA: 84532,
  OPTIMISM: 10,
  ARBITRUM: 42161,
  POLYGON: 137,
  BSC: 56,
  AVALANCHE: 43114,
} as const;

export type KnownChainId = (typeof CHAINS)[keyof typeof CHAINS];
