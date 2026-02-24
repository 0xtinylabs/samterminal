/**
 * Order Template System Types
 *
 * Defines the condition system for order templates including
 * single conditions, condition groups with AND/OR logic, and operators.
 */

/**
 * Supported data fields for conditions
 * These map to TokenData provider fields
 */
export type ConditionField =
  | 'price'
  | 'priceChange1h'
  | 'priceChange24h'
  | 'priceChange7d'
  | 'mcap'
  | 'fdv'
  | 'volume24h'
  | 'volumeChange24h'
  | 'liquidity'
  | 'holders'
  | 'tokenAge'
  | 'txCount24h'
  | 'buyCount24h'
  | 'sellCount24h'
  | 'buyPressure'
  | 'sellPressure';

/**
 * Comparison operators for conditions
 */
export type OrderConditionOperator =
  | 'eq'      // Equal
  | 'neq'     // Not equal
  | 'gt'      // Greater than
  | 'gte'     // Greater than or equal
  | 'lt'      // Less than
  | 'lte'     // Less than or equal
  | 'between' // Between two values (inclusive)
  | 'change'; // Change from previous value (percentage)

/**
 * Logical operators for combining conditions
 */
export type LogicalOperator = 'AND' | 'OR';

/**
 * Single condition definition
 */
export interface SingleCondition {
  /** The data field to evaluate */
  field: ConditionField;
  /** The comparison operator */
  operator: OrderConditionOperator;
  /** The value to compare against (single value or [min, max] for 'between') */
  value: number | [number, number];
}

/**
 * Condition group with nested conditions and logical operator
 */
export interface ConditionGroup {
  /** Logical operator to combine conditions */
  operator: LogicalOperator;
  /** Array of conditions or nested groups */
  conditions: Array<SingleCondition | ConditionGroup>;
}

/**
 * Union type for any condition (single or group)
 */
export type Condition = SingleCondition | ConditionGroup;

/**
 * Type guard to check if a condition is a ConditionGroup
 */
export function isConditionGroup(condition: Condition): condition is ConditionGroup {
  return 'conditions' in condition && 'operator' in condition && Array.isArray(condition.conditions);
}

/**
 * Type guard to check if a condition is a SingleCondition
 */
export function isSingleCondition(condition: Condition): condition is SingleCondition {
  return 'field' in condition && 'operator' in condition && 'value' in condition;
}

/**
 * Token data structure for condition evaluation
 * Maps to TokenMarketData from tokendata plugin
 */
export interface TokenDataSnapshot {
  price: number;
  priceChange1h?: number;
  priceChange24h?: number;
  priceChange7d?: number;
  mcap?: number;
  fdv?: number;
  volume24h?: number;
  volumeChange24h?: number;
  liquidity?: number;
  holders?: number;
  tokenAge?: number;
  txCount24h?: number;
  buyCount24h?: number;
  sellCount24h?: number;
  buyPressure?: number;
  sellPressure?: number;
}

/**
 * Result of condition evaluation
 */
export interface ConditionEvaluationResult {
  /** Whether all conditions are met */
  met: boolean;
  /** Detailed results for each condition */
  details: ConditionDetail[];
  /** Timestamp of evaluation */
  evaluatedAt: Date;
}

/**
 * Detail of a single condition evaluation
 */
export interface ConditionDetail {
  /** The condition that was evaluated */
  condition: SingleCondition;
  /** Whether this condition was met */
  met: boolean;
  /** The actual value from token data */
  actualValue: number | undefined;
  /** The expected value from condition */
  expectedValue: number | [number, number];
}

/**
 * Order status
 */
export type OrderStatus =
  | 'created'
  | 'active'
  | 'triggered'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

/**
 * Base order configuration
 */
export interface BaseOrderConfig {
  /** Unique order identifier */
  id?: string;
  /** Token address */
  token: string;
  /** Chain ID */
  chainId?: string;
  /** Notification channels */
  notifyChannels?: string[];
}

/**
 * Order template types
 */
export type OrderTemplateType =
  | 'conditional-sell'
  | 'conditional-buy'
  | 'stop-loss'
  | 'take-profit'
  | 'smart-entry'
  | 'dca'
  | 'twap'
  | 'trailing-stop'
  | 'dual-protection'
  | 'whale-copy';

/**
 * Conditional sell order parameters
 */
export interface ConditionalSellParams extends BaseOrderConfig {
  conditions: ConditionGroup;
  sellPercent: number;
  receiveToken?: string;
}

/**
 * Conditional buy order parameters
 */
export interface ConditionalBuyParams extends BaseOrderConfig {
  buyToken: string;
  sellToken: string;
  conditions: ConditionGroup;
  spendAmount: number;
}

/**
 * Stop-loss order parameters (simplified)
 */
export interface StopLossParams extends BaseOrderConfig {
  triggerPrice: number;
  sellPercent: number;
  receiveToken?: string;
}

/**
 * Take-profit order parameters (simplified)
 */
export interface TakeProfitParams extends BaseOrderConfig {
  triggerPrice: number;
  sellPercent: number;
  receiveToken?: string;
}

/**
 * Smart entry order parameters
 */
export interface SmartEntryParams extends BaseOrderConfig {
  buyToken: string;
  sellToken: string;
  conditions: ConditionGroup;
  spendAmount: number;
  maxSpendTotal?: number;
  cooldownMinutes?: number;
}

/**
 * DCA order parameters
 */
export interface DCAParams extends BaseOrderConfig {
  buyToken: string;
  sellToken: string;
  amountPerExecution: number;
  interval: 'hourly' | 'daily' | 'weekly' | 'monthly' | number;
  conditions?: ConditionGroup;
  maxExecutions?: number;
  endDate?: string;
}

/**
 * TWAP order parameters
 */
export interface TWAPParams extends BaseOrderConfig {
  sellToken: string;
  buyToken: string;
  totalAmount: number;
  duration: number;
  slices: number;
  conditions?: ConditionGroup;
}

/**
 * Trailing stop order parameters
 */
export interface TrailingStopParams extends BaseOrderConfig {
  trailPercent: number;
  sellPercent: number;
  activationConditions?: ConditionGroup;
  receiveToken?: string;
}

/**
 * Dual protection order parameters
 */
export interface DualProtectionParams extends BaseOrderConfig {
  stopLoss: {
    conditions: ConditionGroup;
    sellPercent: number;
  };
  takeProfit: {
    conditions: ConditionGroup;
    sellPercent: number;
  };
  receiveToken?: string;
}

/**
 * Whale copy order parameters
 */
export interface WhaleCopyParams extends BaseOrderConfig {
  watchAddress: string;
  minTransactionValue: number;
  action: 'copy' | 'inverse';
  tradeAmount: number;
  tradeToken: string;
  tokenFilter?: string[];
}

/**
 * Union type for all order parameters
 */
export type OrderParams =
  | ConditionalSellParams
  | ConditionalBuyParams
  | StopLossParams
  | TakeProfitParams
  | SmartEntryParams
  | DCAParams
  | TWAPParams
  | TrailingStopParams
  | DualProtectionParams
  | WhaleCopyParams;

/**
 * Order instance
 */
export interface Order {
  id: string;
  type: OrderTemplateType;
  params: OrderParams;
  status: OrderStatus;
  flowId?: string;
  createdAt: Date;
  updatedAt: Date;
  triggeredAt?: Date;
  completedAt?: Date;
  error?: string;
}
