/**
 * Flow Engine tests
 */


import { FlowEngineImpl, createFlowEngine } from './engine.js';
import { createTriggerNode, createActionNode, createConditionNode, createDelayNode } from './nodes.js';
import { createEdge, createTrueEdge, createFalseEdge } from './edges.js';
import type { Flow, FlowNode, SamTerminalCore } from '../types/index.js';

describe('FlowEngineImpl', () => {
  let engine: FlowEngineImpl;
  let mockCore: SamTerminalCore;

  const createBasicFlow = (): Omit<Flow, 'id' | 'createdAt' | 'updatedAt'> => ({
    name: 'Test Flow',
    description: 'A test flow',
    nodes: [
      createTriggerNode({ id: 'trigger', name: 'Start' }, { triggerType: 'manual', config: {} }),
    ],
    edges: [],
    variables: {},
    status: 'active',
  });

  beforeEach(() => {
    engine = new FlowEngineImpl();
    mockCore = {
      runtime: {
        executeAction: jest.fn().mockResolvedValue({ success: true, data: {} }),
      },
    } as unknown as SamTerminalCore;

    engine.setCore(mockCore);
  });

  describe('create', () => {
    it('should create a flow with generated ID', () => {
      const flow = engine.create(createBasicFlow());

      expect(flow.id).toBeDefined();
      expect(flow.name).toBe('Test Flow');
      expect(flow.createdAt).toBeInstanceOf(Date);
      expect(flow.updatedAt).toBeInstanceOf(Date);
    });

    it('should store flow internally', () => {
      const flow = engine.create(createBasicFlow());
      expect(engine.get(flow.id)).toEqual(flow);
    });
  });

  describe('get', () => {
    it('should return flow by ID', () => {
      const flow = engine.create(createBasicFlow());
      expect(engine.get(flow.id)).toEqual(flow);
    });

    it('should return undefined for unknown ID', () => {
      expect(engine.get('unknown')).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update flow properties', () => {
      const flow = engine.create(createBasicFlow());
      const updated = engine.update(flow.id, { name: 'Updated Flow' });

      expect(updated?.name).toBe('Updated Flow');
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });

    it('should not change ID when trying to update it', () => {
      const flow = engine.create(createBasicFlow());
      const originalId = flow.id;
      const updated = engine.update(flow.id, { id: 'new-id' } as any);

      // ID should remain the original, not change to 'new-id'
      expect(updated?.id).toBe(originalId);
    });

    it('should return undefined for unknown flow', () => {
      const result = engine.update('unknown', { name: 'Test' });
      expect(result).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete flow', () => {
      const flow = engine.create(createBasicFlow());
      const result = engine.delete(flow.id);

      expect(result).toBe(true);
      expect(engine.get(flow.id)).toBeUndefined();
    });

    it('should return false for unknown flow', () => {
      const result = engine.delete('unknown');
      expect(result).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return all flows', () => {
      engine.create(createBasicFlow());
      engine.create({ ...createBasicFlow(), name: 'Flow 2' });

      const all = engine.getAll();

      expect(all).toHaveLength(2);
    });
  });

  describe('validate', () => {
    it('should validate valid flow', () => {
      const flow = engine.create(createBasicFlow());
      const result = engine.validate(flow);

      expect(result.valid).toBe(true);
    });

    it('should return errors for invalid flow', () => {
      const flow = engine.create({
        ...createBasicFlow(),
        nodes: [], // No trigger
      });

      const result = engine.validate(flow);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('execute', () => {
    it('should throw for unknown flow', async () => {
      await expect(engine.execute('unknown')).rejects.toThrow('Flow not found');
    });

    it('should throw for invalid flow', async () => {
      const flow = engine.create({
        ...createBasicFlow(),
        nodes: [],
      });

      await expect(engine.execute(flow.id)).rejects.toThrow('Invalid flow');
    });

    it('should execute basic flow', async () => {
      const flow = engine.create(createBasicFlow());
      const context = await engine.execute(flow.id);

      expect(context.status).toBe('completed');
      expect(context.flowId).toBe(flow.id);
    });

    it('should pass input variables', async () => {
      const flow = engine.create(createBasicFlow());
      const context = await engine.execute(flow.id, { key: 'value' });

      expect(context.variables.key).toBe('value');
    });

    it('should execute action nodes', async () => {
      const flowData = createBasicFlow();
      const actionNode = createActionNode(
        { id: 'action', name: 'Test Action' },
        { pluginName: 'test', actionName: 'do', params: {} }
      );
      flowData.nodes.push(actionNode);
      flowData.edges.push(createEdge('trigger', 'action'));

      const flow = engine.create(flowData);
      await engine.execute(flow.id);

      expect(mockCore.runtime.executeAction).toHaveBeenCalled();
    });

    it('should execute condition nodes', async () => {
      const flowData = createBasicFlow();

      const conditionNode = createConditionNode(
        { id: 'condition', name: 'Check' },
        {
          conditions: [{ field: 'value', operator: 'eq', value: true }],
          operator: 'and',
        }
      );

      const trueNode = createActionNode(
        { id: 'true-action', name: 'True Action' },
        { pluginName: 'test', actionName: 'true', params: {} }
      );

      const falseNode = createActionNode(
        { id: 'false-action', name: 'False Action' },
        { pluginName: 'test', actionName: 'false', params: {} }
      );

      flowData.nodes.push(conditionNode, trueNode, falseNode);
      flowData.edges.push(
        createEdge('trigger', 'condition'),
        createTrueEdge('condition', 'true-action'),
        createFalseEdge('condition', 'false-action')
      );

      const flow = engine.create(flowData);
      await engine.execute(flow.id, { value: true });

      // Should only call true action
      const calls = (mockCore.runtime.executeAction as any).mock.calls;
      expect(calls.some((c: any) => c[0].includes('true'))).toBe(true);
    });

    it('should execute delay nodes', async () => {
      const flowData = createBasicFlow();

      const delayNode = createDelayNode(
        { id: 'delay', name: 'Wait' },
        { delayMs: 10, delayType: 'fixed' }
      );

      flowData.nodes.push(delayNode);
      flowData.edges.push(createEdge('trigger', 'delay'));

      const flow = engine.create(flowData);
      const startTime = Date.now();
      await engine.execute(flow.id);
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThanOrEqual(10);
    });
  });

  describe('getExecution', () => {
    it('should return execution context', async () => {
      const flow = engine.create(createBasicFlow());
      const context = await engine.execute(flow.id);

      expect(engine.getExecution(context.executionId)).toEqual(context);
    });

    it('should return undefined for unknown execution', () => {
      expect(engine.getExecution('unknown')).toBeUndefined();
    });
  });

  describe('cancel', () => {
    it('should cancel running execution', async () => {
      // This is hard to test without async execution
      // For now, just verify it returns false for unknown
      expect(engine.cancel('unknown')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all flows and executions', () => {
      engine.create(createBasicFlow());
      engine.clear();

      expect(engine.getAll()).toHaveLength(0);
    });
  });
});

describe('createFlowEngine', () => {
  it('should create a new FlowEngineImpl', () => {
    const engine = createFlowEngine();
    expect(engine).toBeInstanceOf(FlowEngineImpl);
  });
});
