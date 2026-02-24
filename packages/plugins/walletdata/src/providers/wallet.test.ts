/**
 * Wallet provider tests
 */


import { createWalletProvider } from './wallet.js';
import type { WalletDataPluginConfig, Wallet } from '../types/index.js';
import type { MoralisWalletClient } from '../utils/moralis.js';
import type { RpcClient } from '../utils/rpc.js';
import type { Cache } from '../utils/cache.js';
import type { ProviderContext } from '@samterminal/core';

describe('WalletProvider', () => {
  let mockMoralis: MoralisWalletClient;
  let mockRpc: RpcClient;
  let mockCache: Cache<Wallet>;
  let config: WalletDataPluginConfig;

  beforeEach(() => {
    mockMoralis = {
      getWalletTokens: jest.fn(),
    } as unknown as MoralisWalletClient;

    mockRpc = {
      getNativeBalance: jest.fn(),
    } as unknown as RpcClient;

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    } as unknown as Cache<Wallet>;

    config = {
      defaultChain: 'base',
      enableCache: true,
      cacheTtl: 30000,
      excludeSpam: true,
    };
  });

  const createContext = (query: unknown): ProviderContext => ({
    query,
    params: {},
    user: undefined,
    metadata: {},
  });

  describe('provider metadata', () => {
    it('should have correct name and type', () => {
      const provider = createWalletProvider(
        () => mockMoralis,
        () => mockRpc,
        () => mockCache,
        config,
      );

      expect(provider.name).toBe('walletdata:wallet');
      expect(provider.type).toBe('wallet');
    });
  });

  describe('get', () => {
    it('should return error when address is missing', async () => {
      const provider = createWalletProvider(
        () => mockMoralis,
        () => mockRpc,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({}));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wallet address is required');
    });

    it('should return cached data when available', async () => {
      const cachedWallet: Wallet = {
        address: '0xwallet',
        chainId: 'base',
        totalValueUsd: 1000,
        nativeBalance: '1000000000000000000',
        nativeBalanceFormatted: 1,
        nativeValueUsd: 500,
        tokenCount: 5,
        lastUpdated: new Date().toISOString(),
      };

      jest.mocked(mockCache.get).mockReturnValue(cachedWallet);

      const provider = createWalletProvider(
        () => mockMoralis,
        () => mockRpc,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(true);
      expect(result.cached).toBe(true);
      expect(result.data).toEqual(cachedWallet);
    });

    it('should fetch wallet data from RPC and Moralis', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockRpc.getNativeBalance).mockResolvedValue({
        balance: '1000000000000000000',
        balanceFormatted: 1,
      });
      jest.mocked(mockMoralis.getWalletTokens).mockResolvedValue({
        result: [
          {
            native_token: true,
            balance: '1000000000000000000',
            balance_formatted: '1.0',
            usd_value: 3000,
          },
          {
            native_token: false,
            token_address: '0xToken1',
            balance: '100000000',
            balance_formatted: '100',
            usd_value: 500,
          },
          {
            native_token: false,
            token_address: '0xToken2',
            balance: '200000000',
            balance_formatted: '200',
            usd_value: 200,
          },
        ],
      } as any);

      const provider = createWalletProvider(
        () => mockMoralis,
        () => mockRpc,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(true);
      expect(result.data?.totalValueUsd).toBe(3700); // 3000 + 500 + 200
      expect(result.data?.nativeValueUsd).toBe(3000);
      expect(result.data?.tokenCount).toBe(2); // Excluding native token
    });

    it('should use query chainId over default', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockRpc.getNativeBalance).mockResolvedValue({
        balance: '1000000000000000000',
        balanceFormatted: 1,
      });
      jest.mocked(mockMoralis.getWalletTokens).mockResolvedValue({ result: [] } as any);

      const provider = createWalletProvider(
        () => mockMoralis,
        () => mockRpc,
        () => mockCache,
        config,
      );

      await provider.get(createContext({ address: '0xWallet', chainId: 'ethereum' }));

      expect(mockMoralis.getWalletTokens).toHaveBeenCalledWith('0xWallet', 'ethereum', expect.any(Object));
    });

    it('should handle RPC errors gracefully', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockRpc.getNativeBalance).mockRejectedValue(new Error('RPC error'));
      jest.mocked(mockMoralis.getWalletTokens).mockResolvedValue({
        result: [
          {
            native_token: true,
            balance: '1000000000000000000',
            balance_formatted: '1.0',
            usd_value: 3000,
          },
        ],
      } as any);

      const provider = createWalletProvider(
        () => mockMoralis,
        () => mockRpc,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      // Should still return Moralis data
      expect(result.success).toBe(true);
      expect(result.data?.nativeValueUsd).toBe(3000);
    });

    it('should handle Moralis errors gracefully', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockRpc.getNativeBalance).mockResolvedValue({
        balance: '1000000000000000000',
        balanceFormatted: 1,
      });
      jest.mocked(mockMoralis.getWalletTokens).mockRejectedValue(new Error('Moralis error'));

      const provider = createWalletProvider(
        () => mockMoralis,
        () => mockRpc,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      // Should still return partial data
      expect(result.success).toBe(true);
      expect(result.data?.nativeBalance).toBe('1000000000000000000');
    });

    it('should work without Moralis client', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockRpc.getNativeBalance).mockResolvedValue({
        balance: '1000000000000000000',
        balanceFormatted: 1,
      });

      const provider = createWalletProvider(
        () => null,
        () => mockRpc,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(true);
      expect(result.data?.nativeBalanceFormatted).toBe(1);
      expect(result.data?.tokenCount).toBe(0);
    });

    it('should cache result after fetching', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockRpc.getNativeBalance).mockResolvedValue({
        balance: '1000000000000000000',
        balanceFormatted: 1,
      });
      jest.mocked(mockMoralis.getWalletTokens).mockResolvedValue({ result: [] } as any);

      const provider = createWalletProvider(
        () => mockMoralis,
        () => mockRpc,
        () => mockCache,
        config,
      );

      await provider.get(createContext({ address: '0xWallet' }));

      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ address: '0xwallet' }),
        30000,
      );
    });

    it('should not use cache when disabled', async () => {
      const noCacheConfig: WalletDataPluginConfig = {
        ...config,
        enableCache: false,
      };

      jest.mocked(mockRpc.getNativeBalance).mockResolvedValue({
        balance: '0',
        balanceFormatted: 0,
      });

      const provider = createWalletProvider(
        () => null,
        () => mockRpc,
        () => mockCache,
        noCacheConfig,
      );

      await provider.get(createContext({ address: '0xWallet' }));

      expect(mockCache.get).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });
});
