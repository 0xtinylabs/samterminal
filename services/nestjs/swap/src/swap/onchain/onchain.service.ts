import { Injectable } from '@nestjs/common';
import { ApiService } from '@/swap/onchain/api/api.service';
import {
  GetFeeRequest,
  GetFeeResponse,
  SwapRequest,
  SwapResponse,
} from '@/proto-generated/swap';
import { NATIVE, PERMIT, PROVIDER, WALLET } from '@/swap/onchain/utils';
import { CONFIG } from '@/config/config';
import { GAS } from '@/swap/onchain/utils/provider';
import { ETHERS } from '@/web3/tokens';

@Injectable()
export class OnchainService {
  constructor(private apiService: ApiService) {}

  async swap(request: SwapRequest): Promise<SwapResponse> {
    // Get Wallet

    const wallet = WALLET.CLIENT.walletClient(request.privateKey);

    const amount = await this.apiService.getAmount({
      amount: request.amount,
      privateKey: request.privateKey,
      tokenAddress: request.fromTokenAddress,
      walletAddress: wallet.address,
    });

    if (amount.noBalance) {
      return { success: false, error: { message: 'No balance' } };
    }

    // Get Quote From 0x API

    const quote = await this.apiService.quoteSwap({
      amount: request.amount,
      fromSwapToken: request.fromTokenAddress,
      toSwapToken: request.toTokenAddress,
      toWalletAddress: wallet.address,
      slippage: request.slippage ?? 10,
      privateKey: request.privateKey,
    });

    if (quote?.type === 'error') {
      const errMsg = 'error' in quote && quote.error instanceof Error ? quote.error.message : String('error' in quote ? quote.error : 'Unknown swap error');
      return { success: false, error: { message: errMsg } };
    }

    const isNative = ETHERS.UNCHECKABLE_GROUP.includes(
      request.fromTokenAddress.toLowerCase(),
    );

    if (isNative) {
      if (!quote) {
        return { success: false };
      }
      const { hash } = await NATIVE.nativeTransaction(
        {
          transaction: quote.transaction,
          wallet: wallet,
        },
        async () => {},
      );

      return {
        success: true,
        tx: hash,
        txId: hash,
        error: { error: {} },
        buyAmount: quote?.buyAmount?.toString(),
        sellAmount: quote?.sellAmount?.toString(),
        companyFee: '0',
      };
    }

    let data = quote?.transaction?.data ?? '0x';

    if (!quote.transaction) {
      return {
        success: false,
        buyAmount: '0',
        error: {
          message: 'error' in quote && quote.error instanceof Error ? quote.error.message : String('error' in quote ? quote.error : 'Unknown swap error'),
        },
      };
    }

    // Allow for amount

    await PERMIT.allowance(request.fromTokenAddress, wallet, async () => {});

    data = await PERMIT.permitSecure(
      request.fromTokenAddress,
      request.privateKey,
      quote?.transaction?.data ?? '',
      request?.amount,
      quote?.transaction?.to,
    );

    // Get Gas Limit
    const { gasLimit } = await GAS.getGasInformation();

    // Send Transaction via wallet
    const { hash } = await NATIVE.nativeTransaction(
      {
        transaction: {
          to: CONFIG.swap.permitSwap,
          data: data,
          value: '0',
          gas: gasLimit.toString(),
          gasPrice: '',
        },
        wallet: wallet,
      },
      async () => {},
    );

    // Error If: No Transaction Data
    if (!hash) {
      return {
        success: false,
        error: { message: 'Could not swapped' },
      };
    }

    // Return Necessary Information
    return {
      success: true,
      tx: hash,
      txId: hash,
      error: { error: {} },
      buyAmount: quote?.buyAmount?.toString(),
      sellAmount: quote?.sellAmount?.toString(),
      companyFee: quote.user_fee,
    };
  }

  async getFee(_request: GetFeeRequest): Promise<GetFeeResponse> {
    return { success: true };
  }
}
