/**
 * Flow Edges
 * Edge management and creation utilities
 */

import type { FlowEdge, EdgeType, FlowCondition, UUID } from '../types/index.js';
import { uuid } from '../utils/id.js';

/**
 * Create a default edge
 */
export function createEdge(
  source: UUID,
  target: UUID,
  options?: {
    id?: string;
    sourceHandle?: string;
    targetHandle?: string;
    type?: EdgeType;
    label?: string;
    condition?: FlowCondition;
  },
): FlowEdge {
  return {
    id: options?.id ?? uuid(),
    source,
    sourceHandle: options?.sourceHandle,
    target,
    targetHandle: options?.targetHandle,
    type: options?.type ?? 'default',
    label: options?.label,
    condition: options?.condition,
  };
}

/**
 * Create a success edge (from action nodes)
 */
export function createSuccessEdge(
  source: UUID,
  target: UUID,
  options?: { id?: string; label?: string },
): FlowEdge {
  return createEdge(source, target, {
    ...options,
    sourceHandle: 'output',
    type: 'success',
    label: options?.label ?? 'Success',
  });
}

/**
 * Create a failure edge (from action nodes)
 */
export function createFailureEdge(
  source: UUID,
  target: UUID,
  options?: { id?: string; label?: string },
): FlowEdge {
  return createEdge(source, target, {
    ...options,
    sourceHandle: 'error',
    type: 'failure',
    label: options?.label ?? 'Failure',
  });
}

/**
 * Create a conditional edge
 */
export function createConditionalEdge(
  source: UUID,
  target: UUID,
  condition: FlowCondition,
  options?: { id?: string; label?: string },
): FlowEdge {
  return createEdge(source, target, {
    ...options,
    type: 'conditional',
    condition,
    label: options?.label ?? formatCondition(condition),
  });
}

/**
 * Create a true branch edge (from condition nodes)
 */
export function createTrueEdge(
  source: UUID,
  target: UUID,
  options?: { id?: string },
): FlowEdge {
  return createEdge(source, target, {
    ...options,
    sourceHandle: 'true',
    type: 'conditional',
    label: 'True',
  });
}

/**
 * Create a false branch edge (from condition nodes)
 */
export function createFalseEdge(
  source: UUID,
  target: UUID,
  options?: { id?: string },
): FlowEdge {
  return createEdge(source, target, {
    ...options,
    sourceHandle: 'false',
    type: 'conditional',
    label: 'False',
  });
}

/**
 * Create an iteration edge (from loop nodes)
 */
export function createIterationEdge(
  source: UUID,
  target: UUID,
  options?: { id?: string },
): FlowEdge {
  return createEdge(source, target, {
    ...options,
    sourceHandle: 'iteration',
    type: 'default',
    label: 'Each Item',
  });
}

/**
 * Create a loop complete edge
 */
export function createLoopCompleteEdge(
  source: UUID,
  target: UUID,
  options?: { id?: string },
): FlowEdge {
  return createEdge(source, target, {
    ...options,
    sourceHandle: 'complete',
    type: 'default',
    label: 'Complete',
  });
}

/**
 * Clone an edge with a new ID
 */
export function cloneEdge(edge: FlowEdge): FlowEdge {
  return {
    ...edge,
    id: uuid(),
  };
}

/**
 * Update edge endpoints (when nodes are reconnected)
 */
export function updateEdgeEndpoints(
  edge: FlowEdge,
  updates: {
    source?: UUID;
    sourceHandle?: string;
    target?: UUID;
    targetHandle?: string;
  },
): FlowEdge {
  return {
    ...edge,
    source: updates.source ?? edge.source,
    sourceHandle: updates.sourceHandle ?? edge.sourceHandle,
    target: updates.target ?? edge.target,
    targetHandle: updates.targetHandle ?? edge.targetHandle,
  };
}

/**
 * Format condition as string for display
 */
export function formatCondition(condition: FlowCondition): string {
  const { field, operator, value } = condition;

  const operatorLabels: Record<string, string> = {
    eq: '=',
    neq: '!=',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    contains: 'contains',
    startsWith: 'starts with',
    endsWith: 'ends with',
    matches: 'matches',
    in: 'in',
    notIn: 'not in',
    isNull: 'is null',
    isNotNull: 'is not null',
  };

  const op = operatorLabels[operator] ?? operator;

  if (operator === 'isNull' || operator === 'isNotNull') {
    return `${field} ${op}`;
  }

  const valueStr =
    typeof value === 'string' ? `"${value}"` : JSON.stringify(value);

  return `${field} ${op} ${valueStr}`;
}

/**
 * Get all edges from a node
 */
export function getOutgoingEdges(edges: FlowEdge[], nodeId: UUID): FlowEdge[] {
  return edges.filter((e) => e.source === nodeId);
}

/**
 * Get all edges to a node
 */
export function getIncomingEdges(edges: FlowEdge[], nodeId: UUID): FlowEdge[] {
  return edges.filter((e) => e.target === nodeId);
}

/**
 * Get edges between two nodes
 */
export function getEdgesBetween(
  edges: FlowEdge[],
  sourceId: UUID,
  targetId: UUID,
): FlowEdge[] {
  return edges.filter((e) => e.source === sourceId && e.target === targetId);
}

/**
 * Check if two nodes are connected
 */
export function areNodesConnected(
  edges: FlowEdge[],
  sourceId: UUID,
  targetId: UUID,
): boolean {
  return edges.some((e) => e.source === sourceId && e.target === targetId);
}

/**
 * Remove edges connected to a node
 */
export function removeNodeEdges(edges: FlowEdge[], nodeId: UUID): FlowEdge[] {
  return edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
}

/**
 * Edge type display labels
 */
export const EDGE_TYPE_LABELS: Record<EdgeType, string> = {
  default: 'Default',
  success: 'Success',
  failure: 'Failure',
  conditional: 'Conditional',
};
