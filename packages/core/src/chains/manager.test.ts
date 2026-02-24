/**
 * Chain Manager tests
 */


import { ChainManagerImpl, createChainManager } from './manager.js';
import type { Chain, EVMChain } from '../types/index.js';

describe('ChainManagerImpl', () => {
  let manager: ChainManagerImpl;

  const createEVMChain = (id: number, name: string): EVMChain => ({
    id,
    chainId: id,
    name,
    type: 'evm',
    rpcUrls: [`https://rpc.${name.toLowerCase()}.io`],
    blockExplorerUrls: [`https://explorer.${name.toLowerCase()}.io`],
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    testnet: false,
  });

  beforeEach(() => {
    manager = new ChainManagerImpl();
  });

  describe('constructor', () => {
    it('should create empty manager', () => {
      expect(manager.size).toBe(0);
    });

    it('should accept config with default chain', () => {
      const chain = createEVMChain(1, 'Ethereum');
      const configured = new ChainManagerImpl({ defaultChain: 1 });
      configured.register(chain);

      expect(configured.getCurrentChainId()).toBe(1);
    });

    it('should accept config with RPC overrides', () => {
      const configured = new ChainManagerImpl();
      const chain = createEVMChain(1, 'Ethereum');
      configured.register(chain);
      // Set RPC override using the API method
      configured.setRpcUrl(1, 'https://custom.rpc.io');

      expect(configured.getRpcUrl(1)).toBe('https://custom.rpc.io');
    });
  });

  describe('register', () => {
    it('should register a chain', () => {
      const chain = createEVMChain(1, 'Ethereum');
      manager.register(chain);

      expect(manager.isSupported(1)).toBe(true);
      expect(manager.getAll()).toHaveLength(1);
    });

    it('should overwrite existing chain', () => {
      const chain1 = createEVMChain(1, 'Ethereum');
      const chain2 = createEVMChain(1, 'Ethereum Updated');

      manager.register(chain1);
      manager.register(chain2);

      expect(manager.get(1)?.name).toBe('Ethereum Updated');
      expect(manager.getAll()).toHaveLength(1);
    });
  });

  describe('registerMany', () => {
    it('should register multiple chains', () => {
      const chains = [
        createEVMChain(1, 'Ethereum'),
        createEVMChain(8453, 'Base'),
      ];

      manager.registerMany(chains);

      expect(manager.getAll()).toHaveLength(2);
    });
  });

  describe('unregister', () => {
    it('should unregister existing chain', () => {
      const chain = createEVMChain(1, 'Ethereum');
      manager.register(chain);

      const result = manager.unregister(1);

      expect(result).toBe(true);
      expect(manager.isSupported(1)).toBe(false);
    });

    it('should return false for non-existent chain', () => {
      const result = manager.unregister(999);
      expect(result).toBe(false);
    });

    it('should clear current chain if unregistering it', () => {
      const chain = createEVMChain(1, 'Ethereum');
      manager.register(chain);
      manager.setCurrentChain(1);

      manager.unregister(1);

      expect(manager.getCurrentChainId()).toBeUndefined();
    });
  });

  describe('get', () => {
    it('should return chain by ID', () => {
      const chain = createEVMChain(1, 'Ethereum');
      manager.register(chain);

      expect(manager.get(1)).toEqual(chain);
    });

    it('should return undefined for unknown ID', () => {
      expect(manager.get(999)).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all chains', () => {
      const chains = [
        createEVMChain(1, 'Ethereum'),
        createEVMChain(8453, 'Base'),
      ];
      manager.registerMany(chains);

      const all = manager.getAll();

      expect(all).toHaveLength(2);
    });
  });

  describe('getEVMChains', () => {
    it('should return only EVM chains', () => {
      manager.register(createEVMChain(1, 'Ethereum'));
      manager.register(createEVMChain(8453, 'Base'));

      const evmChains = manager.getEVMChains();

      expect(evmChains).toHaveLength(2);
      expect(evmChains[0].type).toBe('evm');
    });
  });

  describe('getCurrentChain', () => {
    it('should return undefined if no current chain', () => {
      expect(manager.getCurrentChain()).toBeUndefined();
    });

    it('should return current chain', () => {
      const chain = createEVMChain(1, 'Ethereum');
      manager.register(chain);
      manager.setCurrentChain(1);

      expect(manager.getCurrentChain()).toEqual(chain);
    });
  });

  describe('setCurrentChain', () => {
    it('should set current chain', () => {
      const chain = createEVMChain(1, 'Ethereum');
      manager.register(chain);

      manager.setCurrentChain(1);

      expect(manager.getCurrentChainId()).toBe(1);
    });

    it('should throw for unregistered chain', () => {
      expect(() => manager.setCurrentChain(999)).toThrow(
        'Chain "999" is not registered'
      );
    });
  });

  describe('isSupported', () => {
    it('should return true for registered chain', () => {
      manager.register(createEVMChain(1, 'Ethereum'));
      expect(manager.isSupported(1)).toBe(true);
    });

    it('should return false for unregistered chain', () => {
      expect(manager.isSupported(999)).toBe(false);
    });
  });

  describe('isEVM', () => {
    it('should return true for EVM chain', () => {
      manager.register(createEVMChain(1, 'Ethereum'));
      expect(manager.isEVM(1)).toBe(true);
    });

    it('should return false for unknown chain', () => {
      expect(manager.isEVM(999)).toBe(false);
    });
  });

  describe('getRpcUrl', () => {
    it('should return override RPC if set', () => {
      manager.register(createEVMChain(1, 'Ethereum'));
      manager.setRpcUrl(1, 'https://custom.rpc.io');

      expect(manager.getRpcUrl(1)).toBe('https://custom.rpc.io');
    });

    it('should return chain RPC if no override', () => {
      const chain = createEVMChain(1, 'Ethereum');
      manager.register(chain);

      expect(manager.getRpcUrl(1)).toBe(chain.rpcUrls[0]);
    });

    it('should return undefined for unknown chain', () => {
      expect(manager.getRpcUrl(999)).toBeUndefined();
    });
  });

  describe('setRpcUrl', () => {
    it('should set RPC URL override', () => {
      manager.register(createEVMChain(1, 'Ethereum'));
      manager.setRpcUrl(1, 'https://override.rpc.io');

      expect(manager.getRpcUrl(1)).toBe('https://override.rpc.io');
    });
  });

  describe('getExplorerUrl', () => {
    it('should return explorer URL', () => {
      const chain = createEVMChain(1, 'Ethereum');
      manager.register(chain);

      expect(manager.getExplorerUrl(1)).toBe(chain.blockExplorerUrls![0]);
    });

    it('should return undefined for chain without explorer', () => {
      const chain: Chain = {
        id: 1,
        name: 'Test',
        type: 'evm',
        rpcUrls: [],
        testnet: false,
      } as EVMChain;
      manager.register(chain);

      expect(manager.getExplorerUrl(1)).toBeUndefined();
    });
  });

  describe('getNativeCurrency', () => {
    it('should return native currency', () => {
      const chain = createEVMChain(1, 'Ethereum');
      manager.register(chain);

      const currency = manager.getNativeCurrency(1);
      expect(currency?.symbol).toBe('ETH');
    });

    it('should return undefined for unknown chain', () => {
      expect(manager.getNativeCurrency(999)).toBeUndefined();
    });
  });

  describe('isTestnet', () => {
    it('should return true for testnet', () => {
      const chain: EVMChain = {
        ...createEVMChain(11155111, 'Sepolia'),
        testnet: true,
      };
      manager.register(chain);

      expect(manager.isTestnet(11155111)).toBe(true);
    });

    it('should return false for mainnet', () => {
      manager.register(createEVMChain(1, 'Ethereum'));
      expect(manager.isTestnet(1)).toBe(false);
    });

    it('should return false for unknown chain', () => {
      expect(manager.isTestnet(999)).toBe(false);
    });
  });

  describe('getChainIds', () => {
    it('should return all chain IDs', () => {
      manager.register(createEVMChain(1, 'Ethereum'));
      manager.register(createEVMChain(8453, 'Base'));

      const ids = manager.getChainIds();

      expect(ids).toContain(1);
      expect(ids).toContain(8453);
    });
  });

  describe('clear', () => {
    it('should clear all chains', () => {
      manager.register(createEVMChain(1, 'Ethereum'));
      manager.setRpcUrl(1, 'https://custom.rpc.io');
      manager.setCurrentChain(1);

      manager.clear();

      expect(manager.size).toBe(0);
      expect(manager.getCurrentChainId()).toBeUndefined();
    });
  });
});

describe('createChainManager', () => {
  it('should create a new ChainManagerImpl', () => {
    const manager = createChainManager();
    expect(manager).toBeInstanceOf(ChainManagerImpl);
  });

  it('should accept config', () => {
    const manager = createChainManager({ defaultChain: 1 });
    expect(manager).toBeInstanceOf(ChainManagerImpl);
  });
});
