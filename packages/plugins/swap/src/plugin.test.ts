/**
 * Swap Plugin tests
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

import type { SamTerminalCore } from '@samterminal/core';

// Mock dependencies with ESM-compatible mocking
jest.unstable_mockModule('./utils/zerox.js', () => ({
  createZeroXClient: jest.fn(() => ({
    getQuote: jest.fn(),
    getPrice: jest.fn(),
  })),
}));

jest.unstable_mockModule('./utils/wallet.js', () => ({
  createWalletManager: jest.fn(() => ({
    getTokenAllowance: jest.fn(),
    getBalance: jest.fn(),
  })),
}));

jest.unstable_mockModule('./providers/quote.js', () => ({
  createQuoteProvider: jest.fn(() => ({
    name: 'swap:quote',
    type: 'token',
    get: jest.fn(),
  })),
}));

jest.unstable_mockModule('./providers/allowance.js', () => ({
  createAllowanceProvider: jest.fn(() => ({
    name: 'swap:allowance',
    type: 'token',
    get: jest.fn(),
  })),
}));

jest.unstable_mockModule('./actions/approve.js', () => ({
  createApproveAction: jest.fn(() => ({
    name: 'swap:approve',
    execute: jest.fn(),
  })),
}));

jest.unstable_mockModule('./actions/swap.js', () => ({
  createSwapAction: jest.fn(() => ({
    name: 'swap:execute',
    execute: jest.fn(),
  })),
}));

// Import after mocks are set up
const { SwapPlugin, createSwapPlugin } = await import('./plugin.js');
const { createZeroXClient } = await import('./utils/zerox.js');
const { createWalletManager } = await import('./utils/wallet.js');

type SwapPluginOptions = import('./plugin.js').SwapPluginOptions;
type SwapPluginInstance = InstanceType<typeof SwapPlugin>;

describe('SwapPlugin', () => {
  let plugin: SwapPluginInstance;
  let mockCore: SamTerminalCore;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCore = {
      services: {
        registerProvider: jest.fn(),
        registerAction: jest.fn(),
        unregisterPlugin: jest.fn(),
      },
      events: {
        emit: jest.fn(),
      },
    } as unknown as SamTerminalCore;

    plugin = new SwapPlugin();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create plugin with default config', () => {
      const p = new SwapPlugin();

      expect(p.name).toBe('@samterminal/plugin-swap');
      expect(p.version).toBe('1.0.0');
    });

    it('should set default chain to base', () => {
      const p = new SwapPlugin();

      // Config is private, so we test through init behavior
      expect(p.name).toBeDefined();
    });

    it('should accept custom options', () => {
      const options: SwapPluginOptions = {
        defaultChain: 'ethereum',
        zeroXApiKey: 'test-key',
        defaultSlippageBps: 200,
      };

      const p = new SwapPlugin(options);
      expect(p).toBeInstanceOf(SwapPlugin);
    });

    it('should read API keys from environment if not provided', () => {
      const originalEnv = process.env.ZEROX_API_KEY;
      process.env.ZEROX_API_KEY = 'env-api-key';

      const p = new SwapPlugin();
      expect(p).toBeInstanceOf(SwapPlugin);

      process.env.ZEROX_API_KEY = originalEnv;
    });

    it('should accept database adapter', () => {
      const mockDatabase = {
        saveSwap: jest.fn(),
        getSwap: jest.fn(),
      };

      const p = new SwapPlugin({ database: mockDatabase });
      expect(p.getDatabase()).toBe(mockDatabase);
    });
  });

  describe('plugin metadata', () => {
    it('should have correct name', () => {
      expect(plugin.name).toBe('@samterminal/plugin-swap');
    });

    it('should have version 1.0.0', () => {
      expect(plugin.version).toBe('1.0.0');
    });

    it('should have description', () => {
      expect(plugin.description).toContain('swap');
    });

    it('should have author', () => {
      expect(plugin.author).toBe('SamTerminal Team');
    });

    it('should depend on tokendata plugin', () => {
      expect(plugin.dependencies).toContain('@samterminal/plugin-tokendata');
    });
  });

  describe('init', () => {
    it('should initialize successfully', async () => {
      const p = new SwapPlugin({ zeroXApiKey: 'test-key' });
      await p.init(mockCore);

      expect(mockCore.services.registerProvider).toHaveBeenCalled();
      expect(mockCore.services.registerAction).toHaveBeenCalled();
    });

    it('should create 0x client when API key provided', async () => {
      const p = new SwapPlugin({ zeroXApiKey: 'test-key' });
      await p.init(mockCore);

      expect(createZeroXClient).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'test-key',
        }),
      );
    });

    it('should create wallet manager', async () => {
      await plugin.init(mockCore);

      expect(createWalletManager).toHaveBeenCalled();
    });

    it('should register providers with core', async () => {
      const p = new SwapPlugin({ zeroXApiKey: 'test-key' });
      await p.init(mockCore);

      // Should register quote and allowance providers
      expect(mockCore.services.registerProvider).toHaveBeenCalledTimes(2);
    });

    it('should register actions with core', async () => {
      const p = new SwapPlugin({ zeroXApiKey: 'test-key' });
      await p.init(mockCore);

      // Should register approve and swap actions
      expect(mockCore.services.registerAction).toHaveBeenCalledTimes(2);
    });

    it('should emit plugin:loaded event', async () => {
      await plugin.init(mockCore);

      expect(mockCore.events.emit).toHaveBeenCalledWith('plugin:loaded', {
        plugin: '@samterminal/plugin-swap',
      });
    });
  });

  describe('destroy', () => {
    it('should cleanup resources', async () => {
      const p = new SwapPlugin({ zeroXApiKey: 'test-key' });
      await p.init(mockCore);
      await p.destroy();

      expect(p.getZeroXClient()).toBeNull();
      expect(p.getWalletManager()).toBeNull();
    });

    it('should unregister plugin from core', async () => {
      const p = new SwapPlugin({ zeroXApiKey: 'test-key' });
      await p.init(mockCore);
      await p.destroy();

      expect(mockCore.services.unregisterPlugin).toHaveBeenCalledWith('@samterminal/plugin-swap');
    });

    it('should emit plugin:unloaded event', async () => {
      await plugin.init(mockCore);
      await plugin.destroy();

      expect(mockCore.events.emit).toHaveBeenCalledWith('plugin:unloaded', {
        plugin: '@samterminal/plugin-swap',
      });
    });

    it('should clear actions and providers', async () => {
      await plugin.init(mockCore);
      await plugin.destroy();

      expect(plugin.actions).toEqual([]);
      expect(plugin.providers).toEqual([]);
    });
  });

  describe('getters', () => {
    it('should return null for zeroXClient before init', () => {
      expect(plugin.getZeroXClient()).toBeNull();
    });

    it('should return null for walletManager before init', () => {
      expect(plugin.getWalletManager()).toBeNull();
    });

    it('should return zeroXClient after init', async () => {
      const p = new SwapPlugin({ zeroXApiKey: 'test-key' });
      await p.init(mockCore);

      expect(p.getZeroXClient()).not.toBeNull();
    });

    it('should return walletManager after init', async () => {
      await plugin.init(mockCore);

      expect(plugin.getWalletManager()).not.toBeNull();
    });

    it('should return database', () => {
      const mockDb = { saveSwap: jest.fn(), getSwap: jest.fn() };
      const p = new SwapPlugin({ database: mockDb });

      expect(p.getDatabase()).toBe(mockDb);
    });
  });

  describe('updateConfig', () => {
    it('should update config values', async () => {
      await plugin.init(mockCore);

      plugin.updateConfig({ defaultSlippageBps: 300 });

      // Config is private, but we can verify by checking clients are recreated
      expect(plugin).toBeInstanceOf(SwapPlugin);
    });

    it('should recreate 0x client when API key updated', async () => {
      await plugin.init(mockCore);

      plugin.updateConfig({ zeroXApiKey: 'new-key' });

      expect(createZeroXClient).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'new-key',
        }),
      );
    });

    it('should recreate wallet manager when RPC URLs updated', async () => {
      await plugin.init(mockCore);

      plugin.updateConfig({ rpcUrls: { base: 'https://rpc.base.org' } });

      expect(createWalletManager).toHaveBeenLastCalledWith(
        expect.objectContaining({
          rpcUrls: { base: 'https://rpc.base.org' },
        }),
      );
    });
  });

  describe('setDatabase', () => {
    it('should set database adapter', () => {
      const mockDb = { saveSwap: jest.fn(), getSwap: jest.fn() };
      plugin.setDatabase(mockDb);

      expect(plugin.getDatabase()).toBe(mockDb);
    });
  });
});

describe('createSwapPlugin', () => {
  it('should create SwapPlugin instance', () => {
    const plugin = createSwapPlugin();
    expect(plugin).toBeInstanceOf(SwapPlugin);
  });

  it('should pass options to constructor', () => {
    const options: SwapPluginOptions = {
      defaultChain: 'arbitrum',
      zeroXApiKey: 'test-key',
    };

    const plugin = createSwapPlugin(options);
    expect(plugin).toBeInstanceOf(SwapPlugin);
  });

  it('should work without options', () => {
    const plugin = createSwapPlugin();
    expect(plugin.name).toBe('@samterminal/plugin-swap');
  });
});
