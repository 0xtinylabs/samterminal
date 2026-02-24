/**
 * Text classification action
 */

import type { Action, ActionContext, ActionResult } from '@samterminal/core';
import type { AIPluginConfig, ClassifyRequest, ClassifyResponse } from '../types/index.js';
import { extractText } from '../types/index.js';
import type { AIClient } from '../utils/client.js';

export function createClassifyAction(
  getClient: () => AIClient | null,
  config: AIPluginConfig,
): Action {
  return {
    name: 'ai:classify',
    description: 'Classify text into categories',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as ClassifyRequest;

      if (!input.text) {
        return {
          success: false,
          error: 'Text is required',
        };
      }

      if (!input.labels || input.labels.length === 0) {
        return {
          success: false,
          error: 'Labels are required',
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

        const multiLabel = input.multiLabel ?? false;
        const labelsStr = input.labels.map((l, i) => `${i + 1}. ${l}`).join('\n');

        const prompt = multiLabel
          ? `Classify the following text into one or more of these categories. Return ONLY the category names that apply, one per line, with a confidence score (0-1) after each.

Categories:
${labelsStr}

Text to classify:
${input.text}

Format your response as:
category_name: confidence_score
(one per line, only include categories that apply)`
          : `Classify the following text into exactly ONE of these categories. Return ONLY the category name and a confidence score (0-1).

Categories:
${labelsStr}

Text to classify:
${input.text}

Format your response as:
category_name: confidence_score`;

        const response = await client.complete({
          messages: [{ role: 'user', content: prompt }],
          model: input.model,
          provider: input.provider,
          maxTokens: 100,
          temperature: 0.1, // Low temperature for consistent classification
        });

        const responseText = extractText(response.content);

        // Parse classifications
        const classifications: Array<{ label: string; confidence: number }> = [];
        const lines = responseText.trim().split('\n');

        for (const line of lines) {
          const match = line.match(/^(.+?):\s*([\d.]+)/);
          if (match) {
            const label = match[1].trim();
            const confidence = parseFloat(match[2]);

            // Validate label is in the allowed list
            const normalizedLabel = input.labels.find(
              (l) => l.toLowerCase() === label.toLowerCase(),
            );

            if (normalizedLabel && !isNaN(confidence)) {
              classifications.push({
                label: normalizedLabel,
                confidence: Math.min(1, Math.max(0, confidence)),
              });
            }
          }
        }

        // Sort by confidence
        classifications.sort((a, b) => b.confidence - a.confidence);

        const result: ClassifyResponse = {
          classifications,
          model: response.model,
          provider: response.provider,
          timestamp: response.timestamp,
        };

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Classification failed',
        };
      }
    },
  };
}
