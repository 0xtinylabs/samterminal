/**
 * CoinGecko client tests
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
    isAxiosError: (error: unknown) => {
      return error && typeof error === 'object' && 'isAxiosError' in error;
    },
  },
}));

// Dynamic import after mock is set up
const { CoinGeckoClient } = await import('./coingecko.js');

describe('CoinGeckoClient', () => {
  let client: InstanceType<typeof CoinGeckoClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReset();
    client = new CoinGeckoClient();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create client with default config (free tier)', () => {
      const freeClient = new CoinGeckoClient();
      expect(freeClient).toBeInstanceOf(CoinGeckoClient);
    });

    it('should create client with API key (pro tier)', () => {
      const proClient = new CoinGeckoClient({ apiKey: 'test-api-key' });
      expect(proClient).toBeInstanceOf(CoinGeckoClient);
    });

    it('should create client with custom timeout', () => {
      const customClient = new CoinGeckoClient({ timeout: 30000 });
      expect(customClient).toBeInstanceOf(CoinGeckoClient);
    });
  });

  describe('getTokenInfo', () => {
    it('should return token info for valid contract', async () => {
      const mockTokenInfo = {
        id: 'usd-coin',
        symbol: 'usdc',
        name: 'USD Coin',
        asset_platform_id: 'ethereum',
        market_data: {
          current_price: { usd: 1.0 },
        },
      };

      mockGet.mockResolvedValue({ data: mockTokenInfo });

      const result = await client.getTokenInfo('ethereum', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');

      expect(mockGet).toHaveBeenCalledWith(
        '/coins/ethereum/contract/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      );
      expect(result).toEqual(mockTokenInfo);
    });

    it('should lowercase contract address', async () => {
      mockGet.mockResolvedValue({ data: {} });

      await client.getTokenInfo('base', '0xABCDEF123456');

      expect(mockGet).toHaveBeenCalledWith('/coins/base/contract/0xabcdef123456');
    });

    it('should return null for 404 response', async () => {
      const error = { isAxiosError: true, response: { status: 404 } };
      mockGet.mockRejectedValue(error);

      const result = await client.getTokenInfo('ethereum', '0xNonExistent');

      expect(result).toBeNull();
    });

    it('should throw for unsupported chain', async () => {
      await expect(
        client.getTokenInfo('unsupported' as ChainId, '0xAddress'),
      ).rejects.toThrow('Unsupported chain: unsupported');
    });

    it('should throw for non-404 errors', async () => {
      const error = new Error('Network error');
      mockGet.mockRejectedValue(error);

      await expect(
        client.getTokenInfo('ethereum', '0xAddress'),
      ).rejects.toThrow('Network error');
    });

    it('should map chains to correct platform IDs', async () => {
      mockGet.mockResolvedValue({ data: {} });

      const chainMappings: Array<[ChainId, string]> = [
        ['base', 'base'],
        ['ethereum', 'ethereum'],
        ['arbitrum', 'arbitrum-one'],
        ['polygon', 'polygon-pos'],
        ['optimism', 'optimistic-ethereum'],
        ['bsc', 'binance-smart-chain'],
      ];

      for (const [chainId, platform] of chainMappings) {
        await client.getTokenInfo(chainId, '0xToken');
        expect(mockGet).toHaveBeenCalledWith(`/coins/${platform}/contract/0xtoken`);
        mockGet.mockClear();
      }
    });
  });

  describe('getSimplePrice', () => {
    it('should return prices for coin IDs', async () => {
      const mockPrices = {
        bitcoin: { usd: 50000 },
        ethereum: { usd: 3000 },
      };

      mockGet.mockResolvedValue({ data: mockPrices });

      const result = await client.getSimplePrice(['bitcoin', 'ethereum']);

      expect(mockGet).toHaveBeenCalledWith(
        '/simple/price?ids=bitcoin%2Cethereum&vs_currencies=usd',
      );
      expect(result).toEqual(mockPrices);
    });

    it('should support multiple currencies', async () => {
      mockGet.mockResolvedValue({ data: {} });

      await client.getSimplePrice(['bitcoin'], ['usd', 'eur', 'eth']);

      expect(mockGet).toHaveBeenCalledWith(
        '/simple/price?ids=bitcoin&vs_currencies=usd%2Ceur%2Ceth',
      );
    });

    it('should include market cap when requested', async () => {
      mockGet.mockResolvedValue({ data: {} });

      await client.getSimplePrice(['bitcoin'], ['usd'], { includeMarketCap: true });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('include_market_cap=true'),
      );
    });

    it('should include 24h volume when requested', async () => {
      mockGet.mockResolvedValue({ data: {} });

      await client.getSimplePrice(['bitcoin'], ['usd'], { include24hVol: true });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('include_24hr_vol=true'),
      );
    });

    it('should include 24h change when requested', async () => {
      mockGet.mockResolvedValue({ data: {} });

      await client.getSimplePrice(['bitcoin'], ['usd'], { include24hChange: true });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('include_24hr_change=true'),
      );
    });
  });

  describe('getTokenPrice', () => {
    it('should return token price by contract address', async () => {
      const mockPrice = {
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { usd: 1.0 },
      };

      mockGet.mockResolvedValue({ data: mockPrice });

      const result = await client.getTokenPrice('ethereum', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');

      expect(result).toEqual(mockPrice);
    });

    it('should return null for 404 response', async () => {
      const error = { isAxiosError: true, response: { status: 404 } };
      mockGet.mockRejectedValue(error);

      const result = await client.getTokenPrice('ethereum', '0xNonExistent');

      expect(result).toBeNull();
    });

    it('should throw for unsupported chain', async () => {
      await expect(
        client.getTokenPrice('unsupported' as ChainId, '0xAddress'),
      ).rejects.toThrow('Unsupported chain: unsupported');
    });

    it('should include optional data when requested', async () => {
      mockGet.mockResolvedValue({ data: {} });

      await client.getTokenPrice('ethereum', '0xToken', ['usd'], {
        includeMarketCap: true,
        include24hVol: true,
        include24hChange: true,
      });

      const url = mockGet.mock.calls[0][0];
      expect(url).toContain('include_market_cap=true');
      expect(url).toContain('include_24hr_vol=true');
      expect(url).toContain('include_24hr_change=true');
    });
  });

  describe('getCoinsMarkets', () => {
    it('should return market data for coins', async () => {
      const mockMarkets = [
        { id: 'bitcoin', current_price: 50000, market_cap_rank: 1 },
        { id: 'ethereum', current_price: 3000, market_cap_rank: 2 },
      ];

      mockGet.mockResolvedValue({ data: mockMarkets });

      const result = await client.getCoinsMarkets();

      expect(result).toEqual(mockMarkets);
    });

    it('should use default parameters', async () => {
      mockGet.mockResolvedValue({ data: [] });

      await client.getCoinsMarkets();

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('vs_currency=usd'),
      );
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('order=market_cap_desc'),
      );
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('per_page=100'),
      );
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('page=1'),
      );
    });

    it('should filter by coin IDs', async () => {
      mockGet.mockResolvedValue({ data: [] });

      await client.getCoinsMarkets('usd', { ids: ['bitcoin', 'ethereum'] });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('ids=bitcoin%2Cethereum'),
      );
    });

    it('should filter by category', async () => {
      mockGet.mockResolvedValue({ data: [] });

      await client.getCoinsMarkets('usd', { category: 'defi' });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('category=defi'),
      );
    });

    it('should support pagination', async () => {
      mockGet.mockResolvedValue({ data: [] });

      await client.getCoinsMarkets('usd', { perPage: 50, page: 3 });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('per_page=50'),
      );
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('page=3'),
      );
    });

    it('should support different orderings', async () => {
      mockGet.mockResolvedValue({ data: [] });

      await client.getCoinsMarkets('usd', { order: 'volume_desc' });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('order=volume_desc'),
      );
    });
  });

  describe('search', () => {
    it('should search for coins', async () => {
      const mockResults = {
        coins: [
          { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', market_cap_rank: 1 },
          { id: 'bitcoin-cash', name: 'Bitcoin Cash', symbol: 'bch', market_cap_rank: 20 },
        ],
      };

      mockGet.mockResolvedValue({ data: mockResults });

      const result = await client.search('bitcoin');

      expect(mockGet).toHaveBeenCalledWith('/search?query=bitcoin');
      expect(result.coins).toHaveLength(2);
    });

    it('should encode search query', async () => {
      mockGet.mockResolvedValue({ data: { coins: [] } });

      await client.search('test token');

      expect(mockGet).toHaveBeenCalledWith('/search?query=test%20token');
    });
  });

  describe('getTrending', () => {
    it('should return trending coins', async () => {
      const mockTrending = {
        coins: [
          { item: { id: 'pepe', name: 'Pepe', symbol: 'PEPE', score: 0 } },
          { item: { id: 'shib', name: 'Shiba Inu', symbol: 'SHIB', score: 1 } },
        ],
      };

      mockGet.mockResolvedValue({ data: mockTrending });

      const result = await client.getTrending();

      expect(mockGet).toHaveBeenCalledWith('/search/trending');
      expect(result.coins).toHaveLength(2);
    });
  });
});
