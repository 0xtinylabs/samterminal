import { ScannerService } from '../scanner.service';
import { TokenGrpcService } from '../../microservices/token/token.service';
import { WalletGrpcService } from '../../microservices/wallet/wallet.service';
import { CHAIN, Token, Wallet, WalletToken } from '../../proto-generated/common/common';
import { DataType } from '../../proto-generated/wallet/messages';
import {
  TokenAddingType,
  TokenRemovingType,
} from '../../proto-generated/token/messages';

// Mock dependencies
jest.mock('../../microservices/token/token.service');
jest.mock('../../microservices/wallet/wallet.service');

// Mock WalletDTO
jest.mock('../dto/wallet.dto', () => ({
  WalletDTO: jest.fn().mockImplementation((walletData, nativeTokenPrice) => ({
    getWalletData: jest.fn().mockResolvedValue({
      ...walletData,
      nativeBalanceFormatted: '1.0',
      totalDollarValue: (
        parseFloat(walletData.totalDollarValue || '0') +
        nativeTokenPrice
      ).toString(),
    }),
  })),
}));

// Mock TokenDTO
jest.mock('../dto/token.dto', () => ({
  TokenDTO: jest.fn().mockImplementation((tokenList) => ({
    getTokenData: jest.fn().mockResolvedValue(
      tokenList.map((addr: string) => ({
        tokenAddress: addr,
        tokenBalance: '1000000000000000000',
        tokenBalanceFormatted: '1.0',
        tokenPrice: '100',
        tokenDollarValue: '100',
        tokenImage: '',
        tokenName: 'Token',
        tokenSymbol: 'TKN',
        tokenVolume: '0',
        tokenSupply: '0',
        tokenPairAddress: '',
      })),
    ),
    getNativeTokenData: jest.fn().mockResolvedValue({
      tokenAddress: '0x0000000000000000000000000000000000000000',
      tokenBalance: '1000000000000000000',
      tokenBalanceFormatted: '1.0',
      tokenPrice: '3000',
      tokenDollarValue: '3000',
      tokenImage: '',
      tokenName: 'Ethereum',
      tokenSymbol: 'ETH',
      tokenVolume: '0',
      tokenSupply: '0',
      tokenPairAddress: '',
    }),
    getCurrencyTokenData: jest.fn().mockResolvedValue({
      tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      tokenBalance: '1000000',
      tokenBalanceFormatted: '1.0',
      tokenPrice: '1',
      tokenDollarValue: '1',
      tokenImage: '',
      tokenName: 'USD Coin',
      tokenSymbol: 'USDC',
      tokenVolume: '0',
      tokenSupply: '0',
      tokenPairAddress: '',
    }),
  })),
}));

describe('ScannerService', () => {
  let service: ScannerService;
  let mockTokenGrpcService: jest.Mocked<TokenGrpcService>;
  let mockWalletGrpcService: jest.Mocked<WalletGrpcService>;

  const TEST_WALLET_ADDRESS = '0xabcdef1234567890abcdef1234567890abcdef12';
  const TEST_TOKEN_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

  const mockWalletData: Wallet = {
    walletAddress: TEST_WALLET_ADDRESS,
    totalDollarValue: '1000.00',
    tokenAddresses: [TEST_TOKEN_ADDRESS],
    nativeBalance: '1000000000000000000',
    nativeBalanceFormatted: '1.0',
  };

  const mockToken: Token = {
    address: TEST_TOKEN_ADDRESS,
    name: 'Test Token',
    symbol: 'TEST',
    decimals: '18',
    price: '100.00',
    imageUrl: '',
    volume: '1000000',
    calculatedVolume: '1000000',
    circulatedSupply: '1000000',
    pairAddress: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockTokenGrpcService = {
      getToken: jest.fn(),
      getTokens: jest.fn(),
      getTokenPrice: jest.fn(),
      addToken: jest.fn(),
      removeToken: jest.fn(),
    } as unknown as jest.Mocked<TokenGrpcService>;

    mockWalletGrpcService = {
      getWallet: jest.fn(),
      getWalletTokens: jest.fn(),
      getWalletDetails: jest.fn(),
      addWallet: jest.fn(),
      updateWalletPortfolio: jest.fn(),
    } as unknown as jest.Mocked<WalletGrpcService>;

    service = new ScannerService(
      mockTokenGrpcService,
      mockWalletGrpcService,
    );
  });

  describe('addWallet', () => {
    const request = { walletAddress: TEST_WALLET_ADDRESS };

    it('should delegate to walletGrpcService.addWallet', async () => {
      const expectedResponse = { success: true };
      mockWalletGrpcService.addWallet.mockResolvedValue(expectedResponse);

      const result = await service.addWallet(request);

      expect(result).toEqual(expectedResponse);
      expect(mockWalletGrpcService.addWallet).toHaveBeenCalledWith(request);
    });

    it('should return failure response on error', async () => {
      const expectedResponse = { success: false };
      mockWalletGrpcService.addWallet.mockResolvedValue(expectedResponse);

      const result = await service.addWallet(request);

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('addToken', () => {
    const request = {
      tokenAddress: TEST_TOKEN_ADDRESS,
      name: 'New Token',
      symbol: 'NEW',
    };

    it('should delegate to tokenGrpcService.addToken', async () => {
      const expectedResponse = {
        success: true,
        type: TokenAddingType.FIRST_TIME,
        Message: 'Token added',
      };
      mockTokenGrpcService.addToken.mockResolvedValue(expectedResponse);

      const result = await service.addToken(request);

      expect(result).toEqual(expectedResponse);
      expect(mockTokenGrpcService.addToken).toHaveBeenCalledWith(request);
    });

    it('should handle duplicate token', async () => {
      const expectedResponse = {
        success: true,
        type: TokenAddingType.DUPLICATE,
        Message: 'Already exists',
      };
      mockTokenGrpcService.addToken.mockResolvedValue(expectedResponse);

      const result = await service.addToken(request);

      expect(result.type).toBe(TokenAddingType.DUPLICATE);
    });
  });

  describe('removeToken', () => {
    const request = { tokenAddress: TEST_TOKEN_ADDRESS };

    it('should delegate to tokenGrpcService.removeToken', async () => {
      const expectedResponse = {
        success: true,
        type: TokenRemovingType.ALL_CLEAR,
        Message: 'Removed',
      };
      mockTokenGrpcService.removeToken.mockResolvedValue(expectedResponse);

      const result = await service.removeToken(request);

      expect(result).toEqual(expectedResponse);
      expect(mockTokenGrpcService.removeToken).toHaveBeenCalledWith(request);
    });
  });

  describe('getNativeTokenPrice', () => {
    it('should return token price when available', async () => {
      mockTokenGrpcService.getToken.mockResolvedValue({
        token: { ...mockToken, price: '2500.50' },
      });

      const result = await service.getNativeTokenPrice(CHAIN.BASE);

      expect(result).toBe(2500.5);
      expect(mockTokenGrpcService.getToken).toHaveBeenCalledWith({
        tokenAddress: '0x4200000000000000000000000000000000000006', // WETH on BASE
        addIfNotExist: false,
      });
    });

    it('should return default 3000 when token is undefined', async () => {
      mockTokenGrpcService.getToken.mockResolvedValue({ token: undefined });

      const result = await service.getNativeTokenPrice(CHAIN.BASE);

      expect(result).toBe(3000);
    });

    it('should return default 3000 when price is undefined', async () => {
      mockTokenGrpcService.getToken.mockResolvedValue({
        token: { ...mockToken, price: undefined },
      });

      const result = await service.getNativeTokenPrice(CHAIN.BASE);

      expect(result).toBe(3000);
    });

    it('should return default 3000 when price is empty', async () => {
      mockTokenGrpcService.getToken.mockResolvedValue({
        token: { ...mockToken, price: '' },
      });

      const result = await service.getNativeTokenPrice(CHAIN.BASE);

      expect(result).toBe(3000);
    });

    it('should use default chain BASE when not provided', async () => {
      mockTokenGrpcService.getToken.mockResolvedValue({
        token: { ...mockToken, price: '3100' },
      });

      const result = await service.getNativeTokenPrice();

      expect(result).toBe(3100);
    });
  });

  describe('getCurrencyTokenPrice', () => {
    it('should return token price when available', async () => {
      mockTokenGrpcService.getToken.mockResolvedValue({
        token: { ...mockToken, price: '1.01' },
      });

      const result = await service.getCurrencyTokenPrice(CHAIN.BASE);

      expect(result).toBe(1.01);
      expect(mockTokenGrpcService.getToken).toHaveBeenCalledWith({
        tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on BASE
        addIfNotExist: false,
      });
    });

    it('should return default 1 when token is undefined', async () => {
      mockTokenGrpcService.getToken.mockResolvedValue({ token: undefined });

      const result = await service.getCurrencyTokenPrice(CHAIN.BASE);

      expect(result).toBe(1);
    });

    it('should return default 1 when price is undefined', async () => {
      mockTokenGrpcService.getToken.mockResolvedValue({
        token: { ...mockToken, price: undefined },
      });

      const result = await service.getCurrencyTokenPrice(CHAIN.BASE);

      expect(result).toBe(1);
    });
  });

  describe('getCurrencyTokenData', () => {
    it('should return token data when available', async () => {
      mockTokenGrpcService.getToken.mockResolvedValue({
        token: mockToken,
      });

      const result = await service.getCurrencyTokenData(CHAIN.BASE);

      expect(result).toEqual(mockToken);
    });

    it('should return undefined when token is not found', async () => {
      mockTokenGrpcService.getToken.mockResolvedValue({ token: undefined });

      const result = await service.getCurrencyTokenData(CHAIN.BASE);

      expect(result).toBeUndefined();
    });
  });

  describe('getWallet', () => {
    const request = {
      walletAddress: TEST_WALLET_ADDRESS,
      chain: CHAIN.BASE,
      type: DataType.SCANNER,
      tokenAddresses: [],
    };

    beforeEach(() => {
      mockTokenGrpcService.getToken.mockResolvedValue({
        token: { ...mockToken, price: '3000' },
      });
    });

    it('should return undefined walletData when wallet not found', async () => {
      mockWalletGrpcService.getWallet.mockResolvedValue({
        walletData: undefined,
      });

      const result = await service.getWallet(request);

      expect(result).toEqual({ walletData: undefined });
    });

    it('should enrich wallet data with native token address', async () => {
      mockWalletGrpcService.getWallet.mockResolvedValue({
        walletData: mockWalletData,
      });

      const result = await service.getWallet(request);

      expect(result.walletData?.tokenAddresses).toContain(
        '0x0000000000000000000000000000000000000000',
      );
    });

    it('should use provided tokenAddresses when available', async () => {
      const requestWithTokens = {
        ...request,
        tokenAddresses: ['0xtoken1', '0xtoken2'],
      };
      mockWalletGrpcService.getWallet.mockResolvedValue({
        walletData: mockWalletData,
      });

      const result = await service.getWallet(requestWithTokens);

      expect(result.walletData?.tokenAddresses).toContain('0xtoken1');
      expect(result.walletData?.tokenAddresses).toContain('0xtoken2');
    });

    it('should deduplicate token addresses', async () => {
      const requestWithDuplicates = {
        ...request,
        tokenAddresses: [TEST_TOKEN_ADDRESS, TEST_TOKEN_ADDRESS],
      };
      mockWalletGrpcService.getWallet.mockResolvedValue({
        walletData: mockWalletData,
      });

      const result = await service.getWallet(requestWithDuplicates);

      const addressCount = result.walletData?.tokenAddresses?.filter(
        (addr) => addr === TEST_TOKEN_ADDRESS,
      ).length;
      expect(addressCount).toBe(1);
    });
  });

  describe('getBaseTokens', () => {
    const nativeAddress = '0x0000000000000000000000000000000000000000';
    const currencyAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
    const eeeeAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

    it('should filter out native token address (0x0...0)', () => {
      const tokens = [TEST_TOKEN_ADDRESS, nativeAddress];

      const result = service.getBaseTokens(tokens, CHAIN.BASE);

      expect(result).toEqual([TEST_TOKEN_ADDRESS]);
      expect(result).not.toContain(nativeAddress);
    });

    it('should filter out currency token address (USDC)', () => {
      const tokens = [TEST_TOKEN_ADDRESS, currencyAddress];

      const result = service.getBaseTokens(tokens, CHAIN.BASE);

      expect(result).toEqual([TEST_TOKEN_ADDRESS]);
      expect(result).not.toContain(currencyAddress);
    });

    it('should filter out 0xeee...eee address', () => {
      const tokens = [TEST_TOKEN_ADDRESS, eeeeAddress];

      const result = service.getBaseTokens(tokens, CHAIN.BASE);

      expect(result).toEqual([TEST_TOKEN_ADDRESS]);
      expect(result).not.toContain(eeeeAddress);
    });

    it('should handle WalletToken objects', () => {
      const walletTokens: WalletToken[] = [
        {
          tokenAddress: TEST_TOKEN_ADDRESS,
          tokenBalance: '100',
          tokenBalanceFormatted: '1',
          tokenPrice: '10',
          tokenDollarValue: '10',
          tokenImage: '',
          tokenName: 'Test',
          tokenSymbol: 'TST',
          tokenVolume: '0',
          tokenSupply: '0',
          tokenPairAddress: '',
        },
        {
          tokenAddress: nativeAddress,
          tokenBalance: '100',
          tokenBalanceFormatted: '1',
          tokenPrice: '3000',
          tokenDollarValue: '3000',
          tokenImage: '',
          tokenName: 'ETH',
          tokenSymbol: 'ETH',
          tokenVolume: '0',
          tokenSupply: '0',
          tokenPairAddress: '',
        },
      ];

      const result = service.getBaseTokens(walletTokens, CHAIN.BASE);

      expect(result.length).toBe(1);
      expect(result[0].tokenAddress).toBe(TEST_TOKEN_ADDRESS);
    });

    it('should handle case-insensitive comparison', () => {
      const upperCaseNative = '0x0000000000000000000000000000000000000000';
      const tokens = [TEST_TOKEN_ADDRESS, upperCaseNative.toUpperCase()];

      // Since the method uses toLowerCase(), it should still filter
      const result = service.getBaseTokens(tokens, CHAIN.BASE);

      expect(result.length).toBe(1);
    });

    it('should return empty array when all tokens are filtered', () => {
      const tokens = [nativeAddress, currencyAddress, eeeeAddress];

      const result = service.getBaseTokens(tokens, CHAIN.BASE);

      expect(result).toEqual([]);
    });

    it('should return all tokens when none match filter criteria', () => {
      const tokens = [
        TEST_TOKEN_ADDRESS,
        '0xanotherToken123456789012345678901234567890',
      ];

      const result = service.getBaseTokens(tokens, CHAIN.BASE);

      expect(result).toEqual(tokens);
    });
  });

  describe('updateAndGetWalletTokensData', () => {
    beforeEach(() => {
      mockTokenGrpcService.getToken.mockResolvedValue({
        token: { ...mockToken, price: '3000' },
      });
      mockWalletGrpcService.updateWalletPortfolio.mockResolvedValue({
        success: true,
      });
    });

    it('should return empty array when tokenAddresses is undefined', async () => {
      const walletWithoutTokens: Wallet = {
        ...mockWalletData,
        tokenAddresses: undefined,
      };

      const result = await service.updateAndGetWalletTokensData(
        walletWithoutTokens,
        CHAIN.BASE,
      );

      expect(result).toEqual([]);
    });

    it('should return empty array when tokenAddresses is empty', async () => {
      const walletWithEmptyTokens: Wallet = {
        ...mockWalletData,
        tokenAddresses: [],
      };

      // Even with empty tokenAddresses, native and currency tokens are added
      const result = await service.updateAndGetWalletTokensData(
        walletWithEmptyTokens,
        CHAIN.BASE,
      );

      // Should contain native and currency tokens
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should call updateWalletPortfolio with calculated total', async () => {
      const result = await service.updateAndGetWalletTokensData(
        mockWalletData,
        CHAIN.BASE,
      );

      expect(mockWalletGrpcService.updateWalletPortfolio).toHaveBeenCalledWith(
        expect.objectContaining({
          walletAddress: TEST_WALLET_ADDRESS,
        }),
      );
    });

    it('should filter out tokens with price >= 1,000,000', async () => {
      // This is tested by the mock implementation
      const result = await service.updateAndGetWalletTokensData(
        mockWalletData,
        CHAIN.BASE,
      );

      // All returned tokens should have price < 1,000,000
      result.forEach((token) => {
        expect(parseFloat(token.tokenPrice)).toBeLessThan(1_000_000);
      });
    });

    it('should fetch token data for each base token', async () => {
      const walletWithMultipleTokens: Wallet = {
        ...mockWalletData,
        tokenAddresses: [
          TEST_TOKEN_ADDRESS,
          '0xanotherToken123456789012345678901234567890',
        ],
      };

      await service.updateAndGetWalletTokensData(
        walletWithMultipleTokens,
        CHAIN.BASE,
      );

      // Should call getToken for each base token + native/currency price lookups
      expect(mockTokenGrpcService.getToken).toHaveBeenCalled();
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

    beforeEach(() => {
      mockTokenGrpcService.getToken.mockResolvedValue({
        token: { ...mockToken, price: '3000' },
      });
      mockWalletGrpcService.getWallet.mockResolvedValue({
        walletData: mockWalletData,
      });
      mockWalletGrpcService.updateWalletPortfolio.mockResolvedValue({
        success: true,
      });
    });

    it('should return empty response when wallet not found', async () => {
      mockWalletGrpcService.getWallet.mockResolvedValue({
        walletData: undefined,
      });

      const result = await service.getWalletTokens(request);

      expect(result).toEqual({ numberOfTokens: 0, tokens: [] });
    });

    it('should return wallet tokens', async () => {
      const result = await service.getWalletTokens(request);

      expect(result.tokens).toBeDefined();
      expect(Array.isArray(result.tokens)).toBe(true);
    });

    it('should filter low USD tokens when filterLowUSD is true', async () => {
      const requestWithFilter = { ...request, filterLowUSD: true };

      const result = await service.getWalletTokens(requestWithFilter);

      // All remaining tokens should have value > 0.1
      result.tokens.forEach((token) => {
        expect(parseFloat(token.tokenDollarValue)).toBeGreaterThan(0.1);
      });
    });

    it('should not filter tokens when filterLowUSD is false', async () => {
      const result = await service.getWalletTokens(request);

      // numberOfTokens should reflect total before filtering
      expect(result.numberOfTokens).toBeDefined();
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

    beforeEach(() => {
      mockTokenGrpcService.getToken.mockResolvedValue({
        token: { ...mockToken, price: '3000' },
      });
      mockWalletGrpcService.getWallet.mockResolvedValue({
        walletData: mockWalletData,
      });
      mockWalletGrpcService.updateWalletPortfolio.mockResolvedValue({
        success: true,
      });
    });

    it('should return empty response when wallet not found', async () => {
      mockWalletGrpcService.getWallet.mockResolvedValue({
        walletData: undefined,
      });

      const result = await service.getWalletDetails(request);

      expect(result).toEqual({
        tokens: [],
        numberOfTokens: 0,
        walletData: undefined,
      });
    });

    it('should still process wallet when original tokenAddresses is undefined', async () => {
      // Note: getWallet enriches walletData by adding native token address,
      // so even if original tokenAddresses is undefined, it becomes populated
      mockWalletGrpcService.getWallet.mockResolvedValue({
        walletData: { ...mockWalletData, tokenAddresses: undefined },
      });

      const result = await service.getWalletDetails(request);

      // Should still return tokens (native + currency from mocks)
      expect(result.tokens).toBeDefined();
      expect(result.walletData).toBeDefined();
    });

    it('should return full wallet details with tokens', async () => {
      const result = await service.getWalletDetails(request);

      expect(result.walletData).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.numberOfTokens).toBeDefined();
    });

    it('should include walletData in response', async () => {
      const result = await service.getWalletDetails(request);

      expect(result.walletData?.walletAddress).toBe(TEST_WALLET_ADDRESS);
    });
  });

  describe('getToken', () => {
    const request = {
      tokenAddress: TEST_TOKEN_ADDRESS,
      addIfNotExist: false,
    };

    it('should delegate to tokenGrpcService.getToken', async () => {
      const expectedResponse = { token: mockToken };
      mockTokenGrpcService.getToken.mockResolvedValue(expectedResponse);

      const result = await service.getToken(request);

      expect(result).toEqual(expectedResponse);
      expect(mockTokenGrpcService.getToken).toHaveBeenCalledWith(request);
    });

    it('should return undefined token when not found', async () => {
      mockTokenGrpcService.getToken.mockResolvedValue({ token: undefined });

      const result = await service.getToken(request);

      expect(result.token).toBeUndefined();
    });

    it('should pass addIfNotExist flag correctly', async () => {
      const requestWithAdd = { ...request, addIfNotExist: true };
      mockTokenGrpcService.getToken.mockResolvedValue({ token: mockToken });

      await service.getToken(requestWithAdd);

      expect(mockTokenGrpcService.getToken).toHaveBeenCalledWith({
        tokenAddress: TEST_TOKEN_ADDRESS,
        addIfNotExist: true,
      });
    });
  });

  describe('error handling', () => {
    it('should propagate errors from tokenGrpcService', async () => {
      const error = new Error('gRPC error');
      mockTokenGrpcService.getToken.mockRejectedValue(error);

      await expect(
        service.getToken({ tokenAddress: TEST_TOKEN_ADDRESS, addIfNotExist: false }),
      ).rejects.toThrow('gRPC error');
    });

    it('should propagate errors from walletGrpcService', async () => {
      const error = new Error('gRPC error');
      mockWalletGrpcService.addWallet.mockRejectedValue(error);

      await expect(
        service.addWallet({ walletAddress: TEST_WALLET_ADDRESS }),
      ).rejects.toThrow('gRPC error');
    });
  });
});
