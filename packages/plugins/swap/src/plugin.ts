/**
 * Swap Plugin for SamTerminal
 *
 * Provides token swap functionality via 0x Protocol
 */

import type { SamTerminalPlugin, SamTerminalCore, Action, Provider } from '@samterminal/core';
import type { SwapPluginConfig, SwapDatabaseAdapter } from './types/index.js';
import { createZeroXClient, ZeroXClient } from './utils/zerox.js';
import { createWalletManager, WalletManager } from './utils/wallet.js';
import { createQuoteProvider } from './providers/quote.js';
import { createAllowanceProvider } from './providers/allowance.js';
import { createApproveAction } from './actions/approve.js';
import { createSwapAction } from './actions/swap.js';

export interface SwapPluginOptions extends SwapPluginConfig {
  /** Optional database adapter for swap tracking */
  database?: SwapDatabaseAdapter;
}

export class SwapPlugin implements SamTerminalPlugin {
  readonly name = '@samterminal/plugin-swap';
  readonly version = '1.0.0';
  readonly description = 'Token swap functionality via 0x Protocol';
  readonly author = 'SamTerminal Team';

  readonly dependencies = ['@samterminal/plugin-tokendata'];

  private core: SamTerminalCore | null = null;
  private config: SwapPluginConfig;
  private database?: SwapDatabaseAdapter;
  private zeroXClient: ZeroXClient | null = null;
  private walletManager: WalletManager | null = null;

  actions: Action[] = [];
  providers: Provider[] = [];

  constructor(options: SwapPluginOptions = {}) {
    this.config = {
      defaultChain: options.defaultChain ?? 'base',
      zeroXApiKey: options.zeroXApiKey ?? process.env.ZEROX_API_KEY,
      zeroXApiUrl: options.zeroXApiUrl,
      defaultPrivateKey: options.defaultPrivateKey ?? process.env.WALLET_PRIVATE_KEY,
      defaultSlippageBps: options.defaultSlippageBps ?? 100,
      feeBps: options.feeBps,
      feeRecipient: options.feeRecipient,
      feeToken: options.feeToken,
      rpcUrls: options.rpcUrls ?? {},
      alchemyApiKey: options.alchemyApiKey ?? process.env.ALCHEMY_API_KEY,
      cacheTtl: options.cacheTtl ?? 10000,
      enableCache: options.enableCache ?? true,
      requestTimeout: options.requestTimeout ?? 30000,
      permitSwapAddress: options.permitSwapAddress,
      permit2Address: options.permit2Address,
      permitDeadlineSeconds: options.permitDeadlineSeconds ?? 60,
      defaultGasLimit: options.defaultGasLimit ?? 6_000_000n,
    };

    this.database = options.database;
  }

  async init(core: SamTerminalCore): Promise<void> {
    this.core = core;

    // Initialize 0x client if API key is available
    if (this.config.zeroXApiKey) {
      this.zeroXClient = createZeroXClient({
        apiKey: this.config.zeroXApiKey,
        cacheTtl: this.config.cacheTtl,
        enableCache: this.config.enableCache,
        requestTimeout: this.config.requestTimeout,
        feeBps: this.config.feeBps,
        feeRecipient: this.config.feeRecipient,
        feeToken: this.config.feeToken,
      });
    }

    // Initialize wallet manager
    this.walletManager = createWalletManager({
      rpcUrls: this.config.rpcUrls ?? {},
      alchemyApiKey: this.config.alchemyApiKey,
    });

    // Create providers
    this.providers = [
      createQuoteProvider(
        () => this.zeroXClient,
        () => this.walletManager!,
        this.config,
      ),
      createAllowanceProvider(() => this.walletManager!, this.config),
    ];

    // Create actions
    this.actions = [
      createApproveAction(() => this.walletManager!, this.config),
      createSwapAction(
        () => this.zeroXClient,
        () => this.walletManager!,
        () => this.database,
        this.config,
      ),
    ];

    // Register providers and actions with core
    for (const provider of this.providers) {
      core.services.registerProvider(provider, this.name);
    }

    for (const action of this.actions) {
      core.services.registerAction(action, this.name);
    }

    core.events.emit('plugin:loaded', { plugin: this.name });
  }

  async destroy(): Promise<void> {
    // Cleanup resources
    this.zeroXClient = null;
    this.walletManager = null;

    if (this.core) {
      // Unregister all services for this plugin
      this.core.services.unregisterPlugin(this.name);

      this.core.events.emit('plugin:unloaded', { plugin: this.name });
    }

    this.core = null;
    this.providers = [];
    this.actions = [];
  }

  /**
   * Get the 0x client instance
   */
  getZeroXClient(): ZeroXClient | null {
    return this.zeroXClient;
  }

  /**
   * Get the wallet manager instance
   */
  getWalletManager(): WalletManager | null {
    return this.walletManager;
  }

  /**
   * Get the database adapter
   */
  getDatabase(): SwapDatabaseAdapter | undefined {
    return this.database;
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(config: Partial<SwapPluginConfig>): void {
    this.config = { ...this.config, ...config };

    // Reinitialize clients if API keys changed
    if (config.zeroXApiKey) {
      this.zeroXClient = createZeroXClient({
        apiKey: config.zeroXApiKey,
        cacheTtl: this.config.cacheTtl,
        enableCache: this.config.enableCache,
        requestTimeout: this.config.requestTimeout,
        feeBps: this.config.feeBps,
        feeRecipient: this.config.feeRecipient,
        feeToken: this.config.feeToken,
      });
    }

    if (config.rpcUrls || config.alchemyApiKey) {
      this.walletManager = createWalletManager({
        rpcUrls: this.config.rpcUrls ?? {},
        alchemyApiKey: this.config.alchemyApiKey,
      });
    }
  }

  /**
   * Set database adapter at runtime
   */
  setDatabase(database: SwapDatabaseAdapter): void {
    this.database = database;
  }
}

/**
 * Create a new SwapPlugin instance
 */
export function createSwapPlugin(options?: SwapPluginOptions): SwapPlugin {
  return new SwapPlugin(options);
}
