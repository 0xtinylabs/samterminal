import { ethers, Wallet } from 'ethers';
import { RPC } from '@/swap/onchain/utils/provider';
import { ABI } from '@/web3/abi';

export const tokenContract = (tokenAddress: string, wallet?: Wallet) => {
  const contract = new ethers.Contract(
    tokenAddress,
    ABI.JSON.erc20,
    wallet ?? RPC.rpcProvider,
  );
  if (wallet) {
    contract.connect(wallet);
  }
  return contract;
};
