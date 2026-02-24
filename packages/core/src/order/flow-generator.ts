/**
 * Flow Generator
 *
 * Converts order templates into SamTerminal Flow definitions.
 * Each template generates a complete flow with trigger, conditions, actions, and outputs.
 */

import type { Flow, FlowNode, FlowEdge } from '../types/flow.js';
import type {
  ConditionGroup,
  SingleCondition,
  Order,
  OrderTemplateType,
  ConditionalSellParams,
  ConditionalBuyParams,
  StopLossParams,
  TakeProfitParams,
  DCAParams,
  SmartEntryParams,
  TrailingStopParams,
  DualProtectionParams,
} from './types.js';
import { isConditionGroup } from './types.js';
import { uuid } from '../utils/id.js';

/**
 * Flow generator configuration
 */
export interface FlowGeneratorConfig {
  /** Default check interval in milliseconds (default: 30000 = 30s) */
  defaultCheckInterval?: number;
  /** Default receive token for sells (default: 'USDC') */
  defaultReceiveToken?: string;
  /** Default chain ID */
  defaultChainId?: string;
}

/**
 * Flow Generator Class
 *
 * Generates SamTerminal Flow definitions from order templates.
 */
export class FlowGenerator {
  private config: Required<FlowGeneratorConfig>;

  constructor(config: FlowGeneratorConfig = {}) {
    this.config = {
      defaultCheckInterval: config.defaultCheckInterval ?? 30000,
      defaultReceiveToken: config.defaultReceiveToken ?? 'USDC',
      defaultChainId: config.defaultChainId ?? 'base',
    };
  }

  /**
   * Generate a flow from an order
   */
  generate(order: Order): Flow {
    switch (order.type) {
      case 'conditional-sell':
        return this.generateConditionalSell(order);
      case 'conditional-buy':
        return this.generateConditionalBuy(order);
      case 'stop-loss':
        return this.generateStopLoss(order);
      case 'take-profit':
        return this.generateTakeProfit(order);
      case 'dca':
        return this.generateDCA(order);
      case 'smart-entry':
        return this.generateSmartEntry(order);
      case 'trailing-stop':
        return this.generateTrailingStop(order);
      case 'dual-protection':
        return this.generateDualProtection(order);
      default:
        throw new Error(`Unsupported order type: ${order.type}`);
    }
  }

  /**
   * Generate Conditional Sell flow
   */
  private generateConditionalSell(order: Order): Flow {
    const params = order.params as ConditionalSellParams;
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];

    // 1. Trigger node (schedule-based)
    const triggerId = uuid();
    nodes.push(this.createTriggerNode(triggerId, 'schedule', {
      interval: this.config.defaultCheckInterval,
    }));

    // 2. Get token data action
    const getDataId = uuid();
    nodes.push(this.createActionNode(getDataId, 'Get Token Data', 'tokendata', 'getMarket', {
      address: params.token,
      chainId: params.chainId ?? this.config.defaultChainId,
    }));
    edges.push(this.createEdge(triggerId, getDataId));

    // 3. Condition node
    const conditionId = uuid();
    nodes.push(this.createConditionNodeFromGroup(conditionId, params.conditions));
    edges.push(this.createEdge(getDataId, conditionId));

    // 4. Swap action (on condition true)
    const swapId = uuid();
    nodes.push(this.createActionNode(swapId, 'Execute Swap', 'swap', 'execute', {
      fromToken: params.token,
      toToken: params.receiveToken ?? this.config.defaultReceiveToken,
      percent: params.sellPercent,
      chainId: params.chainId ?? this.config.defaultChainId,
    }));
    edges.push(this.createEdge(conditionId, swapId, 'true'));

    // 5. Notify action (after swap)
    const notifyId = uuid();
    nodes.push(this.createActionNode(notifyId, 'Send Notification', 'telegram', 'send', {
      template: 'conditional-sell-executed',
      channels: params.notifyChannels ?? [],
    }));
    edges.push(this.createEdge(swapId, notifyId));

    // 6. Output node
    const outputId = uuid();
    nodes.push(this.createOutputNode(outputId, 'return'));
    edges.push(this.createEdge(notifyId, outputId));

    // 7. Loop back edge (on condition false)
    // Flow engine will re-trigger on next schedule

    return this.createFlow(
      `Conditional Sell - ${params.token}`,
      `Sell ${params.sellPercent}% of ${params.token} when conditions are met`,
      nodes,
      edges,
      order.id,
    );
  }

  /**
   * Generate Conditional Buy flow
   */
  private generateConditionalBuy(order: Order): Flow {
    const params = order.params as ConditionalBuyParams;
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];

    const triggerId = uuid();
    nodes.push(this.createTriggerNode(triggerId, 'schedule', {
      interval: this.config.defaultCheckInterval,
    }));

    const getDataId = uuid();
    nodes.push(this.createActionNode(getDataId, 'Get Token Data', 'tokendata', 'getMarket', {
      address: params.buyToken,
      chainId: params.chainId ?? this.config.defaultChainId,
    }));
    edges.push(this.createEdge(triggerId, getDataId));

    const conditionId = uuid();
    nodes.push(this.createConditionNodeFromGroup(conditionId, params.conditions));
    edges.push(this.createEdge(getDataId, conditionId));

    const swapId = uuid();
    nodes.push(this.createActionNode(swapId, 'Execute Swap', 'swap', 'execute', {
      fromToken: params.sellToken,
      toToken: params.buyToken,
      amount: params.spendAmount,
      chainId: params.chainId ?? this.config.defaultChainId,
    }));
    edges.push(this.createEdge(conditionId, swapId, 'true'));

    const notifyId = uuid();
    nodes.push(this.createActionNode(notifyId, 'Send Notification', 'telegram', 'send', {
      template: 'conditional-buy-executed',
      channels: params.notifyChannels ?? [],
    }));
    edges.push(this.createEdge(swapId, notifyId));

    const outputId = uuid();
    nodes.push(this.createOutputNode(outputId, 'return'));
    edges.push(this.createEdge(notifyId, outputId));

    return this.createFlow(
      `Conditional Buy - ${params.buyToken}`,
      `Buy ${params.buyToken} with ${params.spendAmount} ${params.sellToken} when conditions are met`,
      nodes,
      edges,
      order.id,
    );
  }

  /**
   * Generate Stop-Loss flow
   */
  private generateStopLoss(order: Order): Flow {
    const params = order.params as StopLossParams;

    // Convert to conditional sell with price condition
    const conditionGroup: ConditionGroup = {
      operator: 'AND',
      conditions: [
        { field: 'price', operator: 'lte', value: params.triggerPrice },
      ],
    };

    const conditionalOrder: Order = {
      ...order,
      type: 'conditional-sell',
      params: {
        token: params.token,
        chainId: params.chainId,
        conditions: conditionGroup,
        sellPercent: params.sellPercent,
        receiveToken: params.receiveToken,
        notifyChannels: params.notifyChannels,
      } as ConditionalSellParams,
    };

    const flow = this.generateConditionalSell(conditionalOrder);
    flow.name = `Stop-Loss - ${params.token}`;
    flow.description = `Sell ${params.sellPercent}% of ${params.token} when price drops to $${params.triggerPrice}`;

    return flow;
  }

  /**
   * Generate Take-Profit flow
   */
  private generateTakeProfit(order: Order): Flow {
    const params = order.params as TakeProfitParams;

    const conditionGroup: ConditionGroup = {
      operator: 'AND',
      conditions: [
        { field: 'price', operator: 'gte', value: params.triggerPrice },
      ],
    };

    const conditionalOrder: Order = {
      ...order,
      type: 'conditional-sell',
      params: {
        token: params.token,
        chainId: params.chainId,
        conditions: conditionGroup,
        sellPercent: params.sellPercent,
        receiveToken: params.receiveToken,
        notifyChannels: params.notifyChannels,
      } as ConditionalSellParams,
    };

    const flow = this.generateConditionalSell(conditionalOrder);
    flow.name = `Take-Profit - ${params.token}`;
    flow.description = `Sell ${params.sellPercent}% of ${params.token} when price reaches $${params.triggerPrice}`;

    return flow;
  }

  /**
   * Generate DCA flow
   */
  private generateDCA(order: Order): Flow {
    const params = order.params as DCAParams;
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];

    // Calculate interval in milliseconds
    let intervalMs: number;
    if (typeof params.interval === 'number') {
      intervalMs = params.interval;
    } else {
      switch (params.interval) {
        case 'hourly':
          intervalMs = 60 * 60 * 1000;
          break;
        case 'daily':
          intervalMs = 24 * 60 * 60 * 1000;
          break;
        case 'weekly':
          intervalMs = 7 * 24 * 60 * 60 * 1000;
          break;
        case 'monthly':
          intervalMs = 30 * 24 * 60 * 60 * 1000;
          break;
        default:
          intervalMs = 24 * 60 * 60 * 1000;
      }
    }

    const triggerId = uuid();
    nodes.push(this.createTriggerNode(triggerId, 'schedule', {
      interval: intervalMs,
    }));

    let lastNodeId = triggerId;

    // If conditions are specified, add condition check
    if (params.conditions) {
      const getDataId = uuid();
      nodes.push(this.createActionNode(getDataId, 'Get Token Data', 'tokendata', 'getMarket', {
        address: params.buyToken,
        chainId: params.chainId ?? this.config.defaultChainId,
      }));
      edges.push(this.createEdge(lastNodeId, getDataId));

      const conditionId = uuid();
      nodes.push(this.createConditionNodeFromGroup(conditionId, params.conditions));
      edges.push(this.createEdge(getDataId, conditionId));

      // Only proceed to swap if condition is true
      const swapId = uuid();
      nodes.push(this.createActionNode(swapId, 'Execute DCA Buy', 'swap', 'execute', {
        fromToken: params.sellToken,
        toToken: params.buyToken,
        amount: params.amountPerExecution,
        chainId: params.chainId ?? this.config.defaultChainId,
      }));
      edges.push(this.createEdge(conditionId, swapId, 'true'));

      lastNodeId = swapId;
    } else {
      // No conditions, always execute
      const swapId = uuid();
      nodes.push(this.createActionNode(swapId, 'Execute DCA Buy', 'swap', 'execute', {
        fromToken: params.sellToken,
        toToken: params.buyToken,
        amount: params.amountPerExecution,
        chainId: params.chainId ?? this.config.defaultChainId,
      }));
      edges.push(this.createEdge(lastNodeId, swapId));

      lastNodeId = swapId;
    }

    const notifyId = uuid();
    nodes.push(this.createActionNode(notifyId, 'Send Notification', 'telegram', 'send', {
      template: 'dca-executed',
      channels: params.notifyChannels ?? [],
    }));
    edges.push(this.createEdge(lastNodeId, notifyId));

    const outputId = uuid();
    nodes.push(this.createOutputNode(outputId, 'return'));
    edges.push(this.createEdge(notifyId, outputId));

    return this.createFlow(
      `DCA - ${params.buyToken}`,
      `Buy ${params.amountPerExecution} ${params.sellToken} worth of ${params.buyToken} ${params.interval}`,
      nodes,
      edges,
      order.id,
    );
  }

  /**
   * Generate Smart Entry flow
   */
  private generateSmartEntry(order: Order): Flow {
    const params = order.params as SmartEntryParams;
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];

    const triggerId = uuid();
    nodes.push(this.createTriggerNode(triggerId, 'schedule', {
      interval: this.config.defaultCheckInterval,
    }));

    const getDataId = uuid();
    nodes.push(this.createActionNode(getDataId, 'Get Token Data', 'tokendata', 'getMarket', {
      address: params.buyToken,
      chainId: params.chainId ?? this.config.defaultChainId,
      includeHolders: true,
    }));
    edges.push(this.createEdge(triggerId, getDataId));

    const conditionId = uuid();
    nodes.push(this.createConditionNodeFromGroup(conditionId, params.conditions));
    edges.push(this.createEdge(getDataId, conditionId));

    // Check budget and cooldown (additional conditions in swap action)
    const swapId = uuid();
    nodes.push(this.createActionNode(swapId, 'Execute Smart Entry', 'swap', 'executeWithLimits', {
      fromToken: params.sellToken,
      toToken: params.buyToken,
      amount: params.spendAmount,
      maxTotal: params.maxSpendTotal,
      cooldownMs: (params.cooldownMinutes ?? 60) * 60 * 1000,
      chainId: params.chainId ?? this.config.defaultChainId,
    }));
    edges.push(this.createEdge(conditionId, swapId, 'true'));

    const notifyId = uuid();
    nodes.push(this.createActionNode(notifyId, 'Send Notification', 'telegram', 'send', {
      template: 'smart-entry-executed',
      channels: params.notifyChannels ?? [],
    }));
    edges.push(this.createEdge(swapId, notifyId));

    const outputId = uuid();
    nodes.push(this.createOutputNode(outputId, 'return'));
    edges.push(this.createEdge(notifyId, outputId));

    return this.createFlow(
      `Smart Entry - ${params.buyToken}`,
      `Buy ${params.buyToken} when entry conditions are met`,
      nodes,
      edges,
      order.id,
    );
  }

  /**
   * Generate Trailing Stop flow
   */
  private generateTrailingStop(order: Order): Flow {
    const params = order.params as TrailingStopParams;
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];

    const triggerId = uuid();
    nodes.push(this.createTriggerNode(triggerId, 'schedule', {
      interval: this.config.defaultCheckInterval,
    }));

    const getDataId = uuid();
    nodes.push(this.createActionNode(getDataId, 'Get Token Data', 'tokendata', 'getMarket', {
      address: params.token,
      chainId: params.chainId ?? this.config.defaultChainId,
    }));
    edges.push(this.createEdge(triggerId, getDataId));

    // Trailing stop logic is handled by a special action
    const trailingId = uuid();
    nodes.push(this.createActionNode(trailingId, 'Check Trailing Stop', 'order', 'checkTrailingStop', {
      token: params.token,
      trailPercent: params.trailPercent,
      activationConditions: params.activationConditions,
    }));
    edges.push(this.createEdge(getDataId, trailingId));

    // Condition to check if trailing stop triggered
    const conditionId = uuid();
    nodes.push({
      id: conditionId,
      type: 'condition',
      name: 'Trailing Stop Triggered?',
      position: { x: 0, y: 0 },
      data: {
        conditions: [{ field: '_trailingTriggered', operator: 'eq', value: true }],
        operator: 'and',
      },
    });
    edges.push(this.createEdge(trailingId, conditionId));

    const swapId = uuid();
    nodes.push(this.createActionNode(swapId, 'Execute Trailing Stop', 'swap', 'execute', {
      fromToken: params.token,
      toToken: params.receiveToken ?? this.config.defaultReceiveToken,
      percent: params.sellPercent,
      chainId: params.chainId ?? this.config.defaultChainId,
    }));
    edges.push(this.createEdge(conditionId, swapId, 'true'));

    const notifyId = uuid();
    nodes.push(this.createActionNode(notifyId, 'Send Notification', 'telegram', 'send', {
      template: 'trailing-stop-executed',
      channels: params.notifyChannels ?? [],
    }));
    edges.push(this.createEdge(swapId, notifyId));

    const outputId = uuid();
    nodes.push(this.createOutputNode(outputId, 'return'));
    edges.push(this.createEdge(notifyId, outputId));

    return this.createFlow(
      `Trailing Stop - ${params.token}`,
      `Sell ${params.sellPercent}% of ${params.token} with ${params.trailPercent}% trailing stop`,
      nodes,
      edges,
      order.id,
    );
  }

  /**
   * Generate Dual Protection flow (Stop-Loss + Take-Profit)
   */
  private generateDualProtection(order: Order): Flow {
    const params = order.params as DualProtectionParams;
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];

    const triggerId = uuid();
    nodes.push(this.createTriggerNode(triggerId, 'schedule', {
      interval: this.config.defaultCheckInterval,
    }));

    const getDataId = uuid();
    nodes.push(this.createActionNode(getDataId, 'Get Token Data', 'tokendata', 'getMarket', {
      address: params.token,
      chainId: params.chainId ?? this.config.defaultChainId,
    }));
    edges.push(this.createEdge(triggerId, getDataId));

    // Stop-Loss condition
    const slConditionId = uuid();
    nodes.push(this.createConditionNodeFromGroup(slConditionId, params.stopLoss.conditions, 'Stop-Loss Check'));
    edges.push(this.createEdge(getDataId, slConditionId));

    // Stop-Loss swap
    const slSwapId = uuid();
    nodes.push(this.createActionNode(slSwapId, 'Execute Stop-Loss', 'swap', 'execute', {
      fromToken: params.token,
      toToken: params.receiveToken ?? this.config.defaultReceiveToken,
      percent: params.stopLoss.sellPercent,
      chainId: params.chainId ?? this.config.defaultChainId,
    }));
    edges.push(this.createEdge(slConditionId, slSwapId, 'true'));

    // Take-Profit condition (only check if stop-loss not triggered)
    const tpConditionId = uuid();
    nodes.push(this.createConditionNodeFromGroup(tpConditionId, params.takeProfit.conditions, 'Take-Profit Check'));
    edges.push(this.createEdge(slConditionId, tpConditionId, 'false'));

    // Take-Profit swap
    const tpSwapId = uuid();
    nodes.push(this.createActionNode(tpSwapId, 'Execute Take-Profit', 'swap', 'execute', {
      fromToken: params.token,
      toToken: params.receiveToken ?? this.config.defaultReceiveToken,
      percent: params.takeProfit.sellPercent,
      chainId: params.chainId ?? this.config.defaultChainId,
    }));
    edges.push(this.createEdge(tpConditionId, tpSwapId, 'true'));

    // Notifications
    const slNotifyId = uuid();
    nodes.push(this.createActionNode(slNotifyId, 'Notify Stop-Loss', 'telegram', 'send', {
      template: 'stop-loss-executed',
      channels: params.notifyChannels ?? [],
    }));
    edges.push(this.createEdge(slSwapId, slNotifyId));

    const tpNotifyId = uuid();
    nodes.push(this.createActionNode(tpNotifyId, 'Notify Take-Profit', 'telegram', 'send', {
      template: 'take-profit-executed',
      channels: params.notifyChannels ?? [],
    }));
    edges.push(this.createEdge(tpSwapId, tpNotifyId));

    // Output nodes
    const slOutputId = uuid();
    nodes.push(this.createOutputNode(slOutputId, 'return'));
    edges.push(this.createEdge(slNotifyId, slOutputId));

    const tpOutputId = uuid();
    nodes.push(this.createOutputNode(tpOutputId, 'return'));
    edges.push(this.createEdge(tpNotifyId, tpOutputId));

    return this.createFlow(
      `Dual Protection - ${params.token}`,
      `Protect ${params.token} with stop-loss and take-profit`,
      nodes,
      edges,
      order.id,
    );
  }

  // Helper methods

  private createFlow(
    name: string,
    description: string,
    nodes: FlowNode[],
    edges: FlowEdge[],
    orderId: string,
  ): Flow {
    return {
      id: uuid(),
      name,
      description,
      version: '1.0.0',
      nodes,
      edges,
      metadata: { orderId },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private createTriggerNode(
    id: string,
    triggerType: 'manual' | 'schedule' | 'event' | 'webhook',
    config: Record<string, unknown>,
  ): FlowNode {
    return {
      id,
      type: 'trigger',
      name: `Trigger (${triggerType})`,
      position: { x: 0, y: 0 },
      data: { triggerType, config },
    };
  }

  private createActionNode(
    id: string,
    name: string,
    pluginName: string,
    actionName: string,
    params: Record<string, unknown>,
  ): FlowNode {
    return {
      id,
      type: 'action',
      name,
      position: { x: 0, y: 0 },
      data: { pluginName, actionName, params },
    };
  }

  private createConditionNodeFromGroup(
    id: string,
    group: ConditionGroup,
    name?: string,
  ): FlowNode {
    // Flatten the condition group into flow conditions
    const flowConditions = this.flattenConditions(group);

    // Note: We use type assertion here because order conditions may have
    // additional operators like 'between' and 'change' that aren't in the
    // base FlowCondition type. The _originalConditionGroup is stored for
    // proper evaluation by the order system.
    const nodeData = {
      conditions: flowConditions,
      operator: group.operator.toLowerCase() as 'and' | 'or',
      _originalConditionGroup: group,
    };

    return {
      id,
      type: 'condition',
      name: name ?? 'Check Conditions',
      position: { x: 0, y: 0 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: nodeData as any,
    };
  }

  private flattenConditions(group: ConditionGroup): Array<{ field: string; operator: string; value: unknown }> {
    const result: Array<{ field: string; operator: string; value: unknown }> = [];

    for (const cond of group.conditions) {
      if (isConditionGroup(cond)) {
        // For nested groups, flatten recursively
        result.push(...this.flattenConditions(cond));
      } else {
        result.push({
          field: cond.field,
          operator: cond.operator,
          value: cond.value,
        });
      }
    }

    return result;
  }

  private createOutputNode(
    id: string,
    outputType: 'return' | 'log' | 'notify' | 'store',
  ): FlowNode {
    return {
      id,
      type: 'output',
      name: 'Output',
      position: { x: 0, y: 0 },
      data: { outputType, config: {} },
    };
  }

  private createEdge(
    source: string,
    target: string,
    sourceHandle?: string,
  ): FlowEdge {
    return {
      id: uuid(),
      source,
      target,
      sourceHandle,
      type: sourceHandle ? 'conditional' : 'default',
    };
  }
}

/**
 * Create a new flow generator instance
 */
export function createFlowGenerator(config?: FlowGeneratorConfig): FlowGenerator {
  return new FlowGenerator(config);
}
