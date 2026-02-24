import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { CONFIG } from '@/config/config';
import {
  AmountRequest,
  AmountResponse,
  ApiSwapQuoteBodyMonetize,
  ApiSwapQuoteParams,
  ApiSwapQuoteRequest,
  ApiSwapQuoteResponse,
  SwapErrorResponse,
  SwapQuoteResponse,
} from './types/api';
import { AMOUNT, TOKEN, WALLET } from '@/swap/onchain/utils';
import { ETHERS } from '@/web3/tokens';
import { CHAINS } from '@/web3/chains';
import { GAS, RPC } from '@/swap/onchain/utils/provider';

@Injectable()
export class ApiService {
  service: AxiosInstance;

  baseUrl = 'https://api.0x.org/';
  version = 'v2';

  routes = {
    swap: '/swap/allowance-holder/quote',
  };

  constructor() {
    this.service = axios.create({
      baseURL: this.baseUrl,
      headers: {
        '0x-version': this.version,
        '0x-api-key': CONFIG.apis.matcha,
      },
    });
  }

  async getAmount(request: AmountRequest): Promise<AmountResponse> {
    const response: AmountResponse = {
      amount: 0n,
      isReduced: false,
      noBalance: false,
    };
    let balance = 0n;
    let decimals = 18n;

    if (ETHERS.UNCHECKABLE_GROUP.includes(request.tokenAddress.toLowerCase())) {
      balance = await RPC.rpcProvider.getBalance(request.walletAddress);
    } else {
      const wallet = WALLET.CLIENT.walletClient(request.privateKey);
      const tokenContract = TOKEN.tokenContract(request.tokenAddress);
      decimals = await TOKEN.tokenFunctions(tokenContract).decimals();
      balance = await TOKEN.tokenFunctions(tokenContract).getBalance(
        wallet.address,
      );
    }
    const bigintAmount = AMOUNT.FLOAT.floatToBigInt(request.amount, decimals);

    if (balance === 0n) {
      response.noBalance = true;
    }
    if (bigintAmount > balance && balance !== 0n) {
      response.amount = balance;
      response.isReduced = true;
    } else {
      response.amount = bigintAmount;
    }
    return response;
  }

  isMonetizeApplicable(from_token: string, to_token: string) {
    if (
      [from_token, to_token]
        .map((t) => t.toLowerCase())
        .includes(CONFIG.fee.receive_token.toLowerCase())
    ) {
      return true;
    }
    return false;
  }

  getMonetizeParams = (): ApiSwapQuoteBodyMonetize => {
    const response: ApiSwapQuoteBodyMonetize = {
      swapFeeBps: CONFIG.fee.bps,
      swapFeeRecipient: CONFIG.fee.receiver_wallet,
      swapFeeToken: CONFIG.fee.receive_token,
    };
    return response;
  };

  async getSwapParams(
    request: ApiSwapQuoteRequest,
  ): Promise<ApiSwapQuoteParams> {
    const { gasPrice } = await GAS.getGasInformation();
    const { amount } = await this.getAmount({
      amount: request.amount,
      tokenAddress: request.fromSwapToken,
      walletAddress: request.toWalletAddress,
      privateKey: request.privateKey,
    });

    let params: ApiSwapQuoteParams = {
      buyToken: request.toSwapToken,
      sellToken: request.fromSwapToken,
      chainId: CHAINS.BASE,
      gasPrice: gasPrice.toString(),
      sellAmount: amount.toString(),
      slippageBps: request.slippage * 100,
      taker: request.toWalletAddress,
    };
    const monetize = this.isMonetizeApplicable(
      request.fromSwapToken,
      request.toSwapToken,
    );

    if (monetize) {
      const monetizeParams = this.getMonetizeParams();
      params = { ...params, ...monetizeParams };
    }
    return params;
  }

  async quoteSwap(
    request: ApiSwapQuoteRequest,
  ): Promise<SwapQuoteResponse | SwapErrorResponse> {
    try {
      const params = await this.getSwapParams(request);

      const res = await this.service.get<ApiSwapQuoteResponse>(
        this.routes.swap,
        { params },
      );
      const data = res.data;

      const response: SwapQuoteResponse = {
        allowanceTarget:
          data?.allowanceTarget ?? data?.issues?.allowanceTarget?.spender,
        buyAmount: parseFloat(data?.buyAmount),
        sellAmount: parseFloat(data?.sellAmount),
        eip712: data?.permit?.eip712,
        fee: data?.fees?.gasFee?.amount,
        networkFee: data?.totalNetworkFee,
        user_fee: data?.fees?.integratorFee?.amount,
        transaction: data?.transaction,
        type: 'response',
      };
      return response;
    } catch (err) {
      return { error: err, type: 'error' };
    }
  }
}
