# @samterminal/plugin-tokendata

Token data provider plugin for SamTerminal - fetches price, metadata, pools, and security information from DexScreener, CoinGecko, and Moralis.

## Features

- Real-time token price data from DexScreener
- Token metadata (name, symbol, logo, socials) from multiple sources
- Market data (market cap, volume, liquidity, supply)
- Liquidity pool information
- Token security analysis (honeypot detection, tax info)
- Token search across DEXs
- Token tracking and price alerts (with database adapter)
- Built-in caching for optimal performance
- Multi-chain support (Base, Ethereum, Arbitrum, Polygon, Optimism, BSC)

## Installation

```bash
pnpm add @samterminal/plugin-tokendata
```

## Quick Start

```typescript
import { createCore } from '@samterminal/core';
import { createTokenDataPlugin } from '@samterminal/plugin-tokendata';

const core = createCore();

// Create plugin with configuration
const tokenDataPlugin = createTokenDataPlugin({
  defaultChain: 'base',
  coingeckoApiKey: process.env.COINGECKO_API_KEY, // Optional
  moralisApiKey: process.env.MORALIS_API_KEY, // Optional, for security analysis
});

// Register and initialize
await core.plugins.register(tokenDataPlugin);
await core.initialize();
await core.start();

// Get token price
const priceResult = await core.runtime.query('tokendata:price', {
  address: '0x...',
  chainId: 'base',
});

console.log(priceResult.data);
// { address, chainId, priceUsd, priceChange24h, ... }
```

## Configuration

```typescript
interface TokenDataPluginConfig {
  // Default blockchain for queries
  defaultChain?: ChainId; // 'base' | 'ethereum' | etc.

  // API keys (optional for basic usage)
  dexScreenerApiKey?: string;
  coingeckoApiKey?: string;
  moralisApiKey?: string; // Required for security analysis

  // Cache settings
  cacheTtl?: number; // Default: 30000 (30 seconds)
  enableCache?: boolean; // Default: true

  // Request settings
  requestTimeout?: number; // Default: 10000 (10 seconds)
  maxRetries?: number; // Default: 3
}
```

## Providers

### `tokendata:price`

Get token price data.

```typescript
// Query
{ address: string; chainId?: ChainId; includeHistory?: boolean }

// Response
{
  address: string;
  chainId: ChainId;
  priceUsd: number;
  priceNative?: number;
  priceChange24h?: number;
  priceChange1h?: number;
  priceChange7d?: number;  // With includeHistory
  priceChange30d?: number; // With includeHistory
  ath?: number;
  athDate?: string;
  lastUpdated: string;
}
```

### `tokendata:metadata`

Get token metadata.

```typescript
// Query
{ address: string; chainId?: ChainId }

// Response
{
  address: string;
  chainId: ChainId;
  name: string;
  symbol: string;
  decimals: number;
  logoUrl?: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  coingeckoId?: string;
}
```

### `tokendata:market`

Get token market data.

```typescript
// Query
{ address: string; chainId?: ChainId; includeHolders?: boolean }

// Response
{
  address: string;
  chainId: ChainId;
  marketCap?: number;
  fullyDilutedValuation?: number;
  totalSupply?: number;
  circulatingSupply?: number;
  maxSupply?: number;
  volume24h?: number;
  liquidity?: number;
  holders?: number;
  lastUpdated: string;
}
```

### `tokendata:pools`

Get liquidity pools for a token.

```typescript
// Query
{
  tokenAddress?: string;
  poolAddress?: string;
  chainId?: ChainId;
  dex?: string;
  limit?: number;
}

// Response
Array<{
  address: string;
  chainId: ChainId;
  dex: string;
  poolType: PoolType;
  token0: { address, symbol, reserve, reserveUsd };
  token1: { address, symbol, reserve, reserveUsd };
  liquidity: string;
  liquidityUsd?: number;
  volume24h?: number;
  txCount24h?: number;
  createdAt?: string;
}>
```

### `tokendata:security`

Get token security analysis (requires Moralis API key).

```typescript
// Query
{ address: string; chainId?: ChainId; deepScan?: boolean }

// Response
{
  address: string;
  chainId: ChainId;
  isVerified: boolean;
  isHoneypot: boolean;
  isMintable: boolean;
  isProxy: boolean;
  hasBlacklist: boolean;
  hasWhitelist: boolean;
  hasTradingCooldown: boolean;
  buyTax?: number;
  sellTax?: number;
  ownerAddress?: string;
  isOwnerRenounced: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
}
```

### `tokendata:search`

Search for tokens by name, symbol, or address.

```typescript
// Query
{ query: string; limit?: number }

// Response
Array<{
  address: string;
  chainId: string;
  name: string;
  symbol: string;
  logoUrl?: string;
  priceUsd?: number;
  volume24h?: number;
  liquidity?: number;
  source: 'dexscreener' | 'coingecko';
}>
```

## Actions

### `tokendata:track`

Add a token to tracking for a user.

```typescript
interface TrackTokenInput {
  userId: string;
  address: string;
  chainId?: ChainId;
}
```

### `tokendata:untrack`

Remove a token from tracking.

### `tokendata:tracked`

Get all tracked tokens for a user.

### `tokendata:alert:add`

Add a price alert for a token.

```typescript
interface AddPriceAlertInput {
  userId: string;
  address: string;
  chainId?: ChainId;
  type: 'above' | 'below';
  targetPrice: number;
}
```

### `tokendata:alert:remove`

Remove a price alert.

### `tokendata:alert:list`

Get all price alerts for a token.

## Database Adapter

To enable token tracking and price alerts, implement the `TokenDataDatabaseAdapter` interface:

```typescript
interface TokenDataDatabaseAdapter {
  getTrackedTokens(userId: string): Promise<Array<{ address: string; chainId: ChainId }>>;
  addTrackedToken(userId: string, address: string, chainId: ChainId): Promise<boolean>;
  removeTrackedToken(userId: string, address: string, chainId: ChainId): Promise<boolean>;
  isTokenTracked(userId: string, address: string, chainId: ChainId): Promise<boolean>;
  getPriceAlerts(userId: string, address: string, chainId: ChainId): Promise<PriceAlert[]>;
  addPriceAlert(userId: string, address: string, chainId: ChainId, type: 'above' | 'below', targetPrice: number): Promise<string>;
  removePriceAlert(alertId: string): Promise<boolean>;
  triggerAlert(alertId: string): Promise<boolean>;
}

// Usage
const plugin = createTokenDataPlugin({ ... });
plugin.setDatabase(myDatabaseAdapter);
```

## Supported Chains

| Chain | ID | DexScreener | CoinGecko | Moralis |
|-------|-----|-------------|-----------|---------|
| Base | `base` | ✅ | ✅ | ✅ |
| Ethereum | `ethereum` | ✅ | ✅ | ✅ |
| Arbitrum | `arbitrum` | ✅ | ✅ | ✅ |
| Polygon | `polygon` | ✅ | ✅ | ✅ |
| Optimism | `optimism` | ✅ | ✅ | ✅ |
| BSC | `bsc` | ✅ | ✅ | ✅ |

## Direct API Access

For advanced usage, you can access the API clients directly:

```typescript
const plugin = createTokenDataPlugin({ ... });
await core.plugins.register(plugin);

// Direct API access
const dexScreener = plugin.getDexScreener();
const pairs = await dexScreener.getTokenPairs('0x...', 'base');

const coinGecko = plugin.getCoinGecko();
const info = await coinGecko?.getTokenInfo('base', '0x...');

const moralis = plugin.getMoralis();
const security = await moralis?.getTokenSecurity('base', '0x...');
```

## Environment Variables

```env
COINGECKO_API_KEY=your_coingecko_api_key
MORALIS_API_KEY=your_moralis_api_key
```

## License

MIT
