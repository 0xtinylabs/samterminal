/**
 * Flow Validation
 * Validates flow structure and connections
 */

import type { Flow, FlowNode, FlowEdge, NodeType } from '../types/index.js';

/**
 * Validation result
 */
export interface FlowValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a flow
 */
export function validateFlow(flow: Flow): FlowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (!flow.name) {
    errors.push('Flow must have a name');
  }

  if (!flow.nodes || flow.nodes.length === 0) {
    errors.push('Flow must have at least one node');
  }

  // Validate nodes
  const nodeIds = new Set<string>();
  let hasTrigger = false;

  for (const node of flow.nodes ?? []) {
    // Check for duplicate IDs
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`);
    }
    nodeIds.add(node.id);

    // Validate node structure
    const nodeErrors = validateNode(node);
    errors.push(...nodeErrors);

    // Check for trigger
    if (node.type === 'trigger') {
      if (hasTrigger) {
        warnings.push('Flow has multiple trigger nodes');
      }
      hasTrigger = true;
    }
  }

  if (!hasTrigger && flow.nodes.length > 0) {
    warnings.push('Flow has no trigger node');
  }

  // Validate edges
  for (const edge of flow.edges ?? []) {
    // Check source exists
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge references non-existent source node: ${edge.source}`);
    }

    // Check target exists
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge references non-existent target node: ${edge.target}`);
    }

    // Check for self-loops
    if (edge.source === edge.target) {
      warnings.push(`Edge creates self-loop on node: ${edge.source}`);
    }
  }

  // Check for cycles (optional, some flows may allow cycles)
  const cycleResult = detectCycles(flow);
  if (cycleResult.hasCycle) {
    warnings.push(`Flow contains cycles: ${cycleResult.path?.join(' -> ')}`);
  }

  // Check for disconnected nodes
  const connectedNodes = getConnectedNodes(flow);
  for (const node of flow.nodes ?? []) {
    if (!connectedNodes.has(node.id) && node.type !== 'trigger') {
      warnings.push(`Node "${node.name}" (${node.id}) is disconnected`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a single node
 */
export function validateNode(node: FlowNode): string[] {
  const errors: string[] = [];

  if (!node.id) {
    errors.push('Node must have an ID');
  }

  if (!node.name) {
    errors.push(`Node ${node.id} must have a name`);
  }

  if (!node.type) {
    errors.push(`Node ${node.id} must have a type`);
  }

  // Type-specific validation
  switch (node.type) {
    case 'action':
      if (!node.data || !('pluginName' in node.data) || !('actionName' in node.data)) {
        errors.push(`Action node ${node.id} must have pluginName and actionName`);
      }
      break;

    case 'condition':
      if (!node.data || !('conditions' in node.data)) {
        errors.push(`Condition node ${node.id} must have conditions`);
      }
      break;

    case 'loop':
      if (!node.data || !('loopType' in node.data)) {
        errors.push(`Loop node ${node.id} must have loopType`);
      }
      break;

    case 'delay':
      if (!node.data || !('delayMs' in node.data)) {
        errors.push(`Delay node ${node.id} must have delayMs`);
      }
      break;

    case 'subflow':
      if (!node.data || !('flowId' in node.data)) {
        errors.push(`Subflow node ${node.id} must have flowId`);
      }
      break;

    case 'trigger':
      if (!node.data || !('triggerType' in node.data)) {
        errors.push(`Trigger node ${node.id} must have triggerType`);
      }
      break;
  }

  return errors;
}

/**
 * Detect cycles in the flow
 */
export function detectCycles(flow: Flow): { hasCycle: boolean; path?: string[] } {
  const graph = buildAdjacencyList(flow);
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  const dfs = (nodeId: string): boolean => {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = graph.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        path.push(neighbor);
        return true;
      }
    }

    recursionStack.delete(nodeId);
    path.pop();
    return false;
  };

  for (const node of flow.nodes ?? []) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) {
        // Find the cycle portion of the path
        const cycleStart = path.lastIndexOf(path[path.length - 1]);
        const cyclePath = path.slice(cycleStart);
        return { hasCycle: true, path: cyclePath };
      }
    }
  }

  return { hasCycle: false };
}

/**
 * Build adjacency list from flow
 */
function buildAdjacencyList(flow: Flow): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const node of flow.nodes ?? []) {
    graph.set(node.id, []);
  }

  for (const edge of flow.edges ?? []) {
    const neighbors = graph.get(edge.source) ?? [];
    neighbors.push(edge.target);
    graph.set(edge.source, neighbors);
  }

  return graph;
}

/**
 * Get all connected nodes (reachable from triggers)
 */
function getConnectedNodes(flow: Flow): Set<string> {
  const connected = new Set<string>();
  const graph = buildAdjacencyList(flow);

  // Find all trigger nodes
  const triggers = flow.nodes?.filter((n) => n.type === 'trigger') ?? [];

  // BFS from each trigger
  const queue: string[] = triggers.map((t) => t.id);

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (connected.has(nodeId)) continue;

    connected.add(nodeId);

    const neighbors = graph.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
      if (!connected.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  // Also add nodes that are targets (may be connected but not from trigger)
  for (const edge of flow.edges ?? []) {
    if (connected.has(edge.source)) {
      connected.add(edge.target);
    }
  }

  return connected;
}

/**
 * Get topological order of nodes
 */
export function getTopologicalOrder(flow: Flow): string[] | null {
  const graph = buildAdjacencyList(flow);
  const inDegree = new Map<string, number>();

  // Initialize in-degrees
  for (const node of flow.nodes ?? []) {
    inDegree.set(node.id, 0);
  }

  // Calculate in-degrees
  for (const edge of flow.edges ?? []) {
    const currentDegree = inDegree.get(edge.target) ?? 0;
    inDegree.set(edge.target, currentDegree + 1);
  }

  // Find nodes with no incoming edges
  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  const order: string[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    order.push(nodeId);

    const neighbors = graph.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDegree);

      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Check if all nodes are included (no cycles)
  if (order.length !== (flow.nodes?.length ?? 0)) {
    return null; // Cycle detected
  }

  return order;
}
