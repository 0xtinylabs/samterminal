import { ethers } from 'ethers';
import { PROVIDER, WALLET } from '..';
import {
  NativeTransactionRequest,
  NativeTransactionResponse,
} from './types/native';

export const nativeTransaction = async (
  params: NativeTransactionRequest,
  beforeSend: () => Promise<void>,
): Promise<NativeTransactionResponse> => {
  const { transaction, wallet } = params;
  const client = WALLET.CLIENT.walletPublicClient(wallet.privateKey);
  const nonce = await PROVIDER.RPC.rpcProvider.getTransactionCount(
    wallet.address,
  );

  await beforeSend?.();
  const txHash = await client.sendTransaction({
    account: client.account,
    chain: client.chain,
    gas: transaction?.gas ? ethers.getBigInt(transaction?.gas) : undefined,
    to: transaction?.to as any,
    data: transaction?.data as any,
    value: ethers.getBigInt(transaction?.value ?? 0),
    gasPrice: transaction?.gasPrice
      ? ethers.getBigInt(transaction?.gasPrice)
      : undefined,
    nonce: nonce,
  });
  return { hash: txHash };
};
