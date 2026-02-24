/**
 * Onboarding flow provider
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type { OnboardingPluginConfig, OnboardingDatabaseAdapter } from '../types/index.js';

export interface FlowQuery {
  /** Flow ID */
  flowId?: string;

  /** List all flows */
  listAll?: boolean;

  /** Filter by active status */
  active?: boolean;
}

export function createFlowProvider(
  getDatabase: () => OnboardingDatabaseAdapter,
  config: OnboardingPluginConfig,
): Provider {
  return {
    name: 'onboarding:flow',
    type: 'token',
    description: 'Get onboarding flow definition',

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as FlowQuery;

      try {
        const database = getDatabase();

        if (query.listAll) {
          const flows = await database.listFlows({ active: query.active });
          return {
            success: true,
            data: { flows },
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

        const flow = await database.getFlow(flowId);

        if (!flow) {
          return {
            success: false,
            error: `Flow ${flowId} not found`,
            timestamp: new Date(),
          };
        }

        return {
          success: true,
          data: flow,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get flow',
          timestamp: new Date(),
        };
      }
    },
  };
}
