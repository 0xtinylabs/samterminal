/**
 * Chain constants for swap plugin
 */

/**
 * Permit2 universal address (same on all EVM chains)
 */
export const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3' as const;

/**
 * Native token addresses (treated as ETH/native)
 */
export const NATIVE_TOKEN_ADDRESSES = new Set([
  '0x0000000000000000000000000000000000000000',
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
]);

/**
 * Check if address is native token
 */
export function isNativeToken(address: string): boolean {
  return NATIVE_TOKEN_ADDRESSES.has(address.toLowerCase()) ||
         NATIVE_TOKEN_ADDRESSES.has(address);
}

/**
 * Chain configurations
 */
export const CHAIN_CONFIGS = {
  base: { chainId: 8453, name: 'Base' },
  ethereum: { chainId: 1, name: 'Ethereum' },
  arbitrum: { chainId: 42161, name: 'Arbitrum' },
  polygon: { chainId: 137, name: 'Polygon' },
  optimism: { chainId: 10, name: 'Optimism' },
  bsc: { chainId: 56, name: 'BSC' },
} as const;

export type SupportedChainId = keyof typeof CHAIN_CONFIGS;

/**
 * Get numeric chain ID from string
 */
export function getNumericChainId(chainId: SupportedChainId): number {
  return CHAIN_CONFIGS[chainId]?.chainId ?? 0;
}

/**
 * Wrapped native token addresses per chain
 */
export const WRAPPED_NATIVE_TOKENS: Record<SupportedChainId, string> = {
  base: '0x4200000000000000000000000000000000000006', // WETH on Base
  ethereum: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH on Ethereum
  arbitrum: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH on Arbitrum
  polygon: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC on Polygon
  optimism: '0x4200000000000000000000000000000000000006', // WETH on Optimism
  bsc: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB on BSC
};

/**
 * Default gas limits
 */
export const DEFAULT_GAS_LIMIT = 6_000_000n;

/**
 * Default permit deadlines in seconds
 */
export const PERMIT_DEADLINE_SECURE = 60; // 60 seconds for secure permit
export const PERMIT_DEADLINE_NORMAL = 3600; // 1 hour for normal permit
