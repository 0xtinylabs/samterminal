/**
 * Order Notifications Tests
 */

import {
  ORDER_NOTIFICATION_TEMPLATES,
  getNotificationTemplate,
  renderOrderNotification,
  getOrderEventType,
  formatConditionSummary,
  type NotificationContext,
} from './notifications.js';
import type { Order } from './types.js';

describe('Order Notifications', () => {
  const createOrder = (overrides: Partial<Order> = {}): Order => ({
    id: 'test-order-1',
    type: 'stop-loss',
    params: {
      token: 'ETH',
      triggerPrice: 3000,
      sellPercent: 100,
    },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  describe('ORDER_NOTIFICATION_TEMPLATES', () => {
    it('should have stop-loss templates', () => {
      expect(ORDER_NOTIFICATION_TEMPLATES['stop-loss-triggered']).toBeDefined();
      expect(ORDER_NOTIFICATION_TEMPLATES['stop-loss-created']).toBeDefined();
    });

    it('should have take-profit templates', () => {
      expect(ORDER_NOTIFICATION_TEMPLATES['take-profit-triggered']).toBeDefined();
      expect(ORDER_NOTIFICATION_TEMPLATES['take-profit-created']).toBeDefined();
    });

    it('should have DCA templates', () => {
      expect(ORDER_NOTIFICATION_TEMPLATES['dca-executed']).toBeDefined();
      expect(ORDER_NOTIFICATION_TEMPLATES['dca-created']).toBeDefined();
      expect(ORDER_NOTIFICATION_TEMPLATES['dca-skipped']).toBeDefined();
    });

    it('should have smart-entry templates', () => {
      expect(ORDER_NOTIFICATION_TEMPLATES['smart-entry-executed']).toBeDefined();
      expect(ORDER_NOTIFICATION_TEMPLATES['smart-entry-created']).toBeDefined();
    });

    it('should have generic order templates', () => {
      expect(ORDER_NOTIFICATION_TEMPLATES['order-created']).toBeDefined();
      expect(ORDER_NOTIFICATION_TEMPLATES['order-cancelled']).toBeDefined();
      expect(ORDER_NOTIFICATION_TEMPLATES['order-paused']).toBeDefined();
      expect(ORDER_NOTIFICATION_TEMPLATES['order-resumed']).toBeDefined();
      expect(ORDER_NOTIFICATION_TEMPLATES['order-failed']).toBeDefined();
      expect(ORDER_NOTIFICATION_TEMPLATES['order-completed']).toBeDefined();
    });
  });

  describe('getNotificationTemplate', () => {
    it('should return template by event type', () => {
      const template = getNotificationTemplate('stop-loss-triggered');

      expect(template).toBeDefined();
      expect(template?.title).toContain('Stop-Loss');
      expect(template?.emoji).toBe('🛡️');
    });

    it('should return undefined for unknown event', () => {
      const template = getNotificationTemplate('unknown-event');

      expect(template).toBeUndefined();
    });
  });

  describe('renderOrderNotification', () => {
    it('should render stop-loss notification', () => {
      const order = createOrder();
      const context: NotificationContext = {
        order,
        token: 'ETH',
        triggerValue: 3000,
        conditionSummary: 'price < $3,000',
        soldAmount: 1.5,
        receivedAmount: 4500,
        receiveToken: 'USDC',
        txHash: '0x1234...abcd',
      };

      const result = renderOrderNotification('stop-loss-triggered', context);

      expect(result).not.toBeNull();
      expect(result?.title).toContain('Stop-Loss');
      expect(result?.body).toContain('ETH');
      expect(result?.body).toContain('3000');
      expect(result?.body).toContain('USDC');
      expect(result?.body).toContain('0x1234...abcd');
    });

    it('should render DCA notification', () => {
      const order = createOrder({ type: 'dca' });
      const context: NotificationContext = {
        order,
        token: 'ETH',
        boughtAmount: 0.05,
        spentAmount: 100,
        totalBought: 0.5,
        averageCost: 2000,
        nextExecution: '2026-02-05 09:00',
      };

      const result = renderOrderNotification('dca-executed', context);

      expect(result).not.toBeNull();
      expect(result?.title).toContain('DCA');
      expect(result?.body).toContain('ETH');
      expect(result?.body).toContain('100');
    });

    it('should render notification with conditions array', () => {
      const order = createOrder({ type: 'smart-entry' });
      const context: NotificationContext = {
        order,
        token: 'NEW_TOKEN',
        metConditions: ['liquidity > 100K', 'holders > 100', 'buyPressure > 60%'],
        boughtAmount: 1000,
        spentAmount: 50,
        remainingBudget: 150,
      };

      const result = renderOrderNotification('smart-entry-executed', context);

      expect(result).not.toBeNull();
      expect(result?.body).toContain('liquidity > 100K');
      expect(result?.body).toContain('holders > 100');
      expect(result?.body).toContain('buyPressure > 60%');
    });

    it('should return null for unknown event type', () => {
      const order = createOrder();
      const context: NotificationContext = { order };

      const result = renderOrderNotification('unknown-event', context);

      expect(result).toBeNull();
    });

    it('should use token from order params if not provided', () => {
      const order = createOrder();
      const context: NotificationContext = { order };

      const result = renderOrderNotification('order-cancelled', context);

      expect(result).not.toBeNull();
      expect(result?.body).toContain('ETH');
    });
  });

  describe('getOrderEventType', () => {
    it('should return triggered event type', () => {
      const order = createOrder({ type: 'stop-loss' });
      const eventType = getOrderEventType(order, 'triggered');

      expect(eventType).toBe('stop-loss-triggered');
    });

    it('should return created event type', () => {
      const order = createOrder({ type: 'take-profit' });
      const eventType = getOrderEventType(order, 'created');

      expect(eventType).toBe('take-profit-created');
    });

    it('should return generic cancelled event type', () => {
      const order = createOrder();
      const eventType = getOrderEventType(order, 'cancelled');

      expect(eventType).toBe('order-cancelled');
    });

    it('should return generic paused event type', () => {
      const order = createOrder();
      const eventType = getOrderEventType(order, 'paused');

      expect(eventType).toBe('order-paused');
    });

    it('should return resumed event type for active status', () => {
      const order = createOrder();
      const eventType = getOrderEventType(order, 'active');

      expect(eventType).toBe('order-resumed');
    });

    it('should return dual-protection-sl event type', () => {
      const order = createOrder({ type: 'dual-protection' });
      const eventType = getOrderEventType(order, 'triggered', 'sl');

      expect(eventType).toBe('dual-protection-sl-triggered');
    });

    it('should return dual-protection-tp event type', () => {
      const order = createOrder({ type: 'dual-protection' });
      const eventType = getOrderEventType(order, 'triggered', 'tp');

      expect(eventType).toBe('dual-protection-tp-triggered');
    });
  });

  describe('formatConditionSummary', () => {
    it('should format single condition', () => {
      const conditions = {
        operator: 'AND' as const,
        conditions: [{ field: 'price', operator: 'lt', value: 3000 }],
      };

      const summary = formatConditionSummary(conditions);

      expect(summary).toBe('price < 3.0K');
    });

    it('should format multiple conditions with AND', () => {
      const conditions = {
        operator: 'AND' as const,
        conditions: [
          { field: 'price', operator: 'gt', value: 2000 },
          { field: 'volume24h', operator: 'gt', value: 1000000 },
        ],
      };

      const summary = formatConditionSummary(conditions);

      expect(summary).toBe('price > 2.0K AND volume24h > 1.0M');
    });

    it('should format conditions with OR', () => {
      const conditions = {
        operator: 'OR' as const,
        conditions: [
          { field: 'price', operator: 'lt', value: 2500 },
          { field: 'mcap', operator: 'lt', value: 500000000000 },
        ],
      };

      const summary = formatConditionSummary(conditions);

      expect(summary).toBe('price < 2.5K OR mcap < 500.0B');
    });

    it('should format between condition', () => {
      const conditions = {
        operator: 'AND' as const,
        conditions: [{ field: 'price', operator: 'between', value: [2800, 3200] }],
      };

      const summary = formatConditionSummary(conditions);

      expect(summary).toBe('price between 2800 - 3200');
    });

    it('should return empty string for null conditions', () => {
      const summary = formatConditionSummary(null);

      expect(summary).toBe('');
    });

    it('should format operators correctly', () => {
      const testCases = [
        { operator: 'eq', expected: '=' },
        { operator: 'neq', expected: '≠' },
        { operator: 'gt', expected: '>' },
        { operator: 'gte', expected: '≥' },
        { operator: 'lt', expected: '<' },
        { operator: 'lte', expected: '≤' },
      ];

      for (const { operator, expected } of testCases) {
        const conditions = {
          operator: 'AND' as const,
          conditions: [{ field: 'price', operator, value: 1000 }],
        };

        const summary = formatConditionSummary(conditions);
        expect(summary).toContain(expected);
      }
    });
  });
});
