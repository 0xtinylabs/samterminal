/**
 * EVM Chain utilities tests
 */


import {
  ETHEREUM,
  BASE,
  BASE_SEPOLIA,
  OPTIMISM,
  ARBITRUM,
  POLYGON,
  BSC,
  AVALANCHE,
  SEPOLIA,
  EVM_CHAINS,
  getEVMChain,
  getEVMChainByName,
  isKnownEVMChain,
  createEVMChain,
} from './evm.js';

describe('Predefined Chains', () => {
  describe('ETHEREUM', () => {
    it('should have correct chain ID', () => {
      expect(ETHEREUM.chainId).toBe(1);
    });

    it('should be EVM type', () => {
      expect(ETHEREUM.type).toBe('evm');
    });

    it('should not be testnet', () => {
      expect(ETHEREUM.testnet).toBe(false);
    });

    it('should have RPC URLs', () => {
      expect(ETHEREUM.rpcUrls.length).toBeGreaterThan(0);
    });
  });

  describe('BASE', () => {
    it('should have correct chain ID', () => {
      expect(BASE.chainId).toBe(8453);
    });

    it('should have correct name', () => {
      expect(BASE.name).toBe('Base');
    });
  });

  describe('BASE_SEPOLIA', () => {
    it('should be testnet', () => {
      expect(BASE_SEPOLIA.testnet).toBe(true);
    });

    it('should have correct chain ID', () => {
      expect(BASE_SEPOLIA.chainId).toBe(84532);
    });
  });

  describe('OPTIMISM', () => {
    it('should have correct chain ID', () => {
      expect(OPTIMISM.chainId).toBe(10);
    });
  });

  describe('ARBITRUM', () => {
    it('should have correct chain ID', () => {
      expect(ARBITRUM.chainId).toBe(42161);
    });
  });

  describe('POLYGON', () => {
    it('should have correct chain ID', () => {
      expect(POLYGON.chainId).toBe(137);
    });

    it('should have MATIC as native currency', () => {
      expect(POLYGON.nativeCurrency.symbol).toBe('MATIC');
    });
  });

  describe('BSC', () => {
    it('should have correct chain ID', () => {
      expect(BSC.chainId).toBe(56);
    });

    it('should have BNB as native currency', () => {
      expect(BSC.nativeCurrency.symbol).toBe('BNB');
    });
  });

  describe('AVALANCHE', () => {
    it('should have correct chain ID', () => {
      expect(AVALANCHE.chainId).toBe(43114);
    });

    it('should have AVAX as native currency', () => {
      expect(AVALANCHE.nativeCurrency.symbol).toBe('AVAX');
    });
  });

  describe('SEPOLIA', () => {
    it('should be testnet', () => {
      expect(SEPOLIA.testnet).toBe(true);
    });

    it('should have correct chain ID', () => {
      expect(SEPOLIA.chainId).toBe(11155111);
    });
  });
});

describe('EVM_CHAINS', () => {
  it('should contain all predefined chains', () => {
    expect(EVM_CHAINS).toContain(ETHEREUM);
    expect(EVM_CHAINS).toContain(BASE);
    expect(EVM_CHAINS).toContain(OPTIMISM);
    expect(EVM_CHAINS).toContain(ARBITRUM);
    expect(EVM_CHAINS).toContain(POLYGON);
    expect(EVM_CHAINS).toContain(BSC);
    expect(EVM_CHAINS).toContain(AVALANCHE);
    expect(EVM_CHAINS).toContain(SEPOLIA);
    expect(EVM_CHAINS).toContain(BASE_SEPOLIA);
  });

  it('should have all chains as EVM type', () => {
    EVM_CHAINS.forEach((chain) => {
      expect(chain.type).toBe('evm');
    });
  });
});

describe('getEVMChain', () => {
  it('should return chain by ID', () => {
    expect(getEVMChain(1)).toBe(ETHEREUM);
    expect(getEVMChain(8453)).toBe(BASE);
    expect(getEVMChain(10)).toBe(OPTIMISM);
  });

  it('should return undefined for unknown ID', () => {
    expect(getEVMChain(999999)).toBeUndefined();
  });
});

describe('getEVMChainByName', () => {
  it('should return chain by name (case insensitive)', () => {
    expect(getEVMChainByName('Ethereum')).toBe(ETHEREUM);
    expect(getEVMChainByName('ethereum')).toBe(ETHEREUM);
    expect(getEVMChainByName('ETHEREUM')).toBe(ETHEREUM);
  });

  it('should return chain for Base', () => {
    expect(getEVMChainByName('Base')).toBe(BASE);
  });

  it('should return undefined for unknown name', () => {
    expect(getEVMChainByName('Unknown')).toBeUndefined();
  });
});

describe('isKnownEVMChain', () => {
  it('should return true for known chains', () => {
    expect(isKnownEVMChain(1)).toBe(true);
    expect(isKnownEVMChain(8453)).toBe(true);
    expect(isKnownEVMChain(137)).toBe(true);
  });

  it('should return false for unknown chains', () => {
    expect(isKnownEVMChain(999999)).toBe(false);
    expect(isKnownEVMChain(0)).toBe(false);
  });
});

describe('createEVMChain', () => {
  it('should create custom EVM chain', () => {
    const chain = createEVMChain({
      chainId: 12345,
      name: 'Custom Chain',
      rpcUrls: ['https://rpc.custom.io'],
      nativeCurrency: {
        name: 'Custom Token',
        symbol: 'CTK',
        decimals: 18,
      },
    });

    expect(chain.id).toBe(12345);
    expect(chain.chainId).toBe(12345);
    expect(chain.name).toBe('Custom Chain');
    expect(chain.type).toBe('evm');
    expect(chain.nativeCurrency.symbol).toBe('CTK');
    expect(chain.testnet).toBe(false);
  });

  it('should create testnet chain', () => {
    const chain = createEVMChain({
      chainId: 99999,
      name: 'Test Network',
      rpcUrls: ['https://rpc.test.io'],
      nativeCurrency: {
        name: 'Test ETH',
        symbol: 'tETH',
        decimals: 18,
      },
      testnet: true,
    });

    expect(chain.testnet).toBe(true);
  });

  it('should include block explorer URLs', () => {
    const chain = createEVMChain({
      chainId: 12345,
      name: 'Custom Chain',
      rpcUrls: ['https://rpc.custom.io'],
      blockExplorerUrls: ['https://explorer.custom.io'],
      nativeCurrency: {
        name: 'Custom Token',
        symbol: 'CTK',
        decimals: 18,
      },
    });

    expect(chain.blockExplorerUrls).toEqual(['https://explorer.custom.io']);
  });
});
