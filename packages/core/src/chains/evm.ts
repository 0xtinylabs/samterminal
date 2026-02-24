/**
 * EVM Chain Definitions
 * Pre-defined EVM chain configurations
 */

import type { EVMChain } from '../types/index.js';

/**
 * Ethereum Mainnet
 */
export const ETHEREUM: EVMChain = {
  id: 1,
  chainId: 1,
  name: 'Ethereum',
  type: 'evm',
  rpcUrls: [
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
    'https://cloudflare-eth.com',
  ],
  blockExplorerUrls: ['https://etherscan.io'],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  testnet: false,
};

/**
 * Base Mainnet
 */
export const BASE: EVMChain = {
  id: 8453,
  chainId: 8453,
  name: 'Base',
  type: 'evm',
  rpcUrls: [
    'https://mainnet.base.org',
    'https://base.llamarpc.com',
    'https://rpc.ankr.com/base',
  ],
  blockExplorerUrls: ['https://basescan.org'],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  testnet: false,
};

/**
 * Base Sepolia Testnet
 */
export const BASE_SEPOLIA: EVMChain = {
  id: 84532,
  chainId: 84532,
  name: 'Base Sepolia',
  type: 'evm',
  rpcUrls: ['https://sepolia.base.org'],
  blockExplorerUrls: ['https://sepolia.basescan.org'],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  testnet: true,
};

/**
 * Optimism Mainnet
 */
export const OPTIMISM: EVMChain = {
  id: 10,
  chainId: 10,
  name: 'Optimism',
  type: 'evm',
  rpcUrls: [
    'https://mainnet.optimism.io',
    'https://optimism.llamarpc.com',
    'https://rpc.ankr.com/optimism',
  ],
  blockExplorerUrls: ['https://optimistic.etherscan.io'],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  testnet: false,
};

/**
 * Arbitrum One
 */
export const ARBITRUM: EVMChain = {
  id: 42161,
  chainId: 42161,
  name: 'Arbitrum One',
  type: 'evm',
  rpcUrls: [
    'https://arb1.arbitrum.io/rpc',
    'https://arbitrum.llamarpc.com',
    'https://rpc.ankr.com/arbitrum',
  ],
  blockExplorerUrls: ['https://arbiscan.io'],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  testnet: false,
};

/**
 * Polygon Mainnet
 */
export const POLYGON: EVMChain = {
  id: 137,
  chainId: 137,
  name: 'Polygon',
  type: 'evm',
  rpcUrls: [
    'https://polygon-rpc.com',
    'https://polygon.llamarpc.com',
    'https://rpc.ankr.com/polygon',
  ],
  blockExplorerUrls: ['https://polygonscan.com'],
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  testnet: false,
};

/**
 * BNB Smart Chain
 */
export const BSC: EVMChain = {
  id: 56,
  chainId: 56,
  name: 'BNB Smart Chain',
  type: 'evm',
  rpcUrls: [
    'https://bsc-dataseed.binance.org',
    'https://bsc.llamarpc.com',
    'https://rpc.ankr.com/bsc',
  ],
  blockExplorerUrls: ['https://bscscan.com'],
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  testnet: false,
};

/**
 * Avalanche C-Chain
 */
export const AVALANCHE: EVMChain = {
  id: 43114,
  chainId: 43114,
  name: 'Avalanche',
  type: 'evm',
  rpcUrls: [
    'https://api.avax.network/ext/bc/C/rpc',
    'https://avalanche.llamarpc.com',
    'https://rpc.ankr.com/avalanche',
  ],
  blockExplorerUrls: ['https://snowtrace.io'],
  nativeCurrency: {
    name: 'AVAX',
    symbol: 'AVAX',
    decimals: 18,
  },
  testnet: false,
};

/**
 * Sepolia Testnet
 */
export const SEPOLIA: EVMChain = {
  id: 11155111,
  chainId: 11155111,
  name: 'Sepolia',
  type: 'evm',
  rpcUrls: [
    'https://rpc.sepolia.org',
    'https://ethereum-sepolia.publicnode.com',
  ],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  testnet: true,
};

/**
 * All predefined EVM chains
 */
export const EVM_CHAINS: EVMChain[] = [
  ETHEREUM,
  BASE,
  BASE_SEPOLIA,
  OPTIMISM,
  ARBITRUM,
  POLYGON,
  BSC,
  AVALANCHE,
  SEPOLIA,
];

/**
 * Get EVM chain by ID
 */
export function getEVMChain(chainId: number): EVMChain | undefined {
  return EVM_CHAINS.find((c) => c.chainId === chainId);
}

/**
 * Get EVM chain by name
 */
export function getEVMChainByName(name: string): EVMChain | undefined {
  const lowerName = name.toLowerCase();
  return EVM_CHAINS.find((c) => c.name.toLowerCase() === lowerName);
}

/**
 * Check if chain ID is a known EVM chain
 */
export function isKnownEVMChain(chainId: number): boolean {
  return EVM_CHAINS.some((c) => c.chainId === chainId);
}

/**
 * Create a custom EVM chain
 */
export function createEVMChain(config: {
  chainId: number;
  name: string;
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  nativeCurrency: EVMChain['nativeCurrency'];
  testnet?: boolean;
}): EVMChain {
  return {
    id: config.chainId,
    chainId: config.chainId,
    name: config.name,
    type: 'evm',
    rpcUrls: config.rpcUrls,
    blockExplorerUrls: config.blockExplorerUrls,
    nativeCurrency: config.nativeCurrency,
    testnet: config.testnet ?? false,
  };
}
