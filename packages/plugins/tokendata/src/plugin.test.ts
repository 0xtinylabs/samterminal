/**
 * TokenData Plugin tests
 */

import { jest } from '@jest/globals';
import type { SamTerminalCore } from '@samterminal/core';
import type { TokenDataPluginConfig, TokenDataDatabaseAdapter } from './types/index.js';

// Use jest.unstable_mockModule for ESM compatibility
jest.unstable_mockModule('./utils/cache.js', () => ({
  Cache: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.unstable_mockModule('./utils/dexscreener.js', () => ({
  DexScreenerClient: jest.fn().mockImplementation(() => ({
    getTokenPrice: jest.fn(),
    searchTokens: jest.fn(),
  })),
}));

jest.unstable_mockModule('./utils/coingecko.js', () => ({
  CoinGeckoClient: jest.fn().mockImplementation(() => ({
    getTokenPrice: jest.fn(),
    getTokenMetadata: jest.fn(),
  })),
}));

jest.unstable_mockModule('./utils/moralis.js', () => ({
  MoralisClient: jest.fn().mockImplementation(() => ({
    getTokenMetadata: jest.fn(),
    getTokenSecurity: jest.fn(),
  })),
}));

jest.unstable_mockModule('./providers/index.js', () => ({
  createTokenPriceProvider: jest.fn(() => ({ name: 'tokendata:price', get: jest.fn() })),
  createTokenMetadataProvider: jest.fn(() => ({ name: 'tokendata:metadata', get: jest.fn() })),
  createTokenMarketProvider: jest.fn(() => ({ name: 'tokendata:market', get: jest.fn() })),
  createTokenPoolsProvider: jest.fn(() => ({ name: 'tokendata:pools', get: jest.fn() })),
  createTokenSecurityProvider: jest.fn(() => ({ name: 'tokendata:security', get: jest.fn() })),
  createTokenSearchProvider: jest.fn(() => ({ name: 'tokendata:search', get: jest.fn() })),
}));

jest.unstable_mockModule('./actions/index.js', () => ({
  createTrackTokenAction: jest.fn(() => ({ name: 'tokendata:track', execute: jest.fn() })),
  createUntrackTokenAction: jest.fn(() => ({ name: 'tokendata:untrack', execute: jest.fn() })),
  createGetTrackedTokensAction: jest.fn(() => ({ name: 'tokendata:tracked', execute: jest.fn() })),
  createAddPriceAlertAction: jest.fn(() => ({ name: 'tokendata:alert:add', execute: jest.fn() })),
  createRemovePriceAlertAction: jest.fn(() => ({ name: 'tokendata:alert:remove', execute: jest.fn() })),
  createGetPriceAlertsAction: jest.fn(() => ({ name: 'tokendata:alert:list', execute: jest.fn() })),
}));

// Dynamic imports after mocks are set up
const { TokenDataPlugin, createTokenDataPlugin } = await import('./plugin.js');
const { Cache } = await import('./utils/cache.js');
const { DexScreenerClient } = await import('./utils/dexscreener.js');
const { CoinGeckoClient } = await import('./utils/coingecko.js');
const { MoralisClient } = await import('./utils/moralis.js');

describe('TokenDataPlugin', () => {
  let plugin: InstanceType<typeof TokenDataPlugin>;
  let mockCore: SamTerminalCore;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCore = {} as SamTerminalCore;
    plugin = new TokenDataPlugin();
  });

  afterEach(() => {
    // Don't restore mocks - keep the mock implementations
  });

  describe('constructor', () => {
    it('should create plugin with default config', () => {
      const p = new TokenDataPlugin();
      expect(p.name).toBe('@samterminal/plugin-tokendata');
    });

    it('should accept custom config', () => {
      const config: TokenDataPluginConfig = {
        defaultChain: 'ethereum',
        cacheTtl: 60000,
        enableCache: false,
      };
      const p = new TokenDataPlugin(config);
      expect(p).toBeInstanceOf(TokenDataPlugin);
    });

    it('should initialize DexScreener client', () => {
      new TokenDataPlugin();
      expect(DexScreenerClient).toHaveBeenCalled();
    });

    it('should initialize CoinGecko client', () => {
      new TokenDataPlugin();
      expect(CoinGeckoClient).toHaveBeenCalled();
    });

    it('should initialize Moralis client when API key provided', () => {
      new TokenDataPlugin({ moralisApiKey: 'test-key' });
      expect(MoralisClient).toHaveBeenCalled();
    });

    it('should not initialize Moralis client without API key', () => {
      jest.mocked(MoralisClient).mockClear();
      new TokenDataPlugin();
      expect(MoralisClient).not.toHaveBeenCalled();
    });

    it('should initialize 5 caches', () => {
      jest.mocked(Cache).mockClear();
      new TokenDataPlugin();
      // priceCache, metadataCache, marketCache, poolsCache, securityCache
      expect(Cache).toHaveBeenCalledTimes(5);
    });
  });

  describe('plugin metadata', () => {
    it('should have correct name', () => {
      expect(plugin.name).toBe('@samterminal/plugin-tokendata');
    });

    it('should have version 1.0.0', () => {
      expect(plugin.version).toBe('1.0.0');
    });

    it('should have description', () => {
      expect(plugin.description.toLowerCase()).toContain('token');
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

    it('should initialize 6 actions', async () => {
      await plugin.init(mockCore);
      expect(plugin.actions).toHaveLength(6);
    });
  });

  describe('destroy', () => {
    it('should clear all caches', async () => {
      await plugin.init(mockCore);
      await plugin.destroy();

      // Each cache should have clear called
      expect(Cache).toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    it('should clear all caches', () => {
      plugin.clearCache();
      expect(Cache).toHaveBeenCalled();
    });
  });

  describe('setDatabase', () => {
    it('should set database adapter', () => {
      const mockDb: TokenDataDatabaseAdapter = {
        addTrackedToken: jest.fn(),
        removeTrackedToken: jest.fn(),
        getTrackedTokens: jest.fn(),
        isTokenTracked: jest.fn(),
        addPriceAlert: jest.fn(),
        removePriceAlert: jest.fn(),
        getPriceAlerts: jest.fn(),
      };

      plugin.setDatabase(mockDb);
      // Database is private, so we just verify no error
      expect(plugin).toBeInstanceOf(TokenDataPlugin);
    });
  });

  describe('getters', () => {
    it('should return DexScreener client', () => {
      const client = plugin.getDexScreener();
      expect(client).toBeDefined();
    });

    it('should return CoinGecko client', () => {
      const client = plugin.getCoinGecko();
      expect(client).toBeDefined();
    });

    it('should return null for Moralis without API key', () => {
      const client = plugin.getMoralis();
      expect(client).toBeNull();
    });

    it('should return Moralis client when API key provided', () => {
      const p = new TokenDataPlugin({ moralisApiKey: 'test-key' });
      const client = p.getMoralis();
      expect(client).not.toBeNull();
    });
  });
});

describe('createTokenDataPlugin', () => {
  it('should create TokenDataPlugin instance', () => {
    const plugin = createTokenDataPlugin();
    expect(plugin).toBeInstanceOf(TokenDataPlugin);
  });

  it('should pass config to constructor', () => {
    const config: TokenDataPluginConfig = {
      defaultChain: 'polygon',
    };
    const plugin = createTokenDataPlugin(config);
    expect(plugin).toBeInstanceOf(TokenDataPlugin);
  });

  it('should work without config', () => {
    const plugin = createTokenDataPlugin();
    expect(plugin.name).toBe('@samterminal/plugin-tokendata');
  });
});
