/**
 * WalletData Plugin for SamTerminal
 *
 * Provides wallet data from Moralis and RPC:
 * - Wallet balances and token holdings
 * - Portfolio summary and valuations
 * - Transaction history
 * - NFT holdings
 * - Token approvals/allowances
 * - Wallet tracking and labeling
 */

import type { SamTerminalPlugin, SamTerminalCore, Action, Provider } from '@samterminal/core';
import type {
  WalletDataPluginConfig,
  WalletDataDatabaseAdapter,
  Wallet,
  WalletToken,
  WalletPortfolio,
  WalletTransaction,
  WalletNft,
  TokenApproval,
} from './types/index.js';
import { Cache } from './utils/cache.js';
import { MoralisWalletClient } from './utils/moralis.js';
import { RpcClient } from './utils/rpc.js';
import {
  createWalletProvider,
  createWalletTokensProvider,
  createWalletPortfolioProvider,
  createWalletTransactionsProvider,
  createWalletNftsProvider,
  createWalletApprovalsProvider,
} from './providers/index.js';
import {
  createTrackWalletAction,
  createUntrackWalletAction,
  createGetTrackedWalletsAction,
  createSetWalletLabelAction,
} from './actions/index.js';

export class WalletDataPlugin implements SamTerminalPlugin {
  readonly name = '@samterminal/plugin-walletdata';
  readonly version = '1.0.0';
  readonly description = 'Wallet data provider plugin - balances, portfolio, transactions';
  readonly dependencies = ['@samterminal/plugin-tokendata'];

  private config: WalletDataPluginConfig;
  private moralis: MoralisWalletClient | null = null;
  private rpc: RpcClient;
  private database?: WalletDataDatabaseAdapter;

  // Caches
  private walletCache: Cache<Wallet>;
  private tokensCache: Cache<WalletToken[]>;
  private portfolioCache: Cache<WalletPortfolio>;
  private transactionsCache: Cache<WalletTransaction[]>;
  private nftsCache: Cache<WalletNft[]>;
  private approvalsCache: Cache<TokenApproval[]>;

  actions: Action[] = [];
  providers: Provider[] = [];

  constructor(config: WalletDataPluginConfig = {}) {
    this.config = {
      defaultChain: 'base',
      cacheTtl: 30000,
      enableCache: true,
      excludeSpam: true,
      requestTimeout: 15000,
      ...config,
    };

    // Initialize Moralis client if API key provided
    if (config.moralisApiKey) {
      this.moralis = new MoralisWalletClient({
        apiKey: config.moralisApiKey,
        timeout: this.config.requestTimeout,
      });
    }

    // Initialize RPC client
    this.rpc = new RpcClient({
      alchemyApiKey: config.alchemyApiKey,
      rpcUrls: config.rpcUrls,
      timeout: this.config.requestTimeout,
    });

    // Initialize caches
    const cacheTtl = this.config.cacheTtl ?? 30000;
    this.walletCache = new Cache<Wallet>(cacheTtl);
    this.tokensCache = new Cache<WalletToken[]>(cacheTtl);
    this.portfolioCache = new Cache<WalletPortfolio>(cacheTtl);
    this.transactionsCache = new Cache<WalletTransaction[]>(cacheTtl / 2); // Shorter TTL
    this.nftsCache = new Cache<WalletNft[]>(cacheTtl * 2); // Longer TTL
    this.approvalsCache = new Cache<TokenApproval[]>(cacheTtl);
  }

  /**
   * Set the database adapter for wallet tracking
   */
  setDatabase(adapter: WalletDataDatabaseAdapter): void {
    this.database = adapter;
  }

  async init(_core: SamTerminalCore): Promise<void> {
    // Initialize providers
    this.providers = [
      createWalletProvider(
        () => this.moralis,
        () => this.rpc,
        () => this.walletCache,
        this.config,
      ),
      createWalletTokensProvider(
        () => this.moralis,
        () => this.tokensCache,
        this.config,
      ),
      createWalletPortfolioProvider(
        () => this.moralis,
        () => this.portfolioCache,
        this.config,
      ),
      createWalletTransactionsProvider(
        () => this.moralis,
        () => this.transactionsCache,
        this.config,
      ),
      createWalletNftsProvider(
        () => this.moralis,
        () => this.nftsCache,
        this.config,
      ),
      createWalletApprovalsProvider(
        () => this.moralis,
        () => this.approvalsCache,
        this.config,
      ),
    ];

    // Initialize actions
    this.actions = [
      createTrackWalletAction(this.config, () => this.database, () => this.moralis),
      createUntrackWalletAction(this.config, () => this.database),
      createGetTrackedWalletsAction(() => this.database),
      createSetWalletLabelAction(() => this.database),
    ];
  }

  async destroy(): Promise<void> {
    // Clear all caches
    this.clearCache();
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.walletCache.clear();
    this.tokensCache.clear();
    this.portfolioCache.clear();
    this.transactionsCache.clear();
    this.nftsCache.clear();
    this.approvalsCache.clear();
  }

  /**
   * Get Moralis client for direct access
   */
  getMoralis(): MoralisWalletClient | null {
    return this.moralis;
  }

  /**
   * Get RPC client for direct access
   */
  getRpc(): RpcClient {
    return this.rpc;
  }
}

/**
 * Create a new WalletData plugin instance
 */
export function createWalletDataPlugin(
  config: WalletDataPluginConfig = {},
): WalletDataPlugin {
  return new WalletDataPlugin(config);
}

export default createWalletDataPlugin;
