import { CHAIN } from '@/proto-generated/common/common';

export interface Token {
  address: string;
  name?: string;
  symbol?: string;
  image_url?: string;
  decimals?: bigint;
}

export const TOKENS: Record<CHAIN, Record<string, Token>> = {
  [CHAIN.BASE]: {
    _NATIVE: {
      address: '0x0000000000000000000000000000000000000000',
      name: 'Ethereum',
      symbol: 'ETH',
      image_url: "https://assets.coingecko.com/coins/images/279/standard/ethereum.png?1696501628",
      decimals: 18n,
    },
    WETH: {
      address: '0x4200000000000000000000000000000000000006',
      decimals: 18n,
    },
    CURRENCY: {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6n,
      image_url:
        'https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694',
    },
  },
};
