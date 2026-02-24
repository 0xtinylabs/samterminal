/**
 * Onboarding progress provider
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type { OnboardingPluginConfig, OnboardingDatabaseAdapter } from '../types/index.js';
import type { FlowEngine } from '../utils/flow-engine.js';

export interface ProgressQuery {
  /** User ID */
  userId: string;

  /** Flow ID (optional - defaults to config.defaultFlowId) */
  flowId?: string;

  /** Include current step details */
  includeStep?: boolean;
}

export function createProgressProvider(
  getDatabase: () => OnboardingDatabaseAdapter,
  getFlowEngine: () => FlowEngine,
  config: OnboardingPluginConfig,
): Provider {
  return {
    name: 'onboarding:progress',
    type: 'token',
    description: 'Get user onboarding progress',

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as ProgressQuery;

      if (!query.userId) {
        return {
          success: false,
          error: 'User ID is required',
          timestamp: new Date(),
        };
      }

      const flowId = query.flowId ?? config.defaultFlowId;
      if (!flowId) {
        return {
          success: false,
          error: 'Flow ID is required',
          timestamp: new Date(),
        };
      }

      try {
        const database = getDatabase();
        const flowEngine = getFlowEngine();

        const progress = await database.getProgress(query.userId, flowId);

        if (!progress) {
          return {
            success: true,
            data: {
              progress: null,
              hasStarted: false,
            },
            timestamp: new Date(),
          };
        }

        let currentStep = null;
        if (query.includeStep) {
          const result = await flowEngine.getCurrentStep(query.userId, flowId);
          currentStep = result.step;
        }

        return {
          success: true,
          data: {
            progress,
            currentStep,
            hasStarted: true,
          },
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get progress',
          timestamp: new Date(),
        };
      }
    },
  };
}
