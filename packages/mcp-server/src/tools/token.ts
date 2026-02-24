import { getGrpcClient, callGrpc, type ToolDefinition } from '../utils.js';
import type * as grpc from '@grpc/grpc-js';
import { getCore } from '../utils.js';

function getTokenClient(): grpc.Client {
  return getGrpcClient('token', 'token/token.proto', 'scanner_token', 'ScannerToken');
}

export const tokenTools: ToolDefinition[] = [
  {
    name: 'sam_get_tokens',
    description: 'Get token list (all or filtered by addresses). Returns token details including name, symbol, price, volume, supply.',
    inputSchema: {
      type: 'object',
      properties: {
        tokenAddresses: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional list of token addresses to filter. If empty, returns all tracked tokens.',
        },
      },
    },
    handler: async (args) => {
      const client = getTokenClient();
      return callGrpc(client, 'getTokens', {
        tokenAddresses: (args.tokenAddresses as string[]) ?? [],
      });
    },
  },
  {
    name: 'sam_get_token_price',
    description: 'Get current price and volume for a specific token by its contract address.',
    inputSchema: {
      type: 'object',
      properties: {
        tokenAddress: { type: 'string', description: 'Token contract address' },
        reason: { type: 'string', description: 'Optional reason for the price check' },
      },
      required: ['tokenAddress'],
    },
    handler: async (args) => {
      const client = getTokenClient();
      return callGrpc(client, 'getTokenPrice', {
        tokenAddress: args.tokenAddress,
        reason: args.reason,
      });
    },
  },
  {
    name: 'sam_get_token_info',
    description: 'Get detailed token info including name, symbol, supply, pool address, price, and volume.',
    inputSchema: {
      type: 'object',
      properties: {
        tokenAddress: { type: 'string', description: 'Token contract address' },
        addIfNotExist: { type: 'boolean', description: 'Auto-track token if not already tracked (default: false)' },
      },
      required: ['tokenAddress'],
    },
    handler: async (args) => {
      const client = getTokenClient();
      return callGrpc(client, 'getToken', {
        tokenAddress: args.tokenAddress,
        addIfNotExist: args.addIfNotExist ?? false,
      });
    },
  },
  {
    name: 'sam_token_track',
    description: 'Start tracking a token by its contract address. Optionally provide token metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        tokenAddress: { type: 'string', description: 'Token contract address to track' },
        name: { type: 'string', description: 'Token name' },
        symbol: { type: 'string', description: 'Token symbol' },
        image: { type: 'string', description: 'Token image URL' },
        poolAddress: { type: 'string', description: 'Liquidity pool address' },
        circulatedSupply: { type: 'string', description: 'Circulated supply' },
        pairAddress: { type: 'string', description: 'Trading pair address' },
        reason: { type: 'string', description: 'Reason for tracking' },
        initialPrice: { type: 'string', description: 'Initial price at time of tracking' },
      },
      required: ['tokenAddress'],
    },
    handler: async (args) => {
      const client = getTokenClient();
      return callGrpc(client, 'addToken', args);
    },
  },
  {
    name: 'sam_token_untrack',
    description: 'Stop tracking a token. Removes it from the active tracking list.',
    inputSchema: {
      type: 'object',
      properties: {
        tokenAddress: { type: 'string', description: 'Token contract address to untrack' },
        bypassEnds: { type: 'boolean', description: 'Bypass end conditions (default: false)' },
      },
      required: ['tokenAddress'],
    },
    handler: async (args) => {
      const client = getTokenClient();
      return callGrpc(client, 'removeToken', {
        tokenAddress: args.tokenAddress,
        bypassEnds: args.bypassEnds,
      });
    },
  },
  {
    name: 'sam_token_blacklist',
    description: 'Add token addresses to the blacklist. Blacklisted tokens will be excluded from tracking and results.',
    inputSchema: {
      type: 'object',
      properties: {
        tokenAddresses: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of token contract addresses to blacklist',
        },
      },
      required: ['tokenAddresses'],
    },
    handler: async (args) => {
      const client = getTokenClient();
      return callGrpc(client, 'addBlacklist', {
        tokenAddresses: args.tokenAddresses,
      });
    },
  },
  {
    name: 'sam_token_search',
    description: 'Search for tokens by name, symbol, or contract address using the Core provider.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (name, symbol, or address)' },
      },
      required: ['query'],
    },
    handler: async (args) => {
      const core = await getCore();
      return core.runtime.getData('tokendata:search', { query: args.query });
    },
  },
];
