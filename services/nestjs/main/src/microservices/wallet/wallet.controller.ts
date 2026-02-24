import { Controller } from '@nestjs/common';
import { WalletGrpcService } from './wallet.service';
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
import { GrpcMethod } from '@nestjs/microservices';
import { Payload } from '@nestjs/microservices';
import {
  SCANNER_PACKAGE_NAME,
  SCANNER_SERVICE_NAME,
} from '@/proto-generated';

@Controller(SCANNER_PACKAGE_NAME)
export class WalletController {
  constructor(private readonly walletGrpcService: WalletGrpcService) {}

  @GrpcMethod(SCANNER_SERVICE_NAME, 'GetWallet')
  async getWallet(
    @Payload() payload: GetWalletRequest,
  ): Promise<GetWalletResponse> {
    return await this.walletGrpcService.getWallet(payload);
  }

  @GrpcMethod(SCANNER_SERVICE_NAME, 'GetWalletTokens')
  async getWalletTokens(
    @Payload() payload: GetWalletTokensRequest,
  ): Promise<GetWalletTokensResponse> {
    return await this.walletGrpcService.getWalletTokens(payload);
  }

  @GrpcMethod(SCANNER_SERVICE_NAME, 'GetWalletDetails')
  async getWalletDetails(
    @Payload() payload: GetWalletDetailsRequest,
  ): Promise<GetWalletDetailsResponse> {
    return await this.walletGrpcService.getWalletDetails(payload);
  }

  @GrpcMethod(SCANNER_SERVICE_NAME, 'AddWallet')
  async addWallet(
    @Payload() payload: AddWalletRequest,
  ): Promise<AddWalletResponse> {
    return this.walletGrpcService.addWallet(payload);
  }
}
