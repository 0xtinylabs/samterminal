/**
 * Flow Provider tests
 */


import { createFlowProvider } from './flow.js';
import { InMemoryStorage, createInMemoryStorage } from '../utils/storage.js';
import type { ProviderContext } from '@samterminal/core';
import type { OnboardingFlow, OnboardingPluginConfig } from '../types/index.js';

describe('Flow Provider', () => {
  let storage: InMemoryStorage;
  let config: OnboardingPluginConfig;
  let provider: ReturnType<typeof createFlowProvider>;
  let testFlow: OnboardingFlow;

  beforeEach(async () => {
    storage = createInMemoryStorage();
    config = {};
    provider = createFlowProvider(() => storage, config);

    testFlow = await storage.createFlow({
      name: 'Test Flow',
      steps: [
        {
          id: 'step1',
          name: 'Step 1',
          type: 'info',
          order: 1,
        },
      ],
      active: true,
    });
  });

  describe('metadata', () => {
    it('should have correct name', () => {
      expect(provider.name).toBe('onboarding:flow');
    });

    it('should have correct type', () => {
      expect(provider.type).toBe('token');
    });

    it('should have correct description', () => {
      expect(provider.description).toBe('Get onboarding flow definition');
    });
  });

  describe('get - single flow', () => {
    it('should require flowId when no default is set', async () => {
      const context: ProviderContext = {
        query: {},
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Flow ID is required');
    });

    it('should use default flowId from config', async () => {
      config.defaultFlowId = testFlow.id;
      provider = createFlowProvider(() => storage, config);

      const context: ProviderContext = {
        query: {},
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(testFlow.id);
    });

    it('should return flow by flowId', async () => {
      const context: ProviderContext = {
        query: { flowId: testFlow.id },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(testFlow.id);
      expect(result.data?.name).toBe('Test Flow');
      expect(result.data?.steps).toHaveLength(1);
    });

    it('should return error for non-existent flow', async () => {
      const context: ProviderContext = {
        query: { flowId: 'non-existent' },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Flow non-existent not found');
    });
  });

  describe('get - list flows', () => {
    beforeEach(async () => {
      // Add more flows
      await storage.createFlow({
        name: 'Active Flow 2',
        steps: [],
        active: true,
      });

      await storage.createFlow({
        name: 'Inactive Flow',
        steps: [],
        active: false,
      });
    });

    it('should list all flows when listAll is true', async () => {
      const context: ProviderContext = {
        query: { listAll: true },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data?.flows).toHaveLength(3);
    });

    it('should filter active flows', async () => {
      const context: ProviderContext = {
        query: { listAll: true, active: true },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data?.flows).toHaveLength(2);
      expect(result.data?.flows.every((f: OnboardingFlow) => f.active)).toBe(true);
    });

    it('should filter inactive flows', async () => {
      const context: ProviderContext = {
        query: { listAll: true, active: false },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data?.flows).toHaveLength(1);
      expect(result.data?.flows[0].name).toBe('Inactive Flow');
    });
  });

  describe('get - timestamp', () => {
    it('should include timestamp in response', async () => {
      const context: ProviderContext = {
        query: { flowId: testFlow.id },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });
});
