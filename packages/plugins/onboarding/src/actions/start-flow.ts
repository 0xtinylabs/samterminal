/**
 * Start onboarding flow action
 */

import type { Action, ActionContext, ActionResult } from '@samterminal/core';
import type { OnboardingPluginConfig, OnboardingDatabaseAdapter } from '../types/index.js';
import type { FlowEngine } from '../utils/flow-engine.js';

export interface StartFlowRequest {
  /** User ID */
  userId: string;

  /** Flow ID (optional - defaults to config.defaultFlowId) */
  flowId?: string;
}

export function createStartFlowAction(
  getDatabase: () => OnboardingDatabaseAdapter,
  getFlowEngine: () => FlowEngine,
  config: OnboardingPluginConfig,
): Action {
  return {
    name: 'onboarding:start-flow',
    description: 'Start an onboarding flow for a user',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as StartFlowRequest;

      if (!input.userId) {
        return {
          success: false,
          error: 'User ID is required',
        };
      }

      const flowId = input.flowId ?? config.defaultFlowId;
      if (!flowId) {
        return {
          success: false,
          error: 'Flow ID is required (no default flow configured)',
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

        // Verify flow exists
        const flow = await database.getFlow(flowId);
        if (!flow) {
          return {
            success: false,
            error: `Flow ${flowId} not found`,
          };
        }

        if (!flow.active) {
          return {
            success: false,
            error: 'Flow is not active',
          };
        }

        // Start the flow
        const progress = await flowEngine.startFlow(input.userId, flowId);

        // Update user status
        if (user.status === 'new') {
          await database.updateUser(input.userId, {
            status: 'onboarding',
            lastActiveAt: Date.now(),
          });
        }

        // Get first step details
        const { step } = await flowEngine.getCurrentStep(input.userId, flowId);

        return {
          success: true,
          data: {
            progress,
            currentStep: step,
            flow: {
              id: flow.id,
              name: flow.name,
              totalSteps: flow.steps.length,
            },
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to start flow',
        };
      }
    },
  };
}
