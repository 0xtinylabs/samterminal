/**
 * Moralis client tests
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
const { MoralisClient } = await import('./moralis.js');

describe('MoralisClient', () => {
  let client: InstanceType<typeof MoralisClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReset();
    client = new MoralisClient({ apiKey: 'test-api-key' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should throw if API key is missing', () => {
      expect(() => new MoralisClient({ apiKey: '' })).toThrow(
        'Moralis API key is required',
      );
    });

    it('should create client with valid API key', () => {
      const moralisClient = new MoralisClient({ apiKey: 'valid-key' });
      expect(moralisClient).toBeInstanceOf(MoralisClient);
    });

    it('should create client with custom timeout', () => {
      const moralisClient = new MoralisClient({ apiKey: 'key', timeout: 30000 });
      expect(moralisClient).toBeInstanceOf(MoralisClient);
    });
  });

  describe('getTokenMetadata', () => {
    it('should return token metadata for addresses', async () => {
      const mockMetadata = [
        {
          address: '0xToken1',
          name: 'Token 1',
          symbol: 'TK1',
          decimals: '18',
        },
        {
          address: '0xToken2',
          name: 'Token 2',
          symbol: 'TK2',
          decimals: '6',
        },
      ];

      mockGet.mockResolvedValue({ data: mockMetadata });

      const result = await client.getTokenMetadata('base', ['0xToken1', '0xToken2']);

      expect(mockGet).toHaveBeenCalledWith('/erc20/metadata', {
        params: {
          chain: '0x2105',
          addresses: '0xToken1,0xToken2',
        },
      });
      expect(result).toEqual(mockMetadata);
    });

    it('should map chains to correct hex IDs', async () => {
      mockGet.mockResolvedValue({ data: [] });

      const chainMappings: Array<[ChainId, string]> = [
        ['base', '0x2105'],
        ['ethereum', '0x1'],
        ['arbitrum', '0xa4b1'],
        ['polygon', '0x89'],
        ['optimism', '0xa'],
        ['bsc', '0x38'],
      ];

      for (const [chainId, hexId] of chainMappings) {
        await client.getTokenMetadata(chainId, ['0xToken']);
        expect(mockGet).toHaveBeenCalledWith('/erc20/metadata', {
          params: expect.objectContaining({ chain: hexId }),
        });
        mockGet.mockClear();
      }
    });
  });

  describe('getTokenPrice', () => {
    it('should return token price', async () => {
      const mockPrice = {
        tokenName: 'USD Coin',
        tokenSymbol: 'USDC',
        tokenDecimals: '6',
        usdPrice: 1.0,
      };

      mockGet.mockResolvedValue({ data: mockPrice });

      const result = await client.getTokenPrice('ethereum', '0xUSDC');

      expect(mockGet).toHaveBeenCalledWith('/erc20/0xUSDC/price', {
        params: { chain: '0x1' },
      });
      expect(result).toEqual(mockPrice);
    });

    it('should return null for 404 response', async () => {
      const error = { isAxiosError: true, response: { status: 404 } };
      mockGet.mockRejectedValue(error);

      const result = await client.getTokenPrice('ethereum', '0xNonExistent');

      expect(result).toBeNull();
    });

    it('should throw for non-404 errors', async () => {
      const error = new Error('Network error');
      mockGet.mockRejectedValue(error);

      await expect(
        client.getTokenPrice('ethereum', '0xToken'),
      ).rejects.toThrow('Network error');
    });
  });

  describe('getTokenOwners', () => {
    it('should return token owners', async () => {
      const mockOwners = {
        result: [
          {
            balance: '1000000000000000000',
            balance_formatted: '1',
            is_contract: false,
            owner_address: '0xHolder1',
            percentage_relative_to_total_supply: 10,
          },
        ],
        cursor: 'next_page_cursor',
        page: 1,
        page_size: 100,
      };

      mockGet.mockResolvedValue({ data: mockOwners });

      const result = await client.getTokenOwners('base', '0xToken');

      expect(mockGet).toHaveBeenCalledWith('/erc20/0xToken/owners', {
        params: {
          chain: '0x2105',
          limit: 100,
          cursor: undefined,
          order: 'DESC',
        },
      });
      expect(result).toEqual(mockOwners);
    });

    it('should support pagination options', async () => {
      mockGet.mockResolvedValue({ data: { result: [] } });

      await client.getTokenOwners('ethereum', '0xToken', {
        limit: 50,
        cursor: 'page2_cursor',
        order: 'ASC',
      });

      expect(mockGet).toHaveBeenCalledWith('/erc20/0xToken/owners', {
        params: {
          chain: '0x1',
          limit: 50,
          cursor: 'page2_cursor',
          order: 'ASC',
        },
      });
    });

  });

  describe('getTokenSecurity', () => {
    it('should return security data for verified token', async () => {
      mockGet.mockResolvedValue({
        data: [
          {
            address: '0xToken',
            verified_contract: true,
            possible_spam: false,
          },
        ],
      });

      const result = await client.getTokenSecurity('ethereum', '0xToken');

      expect(result).toBeDefined();
      expect(result?.isVerified).toBe(true);
      expect(result?.riskLevel).toBe('low');
      expect(result?.warnings).toHaveLength(0);
    });

    it('should flag unverified contracts', async () => {
      mockGet.mockResolvedValue({
        data: [
          {
            address: '0xToken',
            verified_contract: false,
            possible_spam: false,
          },
        ],
      });

      const result = await client.getTokenSecurity('ethereum', '0xToken');

      expect(result?.isVerified).toBe(false);
      expect(result?.riskLevel).toBe('medium');
      expect(result?.warnings).toContain('Contract not verified');
    });

    it('should flag possible spam tokens', async () => {
      mockGet.mockResolvedValue({
        data: [
          {
            address: '0xToken',
            verified_contract: true,
            possible_spam: true,
          },
        ],
      });

      const result = await client.getTokenSecurity('ethereum', '0xToken');

      expect(result?.riskLevel).toBe('high');
      expect(result?.warnings).toContain('Token flagged as possible spam');
    });

    it('should return null for 404 response', async () => {
      const error = { isAxiosError: true, response: { status: 404 } };
      mockGet.mockRejectedValue(error);

      const result = await client.getTokenSecurity('ethereum', '0xNonExistent');

      expect(result).toBeNull();
    });

    it('should return null when no metadata found', async () => {
      mockGet.mockResolvedValue({ data: [] });

      const result = await client.getTokenSecurity('ethereum', '0xToken');

      expect(result).toBeNull();
    });

  });

  describe('getTokenHolders', () => {
    it('should return formatted holder data', async () => {
      mockGet.mockResolvedValue({
        data: {
          result: [
            {
              owner_address: '0xHolder1',
              balance: '1000000000000000000',
              balance_formatted: '1.0',
              is_contract: false,
              owner_address_label: 'Whale',
              percentage_relative_to_total_supply: 5.5,
            },
            {
              owner_address: '0xHolder2',
              balance: '500000000000000000',
              balance_formatted: '0.5',
              is_contract: true,
              percentage_relative_to_total_supply: 2.75,
            },
          ],
        },
      });

      const result = await client.getTokenHolders('base', '0xToken', 100);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        address: '0xHolder1',
        balance: '1000000000000000000',
        balanceFormatted: 1.0,
        percentage: 5.5,
        isContract: false,
        label: 'Whale',
      });
      expect(result[1]).toEqual({
        address: '0xHolder2',
        balance: '500000000000000000',
        balanceFormatted: 0.5,
        percentage: 2.75,
        isContract: true,
        label: undefined,
      });
    });

    it('should use default limit', async () => {
      mockGet.mockResolvedValue({ data: { result: [] } });

      await client.getTokenHolders('ethereum', '0xToken');

      expect(mockGet).toHaveBeenCalledWith('/erc20/0xToken/owners', {
        params: expect.objectContaining({ limit: 100 }),
      });
    });

    it('should use custom limit', async () => {
      mockGet.mockResolvedValue({ data: { result: [] } });

      await client.getTokenHolders('ethereum', '0xToken', 50);

      expect(mockGet).toHaveBeenCalledWith('/erc20/0xToken/owners', {
        params: expect.objectContaining({ limit: 50 }),
      });
    });

    it('should handle missing percentage data', async () => {
      mockGet.mockResolvedValue({
        data: {
          result: [
            {
              owner_address: '0xHolder',
              balance: '1000',
              balance_formatted: '0.001',
              is_contract: false,
            },
          ],
        },
      });

      const result = await client.getTokenHolders('base', '0xToken');

      expect(result[0].percentage).toBe(0);
    });
  });
});
