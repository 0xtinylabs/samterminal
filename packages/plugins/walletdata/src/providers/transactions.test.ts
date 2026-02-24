/**
 * Wallet transactions provider tests
 */


import { createWalletTransactionsProvider } from './transactions.js';
import type { WalletDataPluginConfig, WalletTransaction } from '../types/index.js';
import type { MoralisWalletClient } from '../utils/moralis.js';
import type { Cache } from '../utils/cache.js';
import type { ProviderContext } from '@samterminal/core';

describe('WalletTransactionsProvider', () => {
  let mockMoralis: MoralisWalletClient;
  let mockCache: Cache<WalletTransaction[]>;
  let config: WalletDataPluginConfig;

  beforeEach(() => {
    mockMoralis = {
      getWalletTransactions: jest.fn(),
    } as unknown as MoralisWalletClient;

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    } as unknown as Cache<WalletTransaction[]>;

    config = {
      defaultChain: 'base',
      enableCache: true,
      cacheTtl: 30000,
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
      const provider = createWalletTransactionsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      expect(provider.name).toBe('walletdata:transactions');
      expect(provider.type).toBe('transaction');
    });
  });

  describe('get', () => {
    it('should return error when address is missing', async () => {
      const provider = createWalletTransactionsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({}));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wallet address is required');
    });

    it('should return error when Moralis not available', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);

      const provider = createWalletTransactionsProvider(
        () => null,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Moralis API key required for transactions');
    });

    it('should return cached data when available', async () => {
      const cachedTxs: WalletTransaction[] = [
        {
          hash: '0xTxHash',
          chainId: 'base',
          blockNumber: 12345678,
          timestamp: 1700000000,
          from: '0xWallet',
          to: '0xRecipient',
          value: '1000000000000000000',
          valueFormatted: 1,
          type: 'outgoing',
          status: 'confirmed',
        },
      ];

      jest.mocked(mockCache.get).mockReturnValue(cachedTxs);

      const provider = createWalletTransactionsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(true);
      expect(result.cached).toBe(true);
      expect(result.data).toEqual(cachedTxs);
    });

    it('should fetch transactions from Moralis', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletTransactions).mockResolvedValue({
        result: [
          {
            hash: '0xTxHash',
            block_number: '12345678',
            block_timestamp: '2024-01-01T00:00:00Z',
            from_address: '0xWallet',
            to_address: '0xRecipient',
            value: '1000000000000000000',
            receipt_status: '1',
            receipt_gas_used: '21000',
            gas_price: '20000000000',
            method_label: 'transfer',
          },
        ],
      } as any);

      const provider = createWalletTransactionsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(expect.objectContaining({
        hash: '0xTxHash',
        blockNumber: 12345678,
        from: '0xWallet',
        to: '0xRecipient',
        status: 'confirmed',
        methodName: 'transfer',
      }));
    });

    it('should classify outgoing transactions', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletTransactions).mockResolvedValue({
        result: [
          {
            hash: '0xTx1',
            block_number: '1',
            block_timestamp: '2024-01-01T00:00:00Z',
            from_address: '0xWallet',
            to_address: '0xOther',
            value: '1',
            receipt_status: '1',
          },
        ],
      } as any);

      const provider = createWalletTransactionsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.data[0].type).toBe('outgoing');
    });

    it('should classify incoming transactions', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletTransactions).mockResolvedValue({
        result: [
          {
            hash: '0xTx1',
            block_number: '1',
            block_timestamp: '2024-01-01T00:00:00Z',
            from_address: '0xOther',
            to_address: '0xWallet',
            value: '1',
            receipt_status: '1',
          },
        ],
      } as any);

      const provider = createWalletTransactionsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.data[0].type).toBe('incoming');
    });

    it('should classify self transactions', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletTransactions).mockResolvedValue({
        result: [
          {
            hash: '0xTx1',
            block_number: '1',
            block_timestamp: '2024-01-01T00:00:00Z',
            from_address: '0xWallet',
            to_address: '0xWallet',
            value: '1',
            receipt_status: '1',
          },
        ],
      } as any);

      const provider = createWalletTransactionsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.data[0].type).toBe('self');
    });

    it('should classify failed transactions', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletTransactions).mockResolvedValue({
        result: [
          {
            hash: '0xTx1',
            block_number: '1',
            block_timestamp: '2024-01-01T00:00:00Z',
            from_address: '0xWallet',
            to_address: '0xOther',
            value: '1',
            receipt_status: '0',
          },
        ],
      } as any);

      const provider = createWalletTransactionsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.data[0].status).toBe('failed');
    });

    it('should filter by transaction type', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletTransactions).mockResolvedValue({
        result: [
          {
            hash: '0xTx1',
            block_number: '1',
            block_timestamp: '2024-01-01T00:00:00Z',
            from_address: '0xWallet',
            to_address: '0xOther',
            value: '1',
            receipt_status: '1',
          },
          {
            hash: '0xTx2',
            block_number: '2',
            block_timestamp: '2024-01-01T00:00:00Z',
            from_address: '0xOther',
            to_address: '0xWallet',
            value: '1',
            receipt_status: '1',
          },
        ],
      } as any);

      const provider = createWalletTransactionsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({
        address: '0xWallet',
        type: 'incoming',
      }));

      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe('incoming');
    });

    it('should use shorter cache TTL for transactions', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletTransactions).mockResolvedValue({
        result: [],
      } as any);

      const provider = createWalletTransactionsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      await provider.get(createContext({ address: '0xWallet' }));

      // Should use half the normal TTL
      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        15000, // 30000 / 2
      );
    });

    it('should handle Moralis errors', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletTransactions).mockRejectedValue(new Error('API Error'));

      const provider = createWalletTransactionsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });
  });
});
