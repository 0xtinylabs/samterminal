/**
 * TokenData Plugin for SamTerminal
 *
 * Provides token data from DexScreener, CoinGecko, and Moralis:
 * - Price data and price changes
 * - Token metadata (name, symbol, logo, socials)
 * - Market data (market cap, volume, liquidity)
 * - Liquidity pool information
 * - Security analysis
 * - Token search
 * - Token tracking and price alerts
 */

import type { SamTerminalPlugin, SamTerminalCore, Action, Provider } from '@samterminal/core';
import type {
  TokenDataPluginConfig,
  TokenDataDatabaseAdapter,
  TokenPrice,
  TokenData,
  TokenMarketData,
  PoolData,
  TokenSecurity,
} from './types/index.js';
import { Cache } from './utils/cache.js';
import { DexScreenerClient } from './utils/dexscreener.js';
import { CoinGeckoClient } from './utils/coingecko.js';
import { MoralisClient } from './utils/moralis.js';
import {
  createTokenPriceProvider,
  createTokenMetadataProvider,
  createTokenMarketProvider,
  createTokenPoolsProvider,
  createTokenSecurityProvider,
  createTokenSearchProvider,
} from './providers/index.js';
import {
  createTrackTokenAction,
  createUntrackTokenAction,
  createGetTrackedTokensAction,
  createAddPriceAlertAction,
  createRemovePriceAlertAction,
  createGetPriceAlertsAction,
} from './actions/index.js';

export class TokenDataPlugin implements SamTerminalPlugin {
  readonly name = '@samterminal/plugin-tokendata';
  readonly version = '1.0.0';
  readonly description = 'Token data provider plugin - price, metadata, pools, security';

  private config: TokenDataPluginConfig;
  private dexScreener: DexScreenerClient;
  private coinGecko: CoinGeckoClient | null = null;
  private moralis: MoralisClient | null = null;
  private database?: TokenDataDatabaseAdapter;

  // Caches
  private priceCache: Cache<TokenPrice>;
  private metadataCache: Cache<TokenData>;
  private marketCache: Cache<TokenMarketData>;
  private poolsCache: Cache<PoolData[]>;
  private securityCache: Cache<TokenSecurity>;

  actions: Action[] = [];
  providers: Provider[] = [];

  constructor(config: TokenDataPluginConfig = {}) {
    this.config = {
      defaultChain: 'base',
      cacheTtl: 30000,
      enableCache: true,
      requestTimeout: 10000,
      maxRetries: 3,
      ...config,
    };

    // Initialize API clients
    this.dexScreener = new DexScreenerClient({
      apiKey: config.dexScreenerApiKey,
      timeout: this.config.requestTimeout,
    });

    if (config.coingeckoApiKey) {
      this.coinGecko = new CoinGeckoClient({
        apiKey: config.coingeckoApiKey,
        timeout: this.config.requestTimeout,
      });
    } else {
      // Use free tier
      this.coinGecko = new CoinGeckoClient({
        timeout: this.config.requestTimeout,
      });
    }

    if (config.moralisApiKey) {
      this.moralis = new MoralisClient({
        apiKey: config.moralisApiKey,
        timeout: this.config.requestTimeout,
      });
    }

    // Initialize caches
    const cacheTtl = this.config.cacheTtl ?? 30000;
    this.priceCache = new Cache<TokenPrice>(cacheTtl);
    this.metadataCache = new Cache<TokenData>(cacheTtl * 10); // Metadata changes less
    this.marketCache = new Cache<TokenMarketData>(cacheTtl);
    this.poolsCache = new Cache<PoolData[]>(cacheTtl);
    this.securityCache = new Cache<TokenSecurity>(cacheTtl * 10);
  }

  /**
   * Set the database adapter for tracking and alerts
   */
  setDatabase(adapter: TokenDataDatabaseAdapter): void {
    this.database = adapter;
  }

  async init(_core: SamTerminalCore): Promise<void> {
    // Initialize providers
    this.providers = [
      createTokenPriceProvider(
        () => this.dexScreener,
        () => this.coinGecko,
        () => this.priceCache,
        this.config,
      ),
      createTokenMetadataProvider(
        () => this.dexScreener,
        () => this.coinGecko,
        () => this.moralis,
        () => this.metadataCache,
        this.config,
      ),
      createTokenMarketProvider(
        () => this.dexScreener,
        () => this.coinGecko,
        () => this.moralis,
        () => this.marketCache,
        this.config,
      ),
      createTokenPoolsProvider(
        () => this.dexScreener,
        () => this.poolsCache,
        this.config,
      ),
      createTokenSecurityProvider(
        () => this.moralis,
        () => this.securityCache,
        this.config,
      ),
      createTokenSearchProvider(
        () => this.dexScreener,
        () => this.coinGecko,
        this.config,
      ),
    ];

    // Initialize actions
    this.actions = [
      createTrackTokenAction(this.config, () => this.database),
      createUntrackTokenAction(this.config, () => this.database),
      createGetTrackedTokensAction(() => this.database),
      createAddPriceAlertAction(this.config, () => this.database),
      createRemovePriceAlertAction(() => this.database),
      createGetPriceAlertsAction(this.config, () => this.database),
    ];
  }

  async destroy(): Promise<void> {
    // Clear all caches
    this.priceCache.clear();
    this.metadataCache.clear();
    this.marketCache.clear();
    this.poolsCache.clear();
    this.securityCache.clear();
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.priceCache.clear();
    this.metadataCache.clear();
    this.marketCache.clear();
    this.poolsCache.clear();
    this.securityCache.clear();
  }

  /**
   * Get DexScreener client for direct access
   */
  getDexScreener(): DexScreenerClient {
    return this.dexScreener;
  }

  /**
   * Get CoinGecko client for direct access
   */
  getCoinGecko(): CoinGeckoClient | null {
    return this.coinGecko;
  }

  /**
   * Get Moralis client for direct access
   */
  getMoralis(): MoralisClient | null {
    return this.moralis;
  }
}

/**
 * Create a new TokenData plugin instance
 */
export function createTokenDataPlugin(config: TokenDataPluginConfig = {}): TokenDataPlugin {
  return new TokenDataPlugin(config);
}

export default createTokenDataPlugin;
