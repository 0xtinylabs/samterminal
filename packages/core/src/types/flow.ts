/**
 * Flow-related types for visual workflow builder
 */

import type { UUID } from './common.js';

export type NodeType =
  | 'trigger'
  | 'action'
  | 'condition'
  | 'loop'
  | 'delay'
  | 'subflow'
  | 'output';

export type EdgeType = 'default' | 'success' | 'failure' | 'conditional';

export interface FlowNode {
  id: UUID;
  type: NodeType;
  name: string;
  description?: string;
  position: { x: number; y: number };
  data: NodeData;
  inputs?: NodePort[];
  outputs?: NodePort[];
}

export interface NodePort {
  id: string;
  name: string;
  type: string;
  required?: boolean;
}

export type NodeData =
  | TriggerNodeData
  | ActionNodeData
  | ConditionNodeData
  | LoopNodeData
  | DelayNodeData
  | SubflowNodeData
  | OutputNodeData;

export interface TriggerNodeData {
  triggerType: 'manual' | 'schedule' | 'event' | 'webhook';
  config: Record<string, unknown>;
}

export interface ActionNodeData {
  pluginName: string;
  actionName: string;
  params: Record<string, unknown>;
}

export interface ConditionNodeData {
  evaluatorName?: string;
  conditions: FlowCondition[];
  operator: 'and' | 'or';
}

export interface FlowCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'matches'
  | 'in'
  | 'notIn'
  | 'isNull'
  | 'isNotNull';

export interface LoopNodeData {
  loopType: 'count' | 'while' | 'forEach';
  config: {
    count?: number;
    condition?: FlowCondition;
    items?: string; // Path to array in context
    maxIterations?: number;
  };
}

export interface DelayNodeData {
  delayMs: number;
  delayType: 'fixed' | 'random';
  maxDelayMs?: number;
}

export interface SubflowNodeData {
  flowId: UUID;
  inputMapping?: Record<string, string>;
  outputMapping?: Record<string, string>;
}

export interface OutputNodeData {
  outputType: 'return' | 'log' | 'notify' | 'store';
  config: Record<string, unknown>;
}

export interface FlowEdge {
  id: UUID;
  source: UUID;
  sourceHandle?: string;
  target: UUID;
  targetHandle?: string;
  type: EdgeType;
  label?: string;
  condition?: FlowCondition;
}

export interface Flow {
  id: UUID;
  name: string;
  description?: string;
  version: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  variables?: FlowVariable[];
  settings?: FlowSettings;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: unknown;
  description?: string;
}

export interface FlowSettings {
  maxExecutionTime?: number;
  retryOnFailure?: boolean;
  maxRetries?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface FlowExecutionContext {
  flowId: UUID;
  executionId: UUID;
  variables: Record<string, unknown>;
  nodeResults: Record<UUID, NodeExecutionResult>;
  currentNodeId?: UUID;
  startedAt: Date;
  status: FlowExecutionStatus;
}

export type FlowExecutionStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface NodeExecutionResult {
  nodeId: UUID;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output?: unknown;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
}

export interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  flow: Omit<Flow, 'id' | 'createdAt' | 'updatedAt'>;
  thumbnail?: string;
}
