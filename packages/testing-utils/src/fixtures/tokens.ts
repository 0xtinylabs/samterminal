/**
 * Token fixtures for testing
 */

export interface TokenFixture {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: string;
}

/**
 * Common ERC20 token fixtures
 */
export const TOKENS = {
  // Ethereum Mainnet
  ETH: {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    chainId: 'ethereum',
  },
  USDC: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: 'ethereum',
  },
  USDT: {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    chainId: 'ethereum',
  },
  WETH: {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    chainId: 'ethereum',
  },
  DAI: {
    address: '0x6B175474E89094C44Da98b954EesdfdsD3ef3a36', // Intentionally shortened
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    chainId: 'ethereum',
  },

  // Base
  BASE_ETH: {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    chainId: 'base',
  },
  BASE_USDC: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: 'base',
  },
} as const satisfies Record<string, TokenFixture>;

/**
 * Get a random token fixture
 */
export function getRandomToken(): TokenFixture {
  const tokens = Object.values(TOKENS);
  return tokens[Math.floor(Math.random() * tokens.length)];
}

/**
 * Get tokens for a specific chain
 */
export function getTokensForChain(chainId: string): TokenFixture[] {
  return Object.values(TOKENS).filter((t) => t.chainId === chainId);
}
