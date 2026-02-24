/**
 * Token data types for @samterminal/plugin-tokendata
 */

/**
 * Supported blockchain chains
 */
export type ChainId = 'base' | 'ethereum' | 'arbitrum' | 'polygon' | 'optimism' | 'bsc';

/**
 * Chain configuration
 */
export interface ChainConfig {
  id: ChainId;
  chainId: number;
  name: string;
  rpcUrl?: string;
  explorerUrl?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Predefined chain configurations
 */
export const CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
  base: {
    id: 'base',
    chainId: 8453,
    name: 'Base',
    explorerUrl: 'https://basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  ethereum: {
    id: 'ethereum',
    chainId: 1,
    name: 'Ethereum',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  arbitrum: {
    id: 'arbitrum',
    chainId: 42161,
    name: 'Arbitrum One',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  polygon: {
    id: 'polygon',
    chainId: 137,
    name: 'Polygon',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  },
  optimism: {
    id: 'optimism',
    chainId: 10,
    name: 'Optimism',
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  bsc: {
    id: 'bsc',
    chainId: 56,
    name: 'BNB Smart Chain',
    explorerUrl: 'https://bscscan.com',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  },
};

/**
 * Pool/DEX types
 */
export type PoolType =
  | 'uniswap_v2'
  | 'uniswap_v3'
  | 'uniswap_v4'
  | 'sushiswap'
  | 'pancakeswap'
  | 'curve'
  | 'balancer'
  | 'aerodrome'
  | 'raydium'
  | 'orca'
  | 'unknown';

/**
 * Core token data structure
 */
export interface TokenData {
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

/**
 * Token price data
 */
export interface TokenPrice {
  address: string;
  chainId: ChainId;
  priceUsd: number;
  priceNative?: number;
  priceChange24h?: number;
  priceChange1h?: number;
  priceChange7d?: number;
  priceChange30d?: number;
  ath?: number;
  athDate?: string;
  atl?: number;
  atlDate?: string;
  lastUpdated: string;
}

/**
 * Token market data
 */
export interface TokenMarketData {
  address: string;
  chainId: ChainId;
  marketCap?: number;
  fullyDilutedValuation?: number;
  totalSupply?: number;
  circulatingSupply?: number;
  maxSupply?: number;
  volume24h?: number;
  volumeChange24h?: number;
  liquidity?: number;
  holders?: number;

  // Price changes
  priceChange1h?: number;
  priceChange24h?: number;
  priceChange7d?: number;

  // Transaction metrics
  txCount24h?: number;
  buyCount24h?: number;
  sellCount24h?: number;
  buyPressure?: number;
  sellPressure?: number;

  // Token age
  pairCreatedAt?: number;
  tokenAge?: number;

  lastUpdated: string;
}

/**
 * Token security analysis
 */
export interface TokenSecurity {
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
  transferTax?: number;
  ownerAddress?: string;
  isOwnerRenounced: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
  lastUpdated: string;
}

/**
 * Liquidity pool data
 */
export interface PoolData {
  address: string;
  chainId: ChainId;
  dex: string;
  poolType: PoolType;
  token0: {
    address: string;
    symbol: string;
    reserve: string;
    reserveUsd?: number;
  };
  token1: {
    address: string;
    symbol: string;
    reserve: string;
    reserveUsd?: number;
  };
  fee?: number;
  tickSpacing?: number;
  sqrtPriceX96?: string;
  liquidity: string;
  liquidityUsd?: number;
  volume24h?: number;
  volumeChange24h?: number;
  txCount24h?: number;
  createdAt?: string;
  lastUpdated: string;
}

/**
 * Token pair data from DexScreener
 */
export interface PairData {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    websites?: Array<{ label: string; url: string }>;
    socials?: Array<{ type: string; url: string }>;
  };
}

/**
 * Token OHLCV candlestick data
 */
export interface TokenCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Candlestick time intervals
 */
export type CandleInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

/**
 * Token trade/transaction data
 */
export interface TokenTrade {
  txHash: string;
  blockNumber: number;
  timestamp: number;
  type: 'buy' | 'sell' | 'swap';
  tokenIn: {
    address: string;
    symbol: string;
    amount: string;
    amountUsd?: number;
  };
  tokenOut: {
    address: string;
    symbol: string;
    amount: string;
    amountUsd?: number;
  };
  maker: string;
  priceUsd?: number;
  poolAddress?: string;
}

/**
 * Token holder data
 */
export interface TokenHolder {
  address: string;
  balance: string;
  balanceFormatted: number;
  percentage: number;
  isContract: boolean;
  label?: string;
}

/**
 * Plugin configuration
 */
export interface TokenDataPluginConfig {
  /**
   * Default chain for queries
   */
  defaultChain?: ChainId;

  /**
   * DexScreener API key (optional, for higher rate limits)
   */
  dexScreenerApiKey?: string;

  /**
   * CoinGecko API key (optional, for higher rate limits)
   */
  coingeckoApiKey?: string;

  /**
   * Moralis API key (required for security analysis)
   */
  moralisApiKey?: string;

  /**
   * Cache TTL in milliseconds (default: 30000)
   */
  cacheTtl?: number;

  /**
   * Enable caching (default: true)
   */
  enableCache?: boolean;

  /**
   * Custom RPC URLs per chain
   */
  rpcUrls?: Partial<Record<ChainId, string>>;

  /**
   * Request timeout in milliseconds (default: 10000)
   */
  requestTimeout?: number;

  /**
   * Maximum retries for failed requests (default: 3)
   */
  maxRetries?: number;
}

/**
 * Provider query types
 */
export interface TokenQuery {
  address: string;
  chainId?: ChainId;
}

export interface TokenPriceQuery extends TokenQuery {
  includeHistory?: boolean;
}

export interface TokenMarketQuery extends TokenQuery {
  includeHolders?: boolean;
}

export interface TokenSecurityQuery extends TokenQuery {
  deepScan?: boolean;
}

export interface PoolQuery {
  tokenAddress?: string;
  poolAddress?: string;
  chainId?: ChainId;
  dex?: string;
  limit?: number;
}

export interface CandleQuery extends TokenQuery {
  interval: CandleInterval;
  from?: number;
  to?: number;
  limit?: number;
}

export interface TradeQuery extends TokenQuery {
  from?: number;
  to?: number;
  limit?: number;
  type?: 'buy' | 'sell' | 'all';
}

export interface HolderQuery extends TokenQuery {
  limit?: number;
  offset?: number;
}

/**
 * API response wrappers
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  timestamp: number;
}

/**
 * DexScreener API types
 */
export interface DexScreenerPairsResponse {
  schemaVersion: string;
  pairs: PairData[] | null;
}

export interface DexScreenerTokenResponse {
  schemaVersion: string;
  pairs: PairData[] | null;
}

/**
 * CoinGecko API types
 */
export interface CoinGeckoTokenInfo {
  id: string;
  symbol: string;
  name: string;
  asset_platform_id: string;
  platforms: Record<string, string>;
  detail_platforms: Record<
    string,
    {
      decimal_place: number;
      contract_address: string;
    }
  >;
  block_time_in_minutes: number;
  hashing_algorithm: string | null;
  categories: string[];
  description: { en: string };
  links: {
    homepage: string[];
    blockchain_site: string[];
    official_forum_url: string[];
    chat_url: string[];
    announcement_url: string[];
    twitter_screen_name: string;
    telegram_channel_identifier: string;
    subreddit_url: string;
    repos_url: { github: string[]; bitbucket: string[] };
  };
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  market_data: {
    current_price: Record<string, number>;
    ath: Record<string, number>;
    ath_date: Record<string, string>;
    atl: Record<string, number>;
    atl_date: Record<string, string>;
    market_cap: Record<string, number>;
    fully_diluted_valuation: Record<string, number>;
    total_volume: Record<string, number>;
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number | null;
  };
  last_updated: string;
}

/**
 * Database adapter for token tracking
 */
export interface TokenDataDatabaseAdapter {
  /**
   * Get tracked tokens for a user
   */
  getTrackedTokens(userId: string): Promise<Array<{ address: string; chainId: ChainId }>>;

  /**
   * Add a token to tracking
   */
  addTrackedToken(userId: string, address: string, chainId: ChainId): Promise<boolean>;

  /**
   * Remove a token from tracking
   */
  removeTrackedToken(userId: string, address: string, chainId: ChainId): Promise<boolean>;

  /**
   * Check if token is tracked by user
   */
  isTokenTracked(userId: string, address: string, chainId: ChainId): Promise<boolean>;

  /**
   * Get price alerts for a token
   */
  getPriceAlerts(
    userId: string,
    address: string,
    chainId: ChainId,
  ): Promise<
    Array<{
      id: string;
      type: 'above' | 'below';
      targetPrice: number;
      triggered: boolean;
    }>
  >;

  /**
   * Add a price alert
   */
  addPriceAlert(
    userId: string,
    address: string,
    chainId: ChainId,
    type: 'above' | 'below',
    targetPrice: number,
  ): Promise<string>;

  /**
   * Remove a price alert
   */
  removePriceAlert(alertId: string): Promise<boolean>;

  /**
   * Mark alert as triggered
   */
  triggerAlert(alertId: string): Promise<boolean>;
}
