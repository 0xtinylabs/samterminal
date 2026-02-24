/**
 * Flow Execution Integration Tests
 * Tests for end-to-end flow execution, node order, and error handling
 */


import { FlowEngineImpl, createFlowEngine } from '../flow/engine.js';
import { ServiceRegistryImpl, createServiceRegistry } from '../runtime/executor.js';
import { HooksService, createHooksService } from '../hooks/service.js';
import type { SamTerminalCore } from '../interfaces/core.interface.js';
import type { Flow, FlowNode, FlowEdge, ActionNodeData, ConditionNodeData, DelayNodeData, LoopNodeData } from '../types/index.js';
import type { Action, ActionContext, ActionResult } from '../interfaces/action.interface.js';
import { uuid } from '../utils/id.js';

/**
 * Create a test action
 */
function createTestAction(
  name: string,
  handler: (ctx: ActionContext) => Promise<ActionResult> = async () => ({ success: true }),
): Action {
  return {
    name,
    description: `Test action: ${name}`,
    execute: handler,
  };
}

/**
 * Create a flow node
 */
function createNode(
  type: FlowNode['type'],
  name: string,
  data: FlowNode['data'],
  position = { x: 0, y: 0 },
): FlowNode {
  return {
    id: uuid(),
    type,
    name,
    position,
    data,
  };
}

/**
 * Create an edge between nodes
 */
function createEdge(
  source: string,
  target: string,
  options: Partial<FlowEdge> = {},
): FlowEdge {
  return {
    id: uuid(),
    source,
    target,
    ...options,
  };
}

describe('Flow Execution Integration Tests', () => {
  let flowEngine: FlowEngineImpl;
  let services: ServiceRegistryImpl;
  let hooks: HooksService;
  let mockCore: SamTerminalCore;

  beforeEach(() => {
    flowEngine = createFlowEngine();
    services = createServiceRegistry();
    hooks = createHooksService();

    mockCore = {
      config: {},
      services,
      hooks,
      runtime: {
        executeAction: async (name: string, input: unknown) => {
          const action = services.getAction(name);
          if (!action) {
            return { success: false, error: `Action not found: ${name}` };
          }
          return action.execute({
            pluginName: name.split(':')[0] ?? 'test',
            agentId: uuid(),
            input,
          });
        },
        getData: jest.fn(),
      },
      flow: flowEngine,
    } as unknown as SamTerminalCore;

    flowEngine.setCore(mockCore);
  });

  afterEach(() => {
    flowEngine.clear();
    services.clear();
    hooks.clear();
  });

  describe('End-to-End Flow Execution', () => {
    it('should execute a simple linear flow', async () => {
      const executionLog: string[] = [];

      // Register actions
      services.registerAction(
        createTestAction('test:step1', async () => {
          executionLog.push('step1');
          return { success: true, data: { step: 1 } };
        }),
        'test',
      );

      services.registerAction(
        createTestAction('test:step2', async () => {
          executionLog.push('step2');
          return { success: true, data: { step: 2 } };
        }),
        'test',
      );

      // Create trigger node
      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });

      // Create action nodes
      const actionNode1 = createNode('action', 'Step 1', {
        pluginName: 'test',
        actionName: 'step1',
        params: {},
      } as ActionNodeData);

      const actionNode2 = createNode('action', 'Step 2', {
        pluginName: 'test',
        actionName: 'step2',
        params: {},
      } as ActionNodeData);

      // Create output node
      const outputNode = createNode('output', 'End', {});

      // Create flow
      const flow = flowEngine.create({
        name: 'Simple Linear Flow',
        nodes: [triggerNode, actionNode1, actionNode2, outputNode],
        edges: [
          createEdge(triggerNode.id, actionNode1.id),
          createEdge(actionNode1.id, actionNode2.id),
          createEdge(actionNode2.id, outputNode.id),
        ],
      });

      // Execute flow
      const context = await flowEngine.execute(flow.id);

      expect(context.status).toBe('completed');
      expect(executionLog).toEqual(['step1', 'step2']);
      expect(Object.keys(context.nodeResults).length).toBe(4);
    });

    it('should pass input variables through the flow', async () => {
      let receivedInput: unknown;

      services.registerAction(
        createTestAction('test:process', async (ctx) => {
          receivedInput = ctx.input;
          return { success: true, data: { processed: true } };
        }),
        'test',
      );

      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const actionNode = createNode('action', 'Process', {
        pluginName: 'test',
        actionName: 'process',
        params: { value: '{{inputValue}}' },
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'Input Flow',
        nodes: [triggerNode, actionNode],
        edges: [createEdge(triggerNode.id, actionNode.id)],
      });

      await flowEngine.execute(flow.id, { inputValue: 'test-data' });

      expect(receivedInput).toEqual({ value: 'test-data' });
    });

    it('should handle flow with multiple branches', async () => {
      const executionLog: string[] = [];

      services.registerAction(
        createTestAction('test:branch1', async () => {
          executionLog.push('branch1');
          return { success: true };
        }),
        'test',
      );

      services.registerAction(
        createTestAction('test:branch2', async () => {
          executionLog.push('branch2');
          return { success: true };
        }),
        'test',
      );

      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const conditionNode = createNode('condition', 'Check', {
        conditions: [{ field: 'flag', operator: 'eq', value: true }],
        operator: 'and',
      } as ConditionNodeData);

      const branch1 = createNode('action', 'Branch 1', {
        pluginName: 'test',
        actionName: 'branch1',
        params: {},
      } as ActionNodeData);

      const branch2 = createNode('action', 'Branch 2', {
        pluginName: 'test',
        actionName: 'branch2',
        params: {},
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'Branching Flow',
        nodes: [triggerNode, conditionNode, branch1, branch2],
        edges: [
          createEdge(triggerNode.id, conditionNode.id),
          createEdge(conditionNode.id, branch1.id, { sourceHandle: 'true' }),
          createEdge(conditionNode.id, branch2.id, { sourceHandle: 'false' }),
        ],
      });

      // Execute with flag = true
      const context1 = await flowEngine.execute(flow.id, { flag: true });
      expect(executionLog).toEqual(['branch1']);
      expect(context1.status).toBe('completed');

      // Reset and execute with flag = false
      executionLog.length = 0;
      const context2 = await flowEngine.execute(flow.id, { flag: false });
      expect(executionLog).toEqual(['branch2']);
      expect(context2.status).toBe('completed');
    });

    it('should execute flow with delay nodes', async () => {
      jest.useFakeTimers();

      const timestamps: number[] = [];

      services.registerAction(
        createTestAction('test:record', async () => {
          timestamps.push(Date.now());
          return { success: true };
        }),
        'test',
      );

      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const actionBefore = createNode('action', 'Before', {
        pluginName: 'test',
        actionName: 'record',
        params: {},
      } as ActionNodeData);

      const delayNode = createNode('delay', 'Wait', {
        delayType: 'fixed',
        delayMs: 1000,
      } as DelayNodeData);

      const actionAfter = createNode('action', 'After', {
        pluginName: 'test',
        actionName: 'record',
        params: {},
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'Delay Flow',
        nodes: [triggerNode, actionBefore, delayNode, actionAfter],
        edges: [
          createEdge(triggerNode.id, actionBefore.id),
          createEdge(actionBefore.id, delayNode.id),
          createEdge(delayNode.id, actionAfter.id),
        ],
      });

      const executePromise = flowEngine.execute(flow.id);

      // Advance timers
      await jest.advanceTimersByTimeAsync(1000);

      const context = await executePromise;

      expect(context.status).toBe('completed');
      expect(timestamps.length).toBe(2);

      jest.useRealTimers();
    });
  });

  describe('Node Execution Order', () => {
    it('should execute nodes in correct topological order', async () => {
      const executionOrder: string[] = [];

      for (let i = 1; i <= 5; i++) {
        services.registerAction(
          createTestAction(`test:node${i}`, async () => {
            executionOrder.push(`node${i}`);
            return { success: true };
          }),
          'test',
        );
      }

      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const nodes: FlowNode[] = [triggerNode];
      const edges: FlowEdge[] = [];

      // Create chain: trigger -> node1 -> node2 -> node3 -> node4 -> node5
      let prevId = triggerNode.id;
      for (let i = 1; i <= 5; i++) {
        const node = createNode('action', `Node ${i}`, {
          pluginName: 'test',
          actionName: `node${i}`,
          params: {},
        } as ActionNodeData);
        nodes.push(node);
        edges.push(createEdge(prevId, node.id));
        prevId = node.id;
      }

      const flow = flowEngine.create({
        name: 'Ordered Flow',
        nodes,
        edges,
      });

      await flowEngine.execute(flow.id);

      expect(executionOrder).toEqual(['node1', 'node2', 'node3', 'node4', 'node5']);
    });

    it('should execute parallel branches correctly', async () => {
      const executionOrder: string[] = [];

      services.registerAction(
        createTestAction('test:a', async () => {
          executionOrder.push('A');
          return { success: true };
        }),
        'test',
      );

      services.registerAction(
        createTestAction('test:b', async () => {
          executionOrder.push('B');
          return { success: true };
        }),
        'test',
      );

      services.registerAction(
        createTestAction('test:merge', async () => {
          executionOrder.push('merge');
          return { success: true };
        }),
        'test',
      );

      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const nodeA = createNode('action', 'A', {
        pluginName: 'test',
        actionName: 'a',
        params: {},
      } as ActionNodeData);

      const nodeB = createNode('action', 'B', {
        pluginName: 'test',
        actionName: 'b',
        params: {},
      } as ActionNodeData);

      const mergeNode = createNode('action', 'Merge', {
        pluginName: 'test',
        actionName: 'merge',
        params: {},
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'Parallel Flow',
        nodes: [triggerNode, nodeA, nodeB, mergeNode],
        edges: [
          createEdge(triggerNode.id, nodeA.id),
          createEdge(triggerNode.id, nodeB.id),
          createEdge(nodeA.id, mergeNode.id),
        ],
      });

      await flowEngine.execute(flow.id);

      // Both A and B should execute, merge after A
      expect(executionOrder).toContain('A');
      expect(executionOrder).toContain('B');
      expect(executionOrder.indexOf('merge')).toBeGreaterThan(executionOrder.indexOf('A'));
    });

    it('should respect condition node outputs', async () => {
      const executionLog: string[] = [];

      services.registerAction(
        createTestAction('test:true-branch', async () => {
          executionLog.push('true');
          return { success: true };
        }),
        'test',
      );

      services.registerAction(
        createTestAction('test:false-branch', async () => {
          executionLog.push('false');
          return { success: true };
        }),
        'test',
      );

      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const conditionNode = createNode('condition', 'Check Value', {
        conditions: [{ field: 'value', operator: 'gt', value: 10 }],
        operator: 'and',
      } as ConditionNodeData);

      const trueNode = createNode('action', 'True Branch', {
        pluginName: 'test',
        actionName: 'true-branch',
        params: {},
      } as ActionNodeData);

      const falseNode = createNode('action', 'False Branch', {
        pluginName: 'test',
        actionName: 'false-branch',
        params: {},
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'Condition Test',
        nodes: [triggerNode, conditionNode, trueNode, falseNode],
        edges: [
          createEdge(triggerNode.id, conditionNode.id),
          createEdge(conditionNode.id, trueNode.id, { sourceHandle: 'true' }),
          createEdge(conditionNode.id, falseNode.id, { sourceHandle: 'false' }),
        ],
      });

      // Test with value > 10
      await flowEngine.execute(flow.id, { value: 15 });
      expect(executionLog).toEqual(['true']);

      // Test with value <= 10
      executionLog.length = 0;
      await flowEngine.execute(flow.id, { value: 5 });
      expect(executionLog).toEqual(['false']);
    });

    it('should handle loop nodes with count', async () => {
      let counter = 0;

      services.registerAction(
        createTestAction('test:increment', async () => {
          counter++;
          return { success: true, data: { count: counter } };
        }),
        'test',
      );

      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const loopNode = createNode('loop', 'Loop 5 times', {
        loopType: 'count',
        config: { count: 5 },
      } as LoopNodeData);

      const flow = flowEngine.create({
        name: 'Loop Test',
        nodes: [triggerNode, loopNode],
        edges: [createEdge(triggerNode.id, loopNode.id)],
      });

      const context = await flowEngine.execute(flow.id);

      expect(context.status).toBe('completed');
      expect(context.variables['_loopIndex']).toBe(4); // Last index
    });

    it('should handle nested variable access in conditions', async () => {
      const executionLog: string[] = [];

      services.registerAction(
        createTestAction('test:log', async () => {
          executionLog.push('executed');
          return { success: true };
        }),
        'test',
      );

      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const conditionNode = createNode('condition', 'Check Nested', {
        conditions: [{ field: 'user.profile.age', operator: 'gte', value: 18 }],
        operator: 'and',
      } as ConditionNodeData);

      const actionNode = createNode('action', 'Log', {
        pluginName: 'test',
        actionName: 'log',
        params: {},
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'Nested Variable Test',
        nodes: [triggerNode, conditionNode, actionNode],
        edges: [
          createEdge(triggerNode.id, conditionNode.id),
          createEdge(conditionNode.id, actionNode.id, { sourceHandle: 'true' }),
        ],
      });

      await flowEngine.execute(flow.id, {
        user: { profile: { age: 25 } },
      });

      expect(executionLog).toEqual(['executed']);
    });
  });

  describe('Error Handling in Flows', () => {
    it('should mark flow as failed when action throws', async () => {
      services.registerAction(
        createTestAction('test:fail', async () => {
          throw new Error('Action failed');
        }),
        'test',
      );

      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const actionNode = createNode('action', 'Failing Action', {
        pluginName: 'test',
        actionName: 'fail',
        params: {},
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'Failing Flow',
        nodes: [triggerNode, actionNode],
        edges: [createEdge(triggerNode.id, actionNode.id)],
      });

      await expect(flowEngine.execute(flow.id)).rejects.toThrow('Action failed');
    });

    it('should execute error handler on failure', async () => {
      let errorHandled = false;

      services.registerAction(
        createTestAction('test:fail', async () => {
          throw new Error('Intentional failure');
        }),
        'test',
      );

      services.registerAction(
        createTestAction('test:handle-error', async (ctx) => {
          errorHandled = true;
          return { success: true, data: { error: ctx.input } };
        }),
        'test',
      );

      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const failingNode = createNode('action', 'Fail', {
        pluginName: 'test',
        actionName: 'fail',
        params: {},
      } as ActionNodeData);

      const errorHandler = createNode('action', 'Handle Error', {
        pluginName: 'test',
        actionName: 'handle-error',
        params: {},
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'Error Handling Flow',
        nodes: [triggerNode, failingNode, errorHandler],
        edges: [
          createEdge(triggerNode.id, failingNode.id),
          createEdge(failingNode.id, errorHandler.id, { sourceHandle: 'error', type: 'failure' }),
        ],
      });

      const context = await flowEngine.execute(flow.id);

      expect(context.status).toBe('completed');
      expect(errorHandled).toBe(true);
      expect(context.variables['_error']).toBeDefined();
    });

    it('should record error details in node results', async () => {
      services.registerAction(
        createTestAction('test:error', async () => {
          throw new Error('Specific error message');
        }),
        'test',
      );

      services.registerAction(
        createTestAction('test:recover', async () => ({ success: true })),
        'test',
      );

      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const errorNode = createNode('action', 'Error Node', {
        pluginName: 'test',
        actionName: 'error',
        params: {},
      } as ActionNodeData);

      const recoverNode = createNode('action', 'Recover', {
        pluginName: 'test',
        actionName: 'recover',
        params: {},
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'Error Details Flow',
        nodes: [triggerNode, errorNode, recoverNode],
        edges: [
          createEdge(triggerNode.id, errorNode.id),
          createEdge(errorNode.id, recoverNode.id, { type: 'failure' }),
        ],
      });

      const context = await flowEngine.execute(flow.id);

      const errorResult = context.nodeResults[errorNode.id];
      expect(errorResult.status).toBe('failed');
      expect(errorResult.error).toContain('Specific error message');
    });

    it('should reject invalid flow', async () => {
      // Flow with no trigger
      const actionNode = createNode('action', 'Orphan', {
        pluginName: 'test',
        actionName: 'orphan',
        params: {},
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'Invalid Flow',
        nodes: [actionNode],
        edges: [],
      });

      await expect(flowEngine.execute(flow.id)).rejects.toThrow();
    });

    it('should handle action not found error gracefully', async () => {
      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const actionNode = createNode('action', 'Missing Action', {
        pluginName: 'test',
        actionName: 'nonexistent',
        params: {},
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'Missing Action Flow',
        nodes: [triggerNode, actionNode],
        edges: [createEdge(triggerNode.id, actionNode.id)],
      });

      // Flow completes but action returns success: false
      const context = await flowEngine.execute(flow.id);

      expect(context.status).toBe('completed');
      const actionResult = context.nodeResults[actionNode.id];
      expect(actionResult.output).toMatchObject({ success: false });
      expect((actionResult.output as { error: string }).error).toContain('not found');
    });

    it('should allow flow cancellation', async () => {
      jest.useFakeTimers();

      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const delayNode = createNode('delay', 'Long Delay', {
        delayType: 'fixed',
        delayMs: 10000,
      } as DelayNodeData);

      const flow = flowEngine.create({
        name: 'Cancellable Flow',
        nodes: [triggerNode, delayNode],
        edges: [createEdge(triggerNode.id, delayNode.id)],
      });

      const executePromise = flowEngine.execute(flow.id);

      // Let execution start
      await jest.advanceTimersByTimeAsync(100);

      // Get execution and cancel
      const executions = Array.from((flowEngine as any).executions.values());
      if (executions.length > 0) {
        const executionId = (executions[0] as any).executionId;
        const cancelled = flowEngine.cancel(executionId);
        expect(cancelled).toBe(true);
      }

      jest.useRealTimers();
    });
  });

  describe('Flow Validation', () => {
    it('should validate flow structure', () => {
      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const actionNode = createNode('action', 'Action', {
        pluginName: 'test',
        actionName: 'action',
        params: {},
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'Valid Flow',
        nodes: [triggerNode, actionNode],
        edges: [createEdge(triggerNode.id, actionNode.id)],
      });

      const validation = flowEngine.validate(flow);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should warn about flow without trigger', () => {
      const actionNode = createNode('action', 'Action', {
        pluginName: 'test',
        actionName: 'action',
        params: {},
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'No Trigger Flow',
        nodes: [actionNode],
        edges: [],
      });

      const validation = flowEngine.validate(flow);
      // No trigger is a warning, not an error
      expect(validation.warnings.some((e) => e.toLowerCase().includes('trigger') || e.toLowerCase().includes('no trigger'))).toBe(true);
    });

    it('should detect orphan nodes', () => {
      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const connectedNode = createNode('action', 'Connected', {
        pluginName: 'test',
        actionName: 'connected',
        params: {},
      } as ActionNodeData);

      const orphanNode = createNode('action', 'Orphan', {
        pluginName: 'test',
        actionName: 'orphan',
        params: {},
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'Orphan Node Flow',
        nodes: [triggerNode, connectedNode, orphanNode],
        edges: [createEdge(triggerNode.id, connectedNode.id)],
      });

      const validation = flowEngine.validate(flow);
      expect(validation.warnings.some((e) => e.toLowerCase().includes('disconnected') || e.toLowerCase().includes('orphan') || e.toLowerCase().includes('unreachable'))).toBe(true);
    });
  });

  describe('Flow State Management', () => {
    it('should track execution state', async () => {
      services.registerAction(
        createTestAction('test:noop', async () => ({ success: true })),
        'test',
      );

      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const actionNode = createNode('action', 'Action', {
        pluginName: 'test',
        actionName: 'noop',
        params: {},
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'State Tracking Flow',
        nodes: [triggerNode, actionNode],
        edges: [createEdge(triggerNode.id, actionNode.id)],
      });

      const context = await flowEngine.execute(flow.id);

      expect(context.status).toBe('completed');
      expect(context.startedAt).toBeDefined();
      expect(context.nodeResults[triggerNode.id]).toBeDefined();
      expect(context.nodeResults[actionNode.id]).toBeDefined();
    });

    it('should store node execution durations', async () => {
      services.registerAction(
        createTestAction('test:slow', async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { success: true };
        }),
        'test',
      );

      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const actionNode = createNode('action', 'Slow Action', {
        pluginName: 'test',
        actionName: 'slow',
        params: {},
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'Duration Tracking Flow',
        nodes: [triggerNode, actionNode],
        edges: [createEdge(triggerNode.id, actionNode.id)],
      });

      const context = await flowEngine.execute(flow.id);

      const actionResult = context.nodeResults[actionNode.id];
      expect(actionResult.duration).toBeGreaterThanOrEqual(0);
      expect(actionResult.startedAt).toBeDefined();
      expect(actionResult.completedAt).toBeDefined();
    });

    it('should update variables during execution', async () => {
      services.registerAction(
        createTestAction('test:set', async (ctx) => {
          const { key, value } = ctx.input as { key: string; value: unknown };
          return { success: true, data: { [key]: value } };
        }),
        'test',
      );

      const triggerNode = createNode('trigger', 'Start', { triggerType: 'manual' });
      const actionNode = createNode('action', 'Set Value', {
        pluginName: 'test',
        actionName: 'set',
        params: { key: 'result', value: 42 },
      } as ActionNodeData);

      const flow = flowEngine.create({
        name: 'Variable Update Flow',
        nodes: [triggerNode, actionNode],
        edges: [createEdge(triggerNode.id, actionNode.id)],
      });

      const context = await flowEngine.execute(flow.id, { initial: 'value' });

      expect(context.variables['initial']).toBe('value');
      expect(context.variables['_lastOutput']).toBeDefined();
    });
  });
});
