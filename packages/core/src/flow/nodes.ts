/**
 * Flow Nodes
 * Node management and creation utilities
 */

import type {
  FlowNode,
  NodeType,
  NodeData,
  TriggerNodeData,
  ActionNodeData,
  ConditionNodeData,
  LoopNodeData,
  DelayNodeData,
  SubflowNodeData,
  OutputNodeData,
  NodePort,
} from '../types/index.js';
import { uuid } from '../utils/id.js';

/**
 * Node creation options
 */
export interface CreateNodeOptions {
  id?: string;
  name: string;
  description?: string;
  position?: { x: number; y: number };
}

/**
 * Create a trigger node
 */
export function createTriggerNode(
  options: CreateNodeOptions,
  data: TriggerNodeData,
): FlowNode {
  return {
    id: options.id ?? uuid(),
    type: 'trigger',
    name: options.name,
    description: options.description,
    position: options.position ?? { x: 0, y: 0 },
    data,
    outputs: [{ id: 'output', name: 'Output', type: 'any' }],
  };
}

/**
 * Create an action node
 */
export function createActionNode(
  options: CreateNodeOptions,
  data: ActionNodeData,
): FlowNode {
  return {
    id: options.id ?? uuid(),
    type: 'action',
    name: options.name,
    description: options.description,
    position: options.position ?? { x: 0, y: 0 },
    data,
    inputs: [{ id: 'input', name: 'Input', type: 'any', required: true }],
    outputs: [
      { id: 'output', name: 'Output', type: 'any' },
      { id: 'error', name: 'Error', type: 'error' },
    ],
  };
}

/**
 * Create a condition node
 */
export function createConditionNode(
  options: CreateNodeOptions,
  data: ConditionNodeData,
): FlowNode {
  return {
    id: options.id ?? uuid(),
    type: 'condition',
    name: options.name,
    description: options.description,
    position: options.position ?? { x: 0, y: 0 },
    data,
    inputs: [{ id: 'input', name: 'Input', type: 'any', required: true }],
    outputs: [
      { id: 'true', name: 'True', type: 'any' },
      { id: 'false', name: 'False', type: 'any' },
    ],
  };
}

/**
 * Create a loop node
 */
export function createLoopNode(
  options: CreateNodeOptions,
  data: LoopNodeData,
): FlowNode {
  return {
    id: options.id ?? uuid(),
    type: 'loop',
    name: options.name,
    description: options.description,
    position: options.position ?? { x: 0, y: 0 },
    data,
    inputs: [{ id: 'input', name: 'Input', type: 'any', required: true }],
    outputs: [
      { id: 'iteration', name: 'Iteration', type: 'any' },
      { id: 'complete', name: 'Complete', type: 'any' },
    ],
  };
}

/**
 * Create a delay node
 */
export function createDelayNode(
  options: CreateNodeOptions,
  data: DelayNodeData,
): FlowNode {
  return {
    id: options.id ?? uuid(),
    type: 'delay',
    name: options.name,
    description: options.description,
    position: options.position ?? { x: 0, y: 0 },
    data,
    inputs: [{ id: 'input', name: 'Input', type: 'any', required: true }],
    outputs: [{ id: 'output', name: 'Output', type: 'any' }],
  };
}

/**
 * Create a subflow node
 */
export function createSubflowNode(
  options: CreateNodeOptions,
  data: SubflowNodeData,
): FlowNode {
  return {
    id: options.id ?? uuid(),
    type: 'subflow',
    name: options.name,
    description: options.description,
    position: options.position ?? { x: 0, y: 0 },
    data,
    inputs: [{ id: 'input', name: 'Input', type: 'any', required: true }],
    outputs: [
      { id: 'output', name: 'Output', type: 'any' },
      { id: 'error', name: 'Error', type: 'error' },
    ],
  };
}

/**
 * Create an output node
 */
export function createOutputNode(
  options: CreateNodeOptions,
  data: OutputNodeData,
): FlowNode {
  return {
    id: options.id ?? uuid(),
    type: 'output',
    name: options.name,
    description: options.description,
    position: options.position ?? { x: 0, y: 0 },
    data,
    inputs: [{ id: 'input', name: 'Input', type: 'any', required: true }],
  };
}

/**
 * Clone a node with a new ID
 */
export function cloneNode(node: FlowNode, offset?: { x: number; y: number }): FlowNode {
  return {
    ...node,
    id: uuid(),
    position: {
      x: node.position.x + (offset?.x ?? 50),
      y: node.position.y + (offset?.y ?? 50),
    },
  };
}

/**
 * Get default data for a node type
 */
export function getDefaultNodeData(type: NodeType): NodeData {
  switch (type) {
    case 'trigger':
      return { triggerType: 'manual', config: {} };
    case 'action':
      return { pluginName: '', actionName: '', params: {} };
    case 'condition':
      return { conditions: [], operator: 'and' };
    case 'loop':
      return { loopType: 'count', config: { count: 10 } };
    case 'delay':
      return { delayMs: 1000, delayType: 'fixed' };
    case 'subflow':
      return { flowId: '' };
    case 'output':
      return { outputType: 'return', config: {} };
    default:
      throw new Error(`Unknown node type: ${type}`);
  }
}

/**
 * Get default ports for a node type
 */
export function getDefaultPorts(type: NodeType): {
  inputs: NodePort[];
  outputs: NodePort[];
} {
  switch (type) {
    case 'trigger':
      return {
        inputs: [],
        outputs: [{ id: 'output', name: 'Output', type: 'any' }],
      };
    case 'action':
      return {
        inputs: [{ id: 'input', name: 'Input', type: 'any', required: true }],
        outputs: [
          { id: 'output', name: 'Output', type: 'any' },
          { id: 'error', name: 'Error', type: 'error' },
        ],
      };
    case 'condition':
      return {
        inputs: [{ id: 'input', name: 'Input', type: 'any', required: true }],
        outputs: [
          { id: 'true', name: 'True', type: 'any' },
          { id: 'false', name: 'False', type: 'any' },
        ],
      };
    case 'loop':
      return {
        inputs: [{ id: 'input', name: 'Input', type: 'any', required: true }],
        outputs: [
          { id: 'iteration', name: 'Iteration', type: 'any' },
          { id: 'complete', name: 'Complete', type: 'any' },
        ],
      };
    case 'delay':
      return {
        inputs: [{ id: 'input', name: 'Input', type: 'any', required: true }],
        outputs: [{ id: 'output', name: 'Output', type: 'any' }],
      };
    case 'subflow':
      return {
        inputs: [{ id: 'input', name: 'Input', type: 'any', required: true }],
        outputs: [
          { id: 'output', name: 'Output', type: 'any' },
          { id: 'error', name: 'Error', type: 'error' },
        ],
      };
    case 'output':
      return {
        inputs: [{ id: 'input', name: 'Input', type: 'any', required: true }],
        outputs: [],
      };
    default:
      return { inputs: [], outputs: [] };
  }
}

/**
 * Node type display names
 */
export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  trigger: 'Trigger',
  action: 'Action',
  condition: 'Condition',
  loop: 'Loop',
  delay: 'Delay',
  subflow: 'Subflow',
  output: 'Output',
};

/**
 * Node type icons (for UI)
 */
export const NODE_TYPE_ICONS: Record<NodeType, string> = {
  trigger: 'play',
  action: 'bolt',
  condition: 'git-branch',
  loop: 'refresh',
  delay: 'clock',
  subflow: 'layers',
  output: 'arrow-right',
};
