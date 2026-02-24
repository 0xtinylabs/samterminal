import { CONFIG } from '@/config/config';
import { TOKEN } from '@/swap/onchain/utils';
import { maxUint256 } from 'viem';
import { Wallet } from 'ethers';

export const allowance = async (
  token_address: string,
  wallet: Wallet,
  beforeSending: () => Promise<void>,
) => {
  const tokenContract = TOKEN.tokenContract(token_address, wallet);
  const allowance = await TOKEN.tokenFunctions(tokenContract).allowance(
    wallet.address,
    CONFIG.swap.permit2,
  );

  if (allowance != maxUint256) {
    try {
      const approveParams = [CONFIG.swap.permit2, maxUint256] as [
        string,
        bigint,
      ];

      await beforeSending?.();
      const tx = await TOKEN.tokenFunctions(tokenContract).approve(
        ...approveParams,
      );
      await tx.wait();
    } catch (error) {
      throw new Error(`Token approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};
