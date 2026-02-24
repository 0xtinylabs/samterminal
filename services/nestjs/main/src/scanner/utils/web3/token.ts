import { provider } from './provider';
import { Network } from './types';
import { Erc20Abi, Erc20Abi__factory } from '@/app/abi/types';

export const tokenContract = (
  address: string,
  network: Network = Network.BASE,
): Erc20Abi => {
  return Erc20Abi__factory.connect(address, provider(network));
};

export const getTokenName = async (
  address: string,
  network: Network = Network.BASE,
): Promise<string> => {
  const contract = tokenContract(address, network);
  return await contract.name();
};

export const getTokenSymbol = async (
  address: string,
  network: Network = Network.BASE,
): Promise<string> => {
  const contract = tokenContract(address, network);
  return await contract.symbol();
};

export const getTokenDecimals = async (
  address: string,
  network: Network = Network.BASE,
): Promise<bigint> => {
  const contract = tokenContract(address, network);
  return await contract.decimals();
};

export const getTokenBalance = async (
  walletAddress: string,
  tokenAddress: string,
  network: Network = Network.BASE,
): Promise<bigint> => {
  const contract = tokenContract(tokenAddress, network);
  return await contract.balanceOf(walletAddress);
};
