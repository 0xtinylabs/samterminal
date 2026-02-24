/**
 * Flow Engine
 * Executes flows and manages execution state
 */

import type { FlowEngine as IFlowEngine } from '../interfaces/core.interface.js';
import type { SamTerminalCore } from '../interfaces/core.interface.js';
import type {
  Flow,
  FlowNode,
  FlowEdge,
  FlowExecutionContext,
  FlowExecutionStatus,
  NodeExecutionResult,
  UUID,
  ActionNodeData,
  ConditionNodeData,
  DelayNodeData,
  LoopNodeData,
} from '../types/index.js';
import { createLogger } from '../utils/logger.js';
import { uuid } from '../utils/id.js';
import { sleep } from '../utils/retry.js';
import { validateFlow, getTopologicalOrder } from './validation.js';
import { getOutgoingEdges } from './edges.js';

const logger = createLogger({ prefix: 'FlowEngine' });

/**
 * Type guards for flow node data
 */
function isActionNodeData(data: unknown): data is ActionNodeData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'pluginName' in data &&
    'actionName' in data &&
    typeof (data as ActionNodeData).pluginName === 'string' &&
    typeof (data as ActionNodeData).actionName === 'string'
  );
}

function isConditionNodeData(data: unknown): data is ConditionNodeData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'conditions' in data &&
    Array.isArray((data as ConditionNodeData).conditions)
  );
}

function isDelayNodeData(data: unknown): data is DelayNodeData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'delayMs' in data &&
    typeof (data as DelayNodeData).delayMs === 'number'
  );
}

function isLoopNodeData(data: unknown): data is LoopNodeData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'loopType' in data &&
    typeof (data as LoopNodeData).loopType === 'string'
  );
}

/**
 * Flow Engine Implementation
 */
export class FlowEngineImpl implements IFlowEngine {
  private flows: Map<UUID, Flow> = new Map();
  private executions: Map<UUID, FlowExecutionContext> = new Map();
  private abortControllers: Map<UUID, AbortController> = new Map();
  private core: SamTerminalCore | null = null;

  /**
   * Set core reference
   */
  setCore(core: SamTerminalCore): void {
    this.core = core;
  }

  /**
   * Create a new flow
   */
  create(flowData: Omit<Flow, 'id' | 'createdAt' | 'updatedAt'>): Flow {
    const flow: Flow = {
      ...flowData,
      id: uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.flows.set(flow.id, flow);
    logger.info(`Flow created: ${flow.name}`, { id: flow.id });

    return flow;
  }

  /**
   * Get a flow by ID
   */
  get(flowId: UUID): Flow | undefined {
    return this.flows.get(flowId);
  }

  /**
   * Update a flow
   */
  update(flowId: UUID, updates: Partial<Flow>): Flow | undefined {
    const flow = this.flows.get(flowId);
    if (!flow) {
      return undefined;
    }

    const updatedFlow: Flow = {
      ...flow,
      ...updates,
      id: flowId, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    this.flows.set(flowId, updatedFlow);
    logger.info(`Flow updated: ${updatedFlow.name}`, { id: flowId });

    return updatedFlow;
  }

  /**
   * Delete a flow
   */
  delete(flowId: UUID): boolean {
    const deleted = this.flows.delete(flowId);
    if (deleted) {
      logger.info(`Flow deleted`, { id: flowId });
    }
    return deleted;
  }

  /**
   * Get all flows
   */
  getAll(): Flow[] {
    return Array.from(this.flows.values());
  }

  /**
   * Validate a flow
   */
  validate(flow: Flow): { valid: boolean; errors: string[]; warnings: string[] } {
    const result = validateFlow(flow);
    return {
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
    };
  }

  /**
   * Execute a flow
   */
  async execute(
    flowId: UUID,
    input?: Record<string, unknown>,
  ): Promise<FlowExecutionContext> {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`Flow not found: ${flowId}`);
    }

    // Validate before execution
    const validation = this.validate(flow);
    if (!validation.valid) {
      throw new Error(`Invalid flow: ${validation.errors.join(', ')}`);
    }

    // Create execution context
    const executionId = uuid();
    const context: FlowExecutionContext = {
      flowId,
      executionId,
      variables: { ...input },
      nodeResults: {},
      startedAt: new Date(),
      status: 'running',
    };

    this.executions.set(executionId, context);

    const abortController = new AbortController();
    this.abortControllers.set(executionId, abortController);

    logger.info(`Flow execution started`, { flowId, executionId });

    try {
      // Find trigger node
      const triggerNode = flow.nodes.find((n) => n.type === 'trigger');
      if (!triggerNode) {
        throw new Error('Flow has no trigger node');
      }

      // Execute from trigger
      await this.executeNode(flow, triggerNode, context);

      context.status = 'completed';
      logger.info(`Flow execution completed`, { flowId, executionId });
    } catch (error) {
      context.status = 'failed';
      logger.error(`Flow execution failed`, error as Error, { flowId, executionId });
      throw error;
    } finally {
      this.abortControllers.delete(executionId);
    }

    return context;
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    flow: Flow,
    node: FlowNode,
    context: FlowExecutionContext,
  ): Promise<void> {
    // Check for cancellation
    if (context.status === 'cancelled') {
      return;
    }

    context.currentNodeId = node.id;

    const result: NodeExecutionResult = {
      nodeId: node.id,
      status: 'running',
      startedAt: new Date(),
    };

    context.nodeResults[node.id] = result;

    logger.debug(`Executing node: ${node.name}`, { type: node.type, id: node.id });

    try {
      const output = await this.executeNodeByType(node, context);

      result.output = output;
      result.status = 'completed';
      result.completedAt = new Date();
      result.duration = result.completedAt.getTime() - result.startedAt!.getTime();

      // Loop nodes handle their own child execution per iteration
      if (node.type !== 'loop') {
        await this.executeNextNodes(flow, node, context, output);
      }
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : String(error);
      result.completedAt = new Date();
      result.duration = result.completedAt.getTime() - result.startedAt!.getTime();

      // Check for error handling edges
      const errorEdges = getOutgoingEdges(flow.edges, node.id).filter(
        (e) => e.sourceHandle === 'error' || e.type === 'failure',
      );

      if (errorEdges.length > 0) {
        // Execute error handlers
        for (const edge of errorEdges) {
          const targetNode = flow.nodes.find((n) => n.id === edge.target);
          if (targetNode) {
            context.variables['_error'] = {
              message: result.error,
              nodeId: node.id,
              nodeName: node.name,
            };
            await this.executeNode(flow, targetNode, context);
          }
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Execute node based on its type
   */
  private async executeNodeByType(
    node: FlowNode,
    context: FlowExecutionContext,
  ): Promise<unknown> {
    switch (node.type) {
      case 'trigger':
        return context.variables;

      case 'action':
        return this.executeActionNode(node, context);

      case 'condition':
        return this.executeConditionNode(node, context);

      case 'delay':
        return this.executeDelayNode(node, context);

      case 'loop':
        return this.executeLoopNode(node, context);

      case 'output':
        return context.variables['_lastOutput'];

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * Execute action node
   */
  private async executeActionNode(
    node: FlowNode,
    context: FlowExecutionContext,
  ): Promise<unknown> {
    if (!this.core) {
      throw new Error('Core not initialized');
    }

    if (!isActionNodeData(node.data)) {
      throw new Error(`Invalid action node data for node: ${node.id}`);
    }
    const data = node.data;
    const actionName = `${data.pluginName}:${data.actionName}`;

    // Resolve parameters from context
    const params = this.resolveParams(data.params ?? {}, context.variables);

    const result = await this.core.runtime.executeAction(actionName, params);
    context.variables['_lastOutput'] = result;

    return result;
  }

  /**
   * Execute condition node
   */
  private async executeConditionNode(
    node: FlowNode,
    context: FlowExecutionContext,
  ): Promise<boolean> {
    if (!isConditionNodeData(node.data)) {
      throw new Error(`Invalid condition node data for node: ${node.id}`);
    }
    const data = node.data;

    // Evaluate conditions
    let result: boolean;

    if (data.conditions.length === 0) {
      result = true;
    } else {
      const results = data.conditions.map((condition) => {
        const fieldValue = this.getValueFromPath(context.variables, condition.field);
        return this.evaluateCondition(condition.operator, fieldValue, condition.value);
      });

      if (data.operator === 'and') {
        result = results.every((r) => r);
      } else {
        result = results.some((r) => r);
      }
    }

    context.variables['_conditionResult'] = result;
    return result;
  }

  /**
   * Execute delay node
   */
  private async executeDelayNode(
    node: FlowNode,
    context: FlowExecutionContext,
  ): Promise<void> {
    if (!isDelayNodeData(node.data)) {
      throw new Error(`Invalid delay node data for node: ${node.id}`);
    }
    const data = node.data;

    let delayMs = data.delayMs;
    if (data.delayType === 'random' && data.maxDelayMs) {
      delayMs = Math.floor(Math.random() * (data.maxDelayMs - delayMs + 1)) + delayMs;
    }

    logger.debug(`Delaying for ${delayMs}ms`);
    await sleep(delayMs);
  }

  /**
   * Execute loop node
   */
  private async executeLoopNode(
    node: FlowNode,
    context: FlowExecutionContext,
  ): Promise<unknown[]> {
    if (!isLoopNodeData(node.data)) {
      throw new Error(`Invalid loop node data for node: ${node.id}`);
    }
    const data = node.data;
    const results: unknown[] = [];

    // We need the flow reference to execute child nodes in each iteration
    // The flow is passed through context
    const flow = this.flows.get(context.flowId);

    switch (data.loopType) {
      case 'count': {
        const count = data.config.count ?? 0;
        for (let i = 0; i < count; i++) {
          context.variables['_loopIndex'] = i;
          results.push(i);
          if (flow) {
            await this.executeNextNodes(flow, node, context, i);
          }
        }
        break;
      }

      case 'forEach': {
        const items = data.config.items
          ? this.getValueFromPath(context.variables, data.config.items)
          : [];

        if (Array.isArray(items)) {
          for (let i = 0; i < items.length; i++) {
            context.variables['_loopIndex'] = i;
            context.variables['_loopItem'] = items[i];
            results.push(items[i]);
            if (flow) {
              await this.executeNextNodes(flow, node, context, items[i]);
            }
          }
        }
        break;
      }

      case 'while': {
        // Prevent infinite loops
        const maxIterations = data.config?.maxIterations ?? 1000;
        let iterations = 0;

        while (iterations < maxIterations) {
          if (data.config.condition) {
            const conditionMet = this.evaluateCondition(
              data.config.condition.operator,
              this.getValueFromPath(context.variables, data.config.condition.field),
              data.config.condition.value,
            );

            if (!conditionMet) break;
          }

          context.variables['_loopIndex'] = iterations;
          results.push(iterations);
          if (flow) {
            await this.executeNextNodes(flow, node, context, iterations);
          }
          iterations++;
        }
        break;
      }
    }

    return results;
  }

  /**
   * Execute next nodes based on edges
   */
  private async executeNextNodes(
    flow: Flow,
    currentNode: FlowNode,
    context: FlowExecutionContext,
    output: unknown,
  ): Promise<void> {
    const edges = getOutgoingEdges(flow.edges, currentNode.id);

    // Filter edges based on conditions
    const edgesToFollow = edges.filter((edge) => {
      // Skip error edges on success
      if (edge.sourceHandle === 'error' || edge.type === 'failure') {
        return false;
      }

      // For condition nodes, follow true/false edges
      if (currentNode.type === 'condition') {
        const conditionResult = context.variables['_conditionResult'];
        if (edge.sourceHandle === 'true') return conditionResult === true;
        if (edge.sourceHandle === 'false') return conditionResult === false;
      }

      // Check conditional edges
      if (edge.condition) {
        const fieldValue = this.getValueFromPath(context.variables, edge.condition.field);
        return this.evaluateCondition(
          edge.condition.operator,
          fieldValue,
          edge.condition.value,
        );
      }

      return true;
    });

    // Execute next nodes
    for (const edge of edgesToFollow) {
      const nextNode = flow.nodes.find((n) => n.id === edge.target);
      if (nextNode) {
        await this.executeNode(flow, nextNode, context);
      }
    }
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(
    operator: string,
    left: unknown,
    right: unknown,
  ): boolean {
    switch (operator) {
      case 'eq':
        return left === right;
      case 'neq':
        return left !== right;
      case 'gt':
        return Number(left) > Number(right);
      case 'gte':
        return Number(left) >= Number(right);
      case 'lt':
        return Number(left) < Number(right);
      case 'lte':
        return Number(left) <= Number(right);
      case 'contains':
        return String(left).includes(String(right));
      case 'startsWith':
        return String(left).startsWith(String(right));
      case 'endsWith':
        return String(left).endsWith(String(right));
      case 'in':
        return Array.isArray(right) && right.includes(left);
      case 'notIn':
        return Array.isArray(right) && !right.includes(left);
      case 'isNull':
        return left === null || left === undefined;
      case 'isNotNull':
        return left !== null && left !== undefined;
      default:
        return false;
    }
  }

  /**
   * Get value from object path (e.g., "user.name")
   */
  private getValueFromPath(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  /**
   * Resolve parameters with variable substitution
   */
  private resolveParams(
    params: Record<string, unknown>,
    variables: Record<string, unknown>,
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        const path = value.slice(2, -2).trim();
        resolved[key] = this.getValueFromPath(variables, path);
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = this.resolveParams(
          value as Record<string, unknown>,
          variables,
        );
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Get execution context
   */
  getExecution(executionId: UUID): FlowExecutionContext | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Cancel a running execution
   */
  cancel(executionId: UUID): boolean {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'cancelled';
      const controller = this.abortControllers.get(executionId);
      if (controller) {
        controller.abort();
        this.abortControllers.delete(executionId);
      }
      return true;
    }
    return false;
  }

  /**
   * Clear all flows
   */
  clear(): void {
    this.flows.clear();
    this.executions.clear();
    this.abortControllers.clear();
    logger.info('Flow engine cleared');
  }
}

/**
 * Create a new flow engine
 */
export function createFlowEngine(): FlowEngineImpl {
  return new FlowEngineImpl();
}
