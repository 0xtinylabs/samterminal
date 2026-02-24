/**
 * ZeroXClient tests
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import type { ChainId } from '@samterminal/plugin-tokendata';

// Mock axios before importing ZeroXClient
const mockGet = jest.fn();
const mockPost = jest.fn();

jest.unstable_mockModule('axios', () => ({
  default: {
    create: () => ({
      get: (...args: unknown[]) => mockGet(...args),
      post: (...args: unknown[]) => mockPost(...args),
      defaults: { headers: { common: {} } },
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    }),
  },
}));

// Import after mock is set up
const { ZeroXClient, createZeroXClient } = await import('./zerox.js');

describe('ZeroXClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations to default
    mockGet.mockReset();
    mockPost.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should throw if API key is missing', () => {
      expect(() => new ZeroXClient({ apiKey: '' }, {})).toThrow(
        '0x API key is required',
      );
    });

    it('should create client with valid API key', () => {
      const client = new ZeroXClient({ apiKey: 'test-api-key' }, {});
      expect(client).toBeInstanceOf(ZeroXClient);
    });

    it('should accept custom timeout', () => {
      const client = new ZeroXClient(
        { apiKey: 'test-api-key', timeout: 60000 },
        {},
      );
      expect(client).toBeInstanceOf(ZeroXClient);
    });
  });

  describe('createZeroXClient factory', () => {
    it('should create client with config', () => {
      const client = createZeroXClient({
        apiKey: 'test-api-key',
        cacheTtl: 5000,
        enableCache: true,
        feeBps: 100,
        feeRecipient: '0x1234567890123456789012345678901234567890',
      });
      expect(client).toBeInstanceOf(ZeroXClient);
    });
  });

  describe('getPrice', () => {
    it('should get price for ETH->USDC on Base', async () => {
      const client = new ZeroXClient({ apiKey: 'test-api-key' }, {});

      mockGet.mockResolvedValue({
        data: {
          sellAmount: '1000000000000000000',
          buyAmount: '3250000000',
          price: '3250',
          minBuyAmount: '3217500000',
          liquidityAvailable: true,
          gas: '200000',
          gasPrice: '1000000',
          route: {
            fills: [{ source: 'Uniswap_V3', proportionBps: '10000' }],
            tokens: [],
          },
        },
      } as never);

      const result = await client.getPrice({
        sellToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        buyToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        sellAmount: '1000000000000000000',
        chainId: 'base' as ChainId,
      });

      expect(mockGet).toHaveBeenCalledWith('/swap/permit2/price', {
        params: expect.objectContaining({
          sellToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          buyToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          sellAmount: '1000000000000000000',
          chainId: '8453',
        }),
      });

      expect(result.liquidityAvailable).toBe(true);
      expect(result.buyAmount).toBe('3250000000');
    });

    it('should throw for unsupported chain', async () => {
      const client = new ZeroXClient({ apiKey: 'test-api-key' }, {});

      await expect(
        client.getPrice({
          sellToken: '0xToken1',
          buyToken: '0xToken2',
          sellAmount: '1',
          chainId: 'unsupported' as ChainId,
        }),
      ).rejects.toThrow('Unsupported chain: unsupported');
    });

    it('should include taker address when provided', async () => {
      const client = new ZeroXClient({ apiKey: 'test-api-key' }, {});

      mockGet.mockResolvedValue({ data: { liquidityAvailable: true } } as never);

      await client.getPrice({
        sellToken: '0xToken1',
        buyToken: '0xToken2',
        sellAmount: '1',
        chainId: 'base' as ChainId,
        taker: '0xTakerAddress',
      });

      expect(mockGet).toHaveBeenCalledWith('/swap/permit2/price', {
        params: expect.objectContaining({
          taker: '0xTakerAddress',
        }),
      });
    });

    it('should include slippage when provided', async () => {
      const client = new ZeroXClient({ apiKey: 'test-api-key' }, {});

      mockGet.mockResolvedValue({ data: { liquidityAvailable: true } } as never);

      await client.getPrice({
        sellToken: '0xToken1',
        buyToken: '0xToken2',
        sellAmount: '1',
        chainId: 'base' as ChainId,
        slippageBps: 100,
      });

      expect(mockGet).toHaveBeenCalledWith('/swap/permit2/price', {
        params: expect.objectContaining({
          slippageBps: '100',
        }),
      });
    });

    it('should include fee parameters when configured', async () => {
      const client = new ZeroXClient(
        { apiKey: 'test-api-key' },
        {
          feeBps: 100,
          feeRecipient: '0xFeeRecipient',
          feeToken: '0xFeeToken',
        },
      );

      mockGet.mockResolvedValue({ data: { liquidityAvailable: true } } as never);

      await client.getPrice({
        sellToken: '0xToken1',
        buyToken: '0xToken2',
        sellAmount: '1',
        chainId: 'base' as ChainId,
      });

      expect(mockGet).toHaveBeenCalledWith('/swap/permit2/price', {
        params: expect.objectContaining({
          swapFeeBps: '100',
          swapFeeRecipient: '0xFeeRecipient',
          swapFeeToken: '0xFeeToken',
        }),
      });
    });
  });

  describe('getQuote', () => {
    it('should get firm quote with transaction data', async () => {
      const client = new ZeroXClient({ apiKey: 'test-api-key' }, {});

      mockGet.mockResolvedValue({
        data: {
          sellAmount: '1000000000000000000',
          buyAmount: '3250000000',
          liquidityAvailable: true,
          transaction: {
            to: '0xRouterAddress',
            data: '0xSwapData',
            value: '1000000000000000000',
            gas: '200000',
            gasPrice: '1000000',
          },
        },
      } as never);

      const result = await client.getQuote({
        sellToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        buyToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        sellAmount: '1000000000000000000',
        chainId: 'base' as ChainId,
        taker: '0xTakerAddress',
      });

      expect(mockGet).toHaveBeenCalledWith('/swap/permit2/quote', {
        params: expect.objectContaining({
          taker: '0xTakerAddress',
        }),
      });

      expect(result.transaction).toBeDefined();
      expect(result.transaction.to).toBe('0xRouterAddress');
    });

    it('should throw for unsupported chain', async () => {
      const client = new ZeroXClient({ apiKey: 'test-api-key' }, {});

      await expect(
        client.getQuote({
          sellToken: '0xToken1',
          buyToken: '0xToken2',
          sellAmount: '1',
          chainId: 'invalid' as ChainId,
          taker: '0xTaker',
        }),
      ).rejects.toThrow('Unsupported chain: invalid');
    });
  });

  describe('getGasPrice', () => {
    it('should return gas price for chain', async () => {
      const client = new ZeroXClient({ apiKey: 'test-api-key' }, {});

      mockGet.mockResolvedValue({
        data: {
          gasPrice: '1000000000',
        },
      } as never);

      const gasPrice = await client.getGasPrice('base' as ChainId);

      expect(gasPrice).toBe('1000000000');
    });

    it('should throw for unsupported chain', async () => {
      const client = new ZeroXClient({ apiKey: 'test-api-key' }, {});

      await expect(client.getGasPrice('invalid' as ChainId)).rejects.toThrow(
        'Unsupported chain: invalid',
      );
    });
  });

  describe('checkLiquidity', () => {
    it('should return true when liquidity available', async () => {
      const client = new ZeroXClient({ apiKey: 'test-api-key' }, {});

      mockGet.mockResolvedValue({
        data: { liquidityAvailable: true },
      } as never);

      const result = await client.checkLiquidity({
        sellToken: '0xToken1',
        buyToken: '0xToken2',
        sellAmount: '1',
        chainId: 'base' as ChainId,
      });

      expect(result).toBe(true);
    });

    it('should return false when no liquidity', async () => {
      const client = new ZeroXClient({ apiKey: 'test-api-key' }, {});

      mockGet.mockResolvedValue({
        data: { liquidityAvailable: false },
      } as never);

      const result = await client.checkLiquidity({
        sellToken: '0xToken1',
        buyToken: '0xToken2',
        sellAmount: '1',
        chainId: 'base' as ChainId,
      });

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const client = new ZeroXClient({ apiKey: 'test-api-key' }, {});

      mockGet.mockRejectedValue(new Error('API Error'));

      const result = await client.checkLiquidity({
        sellToken: '0xToken1',
        buyToken: '0xToken2',
        sellAmount: '1',
        chainId: 'base' as ChainId,
      });

      expect(result).toBe(false);
    });
  });

  describe('getSupportedChains', () => {
    it('should return list of supported chains', () => {
      const client = new ZeroXClient({ apiKey: 'test-api-key' }, {});
      const chains = client.getSupportedChains();

      expect(chains).toContain('base');
      expect(chains).toContain('ethereum');
      expect(chains).toContain('arbitrum');
      expect(chains).toContain('polygon');
      expect(chains).toContain('optimism');
      expect(chains).toContain('bsc');
    });
  });

  describe('isChainSupported', () => {
    it('should return true for supported chains', () => {
      const client = new ZeroXClient({ apiKey: 'test-api-key' }, {});

      expect(client.isChainSupported('base' as ChainId)).toBe(true);
      expect(client.isChainSupported('ethereum' as ChainId)).toBe(true);
    });

    it('should return false for unsupported chains', () => {
      const client = new ZeroXClient({ apiKey: 'test-api-key' }, {});

      expect(client.isChainSupported('invalid' as ChainId)).toBe(false);
    });
  });

  describe('getNumericChainId', () => {
    it('should return numeric chain ID for supported chains', () => {
      const client = new ZeroXClient({ apiKey: 'test-api-key' }, {});

      expect(client.getNumericChainId('base' as ChainId)).toBe(8453);
      expect(client.getNumericChainId('ethereum' as ChainId)).toBe(1);
      expect(client.getNumericChainId('arbitrum' as ChainId)).toBe(42161);
      expect(client.getNumericChainId('polygon' as ChainId)).toBe(137);
      expect(client.getNumericChainId('optimism' as ChainId)).toBe(10);
      expect(client.getNumericChainId('bsc' as ChainId)).toBe(56);
    });

    it('should return undefined for unsupported chains', () => {
      const client = new ZeroXClient({ apiKey: 'test-api-key' }, {});

      expect(client.getNumericChainId('invalid' as ChainId)).toBeUndefined();
    });
  });
});
