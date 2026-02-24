/**
 * DexScreener client tests
 */

import { jest } from '@jest/globals';
import type { ChainId } from '../types/index.js';

// Create mock functions at module level
const mockGet = jest.fn();

// Use jest.unstable_mockModule for ESM compatibility
jest.unstable_mockModule('axios', () => ({
  default: {
    create: () => ({
      get: (...args: unknown[]) => mockGet(...args),
      defaults: { headers: { common: {} } },
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    }),
  },
}));

// Dynamic import after mock is set up
const { DexScreenerClient } = await import('./dexscreener.js');

describe('DexScreenerClient', () => {
  let client: InstanceType<typeof DexScreenerClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReset();
    client = new DexScreenerClient();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create client with default config', () => {
      expect(client).toBeInstanceOf(DexScreenerClient);
    });

    it('should create client with API key', () => {
      const clientWithKey = new DexScreenerClient({ apiKey: 'test-key' });
      expect(clientWithKey).toBeInstanceOf(DexScreenerClient);
    });

    it('should create client with custom timeout', () => {
      const clientWithTimeout = new DexScreenerClient({ timeout: 30000 });
      expect(clientWithTimeout).toBeInstanceOf(DexScreenerClient);
    });
  });

  describe('getPairByAddress', () => {
    it('should return pair data for valid address', async () => {
      const mockPair = {
        chainId: 'base',
        pairAddress: '0xPairAddress',
        baseToken: { address: '0xToken', name: 'Test', symbol: 'TEST' },
        quoteToken: { address: '0xUSDC', name: 'USDC', symbol: 'USDC' },
        priceUsd: '1.5',
        priceNative: '0.0005',
      };

      mockGet.mockResolvedValue({
        data: { pairs: [mockPair] },
      });

      const result = await client.getPairByAddress('base', '0xPairAddress');

      expect(mockGet).toHaveBeenCalledWith('/latest/dex/pairs/base/0xPairAddress');
      expect(result).toEqual(mockPair);
    });

    it('should return null when no pairs found', async () => {
      mockGet.mockResolvedValue({
        data: { pairs: [] },
      });

      const result = await client.getPairByAddress('base', '0xNonExistent');
      expect(result).toBeNull();
    });

    it('should return null when pairs is null', async () => {
      mockGet.mockResolvedValue({
        data: { pairs: null },
      });

      const result = await client.getPairByAddress('base', '0xNonExistent');
      expect(result).toBeNull();
    });

    it('should throw for unsupported chain', async () => {
      await expect(
        client.getPairByAddress('unsupported' as ChainId, '0xAddress'),
      ).rejects.toThrow('Unsupported chain: unsupported');
    });

    it('should work with different chains', async () => {
      mockGet.mockResolvedValue({ data: { pairs: [{ priceUsd: '1.0' }] } });

      const chains: ChainId[] = ['base', 'ethereum', 'arbitrum', 'polygon', 'optimism', 'bsc'];

      for (const chain of chains) {
        await client.getPairByAddress(chain, '0xAddress');
        expect(mockGet).toHaveBeenCalledWith(`/latest/dex/pairs/${chain}/0xAddress`);
        mockGet.mockClear();
      }
    });
  });

  describe('getTokenPairs', () => {
    it('should return all pairs for a token', async () => {
      const mockPairs = [
        { pairAddress: '0xPair1', priceUsd: '1.5' },
        { pairAddress: '0xPair2', priceUsd: '1.4' },
      ];

      mockGet.mockResolvedValue({
        data: { pairs: mockPairs },
      });

      const result = await client.getTokenPairs('0xTokenAddress');

      expect(mockGet).toHaveBeenCalledWith('/latest/dex/tokens/0xTokenAddress');
      expect(result).toEqual(mockPairs);
    });

    it('should filter by chain when provided', async () => {
      mockGet.mockResolvedValue({ data: { pairs: [] } });

      await client.getTokenPairs('0xToken', 'base');

      expect(mockGet).toHaveBeenCalledWith('/latest/dex/tokens/0xToken?chain=base');
    });

    it('should return empty array when pairs is null', async () => {
      mockGet.mockResolvedValue({ data: { pairs: null } });

      const result = await client.getTokenPairs('0xToken');
      expect(result).toEqual([]);
    });

    it('should throw for unsupported chain filter', async () => {
      await expect(
        client.getTokenPairs('0xToken', 'unsupported' as ChainId),
      ).rejects.toThrow('Unsupported chain: unsupported');
    });
  });

  describe('searchTokens', () => {
    it('should search tokens by query', async () => {
      const mockPairs = [
        { baseToken: { symbol: 'DOGE' } },
        { baseToken: { symbol: 'SHIB' } },
      ];

      mockGet.mockResolvedValue({ data: { pairs: mockPairs } });

      const result = await client.searchTokens('dog');

      expect(mockGet).toHaveBeenCalledWith('/latest/dex/search?q=dog');
      expect(result).toEqual(mockPairs);
    });

    it('should encode special characters in query', async () => {
      mockGet.mockResolvedValue({ data: { pairs: [] } });

      await client.searchTokens('hello world');

      expect(mockGet).toHaveBeenCalledWith('/latest/dex/search?q=hello%20world');
    });

    it('should return empty array when pairs is null', async () => {
      mockGet.mockResolvedValue({ data: { pairs: null } });

      const result = await client.searchTokens('test');
      expect(result).toEqual([]);
    });
  });

  describe('getBoostedTokens', () => {
    it('should return boosted tokens', async () => {
      const mockPairs = [
        { baseToken: { symbol: 'BOOST1' } },
        { baseToken: { symbol: 'BOOST2' } },
      ];

      mockGet.mockResolvedValue({ data: { pairs: mockPairs } });

      const result = await client.getBoostedTokens();

      expect(mockGet).toHaveBeenCalledWith('/token-boosts/top/v1');
      expect(result).toEqual(mockPairs);
    });

    it('should return empty array when pairs is null', async () => {
      mockGet.mockResolvedValue({ data: { pairs: null } });

      const result = await client.getBoostedTokens();
      expect(result).toEqual([]);
    });
  });

  describe('getLatestProfiles', () => {
    it('should return latest token profiles', async () => {
      const mockPairs = [
        { baseToken: { symbol: 'NEW1' } },
        { baseToken: { symbol: 'NEW2' } },
      ];

      mockGet.mockResolvedValue({ data: { pairs: mockPairs } });

      const result = await client.getLatestProfiles();

      expect(mockGet).toHaveBeenCalledWith('/token-profiles/latest/v1');
      expect(result).toEqual(mockPairs);
    });

    it('should return empty array when pairs is null', async () => {
      mockGet.mockResolvedValue({ data: { pairs: null } });

      const result = await client.getLatestProfiles();
      expect(result).toEqual([]);
    });
  });

  describe('getBestPair', () => {
    it('should return pair with highest liquidity', async () => {
      const mockPairs = [
        { pairAddress: '0xLowLiq', liquidity: { usd: 10000 } },
        { pairAddress: '0xHighLiq', liquidity: { usd: 1000000 } },
        { pairAddress: '0xMedLiq', liquidity: { usd: 50000 } },
      ];

      mockGet.mockResolvedValue({ data: { pairs: mockPairs } });

      const result = await client.getBestPair('0xToken');

      expect(result?.pairAddress).toBe('0xHighLiq');
    });

    it('should return null when no pairs found', async () => {
      mockGet.mockResolvedValue({ data: { pairs: [] } });

      const result = await client.getBestPair('0xToken');
      expect(result).toBeNull();
    });

    it('should handle pairs without liquidity data', async () => {
      const mockPairs = [
        { pairAddress: '0xNoLiq' },
        { pairAddress: '0xHasLiq', liquidity: { usd: 1000 } },
      ];

      mockGet.mockResolvedValue({ data: { pairs: mockPairs } });

      const result = await client.getBestPair('0xToken');
      expect(result?.pairAddress).toBe('0xHasLiq');
    });

    it('should filter by chain when provided', async () => {
      mockGet.mockResolvedValue({ data: { pairs: [{ liquidity: { usd: 1000 } }] } });

      await client.getBestPair('0xToken', 'ethereum');

      expect(mockGet).toHaveBeenCalledWith('/latest/dex/tokens/0xToken?chain=ethereum');
    });
  });

  describe('getTokenPrice', () => {
    it('should return token price from best pair', async () => {
      mockGet.mockResolvedValue({
        data: {
          pairs: [
            { priceUsd: '1.5', liquidity: { usd: 100000 } },
          ],
        },
      });

      const result = await client.getTokenPrice('0xToken');

      expect(result).toBe(1.5);
    });

    it('should return null when no pairs found', async () => {
      mockGet.mockResolvedValue({ data: { pairs: [] } });

      const result = await client.getTokenPrice('0xToken');
      expect(result).toBeNull();
    });

    it('should filter by chain when provided', async () => {
      mockGet.mockResolvedValue({
        data: {
          pairs: [{ priceUsd: '2.0', liquidity: { usd: 50000 } }],
        },
      });

      const result = await client.getTokenPrice('0xToken', 'base');

      expect(result).toBe(2.0);
      expect(mockGet).toHaveBeenCalledWith('/latest/dex/tokens/0xToken?chain=base');
    });
  });
});
