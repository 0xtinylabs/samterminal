/**
 * Provider Interface
 * Providers fetch and return data from various sources
 */

import type {
  ChainId,
  ProviderContext,
  ProviderResult,
  CacheConfig,
} from '../types/index.js';

/**
 * Provider types for categorization
 */
export type ProviderType =
  | 'token'
  | 'wallet'
  | 'transaction'
  | 'yield'
  | 'market'
  | 'nft'
  | 'social'
  | 'analytics'
  | 'custom';

/**
 * Provider interface for data fetching operations
 */
export interface Provider {
  /**
   * Unique name of the provider (e.g., "tokendata:price", "wallet:balance")
   */
  readonly name: string;

  /**
   * Type/category of the provider
   */
  readonly type: ProviderType;

  /**
   * Human-readable description
   */
  readonly description?: string;

  /**
   * Fetch data from the provider
   * @param context - Provider context with query params
   * @returns Provider result with data or error
   */
  get(context: ProviderContext): Promise<ProviderResult>;

  /**
   * Chains this provider supports
   * If undefined, provider is chain-agnostic
   */
  readonly chains?: ChainId[];

  /**
   * Cache configuration for this provider
   */
  readonly cacheConfig?: CacheConfig;

  /**
   * Rate limit configuration
   */
  readonly rateLimit?: RateLimitConfig;

  /**
   * Schema for provider query (JSON Schema format)
   */
  readonly querySchema?: ProviderSchema;

  /**
   * Schema for provider response (JSON Schema format)
   */
  readonly responseSchema?: ProviderSchema;

  /**
   * Tags for categorization and search
   */
  readonly tags?: string[];
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /**
   * Maximum requests per window
   */
  maxRequests: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Whether to queue requests when rate limited
   */
  queue?: boolean;
}

/**
 * JSON Schema-like definition for provider I/O
 */
export interface ProviderSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, ProviderSchemaProperty>;
  required?: string[];
  items?: ProviderSchemaProperty;
  description?: string;
}

export interface ProviderSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  default?: unknown;
  enum?: unknown[];
  properties?: Record<string, ProviderSchemaProperty>;
  items?: ProviderSchemaProperty;
}

/**
 * Provider execution options
 */
export interface ProviderOptions {
  /**
   * Timeout in milliseconds
   */
  timeout?: number;

  /**
   * Whether to use cache
   */
  useCache?: boolean;

  /**
   * Force cache refresh
   */
  forceRefresh?: boolean;

  /**
   * Custom cache TTL for this request
   */
  cacheTtl?: number;
}

/**
 * Cached provider response
 */
export interface CachedProviderResponse<T = unknown> {
  data: T;
  cachedAt: Date;
  expiresAt: Date;
  key: string;
}

/**
 * Provider builder for fluent provider creation
 */
export interface ProviderBuilder {
  name(name: string): ProviderBuilder;
  type(type: ProviderType): ProviderBuilder;
  description(description: string): ProviderBuilder;
  chains(chains: ChainId[]): ProviderBuilder;
  querySchema(schema: ProviderSchema): ProviderBuilder;
  responseSchema(schema: ProviderSchema): ProviderBuilder;
  cache(config: CacheConfig): ProviderBuilder;
  rateLimit(config: RateLimitConfig): ProviderBuilder;
  get(getter: (context: ProviderContext) => Promise<ProviderResult>): ProviderBuilder;
  build(): Provider;
}
