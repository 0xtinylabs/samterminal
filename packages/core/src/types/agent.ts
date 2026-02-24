/**
 * Agent-related types
 */

import type { ChainConfig, ChainId } from './chain.js';
import type { UUID } from './common.js';

export type AgentStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error';

export interface AgentConfig {
  id?: UUID;
  name: string;
  description?: string;
  plugins: string[];
  chains?: ChainConfig;
  settings?: AgentSettings;
  metadata?: Record<string, unknown>;
}

export interface AgentSettings {
  maxConcurrentTasks?: number;
  taskTimeoutMs?: number;
  retryConfig?: {
    maxAttempts: number;
    delayMs: number;
  };
  logging?: {
    level: 'debug' | 'info' | 'warn' | 'error';
    destination?: 'console' | 'file' | 'service';
  };
}

export interface Agent {
  id: UUID;
  name: string;
  description?: string;
  status: AgentStatus;
  config: AgentConfig;
  createdAt: Date;
  startedAt?: Date;
  stoppedAt?: Date;
}

export interface AgentContext {
  agent: Agent;
  chainId?: ChainId;
  walletAddress?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentEvent {
  type: AgentEventType;
  agentId: UUID;
  timestamp: Date;
  data?: unknown;
}

export type AgentEventType =
  | 'agent:started'
  | 'agent:stopped'
  | 'agent:paused'
  | 'agent:resumed'
  | 'agent:error'
  | 'task:started'
  | 'task:completed'
  | 'task:failed'
  | 'plugin:loaded'
  | 'plugin:unloaded'
  | 'plugin:error';

export interface AgentStats {
  agentId: UUID;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskDuration: number;
  uptime: number;
  lastActivity?: Date;
}
