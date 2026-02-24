/**
 * Chain constants tests
 */


import {
  PERMIT2_ADDRESS,
  NATIVE_TOKEN_ADDRESSES,
  isNativeToken,
  CHAIN_CONFIGS,
  getNumericChainId,
  WRAPPED_NATIVE_TOKENS,
  DEFAULT_GAS_LIMIT,
  PERMIT_DEADLINE_SECURE,
  PERMIT_DEADLINE_NORMAL,
  type SupportedChainId,
} from './chains.js';

describe('PERMIT2_ADDRESS', () => {
  it('should be the correct universal address', () => {
    expect(PERMIT2_ADDRESS).toBe('0x000000000022D473030F116dDEE9F6B43aC78BA3');
  });

  it('should be lowercase checksum format', () => {
    expect(PERMIT2_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });
});

describe('NATIVE_TOKEN_ADDRESSES', () => {
  it('should contain zero address', () => {
    expect(NATIVE_TOKEN_ADDRESSES.has('0x0000000000000000000000000000000000000000')).toBe(true);
  });

  it('should contain ETH placeholder lowercase', () => {
    expect(NATIVE_TOKEN_ADDRESSES.has('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')).toBe(true);
  });

  it('should contain ETH placeholder checksum', () => {
    expect(NATIVE_TOKEN_ADDRESSES.has('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')).toBe(true);
  });

  it('should have exactly 3 addresses', () => {
    expect(NATIVE_TOKEN_ADDRESSES.size).toBe(3);
  });
});

describe('isNativeToken', () => {
  it('should return true for zero address', () => {
    expect(isNativeToken('0x0000000000000000000000000000000000000000')).toBe(true);
  });

  it('should return true for ETH placeholder lowercase', () => {
    expect(isNativeToken('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')).toBe(true);
  });

  it('should return true for ETH placeholder uppercase', () => {
    expect(isNativeToken('0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE')).toBe(true);
  });

  it('should return true for ETH placeholder checksum', () => {
    expect(isNativeToken('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')).toBe(true);
  });

  it('should return false for ERC20 token address', () => {
    expect(isNativeToken('0x6B175474E89094C44Da98b954EesddFD691F0D')).toBe(false);
  });

  it('should return false for WETH address', () => {
    expect(isNativeToken('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')).toBe(false);
  });

  it('should handle case insensitivity', () => {
    expect(isNativeToken('0xEEEEeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')).toBe(true);
  });
});

describe('CHAIN_CONFIGS', () => {
  it('should have base chain', () => {
    expect(CHAIN_CONFIGS.base).toBeDefined();
    expect(CHAIN_CONFIGS.base.chainId).toBe(8453);
    expect(CHAIN_CONFIGS.base.name).toBe('Base');
  });

  it('should have ethereum chain', () => {
    expect(CHAIN_CONFIGS.ethereum).toBeDefined();
    expect(CHAIN_CONFIGS.ethereum.chainId).toBe(1);
    expect(CHAIN_CONFIGS.ethereum.name).toBe('Ethereum');
  });

  it('should have arbitrum chain', () => {
    expect(CHAIN_CONFIGS.arbitrum).toBeDefined();
    expect(CHAIN_CONFIGS.arbitrum.chainId).toBe(42161);
    expect(CHAIN_CONFIGS.arbitrum.name).toBe('Arbitrum');
  });

  it('should have polygon chain', () => {
    expect(CHAIN_CONFIGS.polygon).toBeDefined();
    expect(CHAIN_CONFIGS.polygon.chainId).toBe(137);
    expect(CHAIN_CONFIGS.polygon.name).toBe('Polygon');
  });

  it('should have optimism chain', () => {
    expect(CHAIN_CONFIGS.optimism).toBeDefined();
    expect(CHAIN_CONFIGS.optimism.chainId).toBe(10);
    expect(CHAIN_CONFIGS.optimism.name).toBe('Optimism');
  });

  it('should have bsc chain', () => {
    expect(CHAIN_CONFIGS.bsc).toBeDefined();
    expect(CHAIN_CONFIGS.bsc.chainId).toBe(56);
    expect(CHAIN_CONFIGS.bsc.name).toBe('BSC');
  });

  it('should have exactly 6 chains', () => {
    expect(Object.keys(CHAIN_CONFIGS).length).toBe(6);
  });
});

describe('getNumericChainId', () => {
  it('should return correct chainId for base', () => {
    expect(getNumericChainId('base')).toBe(8453);
  });

  it('should return correct chainId for ethereum', () => {
    expect(getNumericChainId('ethereum')).toBe(1);
  });

  it('should return correct chainId for arbitrum', () => {
    expect(getNumericChainId('arbitrum')).toBe(42161);
  });

  it('should return correct chainId for polygon', () => {
    expect(getNumericChainId('polygon')).toBe(137);
  });

  it('should return correct chainId for optimism', () => {
    expect(getNumericChainId('optimism')).toBe(10);
  });

  it('should return correct chainId for bsc', () => {
    expect(getNumericChainId('bsc')).toBe(56);
  });

  it('should return 0 for unknown chain', () => {
    expect(getNumericChainId('unknown' as SupportedChainId)).toBe(0);
  });
});

describe('WRAPPED_NATIVE_TOKENS', () => {
  it('should have WETH for base', () => {
    expect(WRAPPED_NATIVE_TOKENS.base).toBe('0x4200000000000000000000000000000000000006');
  });

  it('should have WETH for ethereum', () => {
    expect(WRAPPED_NATIVE_TOKENS.ethereum).toBe('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
  });

  it('should have WETH for arbitrum', () => {
    expect(WRAPPED_NATIVE_TOKENS.arbitrum).toBe('0x82aF49447D8a07e3bd95BD0d56f35241523fBab1');
  });

  it('should have WMATIC for polygon', () => {
    expect(WRAPPED_NATIVE_TOKENS.polygon).toBe('0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270');
  });

  it('should have WETH for optimism', () => {
    expect(WRAPPED_NATIVE_TOKENS.optimism).toBe('0x4200000000000000000000000000000000000006');
  });

  it('should have WBNB for bsc', () => {
    expect(WRAPPED_NATIVE_TOKENS.bsc).toBe('0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c');
  });

  it('should have valid addresses', () => {
    Object.values(WRAPPED_NATIVE_TOKENS).forEach((address) => {
      expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });
  });
});

describe('DEFAULT_GAS_LIMIT', () => {
  it('should be 6 million', () => {
    expect(DEFAULT_GAS_LIMIT).toBe(6_000_000n);
  });

  it('should be a bigint', () => {
    expect(typeof DEFAULT_GAS_LIMIT).toBe('bigint');
  });
});

describe('PERMIT_DEADLINE_SECURE', () => {
  it('should be 60 seconds', () => {
    expect(PERMIT_DEADLINE_SECURE).toBe(60);
  });
});

describe('PERMIT_DEADLINE_NORMAL', () => {
  it('should be 1 hour (3600 seconds)', () => {
    expect(PERMIT_DEADLINE_NORMAL).toBe(3600);
  });
});
