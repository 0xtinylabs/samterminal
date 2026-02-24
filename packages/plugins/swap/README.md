# @samterminal/plugin-swap

Token swap plugin for SamTerminal using 0x Protocol.

## Installation

```bash
pnpm add @samterminal/plugin-swap
```

## Configuration

```typescript
import { SwapPlugin } from '@samterminal/plugin-swap';

const swapPlugin = new SwapPlugin({
  // Required: 0x API key
  zeroXApiKey: process.env.ZEROX_API_KEY,

  // Optional: Default chain for swaps
  defaultChain: 'base',

  // Optional: Default slippage in basis points (100 = 1%)
  defaultSlippageBps: 100,

  // Optional: Platform fee configuration
  feeBps: 25, // 0.25% fee
  feeRecipient: '0x...',
  feeToken: '0x...', // Token to receive fees in

  // Optional: Custom RPC URLs
  rpcUrls: {
    base: 'https://base-mainnet.g.alchemy.com/v2/...',
    ethereum: 'https://eth-mainnet.g.alchemy.com/v2/...',
  },

  // Optional: Alchemy API key for RPC
  alchemyApiKey: process.env.ALCHEMY_API_KEY,

  // Optional: Database adapter for swap tracking
  database: myDatabaseAdapter,
});
```

## Providers

### swap:quote

Get a swap quote with pricing information.

```typescript
const quote = await core.services.get('provider:swap:quote').get({
  query: {
    fromToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
    toToken: '0x4200000000000000000000000000000000000006', // WETH
    amount: 100, // 100 USDC
    chainId: 'base',
    slippageBps: 100, // 1%
    taker: '0x...', // Optional: taker address for firm quote
  },
});

console.log(quote.data);
// {
//   fromToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
//   toToken: '0x4200000000000000000000000000000000000006',
//   sellAmount: '100',
//   buyAmount: '0.0312',
//   price: 0.000312,
//   priceImpact: 0.01,
//   gasEstimate: '150000',
//   minimumBuyAmount: '0.0309',
//   sources: [{ name: 'Uniswap_V3', proportion: 1 }],
//   allowanceTarget: '0x...',
//   transaction: { to, data, value, gas, gasPrice },
// }
```

### swap:allowance

Check token allowance for swap.

```typescript
const allowance = await core.services.get('provider:swap:allowance').get({
  query: {
    token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    owner: '0x...',
    spender: CONTRACTS.PERMIT2, // Optional, defaults to Permit2
    chainId: 'base',
  },
});

console.log(allowance.data);
// {
//   token: '0x...',
//   owner: '0x...',
//   spender: '0x...',
//   allowance: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
//   isUnlimited: true,
// }
```

## Actions

### swap:approve

Approve token spending for swap (Permit2).

```typescript
const result = await core.services.get('action:swap:approve').execute({
  input: {
    token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    privateKey: process.env.PRIVATE_KEY,
    chainId: 'base',
    spender: CONTRACTS.PERMIT2, // Optional
  },
});

console.log(result);
// { success: true, data: { txHash: '0x...' } }
```

### swap:execute

Execute a token swap.

```typescript
const result = await core.services.get('action:swap:execute').execute({
  input: {
    fromToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
    toToken: '0x4200000000000000000000000000000000000006', // WETH
    amount: 100, // 100 USDC
    privateKey: process.env.PRIVATE_KEY,
    chainId: 'base',
    slippageBps: 100, // 1%
    recipient: '0x...', // Optional: defaults to sender
  },
});

console.log(result);
// {
//   success: true,
//   data: {
//     txHash: '0x...',
//     sellAmount: '100',
//     buyAmount: '0.0312',
//     timestamp: 1704067200000,
//   }
// }
```

## Supported Chains

- Base
- Ethereum
- Arbitrum
- Polygon
- Optimism
- BSC

## Database Adapter

Implement the `SwapDatabaseAdapter` interface to track swap history:

```typescript
interface SwapDatabaseAdapter {
  logSwap(swap: Omit<SwapHistoryEntry, 'id'>): Promise<string>;
  logError(walletAddress: string, error: string): Promise<void>;
  getSwapHistory(
    walletAddress: string,
    options?: { limit?: number; offset?: number; chainId?: ChainId },
  ): Promise<SwapHistoryEntry[]>;
  getSwapCount(
    walletAddress: string,
    period?: 'day' | 'week' | 'month' | 'year',
  ): Promise<number>;
  updateSwapStatus(
    txHash: string,
    status: 'pending' | 'confirmed' | 'failed',
  ): Promise<void>;
}
```

## Dependencies

- `@samterminal/core`
- `@samterminal/plugin-tokendata` (for ChainId type)

## License

MIT
