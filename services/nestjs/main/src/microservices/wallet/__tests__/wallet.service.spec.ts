import { of, throwError } from 'rxjs';
import { WalletGrpcService } from '../wallet.service';
import { DataType } from '@/proto-generated/wallet/messages';
import { CHAIN } from '@/proto-generated/common/common';

describe('WalletGrpcService', () => {
  let service: WalletGrpcService;
  let mockClient: any;
  let mockGrpcClient: any;

  const TEST_WALLET_ADDRESS = '0xabcdef1234567890abcdef1234567890abcdef12';

  const mockWalletData = {
    walletAddress: TEST_WALLET_ADDRESS,
    totalDollarValue: '1000.00',
    tokenAddresses: ['0xtoken1', '0xtoken2'],
  };

  const mockWalletTokens = [
    {
      tokenAddress: '0xtoken1',
      tokenName: 'Token 1',
      tokenSymbol: 'TK1',
      tokenBalance: '100',
      tokenDollarValue: '500.00',
    },
    {
      tokenAddress: '0xtoken2',
      tokenName: 'Token 2',
      tokenSymbol: 'TK2',
      tokenBalance: '200',
      tokenDollarValue: '300.00',
    },
  ];

  beforeEach(() => {
    mockClient = {
      getWallet: jest.fn(),
      getWalletTokens: jest.fn(),
      getWalletDetails: jest.fn(),
      addWallet: jest.fn(),
      updateWalletPortfolio: jest.fn(),
    };

    mockGrpcClient = {
      getService: jest.fn().mockReturnValue(mockClient),
    };

    service = new WalletGrpcService(mockGrpcClient);
  });

  describe('constructor', () => {
    it('should get service from gRPC client', () => {
      expect(mockGrpcClient.getService).toHaveBeenCalledWith(
        'ScannerWallet',
      );
    });
  });

  describe('getWallet', () => {
    const request = {
      walletAddress: TEST_WALLET_ADDRESS,
      chain: CHAIN.BASE,
      type: DataType.API,
      tokenAddresses: [],
    };

    it('should return wallet data on success', async () => {
      const expectedResponse = { walletData: mockWalletData };
      mockClient.getWallet.mockReturnValue(of(expectedResponse));

      const result = await service.getWallet(request);

      expect(result).toEqual(expectedResponse);
      expect(mockClient.getWallet).toHaveBeenCalledWith({
        ...request,
        type: DataType.SCANNER,
      });
    });

    it('should override type to SCANNER', async () => {
      mockClient.getWallet.mockReturnValue(of({ walletData: mockWalletData }));

      await service.getWallet(request);

      expect(mockClient.getWallet).toHaveBeenCalledWith(
        expect.objectContaining({ type: DataType.SCANNER }),
      );
    });

    it('should return undefined walletData on error', async () => {
      mockClient.getWallet.mockReturnValue(
        throwError(() => new Error('gRPC error')),
      );

      const result = await service.getWallet(request);

      expect(result).toEqual({ walletData: undefined });
    });

    it('should handle network timeout error', async () => {
      mockClient.getWallet.mockReturnValue(
        throwError(() => new Error('DEADLINE_EXCEEDED')),
      );

      const result = await service.getWallet(request);

      expect(result).toEqual({ walletData: undefined });
    });

    it('should handle service unavailable error', async () => {
      mockClient.getWallet.mockReturnValue(
        throwError(() => new Error('UNAVAILABLE')),
      );

      const result = await service.getWallet(request);

      expect(result).toEqual({ walletData: undefined });
    });

    it('should pass tokenAddresses correctly', async () => {
      const requestWithTokens = {
        ...request,
        tokenAddresses: ['0xtoken1', '0xtoken2'],
      };
      mockClient.getWallet.mockReturnValue(of({ walletData: mockWalletData }));

      await service.getWallet(requestWithTokens);

      expect(mockClient.getWallet).toHaveBeenCalledWith(
        expect.objectContaining({ tokenAddresses: ['0xtoken1', '0xtoken2'] }),
      );
    });
  });

  describe('getWalletTokens', () => {
    const request = {
      walletAddress: TEST_WALLET_ADDRESS,
      chain: CHAIN.BASE,
      type: DataType.SCANNER,
      tokenAddresses: [],
      filterLowUSD: false,
    };

    it('should return wallet tokens on success', async () => {
      const expectedResponse = { tokens: mockWalletTokens, numberOfTokens: 2 };
      mockClient.getWalletTokens.mockReturnValue(of(expectedResponse));

      const result = await service.getWalletTokens(request);

      expect(result).toEqual(expectedResponse);
      expect(mockClient.getWalletTokens).toHaveBeenCalledWith(request);
    });

    it('should return empty tokens array on error', async () => {
      mockClient.getWalletTokens.mockReturnValue(
        throwError(() => new Error('gRPC error')),
      );

      const result = await service.getWalletTokens(request);

      expect(result).toEqual({ tokens: [], numberOfTokens: 0 });
    });

    it('should handle filterLowUSD flag', async () => {
      const requestWithFilter = { ...request, filterLowUSD: true };
      mockClient.getWalletTokens.mockReturnValue(
        of({ tokens: [mockWalletTokens[0]], numberOfTokens: 1 }),
      );

      await service.getWalletTokens(requestWithFilter);

      expect(mockClient.getWalletTokens).toHaveBeenCalledWith(
        expect.objectContaining({ filterLowUSD: true }),
      );
    });

    it('should handle empty wallet', async () => {
      mockClient.getWalletTokens.mockReturnValue(
        of({ tokens: [], numberOfTokens: 0 }),
      );

      const result = await service.getWalletTokens(request);

      expect(result).toEqual({ tokens: [], numberOfTokens: 0 });
    });
  });

  describe('getWalletDetails', () => {
    const request = {
      walletAddress: TEST_WALLET_ADDRESS,
      chain: CHAIN.BASE,
      type: DataType.SCANNER,
      tokenAddresses: [],
      filterLowUSD: false,
    };

    it('should return wallet details on success', async () => {
      const expectedResponse = {
        tokens: mockWalletTokens,
        numberOfTokens: 2,
        walletData: mockWalletData,
      };
      mockClient.getWalletDetails.mockReturnValue(of(expectedResponse));

      const result = await service.getWalletDetails(request);

      expect(result).toEqual(expectedResponse);
      expect(mockClient.getWalletDetails).toHaveBeenCalledWith(request);
    });

    it('should return empty response on error', async () => {
      mockClient.getWalletDetails.mockReturnValue(
        throwError(() => new Error('gRPC error')),
      );

      const result = await service.getWalletDetails(request);

      expect(result).toEqual({
        tokens: [],
        numberOfTokens: 0,
        walletData: undefined,
      });
    });

    it('should include walletData in response', async () => {
      const expectedResponse = {
        tokens: mockWalletTokens,
        numberOfTokens: 2,
        walletData: mockWalletData,
      };
      mockClient.getWalletDetails.mockReturnValue(of(expectedResponse));

      const result = await service.getWalletDetails(request);

      expect(result.walletData).toEqual(mockWalletData);
    });
  });

  describe('addWallet', () => {
    const request = {
      walletAddress: TEST_WALLET_ADDRESS,
    };

    it('should return success on wallet addition', async () => {
      const expectedResponse = { success: true };
      mockClient.addWallet.mockReturnValue(of(expectedResponse));

      const result = await service.addWallet(request);

      expect(result).toEqual(expectedResponse);
      expect(mockClient.addWallet).toHaveBeenCalledWith(request);
    });

    it('should return false on gRPC error', async () => {
      mockClient.addWallet.mockReturnValue(
        throwError(() => new Error('gRPC error')),
      );

      const result = await service.addWallet(request);

      expect(result).toEqual({ success: false });
    });

    it('should handle duplicate wallet gracefully', async () => {
      mockClient.addWallet.mockReturnValue(of({ success: true }));

      const result = await service.addWallet(request);

      expect(result.success).toBe(true);
    });

    it('should handle invalid wallet address', async () => {
      const invalidRequest = { walletAddress: 'invalid' };
      mockClient.addWallet.mockReturnValue(
        throwError(() => new Error('Invalid address')),
      );

      const result = await service.addWallet(invalidRequest);

      expect(result).toEqual({ success: false });
    });
  });

  describe('updateWalletPortfolio', () => {
    const request = {
      walletAddress: TEST_WALLET_ADDRESS,
      totalDollarValue: '1500.00',
    };

    it('should return success on portfolio update', async () => {
      const expectedResponse = { success: true };
      mockClient.updateWalletPortfolio.mockReturnValue(of(expectedResponse));

      const result = await service.updateWalletPortfolio(request);

      expect(result).toEqual(expectedResponse);
      expect(mockClient.updateWalletPortfolio).toHaveBeenCalledWith(request);
    });

    it('should return false on gRPC error', async () => {
      mockClient.updateWalletPortfolio.mockReturnValue(
        throwError(() => new Error('gRPC error')),
      );

      const result = await service.updateWalletPortfolio(request);

      expect(result).toEqual({ success: false });
    });

    it('should handle zero dollar value', async () => {
      const zeroValueRequest = { walletAddress: TEST_WALLET_ADDRESS, totalDollarValue: '0' };
      mockClient.updateWalletPortfolio.mockReturnValue(of({ success: true }));

      const result = await service.updateWalletPortfolio(zeroValueRequest);

      expect(result.success).toBe(true);
    });

    it('should handle large dollar value', async () => {
      const largeValueRequest = {
        walletAddress: TEST_WALLET_ADDRESS,
        totalDollarValue: '999999999.99',
      };
      mockClient.updateWalletPortfolio.mockReturnValue(of({ success: true }));

      const result = await service.updateWalletPortfolio(largeValueRequest);

      expect(result.success).toBe(true);
      expect(mockClient.updateWalletPortfolio).toHaveBeenCalledWith(largeValueRequest);
    });
  });

  describe('error handling', () => {
    it('should not throw on any gRPC error', async () => {
      mockClient.getWallet.mockReturnValue(throwError(() => new Error('Any error')));
      mockClient.getWalletTokens.mockReturnValue(throwError(() => new Error('Any error')));
      mockClient.getWalletDetails.mockReturnValue(throwError(() => new Error('Any error')));
      mockClient.addWallet.mockReturnValue(throwError(() => new Error('Any error')));
      mockClient.updateWalletPortfolio.mockReturnValue(throwError(() => new Error('Any error')));

      await expect(service.getWallet({ walletAddress: '', chain: CHAIN.BASE, type: DataType.API, tokenAddresses: [] })).resolves.not.toThrow();
      await expect(service.getWalletTokens({ walletAddress: '', chain: CHAIN.BASE, type: DataType.API, tokenAddresses: [], filterLowUSD: false })).resolves.not.toThrow();
      await expect(service.getWalletDetails({ walletAddress: '', chain: CHAIN.BASE, type: DataType.API, tokenAddresses: [], filterLowUSD: false })).resolves.not.toThrow();
      await expect(service.addWallet({ walletAddress: '' })).resolves.not.toThrow();
      await expect(service.updateWalletPortfolio({ walletAddress: '', totalDollarValue: '' })).resolves.not.toThrow();
    });
  });
});
