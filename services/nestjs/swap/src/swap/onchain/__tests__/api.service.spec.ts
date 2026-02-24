/**
 * ApiService Unit Tests
 * 0x API entegrasyonu ve amount hesaplama testleri
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ApiService } from '@/swap/onchain/api/api.service';

// Mock axios with factory - must handle ESM default export
jest.mock('axios', () => {
  const mockAxiosGet = jest.fn();
  const mockCreate = jest.fn().mockReturnValue({
    get: mockAxiosGet,
  });

  // Create object that works as both default and named export
  const axiosMock = {
    create: mockCreate,
  };

  return {
    __esModule: true,
    default: axiosMock,
    ...axiosMock,
    __mockAxiosGet: mockAxiosGet,
  };
});

// Mock utilities with factories
jest.mock('@/swap/onchain/utils', () => {
  const mockWalletClient = jest.fn();
  const mockTokenContract = jest.fn();
  const mockTokenFunctions = jest.fn();
  const mockFloatToBigInt = jest.fn();

  return {
    WALLET: {
      CLIENT: {
        walletClient: mockWalletClient,
      },
    },
    TOKEN: {
      tokenContract: mockTokenContract,
      tokenFunctions: mockTokenFunctions,
    },
    AMOUNT: {
      FLOAT: {
        floatToBigInt: mockFloatToBigInt,
      },
    },
    __mocks: {
      mockWalletClient,
      mockTokenContract,
      mockTokenFunctions,
      mockFloatToBigInt,
    },
  };
});

jest.mock('@/swap/onchain/utils/provider', () => {
  const mockGetGasInformation = jest.fn();
  const mockRpcGetBalance = jest.fn();

  return {
    GAS: {
      getGasInformation: mockGetGasInformation,
    },
    RPC: {
      rpcProvider: {
        getBalance: mockRpcGetBalance,
      },
    },
    __mocks: {
      mockGetGasInformation,
      mockRpcGetBalance,
    },
  };
});

jest.mock('@/config/config', () => ({
  CONFIG: {
    apis: {
      matcha: 'mock-matcha-api-key',
    },
    fee: {
      bps: '100',
      receiver_wallet: '0xFeeReceiver',
      receive_token: '0xFeeToken1234567890abcdef1234567890abcdef',
    },
  },
}));

jest.mock('@/web3/tokens', () => ({
  ETHERS: {
    UNCHECKABLE_GROUP: [
      '0x0000000000000000000000000000000000000000',
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    ],
  },
}));

jest.mock('@/web3/chains', () => ({
  CHAINS: {
    BASE: 8453,
  },
}));

describe('ApiService', () => {
  let service: ApiService;
  let mocks: any;
  let providerMocks: any;
  let mockAxiosGet: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Get mock references
    const utils = require('@/swap/onchain/utils');
    mocks = utils.__mocks;
    const provider = require('@/swap/onchain/utils/provider');
    providerMocks = provider.__mocks;
    const axios = require('axios');
    mockAxiosGet = axios.__mockAxiosGet;

    // Default mock returns
    mocks.mockWalletClient.mockReturnValue({
      address: '0xWalletAddress',
    });
    mocks.mockTokenContract.mockReturnValue({});
    mocks.mockTokenFunctions.mockReturnValue({
      decimals: jest.fn().mockResolvedValue(18n),
      getBalance: jest.fn().mockResolvedValue(BigInt('2000000000000000000')),
    });
    mocks.mockFloatToBigInt.mockReturnValue(BigInt('1500000000000000000'));
    providerMocks.mockGetGasInformation.mockResolvedValue({
      gasPrice: BigInt('1000000000'),
    });
    providerMocks.mockRpcGetBalance.mockResolvedValue(BigInt('1000000000000000000'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiService],
    }).compile();

    service = module.get<ApiService>(ApiService);
  });

  describe('constructor', () => {
    it('should initialize axios with correct base URL', () => {
      const axios = require('axios').default;
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.0x.org/',
        })
      );
    });

    it('should set 0x API headers', () => {
      const axios = require('axios').default;
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            '0x-version': 'v2',
            '0x-api-key': 'mock-matcha-api-key',
          }),
        })
      );
    });
  });

  describe('getAmount', () => {
    const baseRequest = {
      amount: 1.5,
      tokenAddress: '0xToken1234567890abcdef1234567890abcdef12',
      walletAddress: '0xWallet1234567890abcdef1234567890abcd12',
      privateKey: '0x' + 'a'.repeat(64),
    };

    describe('native token', () => {
      const nativeRequest = {
        ...baseRequest,
        tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      };

      it('should use rpcProvider.getBalance for native tokens', async () => {
        providerMocks.mockRpcGetBalance.mockResolvedValue(BigInt('5000000000000000000'));
        mocks.mockFloatToBigInt.mockReturnValue(BigInt('1500000000000000000'));

        await service.getAmount(nativeRequest);

        expect(providerMocks.mockRpcGetBalance).toHaveBeenCalledWith(nativeRequest.walletAddress);
      });

      it('should not call tokenFunctions for native tokens', async () => {
        providerMocks.mockRpcGetBalance.mockResolvedValue(BigInt('5000000000000000000'));

        await service.getAmount(nativeRequest);

        expect(mocks.mockTokenFunctions).not.toHaveBeenCalled();
      });
    });

    describe('ERC20 token', () => {
      it('should call tokenContract with token address', async () => {
        await service.getAmount(baseRequest);

        expect(mocks.mockTokenContract).toHaveBeenCalledWith(baseRequest.tokenAddress);
      });

      it('should get decimals from token contract', async () => {
        const mockDecimals = jest.fn().mockResolvedValue(6n);
        mocks.mockTokenFunctions.mockReturnValue({
          decimals: mockDecimals,
          getBalance: jest.fn().mockResolvedValue(BigInt('2000000')),
        });

        await service.getAmount(baseRequest);

        expect(mockDecimals).toHaveBeenCalled();
      });

      it('should get balance from token contract', async () => {
        const mockGetBalance = jest.fn().mockResolvedValue(BigInt('2000000000000000000'));
        mocks.mockTokenFunctions.mockReturnValue({
          decimals: jest.fn().mockResolvedValue(18n),
          getBalance: mockGetBalance,
        });

        await service.getAmount(baseRequest);

        expect(mockGetBalance).toHaveBeenCalled();
      });
    });

    describe('balance handling', () => {
      it('should return noBalance true when balance is 0', async () => {
        mocks.mockTokenFunctions.mockReturnValue({
          decimals: jest.fn().mockResolvedValue(18n),
          getBalance: jest.fn().mockResolvedValue(0n),
        });

        const result = await service.getAmount(baseRequest);

        expect(result.noBalance).toBe(true);
      });

      it('should return isReduced true when amount > balance', async () => {
        mocks.mockTokenFunctions.mockReturnValue({
          decimals: jest.fn().mockResolvedValue(18n),
          getBalance: jest.fn().mockResolvedValue(BigInt('500000000000000000')),
        });
        mocks.mockFloatToBigInt.mockReturnValue(BigInt('1500000000000000000'));

        const result = await service.getAmount(baseRequest);

        expect(result.isReduced).toBe(true);
        expect(result.amount).toBe(BigInt('500000000000000000'));
      });

      it('should return full amount when balance >= amount', async () => {
        mocks.mockTokenFunctions.mockReturnValue({
          decimals: jest.fn().mockResolvedValue(18n),
          getBalance: jest.fn().mockResolvedValue(BigInt('5000000000000000000')),
        });
        mocks.mockFloatToBigInt.mockReturnValue(BigInt('1500000000000000000'));

        const result = await service.getAmount(baseRequest);

        expect(result.isReduced).toBe(false);
        expect(result.amount).toBe(BigInt('1500000000000000000'));
      });
    });
  });

  describe('isMonetizeApplicable', () => {
    it('should return true when from_token matches fee token', () => {
      const result = service.isMonetizeApplicable(
        '0xFeeToken1234567890abcdef1234567890abcdef',
        '0xOtherToken'
      );

      expect(result).toBe(true);
    });

    it('should return true when to_token matches fee token', () => {
      const result = service.isMonetizeApplicable(
        '0xOtherToken',
        '0xFeeToken1234567890abcdef1234567890abcdef'
      );

      expect(result).toBe(true);
    });

    it('should return false when neither token matches fee token', () => {
      const result = service.isMonetizeApplicable(
        '0xTokenA',
        '0xTokenB'
      );

      expect(result).toBe(false);
    });

    it('should be case-insensitive', () => {
      const result = service.isMonetizeApplicable(
        '0xFEETOKEN1234567890ABCDEF1234567890ABCDEF',
        '0xOtherToken'
      );

      expect(result).toBe(true);
    });
  });

  describe('getMonetizeParams', () => {
    it('should return fee parameters from config', () => {
      const result = service.getMonetizeParams();

      expect(result).toEqual({
        swapFeeBps: '100',
        swapFeeRecipient: '0xFeeReceiver',
        swapFeeToken: '0xFeeToken1234567890abcdef1234567890abcdef',
      });
    });
  });

  describe('getSwapParams', () => {
    const baseRequest = {
      amount: 1.5,
      fromSwapToken: '0xFromToken',
      toSwapToken: '0xToToken',
      toWalletAddress: '0xWallet',
      privateKey: '0x' + 'a'.repeat(64),
      slippage: 5,
    };

    it('should fetch gas price', async () => {
      await service.getSwapParams(baseRequest);

      expect(providerMocks.mockGetGasInformation).toHaveBeenCalled();
    });

    it('should return correct swap parameters', async () => {
      jest.spyOn(service, 'getAmount').mockResolvedValue({
        amount: BigInt('1500000000000000000'),
        isReduced: false,
        noBalance: false,
      });
      providerMocks.mockGetGasInformation.mockResolvedValue({
        gasPrice: BigInt('2000000000'),
      });

      const result = await service.getSwapParams(baseRequest);

      expect(result).toMatchObject({
        buyToken: baseRequest.toSwapToken,
        sellToken: baseRequest.fromSwapToken,
        chainId: 8453,
        gasPrice: '2000000000',
        sellAmount: '1500000000000000000',
        slippageBps: 500,
        taker: baseRequest.toWalletAddress,
      });
    });

    it('should include monetize params when applicable', async () => {
      const feeTokenRequest = {
        ...baseRequest,
        fromSwapToken: '0xFeeToken1234567890abcdef1234567890abcdef',
      };
      jest.spyOn(service, 'getAmount').mockResolvedValue({
        amount: BigInt('1500000000000000000'),
        isReduced: false,
        noBalance: false,
      });

      const result = await service.getSwapParams(feeTokenRequest);

      expect(result).toMatchObject({
        swapFeeBps: '100',
        swapFeeRecipient: '0xFeeReceiver',
        swapFeeToken: '0xFeeToken1234567890abcdef1234567890abcdef',
      });
    });
  });

  describe('quoteSwap', () => {
    const baseRequest = {
      amount: 1.5,
      fromSwapToken: '0xFromToken',
      toSwapToken: '0xToToken',
      toWalletAddress: '0xWallet',
      privateKey: '0x' + 'a'.repeat(64),
      slippage: 5,
    };

    beforeEach(() => {
      jest.spyOn(service, 'getSwapParams').mockResolvedValue({
        buyToken: '0xToToken',
        sellToken: '0xFromToken',
        chainId: 8453,
        gasPrice: '1000000000',
        sellAmount: '1500000000000000000',
        slippageBps: 500,
        taker: '0xWallet',
      });
    });

    it('should call 0x API with swap params', async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          buyAmount: '3000000000',
          sellAmount: '1500000000000000000',
          transaction: {
            to: '0xSwapTarget',
            data: '0xswapdata',
            value: '0',
          },
        },
      });

      await service.quoteSwap(baseRequest);

      expect(mockAxiosGet).toHaveBeenCalledWith(
        '/swap/allowance-holder/quote',
        expect.objectContaining({
          params: expect.any(Object),
        })
      );
    });

    it('should return parsed response on success', async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          allowanceTarget: '0xAllowanceTarget',
          buyAmount: '3000000000',
          sellAmount: '1500000000000000000',
          permit: { eip712: {} },
          fees: {
            gasFee: { amount: '1000000' },
            integratorFee: { amount: '50000' },
          },
          totalNetworkFee: '1500000',
          transaction: {
            to: '0xSwapTarget',
            data: '0xswapdata',
            value: '0',
          },
        },
      });

      const result = await service.quoteSwap(baseRequest);

      expect(result).toMatchObject({
        type: 'response',
        allowanceTarget: '0xAllowanceTarget',
        buyAmount: 3000000000,
        sellAmount: 1500000000000000000,
        fee: '1000000',
        user_fee: '50000',
        networkFee: '1500000',
      });
    });

    it('should return error type on API error', async () => {
      mockAxiosGet.mockRejectedValue(new Error('API error'));

      const result = await service.quoteSwap(baseRequest);

      expect(result).toMatchObject({
        type: 'error',
        error: expect.any(Error),
      });
    });

    it('should include transaction in response', async () => {
      const transaction = {
        to: '0xSwapContract',
        data: '0xcalldata',
        value: '1000000',
        gas: '200000',
        gasPrice: '1000000000',
      };
      mockAxiosGet.mockResolvedValue({
        data: {
          buyAmount: '3000000000',
          sellAmount: '1500000000000000000',
          transaction,
        },
      });

      const result = await service.quoteSwap(baseRequest);

      expect((result as any).transaction).toEqual(transaction);
    });
  });

  describe('routes', () => {
    it('should have correct swap route', () => {
      expect(service.routes.swap).toBe('/swap/allowance-holder/quote');
    });
  });
});
