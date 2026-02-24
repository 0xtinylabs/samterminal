/**
 * FlowEngine tests
 */


import { FlowEngine, createFlowEngine } from './flow-engine.js';
import { InMemoryStorage, createInMemoryStorage } from './storage.js';
import type { OnboardingFlow, OnboardingStep } from '../types/index.js';

describe('FlowEngine', () => {
  let storage: InMemoryStorage;
  let engine: FlowEngine;
  let testFlow: OnboardingFlow;

  beforeEach(async () => {
    storage = createInMemoryStorage();
    engine = createFlowEngine(storage, {});

    // Create a test flow with steps
    testFlow = await storage.createFlow({
      name: 'Test Flow',
      steps: [
        {
          id: 'step1',
          name: 'Step 1',
          type: 'info',
          order: 1,
          required: true,
        },
        {
          id: 'step2',
          name: 'Step 2',
          type: 'input',
          order: 2,
          required: false,
          skippable: true,
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
        {
          id: 'step3',
          name: 'Step 3',
          type: 'action',
          order: 3,
          dependsOn: ['step1'],
        },
      ],
      active: true,
    });
  });

  describe('createFlowEngine', () => {
    it('should create a FlowEngine instance', () => {
      const fe = createFlowEngine(storage);
      expect(fe).toBeInstanceOf(FlowEngine);
    });
  });

  describe('startFlow', () => {
    it('should create new progress for a user', async () => {
      const progress = await engine.startFlow('user1', testFlow.id);

      expect(progress.userId).toBe('user1');
      expect(progress.flowId).toBe(testFlow.id);
      expect(progress.currentStepId).toBe('step1');
      expect(progress.completedSteps).toEqual([]);
      expect(progress.progressPercent).toBe(0);
      expect(progress.isCompleted).toBe(false);
    });

    it('should return existing progress if not completed', async () => {
      const first = await engine.startFlow('user1', testFlow.id);
      const second = await engine.startFlow('user1', testFlow.id);

      expect(first).toEqual(second);
    });

    it('should throw for non-existent flow', async () => {
      await expect(engine.startFlow('user1', 'non-existent'))
        .rejects.toThrow('Flow non-existent not found');
    });

    it('should throw for flow with no steps', async () => {
      const emptyFlow = await storage.createFlow({
        name: 'Empty',
        steps: [],
      });

      await expect(engine.startFlow('user1', emptyFlow.id))
        .rejects.toThrow('Flow has no steps');
    });
  });

  describe('completeStep', () => {
    it('should complete a step and advance to next', async () => {
      await engine.startFlow('user1', testFlow.id);

      const result = await engine.completeStep({
        userId: 'user1',
        flowId: testFlow.id,
        stepId: 'step1',
      });

      expect(result.success).toBe(true);
      expect(result.nextStepId).toBe('step2');
      expect(result.isFlowCompleted).toBe(false);
      expect(result.progress.completedSteps).toContain('step1');
    });

    it('should auto-start flow if not started', async () => {
      const result = await engine.completeStep({
        userId: 'user1',
        flowId: testFlow.id,
        stepId: 'step1',
      });

      expect(result.success).toBe(true);
      expect(result.progress).toBeDefined();
    });

    it('should return error for non-existent flow', async () => {
      const result = await engine.completeStep({
        userId: 'user1',
        flowId: 'non-existent',
        stepId: 'step1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should return error for non-existent step', async () => {
      await engine.startFlow('user1', testFlow.id);

      const result = await engine.completeStep({
        userId: 'user1',
        flowId: testFlow.id,
        stepId: 'non-existent',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Step non-existent not found');
    });

    it('should allow re-completing already completed step', async () => {
      await engine.startFlow('user1', testFlow.id);

      await engine.completeStep({
        userId: 'user1',
        flowId: testFlow.id,
        stepId: 'step1',
      });

      const result = await engine.completeStep({
        userId: 'user1',
        flowId: testFlow.id,
        stepId: 'step1',
      });

      expect(result.success).toBe(true);
    });

    it('should skip optional step when skip=true', async () => {
      await engine.startFlow('user1', testFlow.id);
      await engine.completeStep({
        userId: 'user1',
        flowId: testFlow.id,
        stepId: 'step1',
      });

      const result = await engine.completeStep({
        userId: 'user1',
        flowId: testFlow.id,
        stepId: 'step2',
        skip: true,
      });

      expect(result.success).toBe(true);
      expect(result.progress.skippedSteps).toContain('step2');
    });

    it('should not skip required step without allowSkipRequired config', async () => {
      await engine.startFlow('user1', testFlow.id);

      const result = await engine.completeStep({
        userId: 'user1',
        flowId: testFlow.id,
        stepId: 'step1',
        skip: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot skip required step');
    });

    it('should allow skipping required step with allowSkipRequired config', async () => {
      const permissiveEngine = createFlowEngine(storage, { allowSkipRequired: true });
      await permissiveEngine.startFlow('user1', testFlow.id);

      const result = await permissiveEngine.completeStep({
        userId: 'user1',
        flowId: testFlow.id,
        stepId: 'step1',
        skip: true,
      });

      expect(result.success).toBe(true);
      expect(result.progress.skippedSteps).toContain('step1');
    });

    it('should validate required input fields', async () => {
      await engine.startFlow('user1', testFlow.id);
      await engine.completeStep({
        userId: 'user1',
        flowId: testFlow.id,
        stepId: 'step1',
      });

      const result = await engine.completeStep({
        userId: 'user1',
        flowId: testFlow.id,
        stepId: 'step2',
        data: {}, // Missing required email
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.validationErrors).toHaveProperty('email');
    });

    it('should store step data', async () => {
      await engine.startFlow('user1', testFlow.id);
      await engine.completeStep({
        userId: 'user1',
        flowId: testFlow.id,
        stepId: 'step1',
      });

      const result = await engine.completeStep({
        userId: 'user1',
        flowId: testFlow.id,
        stepId: 'step2',
        data: { email: 'test@example.com' },
      });

      expect(result.success).toBe(true);
      expect(result.progress.stepData.step2).toEqual({ email: 'test@example.com' });
    });

    it('should complete flow when all steps are done', async () => {
      await engine.startFlow('user1', testFlow.id);

      await engine.completeStep({
        userId: 'user1',
        flowId: testFlow.id,
        stepId: 'step1',
      });

      await engine.completeStep({
        userId: 'user1',
        flowId: testFlow.id,
        stepId: 'step2',
        data: { email: 'test@example.com' },
      });

      const result = await engine.completeStep({
        userId: 'user1',
        flowId: testFlow.id,
        stepId: 'step3',
      });

      expect(result.success).toBe(true);
      expect(result.isFlowCompleted).toBe(true);
      expect(result.progress.isCompleted).toBe(true);
      expect(result.progress.completedAt).toBeDefined();
      expect(result.progress.progressPercent).toBe(100);
    });

    it('should respect step dependencies', async () => {
      await engine.startFlow('user1', testFlow.id);

      // Step 3 depends on step 1
      const { step: currentStep } = await engine.getCurrentStep('user1', testFlow.id);
      expect(currentStep?.id).toBe('step1');

      // Complete step 1
      await engine.completeStep({
        userId: 'user1',
        flowId: testFlow.id,
        stepId: 'step1',
      });

      // Now step 2 should be available (no dependencies)
      const { step: nextStep } = await engine.getCurrentStep('user1', testFlow.id);
      expect(nextStep?.id).toBe('step2');
    });
  });

  describe('getCurrentStep', () => {
    it('should return current step and progress', async () => {
      await engine.startFlow('user1', testFlow.id);

      const { step, progress } = await engine.getCurrentStep('user1', testFlow.id);

      expect(step?.id).toBe('step1');
      expect(progress?.currentStepId).toBe('step1');
    });

    it('should return null for non-existent flow', async () => {
      const { step, progress } = await engine.getCurrentStep('user1', 'non-existent');

      expect(step).toBeNull();
      expect(progress).toBeNull();
    });

    it('should return null for user without progress', async () => {
      const { step, progress } = await engine.getCurrentStep('user1', testFlow.id);

      expect(step).toBeNull();
      expect(progress).toBeNull();
    });
  });

  describe('resetProgress', () => {
    it('should reset progress and start fresh', async () => {
      await engine.startFlow('user1', testFlow.id);
      await engine.completeStep({
        userId: 'user1',
        flowId: testFlow.id,
        stepId: 'step1',
      });

      const newProgress = await engine.resetProgress('user1', testFlow.id);

      expect(newProgress.completedSteps).toEqual([]);
      expect(newProgress.currentStepId).toBe('step1');
      expect(newProgress.progressPercent).toBe(0);
    });
  });

  describe('validation', () => {
    it('should validate pattern on input fields', async () => {
      const flowWithPattern = await storage.createFlow({
        name: 'Pattern Flow',
        steps: [
          {
            id: 'step1',
            name: 'Step 1',
            type: 'input',
            order: 1,
            inputs: [
              {
                id: 'code',
                name: 'code',
                type: 'text',
                label: 'Code',
                required: true,
                pattern: '^[A-Z]{4}$',
              },
            ],
          },
        ],
      });

      const patternEngine = createFlowEngine(storage);

      const result = await patternEngine.completeStep({
        userId: 'user1',
        flowId: flowWithPattern.id,
        stepId: 'step1',
        data: { code: 'invalid' },
      });

      expect(result.success).toBe(false);
      expect(result.validationErrors?.code).toContain('invalid format');
    });

    it('should use custom validators from config', async () => {
      const flowWithCustom = await storage.createFlow({
        name: 'Custom Flow',
        steps: [
          {
            id: 'step1',
            name: 'Step 1',
            type: 'input',
            order: 1,
            inputs: [
              {
                id: 'age',
                name: 'age',
                type: 'number',
                label: 'Age',
                required: true,
              },
            ],
          },
        ],
      });

      const customEngine = createFlowEngine(storage, {
        validators: {
          number: (value) => typeof value === 'number' && value >= 18,
        },
      });

      const result = await customEngine.completeStep({
        userId: 'user1',
        flowId: flowWithCustom.id,
        stepId: 'step1',
        data: { age: 16 },
      });

      expect(result.success).toBe(false);
      expect(result.validationErrors?.age).toContain('invalid');
    });
  });
});
