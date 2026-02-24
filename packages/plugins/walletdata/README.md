# @samterminal/plugin-walletdata

Wallet data provider plugin for SamTerminal - fetches wallet balances, token holdings, portfolio, transactions, NFTs, and approvals from Moralis and RPC.

## Features

- Wallet balances (native + tokens)
- Token holdings with USD valuations
- Portfolio summary with 24h changes
- Transaction history
- NFT holdings
- Token approvals/allowances
- ENS name resolution
- Wallet tracking and labeling
- Multi-chain support (Base, Ethereum, Arbitrum, Polygon, Optimism, BSC)

## Installation

```bash
pnpm add @samterminal/plugin-walletdata
```

## Quick Start

```typescript
import { createCore } from '@samterminal/core';
import { createTokenDataPlugin } from '@samterminal/plugin-tokendata';
import { createWalletDataPlugin } from '@samterminal/plugin-walletdata';

const core = createCore();

// WalletData depends on TokenData
const tokenDataPlugin = createTokenDataPlugin();
const walletDataPlugin = createWalletDataPlugin({
  moralisApiKey: process.env.MORALIS_API_KEY,
  alchemyApiKey: process.env.ALCHEMY_API_KEY,
});

// Register and initialize
await core.plugins.register(tokenDataPlugin);
await core.plugins.register(walletDataPlugin);
await core.initialize();
await core.start();

// Get wallet portfolio
const portfolioResult = await core.runtime.query('walletdata:portfolio', {
  address: '0x...',
  chainId: 'base',
});

console.log(portfolioResult.data);
// { totalValueUsd, nativeValueUsd, tokenValueUsd, topTokens, ... }
```

## Configuration

```typescript
interface WalletDataPluginConfig {
  // Default blockchain for queries
  defaultChain?: ChainId;

  // API keys
  moralisApiKey?: string; // Required for most features
  alchemyApiKey?: string; // For RPC calls
  etherscanApiKey?: string; // Fallback

  // Custom RPC URLs per chain
  rpcUrls?: Partial<Record<ChainId, string>>;

  // Cache settings
  cacheTtl?: number; // Default: 30000
  enableCache?: boolean; // Default: true

  // Spam filtering
  excludeSpam?: boolean; // Default: true

  // Request settings
  requestTimeout?: number; // Default: 15000
}
```

## Providers

### `walletdata:wallet`

Get basic wallet information.

```typescript
// Query
{ address: string; chainId?: ChainId }

// Response
{
  address: string;
  chainId: ChainId;
  totalValueUsd: number;
  nativeBalance: string;
  nativeBalanceFormatted: number;
  nativeValueUsd: number;
  tokenCount: number;
  lastUpdated: string;
}
```

### `walletdata:tokens`

Get all tokens held by a wallet.

```typescript
// Query
{
  address: string;
  chainId?: ChainId;
  includeSpam?: boolean;
  minValueUsd?: number;
  limit?: number;
}

// Response
Array<{
  address: string;
  chainId: ChainId;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  balanceFormatted: number;
  priceUsd: number;
  valueUsd: number;
  logoUrl?: string;
  priceChange24h?: number;
  isSpam: boolean;
  isVerified: boolean;
}>
```

### `walletdata:portfolio`

Get wallet portfolio summary.

```typescript
// Query
{ address: string; chainId?: ChainId }

// Response
{
  address: string;
  chainId: ChainId;
  totalValueUsd: number;
  nativeValueUsd: number;
  tokenValueUsd: number;
  tokenCount: number;
  change24h?: number;
  change24hPercent?: number;
  topTokens: WalletToken[];
  lastUpdated: string;
}
```

### `walletdata:transactions`

Get wallet transaction history.

```typescript
// Query
{
  address: string;
  chainId?: ChainId;
  from?: number; // Unix timestamp
  to?: number;
  limit?: number;
  type?: 'all' | 'incoming' | 'outgoing';
}

// Response
Array<{
  hash: string;
  chainId: ChainId;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  valueFormatted: number;
  type: 'incoming' | 'outgoing' | 'self' | 'contract';
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: string;
  gasPrice?: string;
  methodName?: string;
}>
```

### `walletdata:nfts`

Get NFTs held by a wallet.

```typescript
// Query
{
  address: string;
  chainId?: ChainId;
  limit?: number;
  collection?: string; // Filter by collection address
}

// Response
Array<{
  contractAddress: string;
  tokenId: string;
  chainId: ChainId;
  name: string;
  description?: string;
  imageUrl?: string;
  animationUrl?: string;
  collectionName?: string;
  collectionSymbol?: string;
  standard: 'ERC721' | 'ERC1155';
  amount: number;
  floorPriceUsd?: number;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}>
```

### `walletdata:approvals`

Get token approvals/allowances.

```typescript
// Query
{
  address: string;
  chainId?: ChainId;
  includeZero?: boolean;
}

// Response
Array<{
  tokenAddress: string;
  tokenSymbol: string;
  spenderAddress: string;
  spenderName?: string;
  allowance: string;
  allowanceFormatted: number;
  isUnlimited: boolean;
  valueAtRiskUsd?: number;
  approvedAt?: number;
}>
```

## Actions

### `walletdata:track`

Add a wallet to tracking.

```typescript
interface TrackWalletInput {
  userId: string;
  address: string; // Address or ENS name
  chainId?: ChainId;
  label?: string;
}
```

### `walletdata:untrack`

Remove a wallet from tracking.

### `walletdata:tracked`

Get all tracked wallets for a user.

### `walletdata:label`

Set a label/name for a wallet.

## Database Adapter

To enable wallet tracking, implement the `WalletDataDatabaseAdapter` interface:

```typescript
interface WalletDataDatabaseAdapter {
  getTrackedWallets(userId: string): Promise<Array<{ address: string; chainId: ChainId }>>;
  addTrackedWallet(userId: string, address: string, chainId: ChainId): Promise<boolean>;
  removeTrackedWallet(userId: string, address: string, chainId: ChainId): Promise<boolean>;
  isWalletTracked(userId: string, address: string, chainId: ChainId): Promise<boolean>;
  getCachedWallet(address: string, chainId: ChainId): Promise<Wallet | null>;
  updateCachedWallet(wallet: Wallet): Promise<void>;
  getWalletLabel(address: string): Promise<string | null>;
  setWalletLabel(address: string, label: string): Promise<void>;
}

// Usage
const plugin = createWalletDataPlugin({ ... });
plugin.setDatabase(myDatabaseAdapter);
```

## Supported Chains

| Chain | ID | Moralis | RPC |
|-------|-----|---------|-----|
| Base | `base` | ✅ | ✅ |
| Ethereum | `ethereum` | ✅ | ✅ |
| Arbitrum | `arbitrum` | ✅ | ✅ |
| Polygon | `polygon` | ✅ | ✅ |
| Optimism | `optimism` | ✅ | ✅ |
| BSC | `bsc` | ✅ | ✅ |

## Direct API Access

```typescript
const plugin = createWalletDataPlugin({ ... });
await core.plugins.register(plugin);

// Direct API access
const moralis = plugin.getMoralis();
const tokens = await moralis?.getWalletTokens('0x...', 'base');

const rpc = plugin.getRpc();
const balance = await rpc.getNativeBalance('0x...', 'ethereum');
```

## ENS Resolution

The plugin supports ENS name resolution:

```typescript
// Track wallet by ENS name
await core.runtime.executeAction('walletdata:track', {
  userId: 'user123',
  address: 'vitalik.eth',
  label: 'Vitalik',
});

// Resolve ENS directly
const moralis = plugin.getMoralis();
const resolved = await moralis?.resolveEns('vitalik.eth');
console.log(resolved?.address); // 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

## Environment Variables

```env
MORALIS_API_KEY=your_moralis_api_key
ALCHEMY_API_KEY=your_alchemy_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## License

MIT
