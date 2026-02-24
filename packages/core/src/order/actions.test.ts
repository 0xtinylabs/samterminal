/**
 * Order Actions Tests
 */

import {
  createOrderCreateAction,
  createOrderListAction,
  createOrderGetAction,
  createOrderCancelAction,
  createOrderPauseAction,
  createOrderResumeAction,
  createOrderStatsAction,
  getOrderActions,
} from './actions.js';
import { OrderTemplates } from './order-templates.js';
import type { ActionContext } from '../types/index.js';

describe('Order Actions', () => {
  let templates: OrderTemplates;
  let getTemplates: () => OrderTemplates | null;

  beforeEach(() => {
    templates = new OrderTemplates({ autoActivate: false });
    getTemplates = () => templates;
  });

  afterEach(() => {
    templates.clear();
  });

  const createContext = (input: unknown): ActionContext => ({
    input,
    runtime: {} as never,
    caller: { name: 'test', type: 'action' },
  });

  describe('createOrderCreateAction', () => {
    it('should create an order', async () => {
      const action = createOrderCreateAction(getTemplates);

      const result = await action.execute(
        createContext({
          type: 'stop-loss',
          params: {
            token: 'ETH',
            triggerPrice: 3000,
            sellPercent: 100,
          },
        }),
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('orderId');
      expect(result.data).toHaveProperty('flowId');
    });

    it('should fail without type', async () => {
      const action = createOrderCreateAction(getTemplates);

      const result = await action.execute(
        createContext({
          params: { token: 'ETH' },
        }),
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('type');
    });

    it('should fail without params', async () => {
      const action = createOrderCreateAction(getTemplates);

      const result = await action.execute(
        createContext({
          type: 'stop-loss',
        }),
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('params');
    });

    it('should fail when templates not initialized', async () => {
      const action = createOrderCreateAction(() => null);

      const result = await action.execute(
        createContext({
          type: 'stop-loss',
          params: { token: 'ETH', triggerPrice: 3000, sellPercent: 100 },
        }),
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not initialized');
    });
  });

  describe('createOrderListAction', () => {
    it('should list orders', async () => {
      const action = createOrderListAction(getTemplates);

      // Create some orders first
      await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });
      await templates.create('take-profit', {
        token: 'BTC',
        triggerPrice: 50000,
        sellPercent: 50,
      });

      const result = await action.execute(createContext({}));

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('orders');
      expect(result.data).toHaveProperty('total', 2);
    });

    it('should filter by status', async () => {
      const action = createOrderListAction(getTemplates);

      const { order } = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });
      await templates.activate(order.id);

      await templates.create('stop-loss', {
        token: 'BTC',
        triggerPrice: 50000,
        sellPercent: 100,
      });

      const result = await action.execute(createContext({ status: 'active' }));

      expect(result.success).toBe(true);
      expect((result.data as { total: number }).total).toBe(1);
    });
  });

  describe('createOrderGetAction', () => {
    it('should get an order by ID', async () => {
      const action = createOrderGetAction(getTemplates);

      const { order } = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });

      const result = await action.execute(createContext({ orderId: order.id }));

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id', order.id);
      expect(result.data).toHaveProperty('type', 'stop-loss');
    });

    it('should fail for non-existent order', async () => {
      const action = createOrderGetAction(getTemplates);

      const result = await action.execute(createContext({ orderId: 'non-existent' }));

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail without orderId', async () => {
      const action = createOrderGetAction(getTemplates);

      const result = await action.execute(createContext({}));

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('createOrderCancelAction', () => {
    it('should cancel an order', async () => {
      const action = createOrderCancelAction(getTemplates);

      const { order } = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });

      const result = await action.execute(createContext({ orderId: order.id }));

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('status', 'cancelled');

      const cancelled = templates.get(order.id);
      expect(cancelled?.status).toBe('cancelled');
    });

    it('should fail for already cancelled order', async () => {
      const action = createOrderCancelAction(getTemplates);

      const { order } = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });

      await templates.cancel(order.id);
      const result = await action.execute(createContext({ orderId: order.id }));

      expect(result.success).toBe(false);
    });
  });

  describe('createOrderPauseAction', () => {
    it('should pause an active order', async () => {
      const action = createOrderPauseAction(getTemplates);

      const { order } = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });
      await templates.activate(order.id);

      const result = await action.execute(createContext({ orderId: order.id }));

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('status', 'paused');
    });

    it('should fail for non-active order', async () => {
      const action = createOrderPauseAction(getTemplates);

      const { order } = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });

      const result = await action.execute(createContext({ orderId: order.id }));

      expect(result.success).toBe(false);
    });
  });

  describe('createOrderResumeAction', () => {
    it('should resume a paused order', async () => {
      const action = createOrderResumeAction(getTemplates);

      const { order } = await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });
      await templates.activate(order.id);
      await templates.pause(order.id);

      const result = await action.execute(createContext({ orderId: order.id }));

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('status', 'active');
    });
  });

  describe('createOrderStatsAction', () => {
    it('should return order statistics', async () => {
      const action = createOrderStatsAction(getTemplates);

      await templates.create('stop-loss', {
        token: 'ETH',
        triggerPrice: 3000,
        sellPercent: 100,
      });
      await templates.create('take-profit', {
        token: 'ETH',
        triggerPrice: 5000,
        sellPercent: 50,
      });

      const result = await action.execute(createContext({}));

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('total', 2);
      expect(result.data).toHaveProperty('byType');
    });
  });

  describe('getOrderActions', () => {
    it('should return all actions', () => {
      const actions = getOrderActions(getTemplates);

      expect(actions).toHaveLength(7);
      expect(actions.map((a) => a.name)).toEqual([
        'order:create',
        'order:list',
        'order:get',
        'order:cancel',
        'order:pause',
        'order:resume',
        'order:stats',
      ]);
    });
  });
});
