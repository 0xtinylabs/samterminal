/**
 * Complete Step Action tests
 */


import { createCompleteStepAction } from './complete-step.js';
import { InMemoryStorage, createInMemoryStorage } from '../utils/storage.js';
import { FlowEngine, createFlowEngine } from '../utils/flow-engine.js';
import type { ActionContext } from '@samterminal/core';
import type { OnboardingPluginConfig, UserProfile, OnboardingFlow } from '../types/index.js';

describe('Complete Step Action', () => {
  let storage: InMemoryStorage;
  let flowEngine: FlowEngine;
  let action: ReturnType<typeof createCompleteStepAction>;
  let config: OnboardingPluginConfig;
  let testUser: UserProfile;
  let testFlow: OnboardingFlow;

  beforeEach(async () => {
    storage = createInMemoryStorage();
    config = {};
    flowEngine = createFlowEngine(storage, config);
    action = createCompleteStepAction(
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

    // Start the flow
    await flowEngine.startFlow(testUser.id, testFlow.id);
  });

  describe('metadata', () => {
    it('should have correct name', () => {
      expect(action.name).toBe('onboarding:complete-step');
    });

    it('should have correct description', () => {
      expect(action.description).toBe('Complete an onboarding step');
    });
  });

  describe('execute', () => {
    it('should require userId', async () => {
      const context: ActionContext = {
        input: {
          stepId: 'step1',
          flowId: testFlow.id,
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
    });

    it('should require stepId', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
          flowId: testFlow.id,
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Step ID is required');
    });

    it('should require flowId when no default is set', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
          stepId: 'step1',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Flow ID is required');
    });

    it('should use default flowId from config', async () => {
      config.defaultFlowId = testFlow.id;
      action = createCompleteStepAction(
        () => storage,
        () => flowEngine,
        config,
      );

      const context: ActionContext = {
        input: {
          userId: testUser.id,
          stepId: 'step1',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
    });

    it('should fail for non-existent user', async () => {
      const context: ActionContext = {
        input: {
          userId: 'non-existent',
          stepId: 'step1',
          flowId: testFlow.id,
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should complete a step', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
          stepId: 'step1',
          flowId: testFlow.id,
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.progress.completedSteps).toContain('step1');
      expect(result.data?.isFlowCompleted).toBe(false);
    });

    it('should return next step details', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
          stepId: 'step1',
          flowId: testFlow.id,
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.nextStep).toBeDefined();
      expect(result.data?.nextStep.id).toBe('step2');
    });

    it('should skip a step', async () => {
      // Create flow with skippable step
      const flowWithSkippable = await storage.createFlow({
        name: 'Skippable Flow',
        steps: [
          {
            id: 'skip-step',
            name: 'Skip Step',
            type: 'info',
            order: 1,
            required: false,
            skippable: true,
          },
        ],
        active: true,
      });
      await flowEngine.startFlow(testUser.id, flowWithSkippable.id);

      const context: ActionContext = {
        input: {
          userId: testUser.id,
          stepId: 'skip-step',
          flowId: flowWithSkippable.id,
          skip: true,
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.progress.skippedSteps).toContain('skip-step');
    });

    it('should complete step with data', async () => {
      // Create flow with input step
      const flowWithInput = await storage.createFlow({
        name: 'Input Flow',
        steps: [
          {
            id: 'input-step',
            name: 'Input Step',
            type: 'input',
            order: 1,
            inputs: [
              {
                id: 'name',
                name: 'name',
                type: 'text',
                label: 'Name',
                required: false,
              },
            ],
          },
        ],
        active: true,
      });
      await flowEngine.startFlow(testUser.id, flowWithInput.id);

      const context: ActionContext = {
        input: {
          userId: testUser.id,
          stepId: 'input-step',
          flowId: flowWithInput.id,
          data: { name: 'Test Name' },
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.progress.stepData['input-step']).toEqual({ name: 'Test Name' });
    });

    it('should return validation errors', async () => {
      // Create flow with required input
      const flowWithRequired = await storage.createFlow({
        name: 'Required Flow',
        steps: [
          {
            id: 'required-step',
            name: 'Required Step',
            type: 'input',
            order: 1,
            inputs: [
              {
                id: 'email',
                name: 'email',
                type: 'email',
                label: 'Email',
                required: true,
              },
            ],
          },
        ],
        active: true,
      });
      await flowEngine.startFlow(testUser.id, flowWithRequired.id);

      const context: ActionContext = {
        input: {
          userId: testUser.id,
          stepId: 'required-step',
          flowId: flowWithRequired.id,
          data: {},
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.data?.validationErrors).toHaveProperty('email');
    });

    it('should complete flow and update user status', async () => {
      // Complete first step
      await action.execute({
        input: {
          userId: testUser.id,
          stepId: 'step1',
          flowId: testFlow.id,
        },
        pluginName: 'onboarding',
      });

      // Complete second (last) step
      const result = await action.execute({
        input: {
          userId: testUser.id,
          stepId: 'step2',
          flowId: testFlow.id,
        },
        pluginName: 'onboarding',
      });

      expect(result.success).toBe(true);
      expect(result.data?.isFlowCompleted).toBe(true);
      expect(result.data?.nextStep).toBeNull();

      // Check user status updated to active
      const updatedUser = await storage.getUser(testUser.id);
      expect(updatedUser?.status).toBe('active');
    });

    it('should return progress with all data', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
          stepId: 'step1',
          flowId: testFlow.id,
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.progress.userId).toBe(testUser.id);
      expect(result.data?.progress.flowId).toBe(testFlow.id);
      expect(result.data?.progress.progressPercent).toBeGreaterThan(0);
    });
  });
});
