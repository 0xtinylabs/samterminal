/**
 * OnchainService Unit Tests
 * Ana swap işlemi ve fee yönetimi testleri
 */

import { Test, TestingModule } from '@nestjs/testing';
import { OnchainService } from '@/swap/onchain/onchain.service';
import { ApiService } from '@/swap/onchain/api/api.service';

// Define mock functions inside factory to avoid hoisting issues
jest.mock('@/swap/onchain/utils', () => {
  const mockNativeTransaction = jest.fn();
  const mockAllowance = jest.fn();
  const mockPermitSecure = jest.fn();
  const mockGetBalance = jest.fn();

  return {
    WALLET: {
      CLIENT: {
        walletClient: jest.fn().mockReturnValue({
          address: '0xTestWalletAddress1234567890abcdef12345678',
          privateKey: '0x' + 'a'.repeat(64),
        }),
      },
    },
    NATIVE: {
      nativeTransaction: mockNativeTransaction,
    },
    PERMIT: {
      allowance: mockAllowance,
      permitSecure: mockPermitSecure,
    },
    PROVIDER: {
      RPC: {
        rpcProvider: {
          getBalance: mockGetBalance,
        },
      },
    },
    __mocks: {
      mockNativeTransaction,
      mockAllowance,
      mockPermitSecure,
      mockGetBalance,
    },
  };
});

jest.mock('@/swap/onchain/utils/provider', () => {
  const mockGetGasInformation = jest.fn();
  return {
    GAS: {
      getGasInformation: mockGetGasInformation,
    },
    __mockGetGasInformation: mockGetGasInformation,
  };
});

jest.mock('@/swap/onchain/utils/provider', () => {
  const mockGetGasInformation = jest.fn();
  return {
    GAS: {
      getGasInformation: mockGetGasInformation,
    },
    __mockGetGasInformation: mockGetGasInformation,
  };
});

jest.mock('@/config/config', () => ({
  CONFIG: {
    swap: {
      permitSwap: '0xPermitSwapAddress',
    },
  },
}));

jest.mock('@/web3/chains', () => ({
  CHAINS: {
    BASE: 8453,
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

describe('OnchainService', () => {
  let service: OnchainService;
  let mockApiService: any;
  let mocks: any;
  let mockGetGasInformation: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Get mock references
    const utils = require('@/swap/onchain/utils');
    mocks = utils.__mocks;
    const provider = require('@/swap/onchain/utils/provider');
    mockGetGasInformation = provider.__mockGetGasInformation;

    mockGetGasInformation.mockResolvedValue({
      gas: BigInt('6000000000000000'),
      gasLimit: BigInt('6000000'),
      gasPrice: BigInt('1000000000'),
    });

    mocks.mockGetBalance.mockResolvedValue(BigInt('1000000000000000000'));
    mocks.mockNativeTransaction.mockResolvedValue({ hash: '0xnativeTxHash' });
    mocks.mockAllowance.mockImplementation(async (token: any, wallet: any, callback: any) => {
      await callback();
    });
    mocks.mockPermitSecure.mockResolvedValue('0xpermitSecureData');

    mockApiService = {
      getAmount: jest.fn(),
      quoteSwap: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnchainService,
        { provide: ApiService, useValue: mockApiService },
      ],
    }).compile();

    service = module.get<OnchainService>(OnchainService);
  });

  describe('swap', () => {
    const baseRequest = {
      privateKey: '0x' + 'a'.repeat(64),
      fromTokenAddress: '0xFromToken1234567890abcdef1234567890abcd',
      toTokenAddress: '0xToToken1234567890abcdef1234567890abcdef',
      amount: 1.5,
      slippage: 10,
    };

    describe('balance check', () => {
      it('should return error when no balance', async () => {
        mockApiService.getAmount.mockResolvedValue({
          amount: 0n,
          noBalance: true,
          isReduced: false,
        });

        const result = await service.swap(baseRequest);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe('No balance');
      });

      it('should proceed when balance exists', async () => {
        mockApiService.getAmount.mockResolvedValue({
          amount: BigInt('1500000000000000000'),
          noBalance: false,
          isReduced: false,
        });
        mockApiService.quoteSwap.mockResolvedValue({
          type: 'response',
          buyAmount: 3000,
          sellAmount: 1.5,
          transaction: {
            to: '0xSwapTarget',
            data: '0xswapdata',
            value: '0',
          },
        });

        await service.swap(baseRequest);

        expect(mockApiService.quoteSwap).toHaveBeenCalled();
      });
    });

    describe('quote handling', () => {
      beforeEach(() => {
        mockApiService.getAmount.mockResolvedValue({
          amount: BigInt('1500000000000000000'),
          noBalance: false,
          isReduced: false,
        });
      });

      it('should return error when quote returns error type', async () => {
        mockApiService.quoteSwap.mockResolvedValue({
          type: 'error',
          error: 'Quote failed',
        });

        const result = await service.swap(baseRequest);

        expect(result.success).toBe(false);
      });

      it('should return error when no transaction in quote', async () => {
        mockApiService.quoteSwap.mockResolvedValue({
          type: 'response',
          buyAmount: 3000,
          sellAmount: 1.5,
          transaction: null,
        });

        const result = await service.swap(baseRequest);

        expect(result.success).toBe(false);
      });
    });

    describe('native token swap', () => {
      const nativeRequest = {
        ...baseRequest,
        fromTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      };

      beforeEach(() => {
        mockApiService.getAmount.mockResolvedValue({
          amount: BigInt('1500000000000000000'),
          noBalance: false,
          isReduced: false,
        });
      });

      it('should call nativeTransaction for native tokens', async () => {
        mockApiService.quoteSwap.mockResolvedValue({
          type: 'response',
          buyAmount: 3000,
          sellAmount: 1.5,
          transaction: {
            to: '0xSwapTarget',
            data: '0xswapdata',
            value: '1500000000000000000',
          },
        });
        mocks.mockNativeTransaction.mockResolvedValue({ hash: '0xnativeHash' });

        const result = await service.swap(nativeRequest);

        expect(mocks.mockNativeTransaction).toHaveBeenCalled();
        expect(result.success).toBe(true);
        expect(result.tx).toBe('0xnativeHash');
      });

      it('should return error when quote is null for native', async () => {
        mockApiService.quoteSwap.mockResolvedValue(null);

        const result = await service.swap(nativeRequest);

        expect(result.success).toBe(false);
      });
    });

    describe('ERC20 token swap', () => {
      beforeEach(() => {
        mockApiService.getAmount.mockResolvedValue({
          amount: BigInt('1500000000000000000'),
          noBalance: false,
          isReduced: false,
        });
        mockApiService.quoteSwap.mockResolvedValue({
          type: 'response',
          buyAmount: 3000,
          sellAmount: 1.5,
          user_fee: '100',
          transaction: {
            to: '0xSwapTarget',
            data: '0xswapdata',
            value: '0',
          },
        });
      });

      it('should call allowance for ERC20 tokens', async () => {
        await service.swap(baseRequest);

        expect(mocks.mockAllowance).toHaveBeenCalledWith(
          baseRequest.fromTokenAddress,
          expect.any(Object),
          expect.any(Function)
        );
      });

      it('should call permitSecure for ERC20 tokens', async () => {
        await service.swap(baseRequest);

        expect(mocks.mockPermitSecure).toHaveBeenCalledWith(
          baseRequest.fromTokenAddress,
          baseRequest.privateKey,
          '0xswapdata',
          baseRequest.amount,
          '0xSwapTarget'
        );
      });

      it('should submit transaction via nativeTransaction', async () => {
        mocks.mockNativeTransaction.mockResolvedValue({ hash: '0xexecutedHash' });

        const result = await service.swap(baseRequest);

        expect(mocks.mockNativeTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            transaction: expect.objectContaining({
              to: '0xPermitSwapAddress',
              data: '0xpermitSecureData',
              value: '0',
            }),
          }),
          expect.any(Function),
        );
        expect(result.success).toBe(true);
        expect(result.tx).toBe('0xexecutedHash');
      });

      it('should return error when transaction submission fails', async () => {
        mocks.mockNativeTransaction.mockResolvedValue({ hash: '' });

        const result = await service.swap(baseRequest);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('getFee', () => {
    it('should return success true', async () => {
      const result = await service.getFee({ to: '0xRecipient' });

      expect(result.success).toBe(true);
    });
  });
});
