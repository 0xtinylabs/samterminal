import { ethers } from 'ethers';

export const bigintToFloat = (value: bigint, decimals: number = 18): number => {
  return parseFloat(ethers.formatUnits(value, decimals));
};
