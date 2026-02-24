import { ETHERS } from '@/web3/tokens';
import { AMOUNT, TOKEN, WALLET } from '@/swap/onchain/utils';
import { CONFIG } from '@/config/config';
import { encodeFunctionData, Hex, keccak256 } from 'viem';
import { CHAINS } from '@/web3/chains';

export const permitSecure = async (
  tokenAddress: string,
  privateKey: string,
  swapData: string,
  amount: number,
  toAddress: string,
) => {
  const wallet = WALLET.CLIENT.walletClient(privateKey);
  const tokenContract = TOKEN.tokenContract(tokenAddress);

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);

  const nonce =
    BigInt(Date.now()) * BigInt(1000000) +
    BigInt(Math.floor(Math.random() * 1000000));

  let decimals = 18n;

  if (!ETHERS.UNCHECKABLE_GROUP.includes(tokenAddress.toLowerCase())) {
    decimals = await TOKEN.tokenFunctions(tokenContract).decimals();
  }

  let amountIn = AMOUNT.FLOAT.floatToBigInt(amount, decimals);

  const balance = await TOKEN.tokenFunctions(tokenContract).getBalance(
    wallet.address,
  );

  if (balance < amountIn) {
    amountIn = balance;
  }

  const permit = {
    permitted: {
      token: tokenAddress,
      amount: amountIn,
    },
    nonce: nonce,
    deadline: deadline,
  };

  const executorABI = [
    {
      type: 'function',
      name: 'rathExecutePermit2WithWitness',
      inputs: [
        {
          name: 'permit',
          type: 'tuple',
          internalType: 'struct ISignatureTransfer.PermitTransferFrom',
          components: [
            {
              name: 'permitted',
              type: 'tuple',
              internalType: 'struct ISignatureTransfer.TokenPermissions',
              components: [
                {
                  name: 'token',
                  type: 'address',
                  internalType: 'address',
                },
                {
                  name: 'amount',
                  type: 'uint256',
                  internalType: 'uint256',
                },
              ],
            },
            {
              name: 'nonce',
              type: 'uint256',
              internalType: 'uint256',
            },
            {
              name: 'deadline',
              type: 'uint256',
              internalType: 'uint256',
            },
          ],
        },
        {
          name: 'from',
          type: 'address',
          internalType: 'address',
        },
        {
          name: 'callData',
          type: 'bytes',
          internalType: 'bytes',
        },
        {
          name: 'signature',
          type: 'bytes',
          internalType: 'bytes',
        },
      ],
      outputs: [],
      stateMutability: 'payable',
    },
  ];

  const secureData = {
    target: toAddress,
    callDataHash: keccak256(swapData as Hex),
  };

  const eip712Message = {
    domain: {
      name: 'Permit2',
      chainId: CHAINS.BASE,
      verifyingContract: CONFIG.swap.permit2 as Hex,
    },
    types: {
      PermitWitnessTransferFrom: [
        { name: 'permitted', type: 'TokenPermissions' },
        { name: 'spender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'witness', type: 'Payload' },
      ],
      TokenPermissions: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      Payload: [
        { name: 'target', type: 'address' },
        { name: 'callDataHash', type: 'bytes32' },
      ],
    },
    primaryType: 'PermitWitnessTransferFrom' as const,
    message: {
      permitted: {
        token: tokenAddress,
        amount: amountIn,
      },
      spender: CONFIG.swap.permitSwap,
      nonce: nonce,
      deadline: deadline,
      witness: secureData,
    },
  };

  const walletClient = WALLET.CLIENT.walletPublicClient(privateKey);

  const signature = await walletClient.signTypedData(eip712Message);

  const transactionData = encodeFunctionData({
    abi: executorABI,
    functionName: 'rathExecutePermit2WithWitness',
    args: [permit, wallet.address, swapData as Hex, signature],
  });
  return transactionData;
};
