
import {
  validateFlow,
  validateNode,
  detectCycles,
  getTopologicalOrder,
} from './validation.js';
import type { Flow, FlowNode, FlowEdge, NodeType } from '../types/index.js';

/**
 * Helper to create a minimal valid flow
 */
function createFlow(overrides: Partial<Flow> = {}): Flow {
  return {
    id: 'flow-1',
    name: 'Test Flow',
    version: '1.0.0',
    nodes: [],
    edges: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Helper to create a flow node
 */
function createNode(
  id: string,
  type: NodeType,
  data: Record<string, unknown> = {},
  name?: string,
): FlowNode {
  const defaultData: Record<NodeType, Record<string, unknown>> = {
    trigger: { triggerType: 'manual', config: {} },
    action: { pluginName: 'test', actionName: 'test', params: {} },
    condition: { conditions: [], operator: 'and' },
    loop: { loopType: 'count', config: { count: 10 } },
    delay: { delayMs: 1000, delayType: 'fixed' },
    subflow: { flowId: 'subflow-1' },
    output: { outputType: 'return', config: {} },
  };

  return {
    id,
    type,
    name: name ?? `${type}-${id}`,
    position: { x: 0, y: 0 },
    data: { ...defaultData[type], ...data },
  } as FlowNode;
}

/**
 * Helper to create an edge
 */
function createEdge(source: string, target: string, id?: string): FlowEdge {
  return {
    id: id ?? `edge-${source}-${target}`,
    source,
    target,
    type: 'default',
  };
}

describe('Flow Validation', () => {
  describe('validateFlow', () => {
    it('should validate a valid flow', () => {
      const flow = createFlow({
        name: 'Valid Flow',
        nodes: [
          createNode('trigger-1', 'trigger'),
          createNode('action-1', 'action'),
        ],
        edges: [createEdge('trigger-1', 'action-1')],
      });

      const result = validateFlow(flow);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail if flow has no name', () => {
      const flow = createFlow({ name: '' });

      const result = validateFlow(flow);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Flow must have a name');
    });

    it('should fail if flow has no nodes', () => {
      const flow = createFlow({ nodes: [] });

      const result = validateFlow(flow);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Flow must have at least one node');
    });

    it('should fail for duplicate node IDs', () => {
      const flow = createFlow({
        nodes: [
          createNode('duplicate', 'trigger'),
          createNode('duplicate', 'action'),
        ],
      });

      const result = validateFlow(flow);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate node ID: duplicate');
    });

    it('should warn about missing trigger node', () => {
      const flow = createFlow({
        nodes: [createNode('action-1', 'action')],
      });

      const result = validateFlow(flow);

      expect(result.warnings).toContain('Flow has no trigger node');
    });

    it('should warn about multiple trigger nodes', () => {
      const flow = createFlow({
        nodes: [
          createNode('trigger-1', 'trigger'),
          createNode('trigger-2', 'trigger'),
        ],
      });

      const result = validateFlow(flow);

      expect(result.warnings).toContain('Flow has multiple trigger nodes');
    });

    it('should fail for edges referencing non-existent source', () => {
      const flow = createFlow({
        nodes: [createNode('node-1', 'trigger')],
        edges: [createEdge('non-existent', 'node-1')],
      });

      const result = validateFlow(flow);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Edge references non-existent source node: non-existent');
    });

    it('should fail for edges referencing non-existent target', () => {
      const flow = createFlow({
        nodes: [createNode('node-1', 'trigger')],
        edges: [createEdge('node-1', 'non-existent')],
      });

      const result = validateFlow(flow);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Edge references non-existent target node: non-existent');
    });

    it('should warn about self-loops', () => {
      const flow = createFlow({
        nodes: [createNode('node-1', 'trigger')],
        edges: [createEdge('node-1', 'node-1')],
      });

      const result = validateFlow(flow);

      expect(result.warnings).toContain('Edge creates self-loop on node: node-1');
    });

    it('should warn about cycles', () => {
      const flow = createFlow({
        nodes: [
          createNode('trigger', 'trigger'),
          createNode('a', 'action'),
          createNode('b', 'action'),
          createNode('c', 'action'),
        ],
        edges: [
          createEdge('trigger', 'a'),
          createEdge('a', 'b'),
          createEdge('b', 'c'),
          createEdge('c', 'a'), // Creates cycle
        ],
      });

      const result = validateFlow(flow);

      expect(result.warnings.some((w) => w.includes('contains cycles'))).toBe(true);
    });

    it('should warn about disconnected nodes', () => {
      const flow = createFlow({
        nodes: [
          createNode('trigger', 'trigger'),
          createNode('connected', 'action'),
          createNode('disconnected', 'action'),
        ],
        edges: [createEdge('trigger', 'connected')],
      });

      const result = validateFlow(flow);

      expect(result.warnings.some((w) => w.includes('disconnected'))).toBe(true);
    });
  });

  describe('validateNode', () => {
    it('should validate a valid action node', () => {
      const node = createNode('action-1', 'action', {
        pluginName: 'swap',
        actionName: 'executeSwap',
        params: {},
      });

      const errors = validateNode(node);

      expect(errors).toHaveLength(0);
    });

    it('should fail if node has no ID', () => {
      const node = createNode('', 'action');

      const errors = validateNode(node);

      expect(errors).toContain('Node must have an ID');
    });

    it('should fail if node has no name', () => {
      const node = createNode('id', 'action');
      node.name = '';

      const errors = validateNode(node);

      expect(errors.some((e) => e.includes('must have a name'))).toBe(true);
    });

    it('should fail if node has no type', () => {
      const node = createNode('id', 'action');
      (node as Record<string, unknown>).type = undefined;

      const errors = validateNode(node);

      expect(errors.some((e) => e.includes('must have a type'))).toBe(true);
    });

    describe('action node validation', () => {
      it('should fail if action node missing pluginName', () => {
        const node = createNode('action-1', 'action');
        // Remove pluginName from data
        delete (node.data as Record<string, unknown>).pluginName;

        const errors = validateNode(node);

        expect(errors.some((e) => e.includes('pluginName and actionName'))).toBe(true);
      });

      it('should fail if action node missing actionName', () => {
        const node = createNode('action-1', 'action');
        // Remove actionName from data
        delete (node.data as Record<string, unknown>).actionName;

        const errors = validateNode(node);

        expect(errors.some((e) => e.includes('pluginName and actionName'))).toBe(true);
      });
    });

    describe('condition node validation', () => {
      it('should fail if condition node missing conditions', () => {
        const node = createNode('cond-1', 'condition');
        // Remove conditions from data
        delete (node.data as Record<string, unknown>).conditions;

        const errors = validateNode(node);

        expect(errors.some((e) => e.includes('must have conditions'))).toBe(true);
      });

      it('should pass with valid conditions', () => {
        const node = createNode('cond-1', 'condition', {
          conditions: [{ field: 'value', operator: 'gt', value: 100 }],
          operator: 'and',
        });

        const errors = validateNode(node);

        expect(errors).toHaveLength(0);
      });
    });

    describe('loop node validation', () => {
      it('should fail if loop node missing loopType', () => {
        const node = createNode('loop-1', 'loop');
        // Remove loopType from data
        delete (node.data as Record<string, unknown>).loopType;

        const errors = validateNode(node);

        expect(errors.some((e) => e.includes('must have loopType'))).toBe(true);
      });
    });

    describe('delay node validation', () => {
      it('should fail if delay node missing delayMs', () => {
        const node = createNode('delay-1', 'delay');
        // Remove delayMs from data
        delete (node.data as Record<string, unknown>).delayMs;

        const errors = validateNode(node);

        expect(errors.some((e) => e.includes('must have delayMs'))).toBe(true);
      });
    });

    describe('subflow node validation', () => {
      it('should fail if subflow node missing flowId', () => {
        const node = createNode('subflow-1', 'subflow');
        // Remove flowId from data
        delete (node.data as Record<string, unknown>).flowId;

        const errors = validateNode(node);

        expect(errors.some((e) => e.includes('must have flowId'))).toBe(true);
      });
    });

    describe('trigger node validation', () => {
      it('should fail if trigger node missing triggerType', () => {
        const node = createNode('trigger-1', 'trigger');
        // Remove triggerType from data
        delete (node.data as Record<string, unknown>).triggerType;

        const errors = validateNode(node);

        expect(errors.some((e) => e.includes('must have triggerType'))).toBe(true);
      });
    });
  });

  describe('detectCycles', () => {
    it('should detect no cycles in acyclic flow', () => {
      const flow = createFlow({
        nodes: [
          createNode('a', 'trigger'),
          createNode('b', 'action'),
          createNode('c', 'action'),
        ],
        edges: [
          createEdge('a', 'b'),
          createEdge('b', 'c'),
        ],
      });

      const result = detectCycles(flow);

      expect(result.hasCycle).toBe(false);
    });

    it('should detect simple cycle', () => {
      const flow = createFlow({
        nodes: [
          createNode('a', 'action'),
          createNode('b', 'action'),
        ],
        edges: [
          createEdge('a', 'b'),
          createEdge('b', 'a'),
        ],
      });

      const result = detectCycles(flow);

      expect(result.hasCycle).toBe(true);
      expect(result.path).toBeDefined();
    });

    it('should detect cycle in larger graph', () => {
      const flow = createFlow({
        nodes: [
          createNode('a', 'trigger'),
          createNode('b', 'action'),
          createNode('c', 'action'),
          createNode('d', 'action'),
        ],
        edges: [
          createEdge('a', 'b'),
          createEdge('b', 'c'),
          createEdge('c', 'd'),
          createEdge('d', 'b'), // Creates cycle b -> c -> d -> b
        ],
      });

      const result = detectCycles(flow);

      expect(result.hasCycle).toBe(true);
    });

    it('should handle flow with no edges', () => {
      const flow = createFlow({
        nodes: [
          createNode('a', 'trigger'),
          createNode('b', 'action'),
        ],
        edges: [],
      });

      const result = detectCycles(flow);

      expect(result.hasCycle).toBe(false);
    });

    it('should handle empty flow', () => {
      const flow = createFlow({ nodes: [], edges: [] });

      const result = detectCycles(flow);

      expect(result.hasCycle).toBe(false);
    });
  });

  describe('getTopologicalOrder', () => {
    it('should return correct order for linear flow', () => {
      const flow = createFlow({
        nodes: [
          createNode('a', 'trigger'),
          createNode('b', 'action'),
          createNode('c', 'action'),
        ],
        edges: [
          createEdge('a', 'b'),
          createEdge('b', 'c'),
        ],
      });

      const order = getTopologicalOrder(flow);

      expect(order).not.toBeNull();
      expect(order!.indexOf('a')).toBeLessThan(order!.indexOf('b'));
      expect(order!.indexOf('b')).toBeLessThan(order!.indexOf('c'));
    });

    it('should return correct order for branching flow', () => {
      const flow = createFlow({
        nodes: [
          createNode('a', 'trigger'),
          createNode('b', 'action'),
          createNode('c', 'action'),
          createNode('d', 'action'),
        ],
        edges: [
          createEdge('a', 'b'),
          createEdge('a', 'c'),
          createEdge('b', 'd'),
          createEdge('c', 'd'),
        ],
      });

      const order = getTopologicalOrder(flow);

      expect(order).not.toBeNull();
      expect(order!.indexOf('a')).toBeLessThan(order!.indexOf('b'));
      expect(order!.indexOf('a')).toBeLessThan(order!.indexOf('c'));
      expect(order!.indexOf('b')).toBeLessThan(order!.indexOf('d'));
      expect(order!.indexOf('c')).toBeLessThan(order!.indexOf('d'));
    });

    it('should return null for cyclic flow', () => {
      const flow = createFlow({
        nodes: [
          createNode('a', 'action'),
          createNode('b', 'action'),
        ],
        edges: [
          createEdge('a', 'b'),
          createEdge('b', 'a'),
        ],
      });

      const order = getTopologicalOrder(flow);

      expect(order).toBeNull();
    });

    it('should handle flow with disconnected components', () => {
      const flow = createFlow({
        nodes: [
          createNode('a', 'trigger'),
          createNode('b', 'action'),
          createNode('c', 'trigger'),
          createNode('d', 'action'),
        ],
        edges: [
          createEdge('a', 'b'),
          createEdge('c', 'd'),
        ],
      });

      const order = getTopologicalOrder(flow);

      expect(order).not.toBeNull();
      expect(order).toHaveLength(4);
      expect(order!.indexOf('a')).toBeLessThan(order!.indexOf('b'));
      expect(order!.indexOf('c')).toBeLessThan(order!.indexOf('d'));
    });

    it('should handle empty flow', () => {
      const flow = createFlow({ nodes: [], edges: [] });

      const order = getTopologicalOrder(flow);

      expect(order).toEqual([]);
    });
  });
});
