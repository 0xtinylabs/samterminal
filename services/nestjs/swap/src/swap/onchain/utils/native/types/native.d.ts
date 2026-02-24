import { Wallet } from 'ethers';
import { ApiSwapQuoteTransacion } from '@/swap/onchain/api/types/api';

export type NativeTransactionRequest = {
  transaction: ApiSwapQuoteTransacion;
  wallet: Wallet;
};

export type NativeTransactionResponse = {
  hash: string;
};
