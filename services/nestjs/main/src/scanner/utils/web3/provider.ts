import config from '@/config';
import { ethers } from 'ethers';
import { Network } from './types';

export const provider = (network: Network = Network.BASE) => {
  return new ethers.JsonRpcProvider(config.profile.web3.provider.base);
};

export const getNativeBalance = async (
  walletAddress: string,
  network: Network = Network.BASE,
) => {
  const balance = await provider(network).getBalance(walletAddress);
  return balance;
};
