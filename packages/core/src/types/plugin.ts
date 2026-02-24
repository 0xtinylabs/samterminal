/**
 * Plugin-related types
 */

import type { ChainConfig, ChainId } from './chain.js';
import type { UUID } from './common.js';

export type PluginStatus =
  | 'registered'
  | 'initializing'
  | 'active'
  | 'error'
  | 'destroyed';

export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  repository?: string;
  homepage?: string;
  keywords?: string[];
}

export interface PluginDependencies {
  required?: string[];
  optional?: string[];
}

export interface PluginCapabilities {
  actions?: string[];
  providers?: string[];
  evaluators?: string[];
  hooks?: string[];
  chains?: ChainId[];
}

export interface PluginState {
  status: PluginStatus;
  loadedAt?: Date;
  error?: Error;
  metadata: PluginMetadata;
  capabilities: PluginCapabilities;
}

export interface PluginContext {
  pluginName: string;
  agentId: UUID;
  chainId?: ChainId;
  config?: Record<string, unknown>;
}

export interface ActionContext extends PluginContext {
  input: unknown;
  metadata?: Record<string, unknown>;
}

export interface ActionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderContext extends PluginContext {
  query: unknown;
  chainId?: ChainId;
}

export interface ProviderResult {
  success: boolean;
  data?: unknown;
  error?: string;
  cached?: boolean;
  timestamp: Date;
}

export interface EvaluatorContext extends PluginContext {
  condition: unknown;
  data: unknown;
}

export interface HookContext extends PluginContext {
  event: string;
  data: unknown;
  timestamp: Date;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}
