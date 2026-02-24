/**
 * OrderTemplates Tests
 */

import {
  OrderTemplates,
  createOrderTemplates,
  createStopLoss,
  createTakeProfit,
  createDCA,
  createConditionalSell,
} from './order-templates.js';
import type { ConditionGroup } from './types.js';

describe('OrderTemplates', () => {
  let templates: OrderTemplates;

  beforeEach(() => {
    templates = new OrderTemplates({ autoActivate: false });
  });

  afterEach(() => {
    templates.clear();
  });

  describe('createOrderTemplates', () => {
    it('should create an instance', () => {
      const t = createOrderTemplates();
      expect(t).toBeInstanceOf(OrderTemplates);
    });

    it('should accept config', () => {
      const t = createOrderTemplates({
        autoActivate: false,
        flowGenerator: { defaultCheckInterval: 60000 },
      });
      expect(t).toBeInstanceOf(OrderTemplates);
    });
  });

  describe('create', () => {
    it('should create a stop-loss order', async () => {
      const result = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });

      expect(result.order).toBeDefined();
      expect(result.order.type).toBe('stop-loss');
      expect(result.order.status).toBe('created');
      expect(result.flow).toBeDefined();
      expect(result.flow.name).toContain('Stop-Loss');
    });

    it('should create a take-profit order', async () => {
      const result = await templates.create('take-profit', {
        token: 'ETH',
        triggerPrice: 5000,
        sellPercent: 50,
      });

      expect(result.order.type).toBe('take-profit');
      expect(result.flow.name).toContain('Take-Profit');
    });

    it('should create a conditional-sell order', async () => {
      const conditions: ConditionGroup = {
        operator: 'OR',
        conditions: [
          { field: 'price', operator: 'lt', value: 3000 },
          { field: 'mcap', operator: 'lt', value: 300_000_000_000 },
        ],
      };

      const result = await templates.create('conditional-sell', {
        token: 'ETH',
        conditions,
        sellPercent: 100,
      });

      expect(result.order.type).toBe('conditional-sell');
    });

    it('should create a DCA order', async () => {
      const result = await templates.create('dca', {
        token: 'ETH',
        buyToken: 'ETH',
        sellToken: 'USDC',
        amountPerExecution: 100,
        interval: 'weekly',
      });

      expect(result.order.type).toBe('dca');
      expect(result.flow.name).toContain('DCA');
    });

    it('should auto-generate order ID if not provided', async () => {
      const result = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });

      expect(result.order.id).toBeDefined();
      expect(result.order.id.length).toBeGreaterThan(0);
    });

    it('should use provided order ID', async () => {
      const result = await templates.create('stop-loss', {
        id: 'custom-id-123',
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });

      expect(result.order.id).toBe('custom-id-123');
    });

    it('should auto-activate order when config enabled', async () => {
      const autoTemplates = new OrderTemplates({ autoActivate: true });

      const result = await autoTemplates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });

      expect(result.order.status).toBe('active');
    });
  });

  describe('activate', () => {
    it('should activate a created order', async () => {
      const { order } = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });

      const activated = await templates.activate(order.id);
      expect(activated).toBe(true);

      const updated = templates.get(order.id);
      expect(updated?.status).toBe('active');
    });

    it('should return false for non-existent order', async () => {
      const activated = await templates.activate('non-existent');
      expect(activated).toBe(false);
    });

    it('should not activate completed order', async () => {
      const { order } = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });

      templates.updateStatus(order.id, 'completed');
      const activated = await templates.activate(order.id);
      expect(activated).toBe(false);
    });
  });

  describe('pause', () => {
    it('should pause an active order', async () => {
      const { order } = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });

      await templates.activate(order.id);
      const paused = await templates.pause(order.id);
      expect(paused).toBe(true);

      const updated = templates.get(order.id);
      expect(updated?.status).toBe('paused');
    });

    it('should not pause a non-active order', async () => {
      const { order } = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });

      const paused = await templates.pause(order.id);
      expect(paused).toBe(false);
    });
  });

  describe('cancel', () => {
    it('should cancel an active order', async () => {
      const { order } = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });

      await templates.activate(order.id);
      const cancelled = await templates.cancel(order.id);
      expect(cancelled).toBe(true);

      const updated = templates.get(order.id);
      expect(updated?.status).toBe('cancelled');
    });

    it('should cancel a created order', async () => {
      const { order } = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });

      const cancelled = await templates.cancel(order.id);
      expect(cancelled).toBe(true);
    });

    it('should not cancel a completed order', async () => {
      const { order } = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });

      templates.updateStatus(order.id, 'completed');
      const cancelled = await templates.cancel(order.id);
      expect(cancelled).toBe(false);
    });
  });

  describe('get', () => {
    it('should get an order by ID', async () => {
      const { order } = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });

      const found = templates.get(order.id);
      expect(found).toEqual(order);
    });

    it('should return undefined for non-existent ID', () => {
      const found = templates.get('non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      // Create several orders
      await templates.create('stop-loss', { token: 'ETH', triggerPrice: 3000, sellPercent: 100 });
      await templates.create('take-profit', { token: 'ETH', triggerPrice: 5000, sellPercent: 50 });
      await templates.create('stop-loss', { token: 'BTC', triggerPrice: 50000, sellPercent: 100 });
    });

    it('should list all orders', () => {
      const orders = templates.list();
      expect(orders.length).toBe(3);
    });

    it('should filter by status', async () => {
      const { order } = await templates.create('stop-loss', {
        token: 'SOL',
        triggerPrice: 100,
        sellPercent: 100,
      });
      await templates.activate(order.id);

      const activeOrders = templates.list({ status: 'active' });
      expect(activeOrders.length).toBe(1);
      expect(activeOrders[0].id).toBe(order.id);
    });

    it('should filter by type', () => {
      const slOrders = templates.list({ type: 'stop-loss' });
      expect(slOrders.length).toBe(2);

      const tpOrders = templates.list({ type: 'take-profit' });
      expect(tpOrders.length).toBe(1);
    });

    it('should filter by token', () => {
      const ethOrders = templates.list({ token: 'ETH' });
      expect(ethOrders.length).toBe(2);

      const btcOrders = templates.list({ token: 'BTC' });
      expect(btcOrders.length).toBe(1);
    });

    it('should support pagination', () => {
      const page1 = templates.list({ limit: 2 });
      expect(page1.length).toBe(2);

      const page2 = templates.list({ limit: 2, offset: 2 });
      expect(page2.length).toBe(1);
    });

    it('should sort by creation date (newest first)', () => {
      const orders = templates.list();
      for (let i = 1; i < orders.length; i++) {
        expect(orders[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
          orders[i].createdAt.getTime(),
        );
      }
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const { order } = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });

      const updated = templates.updateStatus(order.id, 'triggered');
      expect(updated).toBe(true);

      const found = templates.get(order.id);
      expect(found?.status).toBe('triggered');
      expect(found?.triggeredAt).toBeDefined();
    });

    it('should set completedAt for completed status', async () => {
      const { order } = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });

      templates.updateStatus(order.id, 'completed');
      const found = templates.get(order.id);
      expect(found?.completedAt).toBeDefined();
    });

    it('should set error message for failed status', async () => {
      const { order } = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });

      templates.updateStatus(order.id, 'failed', 'Insufficient balance');
      const found = templates.get(order.id);
      expect(found?.error).toBe('Insufficient balance');
    });
  });

  describe('getStats', () => {
    it('should return order statistics', async () => {
      await templates.create('stop-loss', { token: 'ETH', triggerPrice: 3000, sellPercent: 100 });
      await templates.create('take-profit', { token: 'ETH', triggerPrice: 5000, sellPercent: 50 });

      const { order } = await templates.create('stop-loss', {
        token: 'BTC',
        triggerPrice: 50000,
        sellPercent: 100,
      });
      await templates.activate(order.id);

      const stats = templates.getStats();

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(1);
      expect(stats.byType['stop-loss']).toBe(2);
      expect(stats.byType['take-profit']).toBe(1);
    });
  });

  describe('Convenience Functions', () => {
    it('createStopLoss should create a stop-loss order', async () => {
      const result = await createStopLoss(templates, 'ETH', 3000, 100);
      expect(result.order.type).toBe('stop-loss');
    });

    it('createTakeProfit should create a take-profit order', async () => {
      const result = await createTakeProfit(templates, 'ETH', 5000, 50);
      expect(result.order.type).toBe('take-profit');
    });

    it('createDCA should create a DCA order', async () => {
      const result = await createDCA(templates, 'ETH', 'USDC', 100, 'weekly');
      expect(result.order.type).toBe('dca');
    });

    it('createConditionalSell should create a conditional-sell order', async () => {
      const conditions: ConditionGroup = {
        operator: 'AND',
        conditions: [{ field: 'price', operator: 'lt', value: 3000 }],
      };

      const result = await createConditionalSell(templates, 'ETH', conditions, 100);
      expect(result.order.type).toBe('conditional-sell');
    });
  });

  describe('getConditionEvaluator', () => {
    it('should return the condition evaluator instance', () => {
      const evaluator = templates.getConditionEvaluator();
      expect(evaluator).toBeDefined();
    });
  });

  describe('getFlowGenerator', () => {
    it('should return the flow generator instance', () => {
      const generator = templates.getFlowGenerator();
      expect(generator).toBeDefined();
    });
  });
});
