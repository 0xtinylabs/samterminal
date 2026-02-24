/**
 * Chain fixtures for testing
 */

export interface ChainFixture {
  id: string;
  name: string;
  type: 'evm';
  chainId?: number;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Common chain fixtures
 */
export const CHAINS = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    type: 'evm',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  base: {
    id: 'base',
    name: 'Base',
    type: 'evm',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    type: 'evm',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  optimism: {
    id: 'optimism',
    name: 'Optimism',
    type: 'evm',
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    type: 'evm',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
} as const satisfies Record<string, ChainFixture>;

/**
 * Get all EVM chains
 */
export function getEVMChains(): ChainFixture[] {
  return Object.values(CHAINS).filter((c) => c.type === 'evm');
}

/**
 * Get chain by ID
 */
export function getChain(id: string): ChainFixture | undefined {
  return CHAINS[id as keyof typeof CHAINS];
}
