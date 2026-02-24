/**
 * Flow Nodes tests
 */


import {
  createTriggerNode,
  createActionNode,
  createConditionNode,
  createLoopNode,
  createDelayNode,
  createSubflowNode,
  createOutputNode,
  cloneNode,
  getDefaultNodeData,
  getDefaultPorts,
  NODE_TYPE_LABELS,
  NODE_TYPE_ICONS,
} from './nodes.js';
import type {
  TriggerNodeData,
  ActionNodeData,
  ConditionNodeData,
  LoopNodeData,
  DelayNodeData,
  SubflowNodeData,
  OutputNodeData,
} from '../types/index.js';

describe('createTriggerNode', () => {
  it('should create trigger node with required properties', () => {
    const data: TriggerNodeData = { triggerType: 'manual', config: {} };
    const node = createTriggerNode({ name: 'Start' }, data);

    expect(node.type).toBe('trigger');
    expect(node.name).toBe('Start');
    expect(node.data).toEqual(data);
    expect(node.id).toBeDefined();
  });

  it('should use custom ID if provided', () => {
    const data: TriggerNodeData = { triggerType: 'manual', config: {} };
    const node = createTriggerNode({ id: 'custom-id', name: 'Start' }, data);

    expect(node.id).toBe('custom-id');
  });

  it('should use custom position if provided', () => {
    const data: TriggerNodeData = { triggerType: 'manual', config: {} };
    const node = createTriggerNode(
      { name: 'Start', position: { x: 100, y: 200 } },
      data
    );

    expect(node.position).toEqual({ x: 100, y: 200 });
  });

  it('should have output port', () => {
    const data: TriggerNodeData = { triggerType: 'manual', config: {} };
    const node = createTriggerNode({ name: 'Start' }, data);

    expect(node.outputs).toHaveLength(1);
    expect(node.outputs![0].id).toBe('output');
  });
});

describe('createActionNode', () => {
  it('should create action node', () => {
    const data: ActionNodeData = {
      pluginName: 'swap',
      actionName: 'execute',
      params: {},
    };
    const node = createActionNode({ name: 'Execute Swap' }, data);

    expect(node.type).toBe('action');
    expect(node.name).toBe('Execute Swap');
  });

  it('should have input and output ports', () => {
    const data: ActionNodeData = {
      pluginName: 'swap',
      actionName: 'execute',
      params: {},
    };
    const node = createActionNode({ name: 'Execute Swap' }, data);

    expect(node.inputs).toHaveLength(1);
    expect(node.outputs).toHaveLength(2);
    expect(node.outputs![0].id).toBe('output');
    expect(node.outputs![1].id).toBe('error');
  });
});

describe('createConditionNode', () => {
  it('should create condition node', () => {
    const data: ConditionNodeData = {
      conditions: [{ field: 'amount', operator: 'gt', value: 0 }],
      operator: 'and',
    };
    const node = createConditionNode({ name: 'Check Amount' }, data);

    expect(node.type).toBe('condition');
  });

  it('should have true and false outputs', () => {
    const data: ConditionNodeData = { conditions: [], operator: 'and' };
    const node = createConditionNode({ name: 'Check' }, data);

    expect(node.outputs).toHaveLength(2);
    expect(node.outputs![0].id).toBe('true');
    expect(node.outputs![1].id).toBe('false');
  });
});

describe('createLoopNode', () => {
  it('should create loop node', () => {
    const data: LoopNodeData = {
      loopType: 'count',
      config: { count: 10 },
    };
    const node = createLoopNode({ name: 'Loop 10 times' }, data);

    expect(node.type).toBe('loop');
  });

  it('should have iteration and complete outputs', () => {
    const data: LoopNodeData = { loopType: 'count', config: { count: 5 } };
    const node = createLoopNode({ name: 'Loop' }, data);

    expect(node.outputs).toHaveLength(2);
    expect(node.outputs![0].id).toBe('iteration');
    expect(node.outputs![1].id).toBe('complete');
  });
});

describe('createDelayNode', () => {
  it('should create delay node', () => {
    const data: DelayNodeData = { delayMs: 1000, delayType: 'fixed' };
    const node = createDelayNode({ name: 'Wait 1s' }, data);

    expect(node.type).toBe('delay');
    expect(node.data).toEqual(data);
  });

  it('should have single output', () => {
    const data: DelayNodeData = { delayMs: 1000, delayType: 'fixed' };
    const node = createDelayNode({ name: 'Wait' }, data);

    expect(node.outputs).toHaveLength(1);
    expect(node.outputs![0].id).toBe('output');
  });
});

describe('createSubflowNode', () => {
  it('should create subflow node', () => {
    const data: SubflowNodeData = { flowId: 'sub-flow-123' };
    const node = createSubflowNode({ name: 'Run Subflow' }, data);

    expect(node.type).toBe('subflow');
  });

  it('should have output and error ports', () => {
    const data: SubflowNodeData = { flowId: 'sub-flow-123' };
    const node = createSubflowNode({ name: 'Subflow' }, data);

    expect(node.outputs).toHaveLength(2);
    expect(node.outputs![0].id).toBe('output');
    expect(node.outputs![1].id).toBe('error');
  });
});

describe('createOutputNode', () => {
  it('should create output node', () => {
    const data: OutputNodeData = { outputType: 'return', config: {} };
    const node = createOutputNode({ name: 'Output' }, data);

    expect(node.type).toBe('output');
  });

  it('should have input but no output', () => {
    const data: OutputNodeData = { outputType: 'return', config: {} };
    const node = createOutputNode({ name: 'Output' }, data);

    expect(node.inputs).toHaveLength(1);
    expect(node.outputs).toBeUndefined();
  });
});

describe('cloneNode', () => {
  it('should create a copy with new ID', () => {
    const original = createTriggerNode(
      { id: 'original-id', name: 'Start' },
      { triggerType: 'manual', config: {} }
    );

    const cloned = cloneNode(original);

    expect(cloned.id).not.toBe(original.id);
    expect(cloned.name).toBe(original.name);
  });

  it('should offset position', () => {
    const original = createTriggerNode(
      { name: 'Start', position: { x: 100, y: 100 } },
      { triggerType: 'manual', config: {} }
    );

    const cloned = cloneNode(original);

    expect(cloned.position.x).toBe(150);
    expect(cloned.position.y).toBe(150);
  });

  it('should use custom offset', () => {
    const original = createTriggerNode(
      { name: 'Start', position: { x: 100, y: 100 } },
      { triggerType: 'manual', config: {} }
    );

    const cloned = cloneNode(original, { x: 100, y: 0 });

    expect(cloned.position.x).toBe(200);
    expect(cloned.position.y).toBe(100);
  });
});

describe('getDefaultNodeData', () => {
  it('should return default data for trigger', () => {
    const data = getDefaultNodeData('trigger');
    expect(data).toEqual({ triggerType: 'manual', config: {} });
  });

  it('should return default data for action', () => {
    const data = getDefaultNodeData('action');
    expect(data).toEqual({ pluginName: '', actionName: '', params: {} });
  });

  it('should return default data for condition', () => {
    const data = getDefaultNodeData('condition');
    expect(data).toEqual({ conditions: [], operator: 'and' });
  });

  it('should return default data for loop', () => {
    const data = getDefaultNodeData('loop');
    expect(data).toEqual({ loopType: 'count', config: { count: 10 } });
  });

  it('should return default data for delay', () => {
    const data = getDefaultNodeData('delay');
    expect(data).toEqual({ delayMs: 1000, delayType: 'fixed' });
  });

  it('should return default data for subflow', () => {
    const data = getDefaultNodeData('subflow');
    expect(data).toEqual({ flowId: '' });
  });

  it('should return default data for output', () => {
    const data = getDefaultNodeData('output');
    expect(data).toEqual({ outputType: 'return', config: {} });
  });

  it('should throw for unknown type', () => {
    expect(() => getDefaultNodeData('unknown' as any)).toThrow(
      'Unknown node type'
    );
  });
});

describe('getDefaultPorts', () => {
  it('should return ports for trigger (no input)', () => {
    const ports = getDefaultPorts('trigger');
    expect(ports.inputs).toHaveLength(0);
    expect(ports.outputs).toHaveLength(1);
  });

  it('should return ports for action', () => {
    const ports = getDefaultPorts('action');
    expect(ports.inputs).toHaveLength(1);
    expect(ports.outputs).toHaveLength(2);
  });

  it('should return ports for condition', () => {
    const ports = getDefaultPorts('condition');
    expect(ports.outputs).toHaveLength(2);
  });

  it('should return ports for output (no output)', () => {
    const ports = getDefaultPorts('output');
    expect(ports.inputs).toHaveLength(1);
    expect(ports.outputs).toHaveLength(0);
  });
});

describe('NODE_TYPE_LABELS', () => {
  it('should have labels for all types', () => {
    expect(NODE_TYPE_LABELS.trigger).toBe('Trigger');
    expect(NODE_TYPE_LABELS.action).toBe('Action');
    expect(NODE_TYPE_LABELS.condition).toBe('Condition');
    expect(NODE_TYPE_LABELS.loop).toBe('Loop');
    expect(NODE_TYPE_LABELS.delay).toBe('Delay');
    expect(NODE_TYPE_LABELS.subflow).toBe('Subflow');
    expect(NODE_TYPE_LABELS.output).toBe('Output');
  });
});

describe('NODE_TYPE_ICONS', () => {
  it('should have icons for all types', () => {
    expect(NODE_TYPE_ICONS.trigger).toBe('play');
    expect(NODE_TYPE_ICONS.action).toBe('bolt');
    expect(NODE_TYPE_ICONS.condition).toBe('git-branch');
    expect(NODE_TYPE_ICONS.loop).toBe('refresh');
    expect(NODE_TYPE_ICONS.delay).toBe('clock');
    expect(NODE_TYPE_ICONS.subflow).toBe('layers');
    expect(NODE_TYPE_ICONS.output).toBe('arrow-right');
  });
});
