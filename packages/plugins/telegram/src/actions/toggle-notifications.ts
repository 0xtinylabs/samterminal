/**
 * Toggle Notifications Action
 * Enables or disables Telegram notifications for a user
 */

import type { Action, ActionContext, ActionResult } from '@samterminal/core';
import type { TelegramPluginConfig } from '../types/index.js';

/**
 * Toggle notifications input
 */
export interface ToggleNotificationsInput {
  /**
   * User's connection key
   */
  userId: string;
}

/**
 * Create the toggle notifications action
 */
export function createToggleNotificationsAction(
  config: TelegramPluginConfig,
): Action {
  return {
    name: 'telegram:toggle',
    description: 'Toggle Telegram notifications for a user',
    category: 'notification',

    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User connection key' },
      },
      required: ['userId'],
    },

    validate(input: unknown) {
      const data = input as Partial<ToggleNotificationsInput>;

      if (!data.userId || typeof data.userId !== 'string') {
        return { valid: false, errors: ['userId is required and must be a string'] };
      }

      return { valid: true };
    },

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as ToggleNotificationsInput;

      if (!config.database) {
        return {
          success: false,
          error: 'Database adapter not configured',
        };
      }

      try {
        const newState = await config.database.toggleNotifications(input.userId);

        return {
          success: true,
          data: {
            isActive: newState,
          },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
  };
}
