import { ethers } from 'ethers';

export const floatToBigInt = (
  value: number,
  decimals: bigint = 18n,
): bigint => {
  return ethers.parseUnits(String(value.toFixed(Number(decimals))), decimals);
};
