/**
 * Flow engine for managing onboarding flows
 */

import type {
  OnboardingFlow,
  OnboardingStep,
  OnboardingProgress,
  OnboardingPluginConfig,
  CompleteStepRequest,
  CompleteStepResult,
  OnboardingDatabaseAdapter,
} from '../types/index.js';
import { generateId, calculateProgress } from '../types/index.js';

export class FlowEngine {
  private config: OnboardingPluginConfig;
  private database: OnboardingDatabaseAdapter;

  constructor(database: OnboardingDatabaseAdapter, config: OnboardingPluginConfig = {}) {
    this.database = database;
    this.config = config;
  }

  /**
   * Start a flow for a user
   */
  async startFlow(userId: string, flowId: string): Promise<OnboardingProgress> {
    const flow = await this.database.getFlow(flowId);
    if (!flow) {
      throw new Error(`Flow ${flowId} not found`);
    }

    // Check if already started
    const existingProgress = await this.database.getProgress(userId, flowId);
    if (existingProgress && !existingProgress.isCompleted) {
      return existingProgress;
    }

    // Find first step
    const sortedSteps = this.getSortedSteps(flow);
    const firstStep = sortedSteps[0];

    if (!firstStep) {
      throw new Error('Flow has no steps');
    }

    const now = Date.now();
    const progress: OnboardingProgress = {
      userId,
      flowId,
      currentStepId: firstStep.id,
      completedSteps: [],
      skippedSteps: [],
      failedSteps: [],
      stepData: {},
      progressPercent: 0,
      isCompleted: false,
      startedAt: now,
      lastActivityAt: now,
    };

    await this.database.saveProgress(progress);
    return progress;
  }

  /**
   * Complete a step
   */
  async completeStep(request: CompleteStepRequest): Promise<CompleteStepResult> {
    const { userId, flowId, stepId, data, skip } = request;

    // Get flow and progress
    const flow = await this.database.getFlow(flowId);
    if (!flow) {
      return {
        success: false,
        isFlowCompleted: false,
        progress: null as unknown as OnboardingProgress,
        error: `Flow ${flowId} not found`,
      };
    }

    let progress = await this.database.getProgress(userId, flowId);
    if (!progress) {
      // Auto-start flow if not started
      progress = await this.startFlow(userId, flowId);
    }

    // Get current step
    const step = flow.steps.find((s) => s.id === stepId);
    if (!step) {
      return {
        success: false,
        isFlowCompleted: false,
        progress,
        error: `Step ${stepId} not found`,
      };
    }

    // Check if step is already completed
    if (progress.completedSteps.includes(stepId)) {
      const nextStep = this.getNextStep(flow, progress);
      return {
        success: true,
        nextStepId: nextStep?.id,
        isFlowCompleted: progress.isCompleted,
        progress,
      };
    }

    // Handle skip
    if (skip) {
      if (step.required && !this.config.allowSkipRequired) {
        return {
          success: false,
          isFlowCompleted: false,
          progress,
          error: 'Cannot skip required step',
        };
      }

      if (!step.skippable && !this.config.allowSkipRequired) {
        return {
          success: false,
          isFlowCompleted: false,
          progress,
          error: 'This step cannot be skipped',
        };
      }

      progress.skippedSteps.push(stepId);
    } else {
      // Validate step data
      const validationResult = this.validateStepData(step, data);
      if (!validationResult.valid) {
        return {
          success: false,
          isFlowCompleted: false,
          progress,
          error: 'Validation failed',
          validationErrors: validationResult.errors,
        };
      }

      // Store step data
      if (data) {
        progress.stepData[stepId] = data;
      }

      progress.completedSteps.push(stepId);
    }

    // Calculate new progress
    const totalSteps = flow.steps.length;
    progress.progressPercent = calculateProgress(
      progress.completedSteps,
      progress.skippedSteps,
      totalSteps,
    );

    // Find next step
    const nextStep = this.getNextStep(flow, progress);

    if (nextStep) {
      progress.currentStepId = nextStep.id;
    } else {
      // Flow completed
      progress.isCompleted = true;
      progress.completedAt = Date.now();
    }

    progress.lastActivityAt = Date.now();

    // Save progress
    await this.database.saveProgress(progress);

    return {
      success: true,
      nextStepId: nextStep?.id,
      isFlowCompleted: progress.isCompleted,
      progress,
    };
  }

  /**
   * Get current step for a user
   */
  async getCurrentStep(
    userId: string,
    flowId: string,
  ): Promise<{ step: OnboardingStep | null; progress: OnboardingProgress | null }> {
    const flow = await this.database.getFlow(flowId);
    if (!flow) {
      return { step: null, progress: null };
    }

    const progress = await this.database.getProgress(userId, flowId);
    if (!progress) {
      return { step: null, progress: null };
    }

    const step = flow.steps.find((s) => s.id === progress.currentStepId);
    return { step: step ?? null, progress };
  }

  /**
   * Reset progress for a user
   */
  async resetProgress(userId: string, flowId: string): Promise<OnboardingProgress> {
    await this.database.deleteProgress(userId, flowId);
    return this.startFlow(userId, flowId);
  }

  /**
   * Get sorted steps
   */
  private getSortedSteps(flow: OnboardingFlow): OnboardingStep[] {
    return [...flow.steps].sort((a, b) => a.order - b.order);
  }

  /**
   * Get next step based on progress
   */
  private getNextStep(
    flow: OnboardingFlow,
    progress: OnboardingProgress,
  ): OnboardingStep | null {
    const sortedSteps = this.getSortedSteps(flow);
    const completedOrSkipped = new Set([
      ...progress.completedSteps,
      ...progress.skippedSteps,
    ]);

    for (const step of sortedSteps) {
      if (completedOrSkipped.has(step.id)) {
        continue;
      }

      // Check dependencies
      if (step.dependsOn && step.dependsOn.length > 0) {
        const allDependenciesMet = step.dependsOn.every((depId) =>
          completedOrSkipped.has(depId),
        );
        if (!allDependenciesMet) {
          continue;
        }
      }

      return step;
    }

    return null;
  }

  /**
   * Validate step data
   */
  private validateStepData(
    step: OnboardingStep,
    data?: Record<string, unknown>,
  ): { valid: boolean; errors?: Record<string, string> } {
    const errors: Record<string, string> = {};

    // Validate required inputs
    if (step.inputs) {
      for (const input of step.inputs) {
        const value = data?.[input.id];

        if (input.required && (value === undefined || value === null || value === '')) {
          errors[input.id] = `${input.label} is required`;
          continue;
        }

        if (value !== undefined && value !== null && value !== '') {
          // Validate pattern
          if (input.pattern && typeof value === 'string') {
            const regex = new RegExp(input.pattern);
            if (!regex.test(value)) {
              errors[input.id] = `${input.label} has invalid format`;
            }
          }

          // Custom validators
          if (this.config.validators) {
            const validator = this.config.validators[input.type];
            if (validator && !validator(value)) {
              errors[input.id] = `${input.label} is invalid`;
            }
          }
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    };
  }
}

/**
 * Create flow engine instance
 */
export function createFlowEngine(
  database: OnboardingDatabaseAdapter,
  config?: OnboardingPluginConfig,
): FlowEngine {
  return new FlowEngine(database, config);
}
