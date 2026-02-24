import { Transaction } from 'ethers';

export type TokenFunctions = {
  getBalance: (walletAddress: string) => Promise<bigint>;
  name: () => Promise<string>;
  symbol: () => Promise<string>;
  nonce: (walletAddress: string) => Promise<number>;
  version: () => Promise<number>;
  decimals: () => Promise<bigint>;
  allowance: (owner: string, contract: string) => Promise<bigint>;
  approve: (
    contract: string,
    amount: bigint,
  ) => Promise<{ wait: () => Promise<void> }>;
  transfer: (toWalletAddress: string, amount: bigint) => Promise<Transaction>;
  transferFrom: (
    fromWalletAddress: string,
    toWalletAddress: string,
    amount: bigint,
  ) => Promise<Transaction>;
};

export type TokenEstimateFunctions = Partial<
  Record<keyof TokenFunctions, (...params: any) => Promise<bigint>>
>;
