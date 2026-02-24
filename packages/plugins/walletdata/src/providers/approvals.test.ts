/**
 * Wallet approvals provider tests
 */


import { createWalletApprovalsProvider } from './approvals.js';
import type { WalletDataPluginConfig, TokenApproval } from '../types/index.js';
import type { MoralisWalletClient } from '../utils/moralis.js';
import type { Cache } from '../utils/cache.js';
import type { ProviderContext } from '@samterminal/core';

describe('WalletApprovalsProvider', () => {
  let mockMoralis: MoralisWalletClient;
  let mockCache: Cache<TokenApproval[]>;
  let config: WalletDataPluginConfig;

  beforeEach(() => {
    mockMoralis = {
      getWalletApprovals: jest.fn(),
    } as unknown as MoralisWalletClient;

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    } as unknown as Cache<TokenApproval[]>;

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
      const provider = createWalletApprovalsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      expect(provider.name).toBe('walletdata:approvals');
      expect(provider.type).toBe('wallet');
    });
  });

  describe('get', () => {
    it('should return error when address is missing', async () => {
      const provider = createWalletApprovalsProvider(
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

      const provider = createWalletApprovalsProvider(
        () => null,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Moralis API key required for approvals');
    });

    it('should return cached data when available', async () => {
      const cachedApprovals: TokenApproval[] = [
        {
          tokenAddress: '0xToken',
          tokenSymbol: 'TK',
          spenderAddress: '0xSpender',
          allowance: '1000000000000000000',
          allowanceFormatted: 1,
          isUnlimited: false,
          approvedAt: 1700000000,
        },
      ];

      jest.mocked(mockCache.get).mockReturnValue(cachedApprovals);

      const provider = createWalletApprovalsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(true);
      expect(result.cached).toBe(true);
      expect(result.data).toEqual(cachedApprovals);
    });

    it('should fetch approvals from Moralis', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletApprovals).mockResolvedValue({
        result: [
          {
            token: {
              address: '0xToken',
              symbol: 'TK',
              decimals: 18,
            },
            spender: {
              address: '0xSpender',
              address_label: 'Uniswap Router',
            },
            value: '1000000000000000000',
            block_timestamp: '2024-01-01T00:00:00Z',
          },
        ],
      } as any);

      const provider = createWalletApprovalsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(expect.objectContaining({
        tokenAddress: '0xToken',
        tokenSymbol: 'TK',
        spenderAddress: '0xSpender',
        spenderName: 'Uniswap Router',
        allowance: '1000000000000000000',
        isUnlimited: false,
      }));
    });

    it('should identify unlimited approvals', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletApprovals).mockResolvedValue({
        result: [
          {
            token: { address: '0xToken', symbol: 'TK', decimals: 18 },
            spender: { address: '0xSpender' },
            // Max uint256
            value: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
            block_timestamp: '2024-01-01T00:00:00Z',
          },
        ],
      } as any);

      const provider = createWalletApprovalsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.data[0].isUnlimited).toBe(true);
      expect(result.data[0].allowanceFormatted).toBe(Infinity);
    });

    it('should filter out zero approvals by default', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletApprovals).mockResolvedValue({
        result: [
          {
            token: { address: '0xToken1', symbol: 'TK1', decimals: 18 },
            spender: { address: '0xSpender1' },
            value: '1000000000000000000',
            block_timestamp: '2024-01-01T00:00:00Z',
          },
          {
            token: { address: '0xToken2', symbol: 'TK2', decimals: 18 },
            spender: { address: '0xSpender2' },
            value: '0',
            block_timestamp: '2024-01-01T00:00:00Z',
          },
        ],
      } as any);

      const provider = createWalletApprovalsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.data).toHaveLength(1);
      expect(result.data[0].tokenAddress).toBe('0xToken1');
    });

    it('should include zero approvals when requested', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletApprovals).mockResolvedValue({
        result: [
          {
            token: { address: '0xToken1', symbol: 'TK1', decimals: 18 },
            spender: { address: '0xSpender1' },
            value: '1000000000000000000',
            block_timestamp: '2024-01-01T00:00:00Z',
          },
          {
            token: { address: '0xToken2', symbol: 'TK2', decimals: 18 },
            spender: { address: '0xSpender2' },
            value: '0',
            block_timestamp: '2024-01-01T00:00:00Z',
          },
        ],
      } as any);

      const provider = createWalletApprovalsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({
        address: '0xWallet',
        includeZero: true,
      }));

      expect(result.data).toHaveLength(2);
    });

    it('should sort by most recent approval', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletApprovals).mockResolvedValue({
        result: [
          {
            token: { address: '0xToken1', symbol: 'TK1', decimals: 18 },
            spender: { address: '0xSpender1' },
            value: '100',
            block_timestamp: '2024-01-01T00:00:00Z', // Older
          },
          {
            token: { address: '0xToken2', symbol: 'TK2', decimals: 18 },
            spender: { address: '0xSpender2' },
            value: '200',
            block_timestamp: '2024-02-01T00:00:00Z', // Newer
          },
        ],
      } as any);

      const provider = createWalletApprovalsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.data[0].tokenAddress).toBe('0xToken2'); // More recent first
      expect(result.data[1].tokenAddress).toBe('0xToken1');
    });

    it('should cache result after fetching', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletApprovals).mockResolvedValue({
        result: [
          {
            token: { address: '0xToken', symbol: 'TK', decimals: 18 },
            spender: { address: '0xSpender' },
            value: '100',
            block_timestamp: '2024-01-01T00:00:00Z',
          },
        ],
      } as any);

      const provider = createWalletApprovalsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      await provider.get(createContext({ address: '0xWallet' }));

      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ tokenAddress: '0xToken' }),
        ]),
        30000,
      );
    });

    it('should handle Moralis errors', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletApprovals).mockRejectedValue(new Error('API Error'));

      const provider = createWalletApprovalsProvider(
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
