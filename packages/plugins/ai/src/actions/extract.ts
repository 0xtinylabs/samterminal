/**
 * Structured data extraction action
 */

import type { Action, ActionContext, ActionResult } from '@samterminal/core';
import type { AIPluginConfig, ExtractRequest, ExtractResponse, Tool } from '../types/index.js';
import type { AIClient } from '../utils/client.js';

export function createExtractAction(
  getClient: () => AIClient | null,
  config: AIPluginConfig,
): Action {
  return {
    name: 'ai:extract',
    description: 'Extract structured data from text',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as ExtractRequest;

      if (!input.text) {
        return {
          success: false,
          error: 'Text is required',
        };
      }

      if (!input.schema || Object.keys(input.schema).length === 0) {
        return {
          success: false,
          error: 'Schema is required',
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

        // Create a tool for extraction
        const extractTool: Tool = {
          name: 'extract_data',
          description: 'Extract structured data from the text',
          input_schema: {
            type: 'object',
            properties: input.schema,
            required: Object.keys(input.schema),
          },
        };

        const response = await client.complete({
          messages: [
            {
              role: 'user',
              content: `Extract the requested information from the following text. Use the extract_data tool to return the structured data.

Text:
${input.text}`,
            },
          ],
          model: input.model,
          provider: input.provider,
          tools: [extractTool],
          toolChoice: { name: 'extract_data' },
          maxTokens: 1000,
          temperature: 0.1, // Low temperature for accurate extraction
        });

        // Get extracted data from tool call
        let extractedData: Record<string, unknown> = {};

        if (response.toolCalls && response.toolCalls.length > 0) {
          const extractCall = response.toolCalls.find((c) => c.name === 'extract_data');
          if (extractCall) {
            extractedData = extractCall.input;
          }
        }

        const result: ExtractResponse = {
          data: extractedData,
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
          error: error instanceof Error ? error.message : 'Extraction failed',
        };
      }
    },
  };
}
