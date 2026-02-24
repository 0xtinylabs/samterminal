import {
  AddTokenRequest,
  AddTokenResponse,
  GetTokenPriceRequest,
  GetTokenPriceResponse,
  GetTokenRequest,
  GetTokenResponse,
  GetTokensRequest,
  GetTokensResponse,
  RemoveTokenRequest,
  RemoveTokenResponse,
  TokenAddingType,
  TokenRemovingType,
} from '@/proto-generated/token/messages';
import {
  SCANNER_TOKEN_SERVICE_NAME,
  ScannerTokenClient,
} from '@/proto-generated/token/token';
import { Inject } from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

export class TokenGrpcService {
  private client: ScannerTokenClient;

  constructor(@Inject(SCANNER_TOKEN_SERVICE_NAME) client: ClientGrpc) {
    this.client = client.getService<ScannerTokenClient>(
      SCANNER_TOKEN_SERVICE_NAME,
    );
  }

  async getToken(request: GetTokenRequest): Promise<GetTokenResponse> {
    try {
      return await lastValueFrom(this.client.getToken({ ...request }));
    } catch (error) {
      return { token: undefined };
    }
  }

  async getTokens(request: GetTokensRequest): Promise<GetTokensResponse> {
    try {
      return await lastValueFrom(this.client.getTokens(request));
    } catch (error) {
      return { tokens: [] };
    }
  }

  async getTokenPrice(
    request: GetTokenPriceRequest,
  ): Promise<GetTokenPriceResponse> {
    try {
      return await lastValueFrom(this.client.getTokenPrice(request));
    } catch (error) {
      return { price: '0', success: false, volume: '0' };
    }
  }

  async addToken(request: AddTokenRequest): Promise<AddTokenResponse> {
    try {
      return await lastValueFrom(this.client.addToken(request));
    } catch (error) {
      return {
        success: false,
        type: TokenAddingType.ADD_ERROR,
        Message: 'Unknown error',
      };
    }
  }

  async removeToken(request: RemoveTokenRequest): Promise<RemoveTokenResponse> {
    try {
      return await lastValueFrom(this.client.removeToken(request));
    } catch (error) {
      return {
        success: false,
        type: TokenRemovingType.REMOVE_ERROR,
        Message: 'Unknown error',
      };
    }
  }
}
