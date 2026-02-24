/**
 * Start Flow Action tests
 */


import { createStartFlowAction } from './start-flow.js';
import { InMemoryStorage, createInMemoryStorage } from '../utils/storage.js';
import { FlowEngine, createFlowEngine } from '../utils/flow-engine.js';
import type { ActionContext } from '@samterminal/core';
import type { OnboardingPluginConfig, UserProfile, OnboardingFlow } from '../types/index.js';

describe('Start Flow Action', () => {
  let storage: InMemoryStorage;
  let flowEngine: FlowEngine;
  let action: ReturnType<typeof createStartFlowAction>;
  let config: OnboardingPluginConfig;
  let testUser: UserProfile;
  let testFlow: OnboardingFlow;

  beforeEach(async () => {
    storage = createInMemoryStorage();
    config = {};
    flowEngine = createFlowEngine(storage, config);
    action = createStartFlowAction(
      () => storage,
      () => flowEngine,
      config,
    );

    testUser = await storage.createUser({
      name: 'Test User',
      status: 'new',
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
      expect(action.name).toBe('onboarding:start-flow');
    });

    it('should have correct description', () => {
      expect(action.description).toBe('Start an onboarding flow for a user');
    });
  });

  describe('execute', () => {
    it('should require userId', async () => {
      const context: ActionContext = {
        input: {},
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
    });

    it('should require flowId when no default is set', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Flow ID is required (no default flow configured)');
    });

    it('should use default flowId from config', async () => {
      config.defaultFlowId = testFlow.id;
      action = createStartFlowAction(
        () => storage,
        () => flowEngine,
        config,
      );

      const context: ActionContext = {
        input: {
          userId: testUser.id,
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.progress.flowId).toBe(testFlow.id);
    });

    it('should fail for non-existent user', async () => {
      const context: ActionContext = {
        input: {
          userId: 'non-existent',
          flowId: testFlow.id,
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should fail for non-existent flow', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
          flowId: 'non-existent',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Flow non-existent not found');
    });

    it('should fail for inactive flow', async () => {
      const inactiveFlow = await storage.createFlow({
        name: 'Inactive Flow',
        steps: [{ id: 'step1', name: 'Step 1', type: 'info', order: 1 }],
        active: false,
      });

      const context: ActionContext = {
        input: {
          userId: testUser.id,
          flowId: inactiveFlow.id,
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Flow is not active');
    });

    it('should start flow and return progress', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
          flowId: testFlow.id,
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.progress).toBeDefined();
      expect(result.data?.progress.userId).toBe(testUser.id);
      expect(result.data?.progress.flowId).toBe(testFlow.id);
      expect(result.data?.progress.currentStepId).toBe('step1');
    });

    it('should return current step details', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
          flowId: testFlow.id,
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.currentStep).toBeDefined();
      expect(result.data?.currentStep.id).toBe('step1');
      expect(result.data?.currentStep.name).toBe('Step 1');
    });

    it('should return flow info', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
          flowId: testFlow.id,
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.flow).toBeDefined();
      expect(result.data?.flow.id).toBe(testFlow.id);
      expect(result.data?.flow.name).toBe('Test Flow');
      expect(result.data?.flow.totalSteps).toBe(2);
    });

    it('should update user status to onboarding when new', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
          flowId: testFlow.id,
        },
        pluginName: 'onboarding',
      };

      await action.execute(context);

      const updatedUser = await storage.getUser(testUser.id);
      expect(updatedUser?.status).toBe('onboarding');
    });

    it('should not change status if user is already onboarding', async () => {
      await storage.updateUser(testUser.id, { status: 'onboarding' });

      const context: ActionContext = {
        input: {
          userId: testUser.id,
          flowId: testFlow.id,
        },
        pluginName: 'onboarding',
      };

      await action.execute(context);

      const updatedUser = await storage.getUser(testUser.id);
      expect(updatedUser?.status).toBe('onboarding');
    });

    it('should not change status if user is already active', async () => {
      await storage.updateUser(testUser.id, { status: 'active' });

      const context: ActionContext = {
        input: {
          userId: testUser.id,
          flowId: testFlow.id,
        },
        pluginName: 'onboarding',
      };

      await action.execute(context);

      const updatedUser = await storage.getUser(testUser.id);
      expect(updatedUser?.status).toBe('active');
    });
  });
});
