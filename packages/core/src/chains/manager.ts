/**
 * Chain Manager
 * Manages blockchain chain configurations and connections
 */

import type { ChainManager as IChainManager } from '../interfaces/core.interface.js';
import type { Chain, ChainId, EVMChain, ChainConfig } from '../types/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger({ prefix: 'ChainManager' });

/**
 * Chain Manager Implementation
 */
export class ChainManagerImpl implements IChainManager {
  private chains: Map<ChainId, Chain> = new Map();
  private currentChainId: ChainId | undefined;
  private rpcOverrides: Map<ChainId, string> = new Map();

  /**
   * Initialize with default chains
   */
  constructor(config?: ChainConfig) {
    if (config) {
      this.configure(config);
    }
  }

  /**
   * Configure the chain manager
   */
  configure(config: ChainConfig): void {
    if (config.defaultChain) {
      this.currentChainId = config.defaultChain;
    }

    if (config.rpcOverrides) {
      for (const [chainId, rpcUrl] of Object.entries(config.rpcOverrides)) {
        this.rpcOverrides.set(chainId, rpcUrl);
      }
    }
  }

  /**
   * Register a chain
   */
  register(chain: Chain): void {
    if (this.chains.has(chain.id)) {
      logger.warn(`Chain "${chain.id}" already registered, overwriting`);
    }

    this.chains.set(chain.id, chain);
    logger.info(`Chain registered: ${chain.name}`, { id: chain.id, type: chain.type });
  }

  /**
   * Register multiple chains
   */
  registerMany(chains: Chain[]): void {
    for (const chain of chains) {
      this.register(chain);
    }
  }

  /**
   * Unregister a chain
   */
  unregister(chainId: ChainId): boolean {
    const chain = this.chains.get(chainId);
    if (!chain) {
      return false;
    }

    this.chains.delete(chainId);

    if (this.currentChainId === chainId) {
      this.currentChainId = undefined;
    }

    logger.info(`Chain unregistered: ${chain.name}`);
    return true;
  }

  /**
   * Get a chain by ID
   */
  get(chainId: ChainId): Chain | undefined {
    return this.chains.get(chainId);
  }

  /**
   * Get all registered chains
   */
  getAll(): Chain[] {
    return Array.from(this.chains.values());
  }

  /**
   * Get all EVM chains
   */
  getEVMChains(): EVMChain[] {
    return this.getAll().filter((c): c is EVMChain => c.type === 'evm');
  }

  /**
   * Get current active chain
   */
  getCurrentChain(): Chain | undefined {
    if (!this.currentChainId) {
      return undefined;
    }
    return this.chains.get(this.currentChainId);
  }

  /**
   * Get current chain ID
   */
  getCurrentChainId(): ChainId | undefined {
    return this.currentChainId;
  }

  /**
   * Set active chain
   */
  setCurrentChain(chainId: ChainId): void {
    if (!this.chains.has(chainId)) {
      throw new Error(`Chain "${chainId}" is not registered`);
    }

    const previousChain = this.currentChainId;
    this.currentChainId = chainId;

    logger.info(`Chain switched: ${previousChain ?? 'none'} -> ${chainId}`);
  }

  /**
   * Check if chain is supported
   */
  isSupported(chainId: ChainId): boolean {
    return this.chains.has(chainId);
  }

  /**
   * Check if chain is EVM
   */
  isEVM(chainId: ChainId): boolean {
    const chain = this.chains.get(chainId);
    return chain?.type === 'evm';
  }

  /**
   * Get RPC URL for chain
   */
  getRpcUrl(chainId: ChainId): string | undefined {
    // Check overrides first
    const override = this.rpcOverrides.get(chainId);
    if (override) {
      return override;
    }

    // Fall back to chain's RPC URLs
    const chain = this.chains.get(chainId);
    if (!chain || chain.rpcUrls.length === 0) {
      return undefined;
    }

    return chain.rpcUrls[0];
  }

  /**
   * Set RPC URL override for a chain
   */
  setRpcUrl(chainId: ChainId, rpcUrl: string): void {
    this.rpcOverrides.set(chainId, rpcUrl);
    logger.debug(`RPC URL override set for chain ${chainId}`);
  }

  /**
   * Get block explorer URL for chain
   */
  getExplorerUrl(chainId: ChainId): string | undefined {
    const chain = this.chains.get(chainId);
    return chain?.blockExplorerUrls?.[0];
  }

  /**
   * Get native currency for chain
   */
  getNativeCurrency(chainId: ChainId): Chain['nativeCurrency'] | undefined {
    return this.chains.get(chainId)?.nativeCurrency;
  }

  /**
   * Check if chain is testnet
   */
  isTestnet(chainId: ChainId): boolean {
    return this.chains.get(chainId)?.testnet ?? false;
  }

  /**
   * Get all chain IDs
   */
  getChainIds(): ChainId[] {
    return Array.from(this.chains.keys());
  }

  /**
   * Clear all chains
   */
  clear(): void {
    this.chains.clear();
    this.rpcOverrides.clear();
    this.currentChainId = undefined;
    logger.info('Chain manager cleared');
  }

  /**
   * Get number of registered chains
   */
  get size(): number {
    return this.chains.size;
  }
}

/**
 * Create a new chain manager
 */
export function createChainManager(config?: ChainConfig): ChainManagerImpl {
  return new ChainManagerImpl(config);
}
