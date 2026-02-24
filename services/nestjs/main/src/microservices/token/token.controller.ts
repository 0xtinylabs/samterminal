import { Controller } from '@nestjs/common';
import { TokenGrpcService } from './token.service';
import type {
  AddTokenRequest,
  AddTokenResponse,
  GetTokenRequest,
  GetTokensRequest,
  GetTokenPriceRequest,
  GetTokenPriceResponse,
  RemoveTokenRequest,
  RemoveTokenResponse,
  GetTokenResponse,
  GetTokensResponse,
} from '@/proto-generated/token/messages';
import { GrpcMethod } from '@nestjs/microservices';
import { Payload } from '@nestjs/microservices';
import {
  SCANNER_PACKAGE_NAME,
  SCANNER_SERVICE_NAME,
} from '@/proto-generated';

@Controller(SCANNER_PACKAGE_NAME)
export class TokenController {
  constructor(private readonly tokenGrpcService: TokenGrpcService) {}

  @GrpcMethod(SCANNER_SERVICE_NAME, 'GetToken')
  async getToken(
    @Payload() payload: GetTokenRequest,
  ): Promise<GetTokenResponse> {
    return await this.tokenGrpcService.getToken(payload);
  }

  @GrpcMethod(SCANNER_SERVICE_NAME, 'GetTokens')
  async getTokens(
    @Payload() payload: GetTokensRequest,
  ): Promise<GetTokensResponse> {
    return await this.tokenGrpcService.getTokens(payload);
  }

  @GrpcMethod(SCANNER_SERVICE_NAME, 'GetTokenPrice')
  async getTokenPrice(
    @Payload() payload: GetTokenPriceRequest,
  ): Promise<GetTokenPriceResponse> {
    return await this.tokenGrpcService.getTokenPrice(payload);
  }

  @GrpcMethod(SCANNER_SERVICE_NAME, 'AddToken')
  async addToken(
    @Payload() payload: AddTokenRequest,
  ): Promise<AddTokenResponse> {
    return this.tokenGrpcService.addToken(payload);
  }

  @GrpcMethod(SCANNER_SERVICE_NAME, 'RemoveToken')
  async removeToken(
    @Payload() payload: RemoveTokenRequest,
  ): Promise<RemoveTokenResponse> {
    return this.tokenGrpcService.removeToken(payload);
  }
}
