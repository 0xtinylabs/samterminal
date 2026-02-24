/**
 * Moralis wallet client tests
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

import type { ChainId } from '@samterminal/plugin-tokendata';

// Create mock functions at module level
const mockGet = jest.fn();

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

// Import after mock is set up
const { MoralisWalletClient } = await import('./moralis.js');

describe('MoralisWalletClient', () => {
  let client: InstanceType<typeof MoralisWalletClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReset();
    client = new MoralisWalletClient({ apiKey: 'test-api-key' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should throw if API key is missing', () => {
      expect(() => new MoralisWalletClient({ apiKey: '' })).toThrow(
        'Moralis API key is required',
      );
    });

    it('should create client with valid API key', () => {
      const moralisClient = new MoralisWalletClient({ apiKey: 'valid-key' });
      expect(moralisClient).toBeInstanceOf(MoralisWalletClient);
    });

    it('should create client with custom timeout', () => {
      const moralisClient = new MoralisWalletClient({ apiKey: 'key', timeout: 30000 });
      expect(moralisClient).toBeInstanceOf(MoralisWalletClient);
    });
  });

  describe('getWalletTokens', () => {
    it('should return wallet tokens', async () => {
      const mockResponse = {
        result: [
          {
            token_address: '0xToken1',
            name: 'Token 1',
            symbol: 'TK1',
            decimals: 18,
            balance: '1000000000000000000',
            balance_formatted: '1.0',
            usd_value: 100,
          },
        ],
      };

      mockGet.mockResolvedValue({ data: mockResponse } as never);

      const result = await client.getWalletTokens('0xWallet', 'base');

      expect(mockGet).toHaveBeenCalledWith('/wallets/0xWallet/tokens', {
        params: {
          chain: '0x2105',
          exclude_spam: true,
          limit: 100,
          cursor: undefined,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should support pagination options', async () => {
      mockGet.mockResolvedValue({ data: { result: [] } } as never);

      await client.getWalletTokens('0xWallet', 'ethereum', {
        excludeSpam: false,
        limit: 50,
        cursor: 'page2_cursor',
      });

      expect(mockGet).toHaveBeenCalledWith('/wallets/0xWallet/tokens', {
        params: {
          chain: '0x1',
          exclude_spam: false,
          limit: 50,
          cursor: 'page2_cursor',
        },
      });
    });

    it('should map chains to correct hex IDs', async () => {
      mockGet.mockResolvedValue({ data: { result: [] } } as never);

      const chainMappings: Array<[ChainId, string]> = [
        ['base', '0x2105'],
        ['ethereum', '0x1'],
        ['arbitrum', '0xa4b1'],
        ['polygon', '0x89'],
        ['optimism', '0xa'],
        ['bsc', '0x38'],
      ];

      for (const [chainId, hexId] of chainMappings) {
        await client.getWalletTokens('0xWallet', chainId);
        expect(mockGet).toHaveBeenCalledWith(expect.any(String), {
          params: expect.objectContaining({ chain: hexId }),
        });
        mockGet.mockClear();
      }
    });
  });

  describe('getNativeBalance', () => {
    it('should return native balance', async () => {
      mockGet.mockResolvedValue({
        data: { balance: '1000000000000000000' },
      } as never);

      const result = await client.getNativeBalance('0xWallet', 'ethereum');

      expect(mockGet).toHaveBeenCalledWith('/0xWallet/balance', {
        params: { chain: '0x1' },
      });
      expect(result.balance).toBe('1000000000000000000');
      expect(result.balanceFormatted).toBe('1');
    });

  });

  describe('getWalletTransactions', () => {
    it('should return transactions', async () => {
      const mockResponse = {
        result: [
          {
            hash: '0xTxHash',
            from_address: '0xWallet',
            to_address: '0xRecipient',
            value: '1000000000000000000',
            block_timestamp: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockGet.mockResolvedValue({ data: mockResponse } as never);

      const result = await client.getWalletTransactions('0xWallet', 'base');

      expect(mockGet).toHaveBeenCalledWith('/0xWallet', {
        params: expect.objectContaining({
          chain: '0x2105',
          limit: 100,
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should support date range options', async () => {
      mockGet.mockResolvedValue({ data: { result: [] } } as never);

      await client.getWalletTransactions('0xWallet', 'ethereum', {
        fromDate: '2024-01-01',
        toDate: '2024-01-31',
        limit: 50,
      });

      expect(mockGet).toHaveBeenCalledWith('/0xWallet', {
        params: expect.objectContaining({
          from_date: '2024-01-01',
          to_date: '2024-01-31',
          limit: 50,
        }),
      });
    });

  });

  describe('getWalletNfts', () => {
    it('should return NFTs', async () => {
      const mockResponse = {
        result: [
          {
            token_address: '0xCollection',
            token_id: '1',
            name: 'NFT Collection',
            symbol: 'NFT',
          },
        ],
      };

      mockGet.mockResolvedValue({ data: mockResponse } as never);

      const result = await client.getWalletNfts('0xWallet', 'base');

      expect(mockGet).toHaveBeenCalledWith('/0xWallet/nft', {
        params: expect.objectContaining({
          chain: '0x2105',
          exclude_spam: true,
          limit: 100,
          normalizeMetadata: true,
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should filter by collection', async () => {
      mockGet.mockResolvedValue({ data: { result: [] } } as never);

      await client.getWalletNfts('0xWallet', 'ethereum', {
        tokenAddresses: ['0xCollection1', '0xCollection2'],
      });

      expect(mockGet).toHaveBeenCalledWith('/0xWallet/nft', {
        params: expect.objectContaining({
          token_addresses: '0xCollection1,0xCollection2',
        }),
      });
    });

  });

  describe('getWalletApprovals', () => {
    it('should return token approvals', async () => {
      const mockResponse = {
        result: [
          {
            token: { address: '0xToken', symbol: 'TK', decimals: 18 },
            spender: { address: '0xSpender', address_label: 'DEX Router' },
            value: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
            block_timestamp: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockGet.mockResolvedValue({ data: mockResponse } as never);

      const result = await client.getWalletApprovals('0xWallet', 'base');

      expect(mockGet).toHaveBeenCalledWith('/wallets/0xWallet/approvals', {
        params: {
          chain: '0x2105',
          limit: 100,
          cursor: undefined,
        },
      });
      expect(result).toEqual(mockResponse);
    });

  });

  describe('getWalletNetWorth', () => {
    it('should return net worth across chains', async () => {
      const mockResponse = {
        total_networth_usd: '10000',
        chains: [
          {
            chain: '0x2105',
            native_balance: '1000000000000000000',
            native_balance_formatted: '1.0',
            native_balance_usd: '3000',
            token_balance_usd: '7000',
            networth_usd: '10000',
          },
        ],
      };

      mockGet.mockResolvedValue({ data: mockResponse } as never);

      const result = await client.getWalletNetWorth('0xWallet');

      expect(mockGet).toHaveBeenCalledWith('/wallets/0xWallet/net-worth', {
        params: {
          chains: undefined,
          exclude_spam: true,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should filter by chain IDs', async () => {
      mockGet.mockResolvedValue({ data: { total_networth_usd: '0', chains: [] } } as never);

      await client.getWalletNetWorth('0xWallet', ['base', 'ethereum']);

      expect(mockGet).toHaveBeenCalledWith('/wallets/0xWallet/net-worth', {
        params: expect.objectContaining({
          chains: '0x2105,0x1',
        }),
      });
    });

  });

  describe('resolveEns', () => {
    it('should resolve ENS name to address', async () => {
      mockGet.mockResolvedValue({ data: { address: '0x1234567890123456789012345678901234567890' } } as never);

      const result = await client.resolveEns('vitalik.eth');

      expect(mockGet).toHaveBeenCalledWith('/resolve/ens/vitalik.eth');
      expect(result?.address).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should return null for 404 response', async () => {
      const error = { isAxiosError: true, response: { status: 404 } };
      mockGet.mockRejectedValue(error as never);

      const result = await client.resolveEns('nonexistent.eth');

      expect(result).toBeNull();
    });

    it('should throw for non-404 errors', async () => {
      mockGet.mockRejectedValue(new Error('Network error') as never);

      await expect(client.resolveEns('vitalik.eth')).rejects.toThrow('Network error');
    });
  });

  describe('reverseResolveEns', () => {
    it('should resolve address to ENS name', async () => {
      mockGet.mockResolvedValue({ data: { name: 'vitalik.eth' } } as never);

      const result = await client.reverseResolveEns('0x1234567890123456789012345678901234567890');

      expect(mockGet).toHaveBeenCalledWith('/resolve/0x1234567890123456789012345678901234567890/reverse');
      expect(result?.name).toBe('vitalik.eth');
    });

    it('should return null for 404 response', async () => {
      const error = { isAxiosError: true, response: { status: 404 } };
      mockGet.mockRejectedValue(error as never);

      const result = await client.reverseResolveEns('0xNoEns');

      expect(result).toBeNull();
    });
  });
});
