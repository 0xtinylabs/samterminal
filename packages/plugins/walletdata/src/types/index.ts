/**
 * Wallet data types for @samterminal/plugin-walletdata
 */

import type { ChainId } from '@samterminal/plugin-tokendata';

/**
 * Wallet data structure
 */
export interface Wallet {
  address: string;
  chainId: ChainId;
  totalValueUsd: number;
  nativeBalance: string;
  nativeBalanceFormatted: number;
  nativeValueUsd: number;
  tokenCount: number;
  lastUpdated: string;
}

/**
 * Token held in a wallet
 */
export interface WalletToken {
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
}

/**
 * Wallet portfolio summary
 */
export interface WalletPortfolio {
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

/**
 * Wallet transaction
 */
export interface WalletTransaction {
  hash: string;
  chainId: ChainId;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  valueFormatted: number;
  valueUsd?: number;
  type: 'incoming' | 'outgoing' | 'self' | 'contract';
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: string;
  gasPrice?: string;
  gasCostUsd?: number;
  tokenTransfers?: TokenTransfer[];
  methodName?: string;
}

/**
 * Token transfer in a transaction
 */
export interface TokenTransfer {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimals: number;
  from: string;
  to: string;
  value: string;
  valueFormatted: number;
  valueUsd?: number;
}

/**
 * Wallet NFT
 */
export interface WalletNft {
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
  lastSalePriceUsd?: number;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
}

/**
 * Token approval/allowance
 */
export interface TokenApproval {
  tokenAddress: string;
  tokenSymbol: string;
  spenderAddress: string;
  spenderName?: string;
  allowance: string;
  allowanceFormatted: number;
  isUnlimited: boolean;
  valueAtRiskUsd?: number;
  approvedAt?: number;
}

/**
 * Wallet activity/history item
 */
export interface WalletActivity {
  type:
    | 'transfer_in'
    | 'transfer_out'
    | 'swap'
    | 'mint'
    | 'burn'
    | 'approve'
    | 'nft_transfer'
    | 'contract_interaction';
  hash: string;
  timestamp: number;
  chainId: ChainId;
  summary: string;
  valueUsd?: number;
  tokens?: Array<{
    symbol: string;
    amount: number;
    direction: 'in' | 'out';
  }>;
}

/**
 * Native currency info per chain
 */
export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
  priceUsd: number;
  logoUrl?: string;
}

/**
 * Plugin configuration
 */
export interface WalletDataPluginConfig {
  /**
   * Default chain for queries
   */
  defaultChain?: ChainId;

  /**
   * Moralis API key (required for wallet data)
   */
  moralisApiKey?: string;

  /**
   * Alchemy API key (for RPC calls)
   */
  alchemyApiKey?: string;

  /**
   * Etherscan/Basescan API key (fallback)
   */
  etherscanApiKey?: string;

  /**
   * Custom RPC URLs per chain
   */
  rpcUrls?: Partial<Record<ChainId, string>>;

  /**
   * Cache TTL in milliseconds (default: 30000)
   */
  cacheTtl?: number;

  /**
   * Enable caching (default: true)
   */
  enableCache?: boolean;

  /**
   * Exclude spam tokens by default (default: true)
   */
  excludeSpam?: boolean;

  /**
   * Request timeout in milliseconds (default: 15000)
   */
  requestTimeout?: number;
}

/**
 * Query types
 */
export interface WalletQuery {
  address: string;
  chainId?: ChainId;
}

export interface WalletTokensQuery extends WalletQuery {
  includeSpam?: boolean;
  minValueUsd?: number;
  limit?: number;
}

export interface WalletTransactionsQuery extends WalletQuery {
  from?: number;
  to?: number;
  limit?: number;
  type?: 'all' | 'incoming' | 'outgoing';
}

export interface WalletNftsQuery extends WalletQuery {
  limit?: number;
  collection?: string;
}

export interface WalletApprovalsQuery extends WalletQuery {
  includeZero?: boolean;
}

export interface WalletActivityQuery extends WalletQuery {
  from?: number;
  to?: number;
  limit?: number;
  types?: WalletActivity['type'][];
}

/**
 * Moralis API types
 */
export interface MoralisWalletToken {
  token_address: string;
  name: string;
  symbol: string;
  logo?: string;
  thumbnail?: string;
  decimals: number;
  balance: string;
  balance_formatted: string;
  possible_spam: boolean;
  verified_contract: boolean;
  usd_price?: number;
  usd_price_24hr_percent_change?: number;
  usd_price_24hr_usd_change?: number;
  usd_value?: number;
  native_token: boolean;
  portfolio_percentage?: number;
}

export interface MoralisWalletTokensResponse {
  result: MoralisWalletToken[];
  cursor?: string;
  page?: number;
  page_size?: number;
}

export interface MoralisTransaction {
  hash: string;
  nonce: string;
  transaction_index: string;
  from_address: string;
  from_address_label?: string;
  to_address: string;
  to_address_label?: string;
  value: string;
  gas: string;
  gas_price: string;
  input: string;
  receipt_cumulative_gas_used: string;
  receipt_gas_used: string;
  receipt_contract_address?: string;
  receipt_root?: string;
  receipt_status: string;
  block_timestamp: string;
  block_number: string;
  block_hash: string;
  method_label?: string;
}

export interface MoralisTransactionsResponse {
  result: MoralisTransaction[];
  cursor?: string;
  page?: number;
  page_size?: number;
}

export interface MoralisNft {
  token_address: string;
  token_id: string;
  contract_type: string;
  owner_of: string;
  block_number: string;
  block_number_minted: string;
  token_uri?: string;
  metadata?: string;
  normalized_metadata?: {
    name?: string;
    description?: string;
    image?: string;
    animation_url?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
      display_type?: string;
    }>;
  };
  amount: string;
  name: string;
  symbol: string;
  token_hash: string;
  last_token_uri_sync?: string;
  last_metadata_sync?: string;
  possible_spam: boolean;
  verified_collection: boolean;
  floor_price?: string;
  floor_price_usd?: string;
}

export interface MoralisNftsResponse {
  result: MoralisNft[];
  cursor?: string;
  page?: number;
  page_size?: number;
  status?: string;
}

export interface MoralisApproval {
  block_number: string;
  block_timestamp: string;
  transaction_hash: string;
  value: string;
  value_formatted: string;
  token: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logo?: string;
    possible_spam: boolean;
  };
  spender: {
    address: string;
    address_label?: string;
  };
}

export interface MoralisApprovalsResponse {
  result: MoralisApproval[];
  cursor?: string;
  page?: number;
  page_size?: number;
}

/**
 * Database adapter for wallet tracking
 */
export interface WalletDataDatabaseAdapter {
  /**
   * Get tracked wallets for a user
   */
  getTrackedWallets(userId: string): Promise<Array<{ address: string; chainId: ChainId }>>;

  /**
   * Add a wallet to tracking
   */
  addTrackedWallet(userId: string, address: string, chainId: ChainId): Promise<boolean>;

  /**
   * Remove a wallet from tracking
   */
  removeTrackedWallet(userId: string, address: string, chainId: ChainId): Promise<boolean>;

  /**
   * Check if wallet is tracked by user
   */
  isWalletTracked(userId: string, address: string, chainId: ChainId): Promise<boolean>;

  /**
   * Get cached wallet data
   */
  getCachedWallet(address: string, chainId: ChainId): Promise<Wallet | null>;

  /**
   * Update cached wallet data
   */
  updateCachedWallet(wallet: Wallet): Promise<void>;

  /**
   * Get wallet label/name
   */
  getWalletLabel(address: string): Promise<string | null>;

  /**
   * Set wallet label/name
   */
  setWalletLabel(address: string, label: string): Promise<void>;
}
