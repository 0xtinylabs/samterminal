import { getCore, type ToolDefinition } from '../utils.js';

export const chainTools: ToolDefinition[] = [
  {
    name: 'sam_chain_list',
    description: 'List all supported blockchain networks with their chain IDs, names, native currencies, and RPC URLs.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const core = await getCore();
      const chains = core.chains.getAll();
      return chains.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        nativeCurrency: c.nativeCurrency,
        rpcUrl: c.rpcUrl,
        explorerUrl: c.explorerUrl,
        testnet: c.testnet,
      }));
    },
  },
  {
    name: 'sam_chain_current',
    description: 'Get the currently active blockchain network. All chain-dependent operations use this chain by default.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const core = await getCore();
      const chain = core.chains.getCurrentChain();
      if (!chain) return { error: 'No chain currently set' };
      return {
        id: chain.id,
        name: chain.name,
        type: chain.type,
        nativeCurrency: chain.nativeCurrency,
        rpcUrl: chain.rpcUrl,
        explorerUrl: chain.explorerUrl,
      };
    },
  },
  {
    name: 'sam_chain_switch',
    description: 'Switch the active blockchain network. Affects all subsequent chain-dependent operations.',
    inputSchema: {
      type: 'object',
      properties: {
        chainId: { type: 'string', description: 'Chain ID to switch to (e.g., "base", "ethereum")' },
      },
      required: ['chainId'],
    },
    handler: async (args) => {
      const core = await getCore();
      core.chains.setCurrentChain(args.chainId as string);
      const chain = core.chains.getCurrentChain();
      return {
        success: true,
        currentChain: chain
          ? { id: chain.id, name: chain.name, type: chain.type }
          : null,
      };
    },
  },
];
