/**
 * Order Template System
 *
 * Provides a condition-based order system for automated trading strategies.
 */

// Types
export type {
  ConditionField,
  OrderConditionOperator,
  LogicalOperator,
  SingleCondition,
  ConditionGroup,
  Condition,
  TokenDataSnapshot,
  ConditionEvaluationResult,
  ConditionDetail,
  OrderStatus,
  BaseOrderConfig,
  OrderTemplateType,
  ConditionalSellParams,
  ConditionalBuyParams,
  StopLossParams,
  TakeProfitParams,
  SmartEntryParams,
  DCAParams,
  TWAPParams,
  TrailingStopParams,
  DualProtectionParams,
  WhaleCopyParams,
  OrderParams,
  Order,
} from './types.js';

export { isConditionGroup, isSingleCondition } from './types.js';

// Condition Evaluator
export {
  ConditionEvaluator,
  condition,
  and,
  or,
  conditions,
  type ConditionEvaluatorConfig,
} from './condition-evaluator.js';

// Flow Generator
export {
  FlowGenerator,
  createFlowGenerator,
  type FlowGeneratorConfig,
} from './flow-generator.js';

// Order Templates
export {
  OrderTemplates,
  createOrderTemplates,
  createStopLoss,
  createTakeProfit,
  createDCA,
  createConditionalSell,
  type OrderTemplatesConfig,
  type OrderListOptions,
  type OrderCreationResult,
  type OrderStats,
  type OrderParamsForType,
} from './order-templates.js';

// Actions (AI Chat Tools)
export {
  createOrderCreateAction,
  createOrderListAction,
  createOrderGetAction,
  createOrderCancelAction,
  createOrderPauseAction,
  createOrderResumeAction,
  createOrderStatsAction,
  getOrderActions,
} from './actions.js';

// Notifications
export {
  ORDER_NOTIFICATION_TEMPLATES,
  getNotificationTemplate,
  renderOrderNotification,
  getOrderEventType,
  formatConditionSummary,
  type NotificationContext,
  type NotificationTemplate,
} from './notifications.js';
