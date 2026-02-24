/**
 * FlowGenerator Tests
 */

import { FlowGenerator, createFlowGenerator } from './flow-generator.js';
import type { Order, ConditionGroup } from './types.js';

describe('FlowGenerator', () => {
  let generator: FlowGenerator;

  beforeEach(() => {
    generator = new FlowGenerator();
  });

  describe('createFlowGenerator', () => {
    it('should create a flow generator instance', () => {
      const gen = createFlowGenerator();
      expect(gen).toBeInstanceOf(FlowGenerator);
    });

    it('should accept custom config', () => {
      const gen = createFlowGenerator({
        defaultCheckInterval: 60000,
        defaultReceiveToken: 'USDT',
        defaultChainId: 'ethereum',
      });
      expect(gen).toBeInstanceOf(FlowGenerator);
    });
  });

  describe('Conditional Sell', () => {
    it('should generate a conditional sell flow', () => {
      const order: Order = {
        id: 'test-order-1',
        type: 'conditional-sell',
        params: {
          token: '0x1234',
          conditions: {
            operator: 'AND',
            conditions: [
              { field: 'price', operator: 'lt', value: 3000 },
            ],
          },
          sellPercent: 100,
        },
        status: 'created',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const flow = generator.generate(order);

      expect(flow).toBeDefined();
      expect(flow.name).toContain('Conditional Sell');
      expect(flow.nodes.length).toBeGreaterThan(0);
      expect(flow.edges.length).toBeGreaterThan(0);
      expect(flow.metadata?.orderId).toBe('test-order-1');

      // Check node types
      const nodeTypes = flow.nodes.map((n) => n.type);
      expect(nodeTypes).toContain('trigger');
      expect(nodeTypes).toContain('action');
      expect(nodeTypes).toContain('condition');
      expect(nodeTypes).toContain('output');
    });

    it('should include notification if channels specified', () => {
      const order: Order = {
        id: 'test-order-2',
        type: 'conditional-sell',
        params: {
          token: '0x1234',
          conditions: {
            operator: 'AND',
            conditions: [{ field: 'price', operator: 'lt', value: 3000 }],
          },
          sellPercent: 50,
          notifyChannels: ['telegram-123'],
        },
        status: 'created',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const flow = generator.generate(order);
      const notifyNode = flow.nodes.find((n) => n.name === 'Send Notification');
      expect(notifyNode).toBeDefined();
    });
  });

  describe('Stop-Loss', () => {
    it('should generate a stop-loss flow', () => {
      const order: Order = {
        id: 'test-sl-1',
        type: 'stop-loss',
        params: {
          token: 'ETH',
          triggerPrice: 3000,
          sellPercent: 100,
        },
        status: 'created',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const flow = generator.generate(order);

      expect(flow.name).toContain('Stop-Loss');
      expect(flow.description).toContain('3000');
      expect(flow.nodes.length).toBeGreaterThan(0);
    });

    it('should include custom receive token', () => {
      const order: Order = {
        id: 'test-sl-2',
        type: 'stop-loss',
        params: {
          token: 'ETH',
          triggerPrice: 3000,
          sellPercent: 100,
          receiveToken: 'DAI',
        },
        status: 'created',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const flow = generator.generate(order);
      const swapNode = flow.nodes.find((n) => n.name.includes('Swap'));
      expect(swapNode?.data.params.toToken).toBe('DAI');
    });
  });

  describe('Take-Profit', () => {
    it('should generate a take-profit flow', () => {
      const order: Order = {
        id: 'test-tp-1',
        type: 'take-profit',
        params: {
          token: 'ETH',
          triggerPrice: 5000,
          sellPercent: 50,
        },
        status: 'created',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const flow = generator.generate(order);

      expect(flow.name).toContain('Take-Profit');
      expect(flow.description).toContain('5000');
    });
  });

  describe('DCA', () => {
    it('should generate a DCA flow with interval', () => {
      const order: Order = {
        id: 'test-dca-1',
        type: 'dca',
        params: {
          token: 'ETH',
          buyToken: 'ETH',
          sellToken: 'USDC',
          amountPerExecution: 100,
          interval: 'weekly',
        },
        status: 'created',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const flow = generator.generate(order);

      expect(flow.name).toContain('DCA');
      expect(flow.nodes.length).toBeGreaterThan(0);

      // Check trigger has weekly interval
      const triggerNode = flow.nodes.find((n) => n.type === 'trigger');
      expect(triggerNode?.data.config.interval).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should generate a DCA flow with conditions', () => {
      const order: Order = {
        id: 'test-dca-2',
        type: 'dca',
        params: {
          token: 'ETH',
          buyToken: 'ETH',
          sellToken: 'USDC',
          amountPerExecution: 100,
          interval: 'daily',
          conditions: {
            operator: 'AND',
            conditions: [{ field: 'priceChange24h', operator: 'lt', value: 0 }],
          },
        },
        status: 'created',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const flow = generator.generate(order);

      // Should have a condition node
      const conditionNode = flow.nodes.find((n) => n.type === 'condition');
      expect(conditionNode).toBeDefined();
    });

    it('should handle numeric interval', () => {
      const order: Order = {
        id: 'test-dca-3',
        type: 'dca',
        params: {
          token: 'ETH',
          buyToken: 'ETH',
          sellToken: 'USDC',
          amountPerExecution: 50,
          interval: 3600000, // 1 hour in ms
        },
        status: 'created',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const flow = generator.generate(order);
      const triggerNode = flow.nodes.find((n) => n.type === 'trigger');
      expect(triggerNode?.data.config.interval).toBe(3600000);
    });
  });

  describe('Smart Entry', () => {
    it('should generate a smart entry flow', () => {
      const order: Order = {
        id: 'test-se-1',
        type: 'smart-entry',
        params: {
          token: '0xNewToken',
          buyToken: '0xNewToken',
          sellToken: 'USDC',
          conditions: {
            operator: 'AND',
            conditions: [
              { field: 'tokenAge', operator: 'lt', value: 604800 },
              { field: 'liquidity', operator: 'gt', value: 100000 },
              { field: 'buyPressure', operator: 'gt', value: 60 },
            ],
          },
          spendAmount: 100,
          maxSpendTotal: 500,
          cooldownMinutes: 60,
        },
        status: 'created',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const flow = generator.generate(order);

      expect(flow.name).toContain('Smart Entry');
      expect(flow.nodes.length).toBeGreaterThan(0);

      // Should have action with limits
      const swapNode = flow.nodes.find((n) => n.name.includes('Smart Entry'));
      expect(swapNode?.data.params.maxTotal).toBe(500);
    });
  });

  describe('Dual Protection', () => {
    it('should generate a dual protection flow', () => {
      const order: Order = {
        id: 'test-dp-1',
        type: 'dual-protection',
        params: {
          token: 'ETH',
          stopLoss: {
            conditions: {
              operator: 'AND',
              conditions: [{ field: 'price', operator: 'lt', value: 2800 }],
            },
            sellPercent: 100,
          },
          takeProfit: {
            conditions: {
              operator: 'AND',
              conditions: [{ field: 'price', operator: 'gt', value: 5000 }],
            },
            sellPercent: 50,
          },
        },
        status: 'created',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const flow = generator.generate(order);

      expect(flow.name).toContain('Dual Protection');

      // Should have both stop-loss and take-profit condition nodes
      const conditionNodes = flow.nodes.filter((n) => n.type === 'condition');
      expect(conditionNodes.length).toBe(2);

      // Should have two swap actions
      const swapNodes = flow.nodes.filter((n) => n.name.includes('Execute'));
      expect(swapNodes.length).toBe(2);
    });
  });

  describe('Trailing Stop', () => {
    it('should generate a trailing stop flow', () => {
      const order: Order = {
        id: 'test-ts-1',
        type: 'trailing-stop',
        params: {
          token: 'ETH',
          trailPercent: 10,
          sellPercent: 100,
        },
        status: 'created',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const flow = generator.generate(order);

      expect(flow.name).toContain('Trailing Stop');
      expect(flow.nodes.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should throw for unsupported order type', () => {
      const order = {
        id: 'test-unknown',
        type: 'unknown-type' as any,
        params: {},
        status: 'created',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => generator.generate(order)).toThrow('Unsupported order type');
    });

    it('should use default config values', () => {
      const order: Order = {
        id: 'test-defaults',
        type: 'stop-loss',
        params: {
          token: 'ETH',
          triggerPrice: 3000,
          sellPercent: 100,
        },
        status: 'created',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const flow = generator.generate(order);

      // Should use default receive token (USDC)
      const swapNode = flow.nodes.find((n) => n.name.includes('Swap'));
      expect(swapNode?.data.params.toToken).toBe('USDC');

      // Should use default chain (base)
      expect(swapNode?.data.params.chainId).toBe('base');
    });
  });
});
