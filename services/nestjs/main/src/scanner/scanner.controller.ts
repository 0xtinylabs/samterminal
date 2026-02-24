import {
  SCANNER_PACKAGE_NAME,
  SCANNER_SERVICE_NAME,
} from '@/proto-generated';
import type {
  AddTokenRequest,
  AddTokenResponse,
  GetTokenPriceRequest,
  GetTokenPriceResponse,
  GetTokenRequest,
  GetTokenResponse,
  RemoveTokenRequest,
  RemoveTokenResponse,
} from '@/proto-generated/token/messages';
import type {
  AddWalletRequest,
  AddWalletResponse,
  GetWalletDetailsRequest,
  GetWalletDetailsResponse,
  GetWalletRequest,
  GetWalletResponse,
  GetWalletTokensRequest,
  GetWalletTokensResponse,
} from '@/proto-generated/wallet/messages';
import { Controller } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { ScannerService } from './scanner.service';

@Controller(SCANNER_PACKAGE_NAME)
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  // Token operations
  @GrpcMethod(SCANNER_SERVICE_NAME, 'getToken')
  async getToken(
    @Payload() payload: GetTokenRequest,
  ): Promise<GetTokenResponse> {
    return await this.scannerService.getToken(payload);
  }

  @GrpcMethod(SCANNER_SERVICE_NAME, 'getTokenPrice')
  async getTokenPrice(
    @Payload() payload: GetTokenPriceRequest,
  ): Promise<GetTokenPriceResponse> {
    return await this.scannerService.getTokenPrice(payload);
  }

  @GrpcMethod(SCANNER_SERVICE_NAME, 'addToken')
  async addToken(
    @Payload() payload: AddTokenRequest,
  ): Promise<AddTokenResponse> {
    return await this.scannerService.addToken(payload);
  }

  @GrpcMethod(SCANNER_SERVICE_NAME, 'removeToken')
  async removeToken(
    @Payload() payload: RemoveTokenRequest,
  ): Promise<RemoveTokenResponse> {
    return await this.scannerService.removeToken(payload);
  }

  // Wallet operations
  @GrpcMethod(SCANNER_SERVICE_NAME, 'addWallet')
  async addWallet(
    @Payload() payload: AddWalletRequest,
  ): Promise<AddWalletResponse> {
    return await this.scannerService.addWallet(payload);
  }

  @GrpcMethod(SCANNER_SERVICE_NAME, 'getWallet')
  async getWallet(
    @Payload() payload: GetWalletRequest,
  ): Promise<GetWalletResponse> {
    return await this.scannerService.getWallet(payload);
  }

  @GrpcMethod(SCANNER_SERVICE_NAME, 'getWalletTokens')
  async getWalletTokens(
    @Payload() payload: GetWalletTokensRequest,
  ): Promise<GetWalletTokensResponse> {
    return await this.scannerService.getWalletTokens(payload);
  }

  @GrpcMethod(SCANNER_SERVICE_NAME, 'getWalletDetails')
  async getWalletDetails(
    @Payload() payload: GetWalletDetailsRequest,
  ): Promise<GetWalletDetailsResponse> {
    return await this.scannerService.getWalletDetails(payload);
  }
}
