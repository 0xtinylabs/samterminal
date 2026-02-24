import { TOKENS } from '@/constants/tokens';
import { TokenGrpcService } from '@/microservices/token/token.service';
import { WalletGrpcService } from '@/microservices/wallet/wallet.service';
import {
  AddTokenRequest,
  AddTokenResponse,
  GetTokenPriceRequest,
  GetTokenPriceResponse,
  GetTokenRequest,
  GetTokenResponse,
  RemoveTokenResponse,
  RemoveTokenRequest,
  GetTokensResponse,
} from '@/proto-generated/token/messages';
import {
  AddWalletRequest,
  AddWalletResponse,
  DataType,
  GetWalletDetailsRequest,
  GetWalletDetailsResponse,
  GetWalletRequest,
  GetWalletResponse,
  GetWalletTokensRequest,
  GetWalletTokensResponse,
} from '@/proto-generated/wallet/messages';
import { Injectable } from '@nestjs/common';
import { AMOUNT } from './utils';
import { WalletDTO } from './dto/wallet.dto';
import { CHAIN, Token, Wallet, WalletToken } from '@/proto-generated/common/common';
import { TokenDTO } from './dto/token.dto';

@Injectable()
export class ScannerService {
  constructor(
    private readonly tokenGrpcService: TokenGrpcService,
    private readonly walletGrpcService: WalletGrpcService,
  ) { }

  async addWallet(payload: AddWalletRequest): Promise<AddWalletResponse> {
    return await this.walletGrpcService.addWallet(payload);
  }

  async addToken(payload: AddTokenRequest): Promise<AddTokenResponse> {
    return await this.tokenGrpcService.addToken(payload);
  }

  async removeToken(payload: RemoveTokenRequest): Promise<RemoveTokenResponse> {
    return await this.tokenGrpcService.removeToken(payload);
  }

  async getNativeTokenPrice(chain: CHAIN = CHAIN.BASE): Promise<number> {
    const response = await this.tokenGrpcService.getToken({
      tokenAddress: TOKENS[chain].WETH.address,
      addIfNotExist: false
    });
    if (!response.token?.price) {
      return 3000;
    }
    return AMOUNT.convert.floatStringToNumber(response.token?.price);
  }

  async getCurrencyTokenPrice(chain: CHAIN = CHAIN.BASE): Promise<number> {
    const response = await this.tokenGrpcService.getToken({
      tokenAddress: TOKENS[chain].CURRENCY.address,
      addIfNotExist: false
    });
    if (!response.token?.price) {
      return 1;
    }
    return AMOUNT.convert.floatStringToNumber(response.token?.price);
  }

  async getCurrencyTokenData(
    chain: CHAIN = CHAIN.BASE,
  ): Promise<Token | undefined> {
    const response = await this.tokenGrpcService.getToken({
      tokenAddress: TOKENS[chain].CURRENCY.address,
      addIfNotExist: false
    });
    return response.token;
  }


  async getWallet(payload: GetWalletRequest): Promise<GetWalletResponse> {
    const response = await this.walletGrpcService.getWallet(payload);
    if (!response.walletData) {
      return { walletData: undefined };
    }

    // Default to BASE chain if not specified
    const chain = payload.chain ?? CHAIN.BASE;

    const nativeTokenPrice = await this.getNativeTokenPrice(chain);
    const walletDTO = new WalletDTO(response.walletData, nativeTokenPrice);
    response.walletData = await walletDTO.getWalletData();
    if (payload.tokenAddresses?.length > 0) {
      response.walletData.tokenAddresses = [
        ...(payload.tokenAddresses ?? []),
      ];
    }
    else {
      response.walletData.tokenAddresses = [
        ...(response.walletData.tokenAddresses ?? []),
      ];
    }
    response.walletData.tokenAddresses = Array.from(new Set(response.walletData.tokenAddresses));

    // Add native token address if chain tokens are available
    const chainTokens = TOKENS[chain];
    if (chainTokens?._NATIVE?.address) {
      response.walletData.tokenAddresses.push(chainTokens._NATIVE.address);
    }

    return response;
  }

  getBaseTokens<T extends string | WalletToken>(
    tokens: T[],
    chain: CHAIN,
  ): T[] {
    const chainTokens = TOKENS[chain ?? CHAIN.BASE];
    const nativeAddress = chainTokens?._NATIVE?.address?.toLowerCase() ?? '';
    const currencyAddress = chainTokens?.CURRENCY?.address?.toLowerCase() ?? '';

    const baseTokens = tokens.filter((token) => {
      let address = '';
      if (typeof token === 'string') {
        address = token;
      } else {
        address = token.tokenAddress;
      }
      const lowerAddress = address.toLowerCase();
      return (
        lowerAddress !== "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" &&
        lowerAddress !== nativeAddress &&
        lowerAddress !== currencyAddress
      );
    });
    return baseTokens;
  }

  async updateAndGetWalletTokensData(walletData: Wallet, chain: CHAIN): Promise<WalletToken[]> {
    let tokens: Token[] = [];
    let tokenData: WalletToken[] = [];

    if (walletData.tokenAddresses) {
      const baseTokens = this.getBaseTokens<string>(
        walletData.tokenAddresses ?? [],
        chain,
      );



      await Promise.all(baseTokens.map(async (tokenAddress) => {
        const tokenDataResponse = await this.tokenGrpcService.getToken({
          tokenAddress: tokenAddress,
          addIfNotExist: true
        });
        if (tokenDataResponse.token) {
          tokens.push(tokenDataResponse.token);
        }
      }));



      const baseTokenDTO = new TokenDTO(baseTokens);

      tokenData = await baseTokenDTO.getTokenData(walletData.walletAddress, {
        tokens: tokens,
      });


      const tokenDTO = new TokenDTO([]);

      const nativePrice = await this.getNativeTokenPrice();
      tokenData.push(
        await tokenDTO.getNativeTokenData(
          walletData.walletAddress,
          nativePrice,
          chain,
        ),
      );
      const currencyPrice = await this.getCurrencyTokenPrice(chain);
      tokenData.push(
        await tokenDTO.getCurrencyTokenData(
          walletData.walletAddress,
          currencyPrice,
          chain,
        ),
      );
      tokenData = tokenData.filter(token => parseFloat(token.tokenPrice) < 1_000_000);

      const totalDollarValue = tokenData.reduce(
        (acc, token) => acc + parseFloat(token.tokenDollarValue),
        0,
      );
      await this.walletGrpcService.updateWalletPortfolio({
        walletAddress: walletData.walletAddress,
        totalDollarValue: totalDollarValue.toString(),
      });
      return tokenData;
    }
    return [];

  }





  async getWalletTokens(
    payload: GetWalletTokensRequest,
  ): Promise<GetWalletTokensResponse> {

    const response = await this.getWallet(payload);
    if (!response.walletData) {
      return { numberOfTokens: 0, tokens: [] };
    }
    const chain = payload.chain ?? CHAIN.BASE;
    const tokenData = await this.updateAndGetWalletTokensData(response.walletData, chain);
    let filteredTokens = tokenData;
    if (payload.filterLowUSD) {
      filteredTokens = tokenData.filter(
        (t) => parseFloat(t.tokenDollarValue) > 0.1,
      );
    }
    return {
      tokens: filteredTokens,
      numberOfTokens: tokenData.length,
    };
  }

  async getWalletDetails(
    payload: GetWalletDetailsRequest,
  ): Promise<GetWalletDetailsResponse> {
    const response = await this.getWallet(payload);
    if (!response.walletData?.tokenAddresses) {
      return { tokens: [], numberOfTokens: 0, walletData: undefined };
    }
    const walletTokens = await this.getWalletTokens(payload);
    return {
      tokens: walletTokens.tokens,
      numberOfTokens: walletTokens.numberOfTokens,
      walletData: response.walletData,
    };
  }

  async getToken(payload: GetTokenRequest): Promise<GetTokenResponse> {
    return await this.tokenGrpcService.getToken(payload);
  }

  async getTokenPrice(payload: GetTokenPriceRequest): Promise<GetTokenPriceResponse> {
    return await this.tokenGrpcService.getTokenPrice(payload);
  }
}
