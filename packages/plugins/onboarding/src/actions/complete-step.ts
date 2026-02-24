/**
 * Complete onboarding step action
 */

import type { Action, ActionContext, ActionResult } from '@samterminal/core';
import type {
  OnboardingPluginConfig,
  OnboardingDatabaseAdapter,
  CompleteStepRequest,
} from '../types/index.js';
import type { FlowEngine } from '../utils/flow-engine.js';

export function createCompleteStepAction(
  getDatabase: () => OnboardingDatabaseAdapter,
  getFlowEngine: () => FlowEngine,
  config: OnboardingPluginConfig,
): Action {
  return {
    name: 'onboarding:complete-step',
    description: 'Complete an onboarding step',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as CompleteStepRequest;

      if (!input.userId) {
        return {
          success: false,
          error: 'User ID is required',
        };
      }

      if (!input.stepId) {
        return {
          success: false,
          error: 'Step ID is required',
        };
      }

      const flowId = input.flowId ?? config.defaultFlowId;
      if (!flowId) {
        return {
          success: false,
          error: 'Flow ID is required',
        };
      }

      try {
        const database = getDatabase();
        const flowEngine = getFlowEngine();

        // Verify user exists
        const user = await database.getUser(input.userId);
        if (!user) {
          return {
            success: false,
            error: 'User not found',
          };
        }

        // Complete the step
        const result = await flowEngine.completeStep({
          userId: input.userId,
          flowId,
          stepId: input.stepId,
          data: input.data,
          skip: input.skip,
        });

        if (!result.success) {
          return {
            success: false,
            error: result.error,
            data: result.validationErrors
              ? { validationErrors: result.validationErrors }
              : undefined,
          };
        }

        // If flow completed, update user status
        if (result.isFlowCompleted) {
          await database.updateUser(input.userId, {
            status: 'active',
            lastActiveAt: Date.now(),
          });
        }

        // Get next step details if not completed
        let nextStep = null;
        if (result.nextStepId) {
          const flow = await database.getFlow(flowId);
          if (flow) {
            nextStep = flow.steps.find((s) => s.id === result.nextStepId);
          }
        }

        return {
          success: true,
          data: {
            progress: result.progress,
            nextStep,
            isFlowCompleted: result.isFlowCompleted,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to complete step',
        };
      }
    },
  };
}
