import { of, throwError } from 'rxjs';
import { TokenGrpcService } from '../token.service';
import {
  TokenAddingType,
  TokenRemovingType,
} from '@/proto-generated/token/messages';

describe('TokenGrpcService', () => {
  let service: TokenGrpcService;
  let mockClient: any;
  let mockGrpcClient: any;

  const TEST_TOKEN_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

  const mockToken = {
    address: TEST_TOKEN_ADDRESS,
    name: 'Test Token',
    symbol: 'TEST',
    decimals: 18,
    price: '1.5',
  };

  beforeEach(() => {
    mockClient = {
      getToken: jest.fn(),
      getTokens: jest.fn(),
      getTokenPrice: jest.fn(),
      addToken: jest.fn(),
      removeToken: jest.fn(),
    };

    mockGrpcClient = {
      getService: jest.fn().mockReturnValue(mockClient),
    };

    service = new TokenGrpcService(mockGrpcClient);
  });

  describe('constructor', () => {
    it('should get service from gRPC client', () => {
      expect(mockGrpcClient.getService).toHaveBeenCalledWith(
        'ScannerToken',
      );
    });
  });

  describe('getToken', () => {
    const request = {
      tokenAddress: TEST_TOKEN_ADDRESS,
      addIfNotExist: false,
    };

    it('should return token data on success', async () => {
      const expectedResponse = { token: mockToken };
      mockClient.getToken.mockReturnValue(of(expectedResponse));

      const result = await service.getToken(request);

      expect(result).toEqual(expectedResponse);
      expect(mockClient.getToken).toHaveBeenCalledWith({ ...request });
    });

    it('should return undefined token on error', async () => {
      mockClient.getToken.mockReturnValue(
        throwError(() => new Error('gRPC error')),
      );

      const result = await service.getToken(request);

      expect(result).toEqual({ token: undefined });
    });

    it('should handle network timeout error', async () => {
      mockClient.getToken.mockReturnValue(
        throwError(() => new Error('DEADLINE_EXCEEDED')),
      );

      const result = await service.getToken(request);

      expect(result).toEqual({ token: undefined });
    });

    it('should handle service unavailable error', async () => {
      mockClient.getToken.mockReturnValue(
        throwError(() => new Error('UNAVAILABLE')),
      );

      const result = await service.getToken(request);

      expect(result).toEqual({ token: undefined });
    });

    it('should pass addIfNotExist flag correctly', async () => {
      const requestWithAdd = { tokenAddress: TEST_TOKEN_ADDRESS, addIfNotExist: true };
      mockClient.getToken.mockReturnValue(of({ token: mockToken }));

      await service.getToken(requestWithAdd);

      expect(mockClient.getToken).toHaveBeenCalledWith({ ...requestWithAdd });
    });
  });

  describe('getTokens', () => {
    const request = {
      tokenAddresses: [TEST_TOKEN_ADDRESS, '0xabcdef1234567890abcdef1234567890abcdef12'],
    };

    it('should return tokens array on success', async () => {
      const expectedResponse = { tokens: [mockToken, { ...mockToken, address: request.tokenAddresses[1] }] };
      mockClient.getTokens.mockReturnValue(of(expectedResponse));

      const result = await service.getTokens(request);

      expect(result).toEqual(expectedResponse);
      expect(mockClient.getTokens).toHaveBeenCalledWith(request);
    });

    it('should return empty array on error', async () => {
      mockClient.getTokens.mockReturnValue(
        throwError(() => new Error('gRPC error')),
      );

      const result = await service.getTokens(request);

      expect(result).toEqual({ tokens: [] });
    });

    it('should handle empty token addresses request', async () => {
      const emptyRequest = { tokenAddresses: [] };
      mockClient.getTokens.mockReturnValue(of({ tokens: [] }));

      const result = await service.getTokens(emptyRequest);

      expect(result).toEqual({ tokens: [] });
    });
  });

  describe('getTokenPrice', () => {
    const request = {
      tokenAddress: TEST_TOKEN_ADDRESS,
      reason: 'swap',
    };

    it('should return price data on success', async () => {
      const expectedResponse = { price: '1.5', success: true, volume: '1000000' };
      mockClient.getTokenPrice.mockReturnValue(of(expectedResponse));

      const result = await service.getTokenPrice(request);

      expect(result).toEqual(expectedResponse);
      expect(mockClient.getTokenPrice).toHaveBeenCalledWith(request);
    });

    it('should return default error response on failure', async () => {
      mockClient.getTokenPrice.mockReturnValue(
        throwError(() => new Error('gRPC error')),
      );

      const result = await service.getTokenPrice(request);

      expect(result).toEqual({ price: '0', success: false, volume: '0' });
    });

    it('should handle request without reason', async () => {
      const requestWithoutReason = { tokenAddress: TEST_TOKEN_ADDRESS };
      mockClient.getTokenPrice.mockReturnValue(
        of({ price: '2.0', success: true, volume: '500000' }),
      );

      const result = await service.getTokenPrice(requestWithoutReason);

      expect(result.success).toBe(true);
    });
  });

  describe('addToken', () => {
    const request = {
      tokenAddress: TEST_TOKEN_ADDRESS,
      name: 'New Token',
      symbol: 'NEW',
    };

    it('should return success response on first time add', async () => {
      const expectedResponse = {
        success: true,
        type: TokenAddingType.FIRST_TIME,
        Message: 'Token added successfully',
      };
      mockClient.addToken.mockReturnValue(of(expectedResponse));

      const result = await service.addToken(request);

      expect(result).toEqual(expectedResponse);
      expect(mockClient.addToken).toHaveBeenCalledWith(request);
    });

    it('should return duplicate response for existing token', async () => {
      const expectedResponse = {
        success: true,
        type: TokenAddingType.DUPLICATE,
        Message: 'Token already exists',
      };
      mockClient.addToken.mockReturnValue(of(expectedResponse));

      const result = await service.addToken(request);

      expect(result).toEqual(expectedResponse);
    });

    it('should return error response on gRPC failure', async () => {
      mockClient.addToken.mockReturnValue(
        throwError(() => new Error('gRPC error')),
      );

      const result = await service.addToken(request);

      expect(result).toEqual({
        success: false,
        type: TokenAddingType.ADD_ERROR,
        Message: 'Unknown error',
      });
    });

    it('should handle minimal request with only tokenAddress', async () => {
      const minimalRequest = { tokenAddress: TEST_TOKEN_ADDRESS };
      mockClient.addToken.mockReturnValue(
        of({ success: true, type: TokenAddingType.FIRST_TIME, Message: 'Added' }),
      );

      const result = await service.addToken(minimalRequest);

      expect(result.success).toBe(true);
      expect(mockClient.addToken).toHaveBeenCalledWith(minimalRequest);
    });

    it('should pass optional fields correctly', async () => {
      const fullRequest = {
        tokenAddress: TEST_TOKEN_ADDRESS,
        name: 'Full Token',
        symbol: 'FULL',
        image: 'https://example.com/image.png',
        poolAddress: '0xpool',
        circulatedSupply: '1000000',
        pairAddress: '0xpair',
        reason: 'new listing',
        initialPrice: '0.01',
      };
      mockClient.addToken.mockReturnValue(
        of({ success: true, type: TokenAddingType.FIRST_TIME, Message: 'Added' }),
      );

      await service.addToken(fullRequest);

      expect(mockClient.addToken).toHaveBeenCalledWith(fullRequest);
    });
  });

  describe('removeToken', () => {
    const request = {
      tokenAddress: TEST_TOKEN_ADDRESS,
    };

    it('should return success response when all clear', async () => {
      const expectedResponse = {
        success: true,
        type: TokenRemovingType.ALL_CLEAR,
        Message: 'Token removed',
      };
      mockClient.removeToken.mockReturnValue(of(expectedResponse));

      const result = await service.removeToken(request);

      expect(result).toEqual(expectedResponse);
      expect(mockClient.removeToken).toHaveBeenCalledWith(request);
    });

    it('should return still calculates when token is being processed', async () => {
      const expectedResponse = {
        success: true,
        type: TokenRemovingType.STILL_CALCULATES,
        Message: 'Token is still being calculated',
      };
      mockClient.removeToken.mockReturnValue(of(expectedResponse));

      const result = await service.removeToken(request);

      expect(result).toEqual(expectedResponse);
    });

    it('should return error response on gRPC failure', async () => {
      mockClient.removeToken.mockReturnValue(
        throwError(() => new Error('gRPC error')),
      );

      const result = await service.removeToken(request);

      expect(result).toEqual({
        success: false,
        type: TokenRemovingType.REMOVE_ERROR,
        Message: 'Unknown error',
      });
    });

    it('should handle bypassEnds flag', async () => {
      const requestWithBypass = { tokenAddress: TEST_TOKEN_ADDRESS, bypassEnds: true };
      mockClient.removeToken.mockReturnValue(
        of({ success: true, type: TokenRemovingType.ALL_CLEAR, Message: 'Bypassed' }),
      );

      await service.removeToken(requestWithBypass);

      expect(mockClient.removeToken).toHaveBeenCalledWith(requestWithBypass);
    });
  });
});
