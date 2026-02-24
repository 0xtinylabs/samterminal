/**
 * Config Mock - Test Infrastructure
 * CONFIG, CHAINS, ETHERS sabitleri için mock'lar
 */

export const MOCK_CONFIG = {
  rpc_url: 'https://mock-rpc.base.org',
  swap: {
    contract: '0xSwapContractAddress123456789abcdef12345678',
    swapper: '0xSwapperAddress1234567890abcdef1234567890',
    permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
    permitSwap: '0xPermitSwapAddress1234567890abcdef12345678',
  },
  apis: {
    matcha: 'mock-matcha-api-key',
  },
  fee: {
    bps: '100',
    bps_referred: '50',
    receive_token: '0xReceiveTokenAddress123456789abcdef1234',
    receiver_wallet: '0xReceiverWalletAddress123456789abcdef12',
  },
  server: {
    key: 'mock-server-api-key',
  },
};

export const MOCK_CHAINS = {
  BASE: 8453,
};

export const MOCK_ETHERS = {
  ETHER: '0x0000000000000000000000000000000000000000',
  SWAP_ETHER: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  WRAPPED_ETHER: '0x4200000000000000000000000000000000000006',
  UNCHECKABLE_GROUP: [
    '0x0000000000000000000000000000000000000000',
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  ],
};

export const MOCK_ABI = {
  JSON: {
    erc20: [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
      'function balanceOf(address) view returns (uint256)',
      'function allowance(address,address) view returns (uint256)',
      'function approve(address,uint256) returns (bool)',
      'function transfer(address,uint256) returns (bool)',
    ],
    permitSwap: [
      {
        type: 'function',
        name: 'permit2AndSwap',
        inputs: [
          { name: 'permit', type: 'tuple', components: [] },
          { name: 'signature', type: 'bytes' },
          { name: 'to', type: 'address' },
          { name: 'swapData', type: 'bytes' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
    ],
  },
};
