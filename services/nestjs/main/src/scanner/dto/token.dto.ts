import { CHAIN, WalletToken } from '@/proto-generated/common/common';
import { PROVIDER, TOKEN } from '../utils/web3';
import { AMOUNT } from '../utils';
import { GetTokensResponse } from '@/proto-generated/token/messages';
import { TOKENS } from '@/constants/tokens';

export class TokenDTO {
  private tokenList: string[];

  constructor(tokenList: string[]) {
    this.tokenList = tokenList;
  }

  async getCurrencyTokenData(
    walletAddress: string,
    tokenPrice: number,
    chain: CHAIN,
  ): Promise<WalletToken> {
    const token = TOKENS[chain].CURRENCY;
    const balance = await TOKEN.getTokenBalance(walletAddress, token.address);
    const balanceFormatted = AMOUNT.convert
      .bigintToFloat(balance, token.decimals)
      .toString();
    return {
      tokenAddress: token.address,
      tokenBalance: balance.toString(),
      tokenBalanceFormatted: balanceFormatted,
      tokenPrice: tokenPrice.toString(),
      tokenDollarValue: AMOUNT.calculate
        .usd(balanceFormatted, tokenPrice)
        .toString(),
      tokenImage: token.image_url ?? '',
      tokenName: token.name ?? '',
      tokenSymbol: token.symbol ?? '',
      tokenVolume: '0',
      tokenSupply: '0',
      tokenPairAddress: '',

    };
  }

  async getNativeTokenData(
    walletAddress: string,
    nativeTokenPrice: number,
    chain: CHAIN,
  ): Promise<WalletToken> {
    const token = TOKENS[chain]._NATIVE;
    const balance = await PROVIDER.getNativeBalance(walletAddress);
    const balanceFormatted = AMOUNT.convert
      .bigintToFloat(balance, token.decimals)
      .toString();


    return {
      tokenAddress: token.address,
      tokenBalance: balance.toString(),
      tokenBalanceFormatted: balanceFormatted,
      tokenPrice: nativeTokenPrice.toString(),
      tokenDollarValue: AMOUNT.calculate
        .usd(balanceFormatted, nativeTokenPrice)
        .toString(),
      tokenImage: token.image_url ?? '',
      tokenName: token.name ?? '',
      tokenSymbol: token.symbol ?? '',
      tokenVolume: '0',
      tokenSupply: '0',
      tokenPairAddress: '',

    };
  }

  async getTokenData(
    walletAddress: string,
    data: GetTokensResponse,
  ): Promise<WalletToken[]> {
    const tokensData: WalletToken[] = [];

    await Promise.all(this.tokenList.map(async (tokenAddress) => {
      const tokenBalance = await TOKEN.getTokenBalance(
        walletAddress,
        tokenAddress,
      );
      const decimal = await TOKEN.getTokenDecimals(tokenAddress);
      const tokenBalanceFormatted = AMOUNT.convert
        .bigintToFloat(tokenBalance, decimal)
        .toString();
      const tokenData = data.tokens.find(
        (t) => t.address.toLowerCase() === tokenAddress.toLowerCase(),
      );
      if (!tokenData?.name) {
        return;
      }

      if (!tokenData) {
        return;
      }

      const volume =
        tokenData.volume === ''
          ? tokenData.calculatedVolume
          : tokenData.volume;

      tokensData.push({
        tokenAddress: tokenAddress,
        tokenPrice: tokenData.price,
        tokenBalance: tokenBalance.toString(),
        tokenBalanceFormatted: tokenBalanceFormatted,
        tokenDollarValue: AMOUNT.calculate
          .usd(
            tokenBalanceFormatted,
            AMOUNT.convert.floatStringToNumber(tokenData.price),
          )
          .toString(),
        tokenImage: tokenData.imageUrl,
        tokenName: tokenData.name,
        tokenSymbol: tokenData.symbol,
        tokenVolume: volume,
        tokenSupply: tokenData.circulatedSupply,
        tokenPairAddress: tokenData.pairAddress,
      });
    }));

    return tokensData;
  }
}
