/**
 * Order Notification Templates
 *
 * Pre-built notification templates for order events.
 */

import type { Order } from './types.js';

/**
 * Notification template context
 */
export interface NotificationContext {
  order: Order;
  token?: string;
  triggerValue?: number;
  conditionSummary?: string;
  soldAmount?: number;
  receivedAmount?: number;
  receiveToken?: string;
  txHash?: string;
  boughtAmount?: number;
  spentAmount?: number;
  totalBought?: number;
  averageCost?: number;
  nextExecution?: string;
  remainingBudget?: number;
  metConditions?: string[];
  highPrice?: number;
  currentPrice?: number;
  trailPercent?: number;
  sellPercent?: number;
  interval?: string;
  sellToken?: string;
  error?: string;
}

/**
 * Notification template
 */
export interface NotificationTemplate {
  title: string;
  body: string;
  emoji?: string;
}

/**
 * Render template with context
 */
function renderTemplate(template: string, context: Record<string, unknown>): string {
  let result = template;

  // Replace simple variables: {{variable}}
  for (const [key, value] of Object.entries(context)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(placeholder, String(value ?? ''));
  }

  // Handle each blocks: {{#each items}}...{{/each}}
  const eachRegex = /\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  result = result.replace(eachRegex, (_, arrayName, itemTemplate) => {
    const array = context[arrayName] as unknown[];
    if (!Array.isArray(array)) return '';
    return array.map((item) => itemTemplate.replace(/\{\{this\}\}/g, String(item))).join('');
  });

  return result.trim();
}

/**
 * Order notification templates
 */
export const ORDER_NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  // Stop-Loss Templates
  'stop-loss-triggered': {
    title: '🛡️ Stop-Loss Triggered',
    emoji: '🛡️',
    body: [
      'Stop-loss executed for {{token}}!',
      '',
      'Condition: {{conditionSummary}}',
      'Trigger Price: ${{triggerValue}}',
      'Sold: {{soldAmount}} {{token}}',
      'Received: {{receivedAmount}} {{receiveToken}}',
      'TX: {{txHash}}',
    ].join('\n'),
  },

  'stop-loss-created': {
    title: '🛡️ Stop-Loss Created',
    emoji: '🛡️',
    body: [
      'Stop-loss active for {{token}}.',
      '',
      'Trigger: If price drops below ${{triggerValue}}',
      'Action: Sell {{sellPercent}}% → {{receiveToken}}',
    ].join('\n'),
  },

  // Take-Profit Templates
  'take-profit-triggered': {
    title: '🎯 Take-Profit Triggered',
    emoji: '🎯',
    body: [
      'Take-profit executed for {{token}}!',
      '',
      'Condition: {{conditionSummary}}',
      'Trigger Price: ${{triggerValue}}',
      'Sold: {{soldAmount}} {{token}}',
      'Received: {{receivedAmount}} {{receiveToken}}',
      'TX: {{txHash}}',
    ].join('\n'),
  },

  'take-profit-created': {
    title: '🎯 Take-Profit Created',
    emoji: '🎯',
    body: [
      'Take-profit active for {{token}}.',
      '',
      'Trigger: If price rises above ${{triggerValue}}',
      'Action: Sell {{sellPercent}}% → {{receiveToken}}',
    ].join('\n'),
  },

  // DCA Templates
  'dca-executed': {
    title: '📊 DCA Purchase Completed',
    emoji: '📊',
    body: [
      'Your periodic DCA purchase has been executed!',
      '',
      'This time: {{boughtAmount}} {{token}} (${{spentAmount}})',
      'Total: {{totalBought}} {{token}}',
      'Average cost: ${{averageCost}}',
      'Next: {{nextExecution}}',
    ].join('\n'),
  },

  'dca-created': {
    title: '📊 DCA Started',
    emoji: '📊',
    body: [
      'DCA strategy active for {{token}}.',
      '',
      'Amount: ${{spentAmount}} / {{interval}}',
      'Spending: {{sellToken}} → {{token}}',
    ].join('\n'),
  },

  'dca-skipped': {
    title: '⏭️ DCA Skipped',
    emoji: '⏭️',
    body: [
      'DCA purchase for {{token}} was skipped because conditions were not met.',
      '',
      'Conditions: {{conditionSummary}}',
      'Next check: {{nextExecution}}',
    ].join('\n'),
  },

  // Smart Entry Templates
  'smart-entry-executed': {
    title: '🎯 Smart Entry Purchase',
    emoji: '🎯',
    body: [
      'Conditions met, purchase executed!',
      '',
      'Token: {{token}}',
      'Met conditions:',
      '{{#each metConditions}}',
      '  ✓ {{this}}',
      '{{/each}}',
      '',
      'Bought: {{boughtAmount}} (${{spentAmount}})',
      'Remaining budget: ${{remainingBudget}}',
    ].join('\n'),
  },

  'smart-entry-created': {
    title: '🎯 Smart Entry Active',
    emoji: '🎯',
    body: [
      'Monitoring smart entry for {{token}}.',
      '',
      'Conditions: {{conditionSummary}}',
      'Purchase amount: ${{spentAmount}}',
      'Max total: ${{remainingBudget}}',
    ].join('\n'),
  },

  // Conditional Sell Templates
  'conditional-sell-triggered': {
    title: '📉 Conditional Sell Triggered',
    emoji: '📉',
    body: [
      'Conditional sell executed for {{token}}!',
      '',
      'Met conditions:',
      '{{#each metConditions}}',
      '  ✓ {{this}}',
      '{{/each}}',
      '',
      'Sold: {{soldAmount}} {{token}}',
      'Received: {{receivedAmount}} {{receiveToken}}',
      'TX: {{txHash}}',
    ].join('\n'),
  },

  // Conditional Buy Templates
  'conditional-buy-triggered': {
    title: '📈 Conditional Buy Triggered',
    emoji: '📈',
    body: [
      'Conditional buy executed!',
      '',
      'Met conditions:',
      '{{#each metConditions}}',
      '  ✓ {{this}}',
      '{{/each}}',
      '',
      'Bought: {{boughtAmount}} {{token}}',
      'Spent: {{spentAmount}} {{sellToken}}',
      'TX: {{txHash}}',
    ].join('\n'),
  },

  // Trailing Stop Templates
  'trailing-stop-triggered': {
    title: '📊 Trailing Stop Triggered',
    emoji: '📊',
    body: [
      'Trailing stop executed for {{token}}!',
      '',
      'Highest price: ${{highPrice}}',
      'Trigger price: ${{triggerValue}} ({{trailPercent}}% drop)',
      'Sold: {{soldAmount}} {{token}}',
      'Received: {{receivedAmount}} {{receiveToken}}',
      'TX: {{txHash}}',
    ].join('\n'),
  },

  'trailing-stop-updated': {
    title: '📈 Trailing Stop Updated',
    emoji: '📈',
    body: [
      '{{token}} reached a new high!',
      '',
      'New high: ${{highPrice}}',
      'New trigger: ${{triggerValue}}',
      'Trail: {{trailPercent}}%',
    ].join('\n'),
  },

  // Dual Protection Templates
  'dual-protection-sl-triggered': {
    title: '🛡️ Dual Protection - Stop-Loss',
    emoji: '🛡️',
    body: [
      'Stop-loss triggered for {{token}}!',
      '',
      'Price: ${{currentPrice}}',
      'Trigger: ${{triggerValue}}',
      'Sold: {{soldAmount}} {{token}}',
      'TX: {{txHash}}',
    ].join('\n'),
  },

  'dual-protection-tp-triggered': {
    title: '🎯 Dual Protection - Take-Profit',
    emoji: '🎯',
    body: [
      'Take-profit triggered for {{token}}!',
      '',
      'Price: ${{currentPrice}}',
      'Trigger: ${{triggerValue}}',
      'Sold: {{soldAmount}} {{token}}',
      'TX: {{txHash}}',
    ].join('\n'),
  },

  // TWAP Templates
  'twap-slice-executed': {
    title: '⏱️ TWAP Slice Sold',
    emoji: '⏱️',
    body: [
      'TWAP strategy in progress.',
      '',
      'This slice: {{soldAmount}} {{token}}',
      'Received: {{receivedAmount}} {{receiveToken}}',
      'Remaining: {{remainingBudget}} {{token}}',
    ].join('\n'),
  },

  'twap-completed': {
    title: '✅ TWAP Completed',
    emoji: '✅',
    body: [
      'TWAP strategy completed!',
      '',
      'Total sold: {{soldAmount}} {{token}}',
      'Total received: {{receivedAmount}} {{receiveToken}}',
      'Average price: ${{averageCost}}',
    ].join('\n'),
  },

  // Generic Templates
  'order-created': {
    title: '✨ Order Created',
    emoji: '✨',
    body: [
      'New order active.',
      '',
      'Type: {{orderType}}',
      'Token: {{token}}',
      'Status: Active',
    ].join('\n'),
  },

  'order-cancelled': {
    title: '❌ Order Cancelled',
    emoji: '❌',
    body: ['Order cancelled.', '', 'Type: {{orderType}}', 'Token: {{token}}'].join('\n'),
  },

  'order-paused': {
    title: '⏸️ Order Paused',
    emoji: '⏸️',
    body: [
      'Order paused.',
      '',
      'Type: {{orderType}}',
      'Token: {{token}}',
      'To resume: resume',
    ].join('\n'),
  },

  'order-resumed': {
    title: '▶️ Order Resumed',
    emoji: '▶️',
    body: ['Order is active again.', '', 'Type: {{orderType}}', 'Token: {{token}}'].join('\n'),
  },

  'order-failed': {
    title: '⚠️ Order Failed',
    emoji: '⚠️',
    body: [
      'Order could not be executed.',
      '',
      'Type: {{orderType}}',
      'Token: {{token}}',
      'Error: {{error}}',
    ].join('\n'),
  },

  'order-completed': {
    title: '✅ Order Completed',
    emoji: '✅',
    body: ['Order completed successfully.', '', 'Type: {{orderType}}', 'Token: {{token}}'].join('\n'),
  },
};

/**
 * Get notification template for event
 */
export function getNotificationTemplate(eventType: string): NotificationTemplate | undefined {
  return ORDER_NOTIFICATION_TEMPLATES[eventType];
}

/**
 * Render notification for order event
 */
export function renderOrderNotification(
  eventType: string,
  context: NotificationContext,
): { title: string; body: string; emoji?: string } | null {
  const template = getNotificationTemplate(eventType);

  if (!template) {
    return null;
  }

  // Build context object
  const contextObj: Record<string, unknown> = {
    ...context,
    orderType: context.order.type,
    token: context.token ?? (context.order.params as { token?: string }).token,
  };

  return {
    title: renderTemplate(template.title, contextObj),
    body: renderTemplate(template.body, contextObj),
    emoji: template.emoji,
  };
}

/**
 * Get event type for order status change
 */
export function getOrderEventType(
  order: Order,
  newStatus: string,
  subType?: 'sl' | 'tp',
): string {
  const typePrefix = order.type;

  switch (newStatus) {
    case 'triggered':
      if (order.type === 'dual-protection' && subType) {
        return `dual-protection-${subType}-triggered`;
      }
      return `${typePrefix}-triggered`;

    case 'created':
      return `${typePrefix}-created`;

    case 'cancelled':
      return 'order-cancelled';

    case 'paused':
      return 'order-paused';

    case 'active':
      return 'order-resumed';

    case 'failed':
      return 'order-failed';

    case 'completed':
      return 'order-completed';

    default:
      return `order-${newStatus}`;
  }
}

/**
 * Format condition for display
 */
export function formatConditionSummary(conditions: unknown): string {
  if (!conditions) return '';

  const group = conditions as {
    operator: 'AND' | 'OR';
    conditions: Array<{ field: string; operator: string; value: number | [number, number] }>;
  };

  const parts = group.conditions.map((c) => {
    const op = formatOperator(c.operator);
    const val = Array.isArray(c.value) ? `${c.value[0]} - ${c.value[1]}` : formatNumber(c.value);
    return `${c.field} ${op} ${val}`;
  });

  return parts.join(` ${group.operator} `);
}

/**
 * Format operator for display
 */
function formatOperator(op: string): string {
  const operators: Record<string, string> = {
    eq: '=',
    neq: '≠',
    gt: '>',
    gte: '≥',
    lt: '<',
    lte: '≤',
    between: 'between',
    change: 'change',
  };
  return operators[op] ?? op;
}

/**
 * Format number for display
 */
function formatNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}
