/**
 * Progress Provider tests
 */


import { createProgressProvider } from './progress.js';
import { InMemoryStorage, createInMemoryStorage } from '../utils/storage.js';
import { FlowEngine, createFlowEngine } from '../utils/flow-engine.js';
import type { ProviderContext } from '@samterminal/core';
import type { UserProfile, OnboardingFlow, OnboardingPluginConfig } from '../types/index.js';

describe('Progress Provider', () => {
  let storage: InMemoryStorage;
  let flowEngine: FlowEngine;
  let config: OnboardingPluginConfig;
  let provider: ReturnType<typeof createProgressProvider>;
  let testUser: UserProfile;
  let testFlow: OnboardingFlow;

  beforeEach(async () => {
    storage = createInMemoryStorage();
    config = {};
    flowEngine = createFlowEngine(storage, config);
    provider = createProgressProvider(
      () => storage,
      () => flowEngine,
      config,
    );

    testUser = await storage.createUser({
      name: 'Test User',
      status: 'onboarding',
    });

    testFlow = await storage.createFlow({
      name: 'Test Flow',
      steps: [
        {
          id: 'step1',
          name: 'Step 1',
          type: 'info',
          order: 1,
        },
        {
          id: 'step2',
          name: 'Step 2',
          type: 'action',
          order: 2,
        },
      ],
      active: true,
    });
  });

  describe('metadata', () => {
    it('should have correct name', () => {
      expect(provider.name).toBe('onboarding:progress');
    });

    it('should have correct type', () => {
      expect(provider.type).toBe('token');
    });

    it('should have correct description', () => {
      expect(provider.description).toBe('Get user onboarding progress');
    });
  });

  describe('get', () => {
    it('should require userId', async () => {
      const context: ProviderContext = {
        query: { flowId: testFlow.id },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
    });

    it('should require flowId when no default is set', async () => {
      const context: ProviderContext = {
        query: { userId: testUser.id },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Flow ID is required');
    });

    it('should use default flowId from config', async () => {
      config.defaultFlowId = testFlow.id;
      provider = createProgressProvider(
        () => storage,
        () => flowEngine,
        config,
      );

      // Start the flow
      await flowEngine.startFlow(testUser.id, testFlow.id);

      const context: ProviderContext = {
        query: { userId: testUser.id },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data?.hasStarted).toBe(true);
    });

    it('should return hasStarted: false when no progress exists', async () => {
      const context: ProviderContext = {
        query: {
          userId: testUser.id,
          flowId: testFlow.id,
        },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data?.hasStarted).toBe(false);
      expect(result.data?.progress).toBeNull();
    });

    it('should return progress when exists', async () => {
      await flowEngine.startFlow(testUser.id, testFlow.id);

      const context: ProviderContext = {
        query: {
          userId: testUser.id,
          flowId: testFlow.id,
        },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data?.hasStarted).toBe(true);
      expect(result.data?.progress).toBeDefined();
      expect(result.data?.progress.userId).toBe(testUser.id);
    });

    it('should include current step when requested', async () => {
      await flowEngine.startFlow(testUser.id, testFlow.id);

      const context: ProviderContext = {
        query: {
          userId: testUser.id,
          flowId: testFlow.id,
          includeStep: true,
        },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data?.currentStep).toBeDefined();
      expect(result.data?.currentStep.id).toBe('step1');
    });

    it('should not include current step by default', async () => {
      await flowEngine.startFlow(testUser.id, testFlow.id);

      const context: ProviderContext = {
        query: {
          userId: testUser.id,
          flowId: testFlow.id,
        },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data?.currentStep).toBeNull();
    });

    it('should include timestamp in response', async () => {
      await flowEngine.startFlow(testUser.id, testFlow.id);

      const context: ProviderContext = {
        query: {
          userId: testUser.id,
          flowId: testFlow.id,
        },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });
});
