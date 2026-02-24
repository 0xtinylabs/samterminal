import { ethers } from 'ethers';
import { RPC } from '@/swap/onchain/utils/provider';
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, createWalletClient, http } from 'viem';
import { base } from 'viem/chains';

export const walletClient = (walletPrivateKey: string) => {
  return new ethers.Wallet(walletPrivateKey, RPC.rpcProvider);
};

export const walletAccount = (walletPrivateKey: string) => {
  const account = privateKeyToAccount(walletPrivateKey as `0x${string}`);
  return account;
};

export const publicClient = () => {
  return createPublicClient({
    chain: base,
    transport: http(),
  });
};

export const walletPublicClient = (walletPrivateKey: string) => {
  const account = walletAccount(walletPrivateKey);

  return createWalletClient({
    account,
    chain: base,
    transport: http(),
  });
};
