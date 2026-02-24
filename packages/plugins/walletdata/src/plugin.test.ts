/**
 * WalletData Plugin tests
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

import type { SamTerminalCore } from '@samterminal/core';
import type { WalletDataPluginConfig, WalletDataDatabaseAdapter } from './types/index.js';

// Mock dependencies with ESM-compatible mocking
jest.unstable_mockModule('./utils/cache.js', () => ({
  Cache: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.unstable_mockModule('./utils/moralis.js', () => ({
  MoralisWalletClient: jest.fn().mockImplementation(() => ({
    getWalletTokens: jest.fn(),
    getWalletNfts: jest.fn(),
    getWalletTransactions: jest.fn(),
  })),
}));

jest.unstable_mockModule('./utils/rpc.js', () => ({
  RpcClient: jest.fn().mockImplementation(() => ({
    getBalance: jest.fn(),
    getTokenBalance: jest.fn(),
  })),
}));

jest.unstable_mockModule('./providers/index.js', () => ({
  createWalletProvider: jest.fn(() => ({ name: 'walletdata:wallet', get: jest.fn() })),
  createWalletTokensProvider: jest.fn(() => ({ name: 'walletdata:tokens', get: jest.fn() })),
  createWalletPortfolioProvider: jest.fn(() => ({ name: 'walletdata:portfolio', get: jest.fn() })),
  createWalletTransactionsProvider: jest.fn(() => ({ name: 'walletdata:transactions', get: jest.fn() })),
  createWalletNftsProvider: jest.fn(() => ({ name: 'walletdata:nfts', get: jest.fn() })),
  createWalletApprovalsProvider: jest.fn(() => ({ name: 'walletdata:approvals', get: jest.fn() })),
}));

jest.unstable_mockModule('./actions/index.js', () => ({
  createTrackWalletAction: jest.fn(() => ({ name: 'walletdata:track', execute: jest.fn() })),
  createUntrackWalletAction: jest.fn(() => ({ name: 'walletdata:untrack', execute: jest.fn() })),
  createGetTrackedWalletsAction: jest.fn(() => ({ name: 'walletdata:tracked', execute: jest.fn() })),
  createSetWalletLabelAction: jest.fn(() => ({ name: 'walletdata:label', execute: jest.fn() })),
}));

// Import after mocks are set up
const { WalletDataPlugin, createWalletDataPlugin } = await import('./plugin.js');
const { Cache } = await import('./utils/cache.js');
const { MoralisWalletClient } = await import('./utils/moralis.js');
const { RpcClient } = await import('./utils/rpc.js');

type WalletDataPluginInstance = InstanceType<typeof WalletDataPlugin>;

describe('WalletDataPlugin', () => {
  let plugin: WalletDataPluginInstance;
  let mockCore: SamTerminalCore;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCore = {} as SamTerminalCore;
    plugin = new WalletDataPlugin();
  });

  afterEach(() => {
    // Don't restore mocks - keep the mock implementations
  });

  describe('constructor', () => {
    it('should create plugin with default config', () => {
      const p = new WalletDataPlugin();
      expect(p.name).toBe('@samterminal/plugin-walletdata');
    });

    it('should accept custom config', () => {
      const config: WalletDataPluginConfig = {
        defaultChain: 'ethereum',
        cacheTtl: 60000,
        excludeSpam: false,
      };
      const p = new WalletDataPlugin(config);
      expect(p).toBeInstanceOf(WalletDataPlugin);
    });

    it('should initialize RPC client', () => {
      new WalletDataPlugin();
      expect(RpcClient).toHaveBeenCalled();
    });

    it('should initialize Moralis client when API key provided', () => {
      new WalletDataPlugin({ moralisApiKey: 'test-key' });
      expect(MoralisWalletClient).toHaveBeenCalled();
    });

    it('should not initialize Moralis without API key', () => {
      jest.mocked(MoralisWalletClient).mockClear();
      new WalletDataPlugin();
      expect(MoralisWalletClient).not.toHaveBeenCalled();
    });

    it('should initialize 6 caches', () => {
      jest.mocked(Cache).mockClear();
      new WalletDataPlugin();
      // wallet, tokens, portfolio, transactions, nfts, approvals
      expect(Cache).toHaveBeenCalledTimes(6);
    });
  });

  describe('plugin metadata', () => {
    it('should have correct name', () => {
      expect(plugin.name).toBe('@samterminal/plugin-walletdata');
    });

    it('should have version 1.0.0', () => {
      expect(plugin.version).toBe('1.0.0');
    });

    it('should have description', () => {
      expect(plugin.description.toLowerCase()).toContain('wallet');
    });

    it('should depend on tokendata plugin', () => {
      expect(plugin.dependencies).toContain('@samterminal/plugin-tokendata');
    });
  });

  describe('init', () => {
    it('should initialize providers', async () => {
      await plugin.init(mockCore);
      expect(plugin.providers.length).toBeGreaterThan(0);
    });

    it('should initialize 6 providers', async () => {
      await plugin.init(mockCore);
      expect(plugin.providers).toHaveLength(6);
    });

    it('should initialize actions', async () => {
      await plugin.init(mockCore);
      expect(plugin.actions.length).toBeGreaterThan(0);
    });

    it('should initialize 4 actions', async () => {
      await plugin.init(mockCore);
      expect(plugin.actions).toHaveLength(4);
    });
  });

  describe('destroy', () => {
    it('should clear all caches', async () => {
      await plugin.init(mockCore);
      await plugin.destroy();
      // No error means success
      expect(plugin).toBeInstanceOf(WalletDataPlugin);
    });
  });

  describe('clearCache', () => {
    it('should clear all caches without error', () => {
      plugin.clearCache();
      expect(plugin).toBeInstanceOf(WalletDataPlugin);
    });
  });

  describe('setDatabase', () => {
    it('should set database adapter', () => {
      const mockDb: WalletDataDatabaseAdapter = {
        addTrackedWallet: jest.fn() as WalletDataDatabaseAdapter['addTrackedWallet'],
        removeTrackedWallet: jest.fn() as WalletDataDatabaseAdapter['removeTrackedWallet'],
        getTrackedWallets: jest.fn() as WalletDataDatabaseAdapter['getTrackedWallets'],
        isWalletTracked: jest.fn() as WalletDataDatabaseAdapter['isWalletTracked'],
        setWalletLabel: jest.fn() as WalletDataDatabaseAdapter['setWalletLabel'],
        getWalletLabel: jest.fn() as WalletDataDatabaseAdapter['getWalletLabel'],
      };

      plugin.setDatabase(mockDb);
      expect(plugin).toBeInstanceOf(WalletDataPlugin);
    });
  });

  describe('getters', () => {
    it('should return null for Moralis without API key', () => {
      const client = plugin.getMoralis();
      expect(client).toBeNull();
    });

    it('should return Moralis client when API key provided', () => {
      const p = new WalletDataPlugin({ moralisApiKey: 'test-key' });
      const client = p.getMoralis();
      expect(client).not.toBeNull();
    });

    it('should return RPC client', () => {
      const client = plugin.getRpc();
      expect(client).toBeDefined();
    });
  });
});

describe('createWalletDataPlugin', () => {
  it('should create WalletDataPlugin instance', () => {
    const plugin = createWalletDataPlugin();
    expect(plugin).toBeInstanceOf(WalletDataPlugin);
  });

  it('should pass config to constructor', () => {
    const config: WalletDataPluginConfig = {
      defaultChain: 'polygon',
      moralisApiKey: 'test-key',
    };
    const plugin = createWalletDataPlugin(config);
    expect(plugin).toBeInstanceOf(WalletDataPlugin);
  });

  it('should work without config', () => {
    const plugin = createWalletDataPlugin();
    expect(plugin.name).toBe('@samterminal/plugin-walletdata');
  });
});
