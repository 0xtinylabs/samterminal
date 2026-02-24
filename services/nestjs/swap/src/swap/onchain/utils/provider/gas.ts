import { RPC } from '.';

export const GAS_LIMIT = 6_000_000n;

export const getGasInformation = async (gasLimit: bigint = GAS_LIMIT) => {
  const data = await RPC.rpcProvider.getFeeData();

  const gasPrice = data.gasPrice ?? 0n;
  const gas = gasLimit * gasPrice;
  return {
    gas,
    gasPrice,
    gasLimit,
    maxFeePerGas: data.maxFeePerGas ?? 0n,
    maxPriorityFeePerGas: data.maxPriorityFeePerGas ?? 0n,
  };
};
