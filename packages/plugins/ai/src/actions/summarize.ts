/**
 * Text summarization action
 */

import type { Action, ActionContext, ActionResult } from '@samterminal/core';
import type { AIPluginConfig, SummarizeRequest, SummarizeResponse } from '../types/index.js';
import { extractText } from '../types/index.js';
import type { AIClient } from '../utils/client.js';

export function createSummarizeAction(
  getClient: () => AIClient | null,
  config: AIPluginConfig,
): Action {
  return {
    name: 'ai:summarize',
    description: 'Summarize text',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as SummarizeRequest;

      if (!input.text) {
        return {
          success: false,
          error: 'Text is required',
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

        const style = input.style ?? 'concise';
        const maxLength = input.maxLength ?? 100;

        let styleInstruction = '';
        switch (style) {
          case 'concise':
            styleInstruction = `Provide a concise summary in approximately ${maxLength} words.`;
            break;
          case 'detailed':
            styleInstruction = `Provide a detailed summary covering all key points in approximately ${maxLength} words.`;
            break;
          case 'bullets':
            styleInstruction = `Provide a summary as bullet points, with approximately ${maxLength} words total.`;
            break;
        }

        const prompt = `Summarize the following text. ${styleInstruction}

Text to summarize:
${input.text}

Summary:`;

        const response = await client.complete({
          messages: [{ role: 'user', content: prompt }],
          model: input.model,
          provider: input.provider,
          maxTokens: Math.ceil(maxLength * 1.5), // Approximate tokens needed
          temperature: 0.3, // Lower temperature for more focused summaries
        });

        const summary = extractText(response.content);

        const result: SummarizeResponse = {
          summary,
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
          error: error instanceof Error ? error.message : 'Summarization failed',
        };
      }
    },
  };
}
