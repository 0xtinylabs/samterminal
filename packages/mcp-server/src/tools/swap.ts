import { getGrpcClient, callGrpc, type ToolDefinition } from '../utils.js';
import type * as grpc from '@grpc/grpc-js';

function getSwapClient(): grpc.Client {
  return getGrpcClient('swap', 'swap.proto', 'swap', 'SwapService');
}

export const swapTools: ToolDefinition[] = [
  {
    name: 'sam_swap_quote',
    description: 'Get a swap fee/quote estimate before executing. Use this to check costs before swapping tokens.',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Destination address or contract' },
        value: { type: 'string', description: 'Value to estimate fee for' },
      },
      required: ['to'],
    },
    handler: async (args) => {
      const client = getSwapClient();
      return callGrpc(client, 'getFee', {
        to: args.to,
        value: args.value,
      });
    },
  },
  {
    name: 'sam_swap_execute',
    description: 'Execute a token swap. Swaps one token for another on the specified chain. IMPORTANT: Always get a quote first and confirm with the user before executing.',
    inputSchema: {
      type: 'object',
      properties: {
        fromTokenAddress: { type: 'string', description: 'Source token contract address (use native token address for ETH)' },
        toTokenAddress: { type: 'string', description: 'Destination token contract address' },
        amount: { type: 'number', description: 'Amount of source token to swap' },
        chain: { type: 'string', enum: ['BASE'], description: 'Blockchain network (default: BASE)' },
        privateKey: { type: 'string', description: 'Wallet private key for signing the transaction. Falls back to WALLET_PRIVATE_KEY env if not provided.' },
        feeResource: { type: 'string', enum: ['COMPANY', 'SELF'], description: 'Who pays the fee (default: COMPANY)' },
        slippage: { type: 'number', description: 'Slippage tolerance in basis points (e.g., 100 = 1%)' },
      },
      required: ['fromTokenAddress', 'toTokenAddress', 'amount'],
    },
    handler: async (args) => {
      const client = getSwapClient();
      return callGrpc(client, 'swap', {
        fromTokenAddress: args.fromTokenAddress,
        toTokenAddress: args.toTokenAddress,
        amount: args.amount,
        chain: args.chain ?? 'BASE',
        privateKey: args.privateKey,
        feeResource: args.feeResource,
        slippage: args.slippage,
      });
    },
  },
  {
    name: 'sam_swap_approve',
    description: 'Approve an ERC20 token for spending by the swap contract. Required before swapping ERC20 tokens (not needed for native tokens like ETH).',
    inputSchema: {
      type: 'object',
      properties: {
        walletPrivateKey: { type: 'string', description: 'Wallet private key for signing the approval. Falls back to WALLET_PRIVATE_KEY env if not provided.' },
        tokenAddress: { type: 'string', description: 'ERC20 token contract address to approve' },
      },
      required: ['tokenAddress'],
    },
    handler: async (args) => {
      const client = getSwapClient();
      return callGrpc(client, 'approve', {
        walletPrivateKey: args.walletPrivateKey,
        tokenAddress: args.tokenAddress,
      });
    },
  },
];
