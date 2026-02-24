/**
 * Flow Edges tests
 */


import {
  createEdge,
  createSuccessEdge,
  createFailureEdge,
  createConditionalEdge,
  createTrueEdge,
  createFalseEdge,
  createIterationEdge,
  createLoopCompleteEdge,
  cloneEdge,
  updateEdgeEndpoints,
  formatCondition,
  getOutgoingEdges,
  getIncomingEdges,
  getEdgesBetween,
  areNodesConnected,
  removeNodeEdges,
  EDGE_TYPE_LABELS,
} from './edges.js';
import type { FlowEdge, FlowCondition } from '../types/index.js';

describe('createEdge', () => {
  it('should create edge with source and target', () => {
    const edge = createEdge('node1', 'node2');

    expect(edge.source).toBe('node1');
    expect(edge.target).toBe('node2');
    expect(edge.id).toBeDefined();
    expect(edge.type).toBe('default');
  });

  it('should use custom ID', () => {
    const edge = createEdge('node1', 'node2', { id: 'custom-edge' });
    expect(edge.id).toBe('custom-edge');
  });

  it('should use custom handles', () => {
    const edge = createEdge('node1', 'node2', {
      sourceHandle: 'output',
      targetHandle: 'input',
    });

    expect(edge.sourceHandle).toBe('output');
    expect(edge.targetHandle).toBe('input');
  });

  it('should set edge type', () => {
    const edge = createEdge('node1', 'node2', { type: 'success' });
    expect(edge.type).toBe('success');
  });

  it('should set label', () => {
    const edge = createEdge('node1', 'node2', { label: 'Next' });
    expect(edge.label).toBe('Next');
  });

  it('should set condition', () => {
    const condition: FlowCondition = {
      field: 'status',
      operator: 'eq',
      value: 'success',
    };
    const edge = createEdge('node1', 'node2', { condition });

    expect(edge.condition).toEqual(condition);
  });
});

describe('createSuccessEdge', () => {
  it('should create success edge', () => {
    const edge = createSuccessEdge('node1', 'node2');

    expect(edge.sourceHandle).toBe('output');
    expect(edge.type).toBe('success');
    expect(edge.label).toBe('Success');
  });

  it('should use custom label', () => {
    const edge = createSuccessEdge('node1', 'node2', { label: 'OK' });
    expect(edge.label).toBe('OK');
  });
});

describe('createFailureEdge', () => {
  it('should create failure edge', () => {
    const edge = createFailureEdge('node1', 'node2');

    expect(edge.sourceHandle).toBe('error');
    expect(edge.type).toBe('failure');
    expect(edge.label).toBe('Failure');
  });
});

describe('createConditionalEdge', () => {
  it('should create conditional edge', () => {
    const condition: FlowCondition = {
      field: 'amount',
      operator: 'gt',
      value: 100,
    };
    const edge = createConditionalEdge('node1', 'node2', condition);

    expect(edge.type).toBe('conditional');
    expect(edge.condition).toEqual(condition);
  });

  it('should format condition as label', () => {
    const condition: FlowCondition = {
      field: 'amount',
      operator: 'gt',
      value: 100,
    };
    const edge = createConditionalEdge('node1', 'node2', condition);

    expect(edge.label).toBe('amount > 100');
  });
});

describe('createTrueEdge', () => {
  it('should create true branch edge', () => {
    const edge = createTrueEdge('node1', 'node2');

    expect(edge.sourceHandle).toBe('true');
    expect(edge.type).toBe('conditional');
    expect(edge.label).toBe('True');
  });
});

describe('createFalseEdge', () => {
  it('should create false branch edge', () => {
    const edge = createFalseEdge('node1', 'node2');

    expect(edge.sourceHandle).toBe('false');
    expect(edge.type).toBe('conditional');
    expect(edge.label).toBe('False');
  });
});

describe('createIterationEdge', () => {
  it('should create iteration edge', () => {
    const edge = createIterationEdge('node1', 'node2');

    expect(edge.sourceHandle).toBe('iteration');
    expect(edge.label).toBe('Each Item');
  });
});

describe('createLoopCompleteEdge', () => {
  it('should create loop complete edge', () => {
    const edge = createLoopCompleteEdge('node1', 'node2');

    expect(edge.sourceHandle).toBe('complete');
    expect(edge.label).toBe('Complete');
  });
});

describe('cloneEdge', () => {
  it('should create copy with new ID', () => {
    const original = createEdge('node1', 'node2', { id: 'original' });
    const cloned = cloneEdge(original);

    expect(cloned.id).not.toBe(original.id);
    expect(cloned.source).toBe(original.source);
    expect(cloned.target).toBe(original.target);
  });
});

describe('updateEdgeEndpoints', () => {
  it('should update source', () => {
    const edge = createEdge('node1', 'node2');
    const updated = updateEdgeEndpoints(edge, { source: 'node3' });

    expect(updated.source).toBe('node3');
    expect(updated.target).toBe('node2');
  });

  it('should update target', () => {
    const edge = createEdge('node1', 'node2');
    const updated = updateEdgeEndpoints(edge, { target: 'node4' });

    expect(updated.source).toBe('node1');
    expect(updated.target).toBe('node4');
  });

  it('should update handles', () => {
    const edge = createEdge('node1', 'node2');
    const updated = updateEdgeEndpoints(edge, {
      sourceHandle: 'output',
      targetHandle: 'input',
    });

    expect(updated.sourceHandle).toBe('output');
    expect(updated.targetHandle).toBe('input');
  });
});

describe('formatCondition', () => {
  it('should format equality condition', () => {
    const condition: FlowCondition = {
      field: 'status',
      operator: 'eq',
      value: 'success',
    };
    expect(formatCondition(condition)).toBe('status = "success"');
  });

  it('should format inequality condition', () => {
    const condition: FlowCondition = {
      field: 'count',
      operator: 'neq',
      value: 0,
    };
    expect(formatCondition(condition)).toBe('count != 0');
  });

  it('should format greater than', () => {
    const condition: FlowCondition = {
      field: 'amount',
      operator: 'gt',
      value: 100,
    };
    expect(formatCondition(condition)).toBe('amount > 100');
  });

  it('should format less than or equal', () => {
    const condition: FlowCondition = {
      field: 'price',
      operator: 'lte',
      value: 50,
    };
    expect(formatCondition(condition)).toBe('price <= 50');
  });

  it('should format contains', () => {
    const condition: FlowCondition = {
      field: 'name',
      operator: 'contains',
      value: 'test',
    };
    expect(formatCondition(condition)).toBe('name contains "test"');
  });

  it('should format isNull', () => {
    const condition: FlowCondition = {
      field: 'data',
      operator: 'isNull',
      value: null,
    };
    expect(formatCondition(condition)).toBe('data is null');
  });

  it('should format isNotNull', () => {
    const condition: FlowCondition = {
      field: 'data',
      operator: 'isNotNull',
      value: null,
    };
    expect(formatCondition(condition)).toBe('data is not null');
  });
});

describe('getOutgoingEdges', () => {
  const edges: FlowEdge[] = [
    createEdge('node1', 'node2', { id: 'e1' }),
    createEdge('node1', 'node3', { id: 'e2' }),
    createEdge('node2', 'node3', { id: 'e3' }),
  ];

  it('should return edges from node', () => {
    const outgoing = getOutgoingEdges(edges, 'node1');

    expect(outgoing).toHaveLength(2);
    expect(outgoing.map((e) => e.id)).toContain('e1');
    expect(outgoing.map((e) => e.id)).toContain('e2');
  });

  it('should return empty for node with no outgoing edges', () => {
    const outgoing = getOutgoingEdges(edges, 'node3');
    expect(outgoing).toHaveLength(0);
  });
});

describe('getIncomingEdges', () => {
  const edges: FlowEdge[] = [
    createEdge('node1', 'node2', { id: 'e1' }),
    createEdge('node1', 'node3', { id: 'e2' }),
    createEdge('node2', 'node3', { id: 'e3' }),
  ];

  it('should return edges to node', () => {
    const incoming = getIncomingEdges(edges, 'node3');

    expect(incoming).toHaveLength(2);
    expect(incoming.map((e) => e.id)).toContain('e2');
    expect(incoming.map((e) => e.id)).toContain('e3');
  });

  it('should return empty for node with no incoming edges', () => {
    const incoming = getIncomingEdges(edges, 'node1');
    expect(incoming).toHaveLength(0);
  });
});

describe('getEdgesBetween', () => {
  const edges: FlowEdge[] = [
    createEdge('node1', 'node2', { id: 'e1' }),
    createEdge('node1', 'node2', { id: 'e2' }),
    createEdge('node1', 'node3', { id: 'e3' }),
  ];

  it('should return edges between nodes', () => {
    const between = getEdgesBetween(edges, 'node1', 'node2');

    expect(between).toHaveLength(2);
  });

  it('should return empty if no edges between nodes', () => {
    const between = getEdgesBetween(edges, 'node2', 'node3');
    expect(between).toHaveLength(0);
  });
});

describe('areNodesConnected', () => {
  const edges: FlowEdge[] = [
    createEdge('node1', 'node2'),
    createEdge('node2', 'node3'),
  ];

  it('should return true for connected nodes', () => {
    expect(areNodesConnected(edges, 'node1', 'node2')).toBe(true);
  });

  it('should return false for unconnected nodes', () => {
    expect(areNodesConnected(edges, 'node1', 'node3')).toBe(false);
  });

  it('should check direction', () => {
    expect(areNodesConnected(edges, 'node2', 'node1')).toBe(false);
  });
});

describe('removeNodeEdges', () => {
  it('should remove all edges connected to node', () => {
    const edges: FlowEdge[] = [
      createEdge('node1', 'node2', { id: 'e1' }),
      createEdge('node2', 'node3', { id: 'e2' }),
      createEdge('node3', 'node4', { id: 'e3' }),
    ];

    const remaining = removeNodeEdges(edges, 'node2');

    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('e3');
  });
});

describe('EDGE_TYPE_LABELS', () => {
  it('should have labels for all types', () => {
    expect(EDGE_TYPE_LABELS.default).toBe('Default');
    expect(EDGE_TYPE_LABELS.success).toBe('Success');
    expect(EDGE_TYPE_LABELS.failure).toBe('Failure');
    expect(EDGE_TYPE_LABELS.conditional).toBe('Conditional');
  });
});
