/**
 * Text generation action
 */

import type { Action, ActionContext, ActionResult } from '@samterminal/core';
import type { AIPluginConfig, GenerateRequest, GenerateResponse } from '../types/index.js';
import { extractText } from '../types/index.js';
import type { AIClient } from '../utils/client.js';

export function createGenerateAction(
  getClient: () => AIClient | null,
  config: AIPluginConfig,
): Action {
  return {
    name: 'ai:generate',
    description: 'Generate text from a prompt',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as GenerateRequest;

      if (!input.prompt) {
        return {
          success: false,
          error: 'Prompt is required',
        };
      }

      try {
        const client = getClient();
        if (!client) {
          return {
            success: false,
            error: 'No AI provider configured',
          };
        }

        const response = await client.complete({
          messages: [{ role: 'user', content: input.prompt }],
          model: input.model,
          provider: input.provider,
          system: input.system,
          maxTokens: input.maxTokens ?? config.defaultMaxTokens,
          temperature: input.temperature ?? config.defaultTemperature,
        });

        const text = extractText(response.content);

        const result: GenerateResponse = {
          text,
          model: response.model,
          provider: response.provider,
          usage: response.usage,
          timestamp: response.timestamp,
        };

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Generation failed',
        };
      }
    },
  };
}
