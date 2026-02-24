import {
  DataType,
  GetWalletRequest,
  GetWalletResponse,
  GetWalletTokensRequest,
  GetWalletTokensResponse,
  UpdateWalletPortfolioRequest,
  UpdateWalletPortfolioResponse,
} from '@/proto-generated/wallet/messages';
import {
  SCANNER_WALLET_SERVICE_NAME,
  ScannerWalletClient,
} from '@/proto-generated/wallet/wallet';
import {
  GetWalletDetailsRequest,
  GetWalletDetailsResponse,
} from '@/proto-generated/wallet/messages';
import {
  AddWalletRequest,
  AddWalletResponse,
} from '@/proto-generated/wallet/messages';
import { Inject, Injectable } from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class WalletGrpcService {
  private client: ScannerWalletClient;

  constructor(@Inject(SCANNER_WALLET_SERVICE_NAME) client: ClientGrpc) {
    this.client = client.getService<ScannerWalletClient>(
      SCANNER_WALLET_SERVICE_NAME,
    );
  }

  async getWallet(request: GetWalletRequest): Promise<GetWalletResponse> {
    try {
      return await lastValueFrom(
        this.client.getWallet({ ...request, type: DataType.SCANNER }),
      );
    } catch (error) {
      return { walletData: undefined };
    }
  }

  async getWalletTokens(
    request: GetWalletTokensRequest,
  ): Promise<GetWalletTokensResponse> {
    try {
      return await lastValueFrom(this.client.getWalletTokens(request));
    } catch (error) {
      return { tokens: [], numberOfTokens: 0 };
    }
  }

  async getWalletDetails(
    request: GetWalletDetailsRequest,
  ): Promise<GetWalletDetailsResponse> {
    try {
      return await lastValueFrom(this.client.getWalletDetails(request));
    } catch (error) {
      return { tokens: [], numberOfTokens: 0, walletData: undefined };
    }
  }

  async addWallet(request: AddWalletRequest): Promise<AddWalletResponse> {
    try {
      return await lastValueFrom(this.client.addWallet(request));
    } catch (error) {
      return { success: false };
    }
  }

  async updateWalletPortfolio(
    request: UpdateWalletPortfolioRequest,
  ): Promise<UpdateWalletPortfolioResponse> {
    try {
      return await lastValueFrom(this.client.updateWalletPortfolio(request));
    } catch (error) {
      return { success: false };
    }
  }
}
