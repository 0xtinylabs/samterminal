import { AMOUNT, TOKEN, WALLET } from '@/swap/onchain/utils';
import { CONFIG } from '@/config/config';
import { ABI } from '@/web3/abi';
import { CHAINS } from '@/web3/chains';
import { ETHERS } from '@/web3/tokens';
import { encodeFunctionData, Hex } from 'viem';
import { RPC } from '@/swap/onchain/utils/provider';

export const permit2 = async (
  tokenAddress: string,
  privateKey: string,
  swapData: string,
  amount: number,
) => {
  const wallet = WALLET.CLIENT.walletClient(privateKey);
  const tokenContract = TOKEN.tokenContract(tokenAddress);
  const nonce =
    BigInt(Date.now()) * BigInt(1000000) +
    BigInt(Math.floor(Math.random() * 1000000));
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 60);

  let balance = 0n;
  let decimals = 18n;
  if (ETHERS.UNCHECKABLE_GROUP.includes(tokenAddress.toLowerCase())) {
    balance = await RPC.rpcProvider.getBalance(wallet.address);
  } else {
    decimals = await TOKEN.tokenFunctions(tokenContract).decimals();
    balance = await TOKEN.tokenFunctions(tokenContract).getBalance(
      wallet.address,
    );
  }

  let amounIn = AMOUNT.FLOAT.floatToBigInt(amount, decimals);
  if (balance < amounIn) {
    amounIn = balance;
  }
  const permit = {
    permitted: {
      token: tokenAddress,
      amount: amounIn,
    },
    nonce: nonce,
    deadline: deadline,
  };

  const eip712Message = {
    domain: {
      name: 'Permit2',
      chainId: CHAINS.BASE,
      verifyingContract: CONFIG.swap.permit2 as Hex,
    },
    types: {
      PermitTransferFrom: [
        { name: 'permitted', type: 'TokenPermissions' },
        { name: 'spender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
      TokenPermissions: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
    },
    primaryType: 'PermitTransferFrom' as const,
    message: {
      permitted: {
        token: tokenAddress,
        amount: amounIn,
      },
      spender: CONFIG.swap.permitSwap,
      nonce: nonce,
      deadline: deadline,
    },
  };

  const walletClient = WALLET.CLIENT.walletPublicClient(privateKey);

  const signature = await walletClient.signTypedData(eip712Message);

  const transactionData = encodeFunctionData({
    abi: ABI.JSON.permitSwap,
    functionName: 'permit2AndSwap',
    args: [permit, signature, wallet.address, swapData as Hex],
  });

  return transactionData;
};
