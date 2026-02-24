import { getGrpcClient, callGrpc, getCore, type ToolDefinition } from '../utils.js';
import type * as grpc from '@grpc/grpc-js';

function getWalletClient(): grpc.Client {
  return getGrpcClient('wallet', 'wallet/wallet.proto', 'scanner_wallet', 'ScannerWallet');
}

export const walletTools: ToolDefinition[] = [
  {
    name: 'sam_get_wallet',
    description: 'Get wallet summary including native balance, total dollar value, and list of token addresses held.',
    inputSchema: {
      type: 'object',
      properties: {
        walletAddress: { type: 'string', description: 'Wallet address' },
        chain: { type: 'string', enum: ['BASE'], description: 'Blockchain network (default: BASE)' },
        type: { type: 'string', enum: ['API', 'SCANNER'], description: 'Data source type (default: API)' },
        tokenAddresses: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional filter by specific token addresses',
        },
      },
      required: ['walletAddress'],
    },
    handler: async (args) => {
      const client = getWalletClient();
      return callGrpc(client, 'getWallet', {
        walletAddress: args.walletAddress,
        chain: args.chain ?? 'BASE',
        type: args.type ?? 'API',
        tokenAddresses: (args.tokenAddresses as string[]) ?? [],
      });
    },
  },
  {
    name: 'sam_get_wallet_tokens',
    description: 'Get all token holdings for a wallet with price, balance, and USD value for each token.',
    inputSchema: {
      type: 'object',
      properties: {
        walletAddress: { type: 'string', description: 'Wallet address' },
        chain: { type: 'string', enum: ['BASE'], description: 'Blockchain network (default: BASE)' },
        type: { type: 'string', enum: ['API', 'SCANNER'], description: 'Data source type (default: API)' },
        tokenAddresses: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional filter by specific token addresses',
        },
        filterLowUSD: { type: 'boolean', description: 'Filter out tokens with very low USD value (default: false)' },
      },
      required: ['walletAddress'],
    },
    handler: async (args) => {
      const client = getWalletClient();
      return callGrpc(client, 'getWalletTokens', {
        walletAddress: args.walletAddress,
        chain: args.chain ?? 'BASE',
        type: args.type ?? 'API',
        tokenAddresses: (args.tokenAddresses as string[]) ?? [],
        filterLowUSD: args.filterLowUSD ?? false,
      });
    },
  },
  {
    name: 'sam_get_wallet_details',
    description: 'Get full wallet details: native balance, total value, plus all token holdings with prices. Combines wallet summary and token data.',
    inputSchema: {
      type: 'object',
      properties: {
        walletAddress: { type: 'string', description: 'Wallet address' },
        chain: { type: 'string', enum: ['BASE'], description: 'Blockchain network (default: BASE)' },
        type: { type: 'string', enum: ['API', 'SCANNER'], description: 'Data source type (default: API)' },
        tokenAddresses: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional filter by specific token addresses',
        },
        filterLowUSD: { type: 'boolean', description: 'Filter out tokens with very low USD value (default: false)' },
      },
      required: ['walletAddress'],
    },
    handler: async (args) => {
      const client = getWalletClient();
      return callGrpc(client, 'getWalletDetails', {
        walletAddress: args.walletAddress,
        chain: args.chain ?? 'BASE',
        type: args.type ?? 'API',
        tokenAddresses: (args.tokenAddresses as string[]) ?? [],
        filterLowUSD: args.filterLowUSD ?? false,
      });
    },
  },
  {
    name: 'sam_wallet_track',
    description: 'Start tracking a wallet address. Enables monitoring of wallet activity and portfolio changes.',
    inputSchema: {
      type: 'object',
      properties: {
        walletAddress: { type: 'string', description: 'Wallet address to track' },
      },
      required: ['walletAddress'],
    },
    handler: async (args) => {
      const client = getWalletClient();
      return callGrpc(client, 'addWallet', {
        walletAddress: args.walletAddress,
      });
    },
  },
  {
    name: 'sam_wallet_update_portfolio',
    description: 'Update the cached total dollar value of a tracked wallet portfolio.',
    inputSchema: {
      type: 'object',
      properties: {
        walletAddress: { type: 'string', description: 'Wallet address' },
        totalDollarValue: { type: 'string', description: 'New total dollar value' },
      },
      required: ['walletAddress', 'totalDollarValue'],
    },
    handler: async (args) => {
      const client = getWalletClient();
      return callGrpc(client, 'updateWalletPortfolio', {
        walletAddress: args.walletAddress,
        totalDollarValue: args.totalDollarValue,
      });
    },
  },
  {
    name: 'sam_wallet_label',
    description: 'Assign a human-readable label to a wallet address for easier identification.',
    inputSchema: {
      type: 'object',
      properties: {
        walletAddress: { type: 'string', description: 'Wallet address' },
        label: { type: 'string', description: 'Label to assign (e.g., "Main Trading Wallet", "DCA Bot")' },
      },
      required: ['walletAddress', 'label'],
    },
    handler: async (args) => {
      const core = await getCore();
      return core.runtime.executeAction('walletdata:label:set', {
        walletAddress: args.walletAddress,
        label: args.label,
      });
    },
  },
  {
    name: 'sam_wallet_tracked_list',
    description: 'List all wallets currently being tracked with their labels and summary data.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const core = await getCore();
      return core.runtime.executeAction('walletdata:tracked:get', {});
    },
  },
];
