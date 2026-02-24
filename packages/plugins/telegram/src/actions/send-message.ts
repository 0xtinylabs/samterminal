/**
 * Send Message Action
 * Sends a message to a Telegram chat
 */

import type { Action, ActionContext, ActionResult } from '@samterminal/core';
import type TelegramBot from 'node-telegram-bot-api';
import type {
  SendMessageInput,
  SendMessageResult,
  TelegramPluginConfig,
  TelegramBotType,
} from '../types/index.js';
import { convertButtons } from '../utils/buttons.js';

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Create the send message action
 */
export function createSendMessageAction(
  getBots: () => Map<TelegramBotType, TelegramBot | null>,
  config: TelegramPluginConfig,
): Action {
  return {
    name: 'telegram:send',
    description: 'Send a message to a Telegram chat',
    category: 'notification',

    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Message text' },
        to: { type: 'string', description: 'Target chat ID or connection key' },
        botType: { type: 'string', description: 'Bot type: main or user' },
        buttons: {
          type: 'array',
          description: 'Inline keyboard buttons',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              data: { type: 'string' },
              type: { type: 'string' },
            },
          },
        },
        bypass: { type: 'boolean', description: 'Bypass active check' },
        parseMode: { type: 'string', description: 'Parse mode' },
      },
      required: ['message', 'to'],
    },

    validate(input: unknown) {
      const data = input as Partial<SendMessageInput>;

      if (!data.message || typeof data.message !== 'string') {
        return { valid: false, errors: ['message is required and must be a string'] };
      }

      if (!data.to || typeof data.to !== 'string') {
        return { valid: false, errors: ['to is required and must be a string'] };
      }

      if (data.botType && !['main', 'user'].includes(data.botType)) {
        return { valid: false, errors: ['botType must be "main" or "user"'] };
      }

      return { valid: true };
    },

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as SendMessageInput;
      const bots = getBots();

      try {
        const botType: TelegramBotType = input.botType ?? 'user';
        const bot = bots.get(botType);

        if (!bot) {
          return {
            success: false,
            error: `Bot "${botType}" is not configured`,
          };
        }

        // Resolve chat ID
        let chatId: string;

        if (botType === 'main') {
          // Main bot sends to configured group
          chatId = input.to || config.mainGroupChatId || '';
        } else {
          // User bot - resolve Telegram ID from connection key
          if (config.database) {
            // Check if user has notifications enabled
            if (!input.bypass) {
              const isActive = await config.database.isUserActive(input.to);
              if (!isActive) {
                return {
                  success: false,
                  error: 'User has notifications disabled',
                };
              }
            }

            const telegramId = await config.database.getTelegramId(input.to);
            if (!telegramId) {
              return {
                success: false,
                error: 'User not found or not connected to Telegram',
              };
            }
            chatId = telegramId;
          } else {
            // No database - assume input.to is the chat ID
            chatId = input.to;
          }
        }

        if (!chatId) {
          return {
            success: false,
            error: 'Could not determine chat ID',
          };
        }

        // Build message options
        const options: TelegramBot.SendMessageOptions = {
          parse_mode: input.parseMode ?? 'HTML',
          disable_web_page_preview: input.disableWebPagePreview ?? false,
          disable_notification: input.disableNotification ?? false,
        };

        // Add inline keyboard if buttons provided
        if (input.buttons && input.buttons.length > 0) {
          options.reply_markup = convertButtons(input.buttons);
        }

        // Sanitize message content when using HTML parse mode
        const messageText = options.parse_mode === 'HTML'
          ? escapeHtml(input.message)
          : input.message;

        // Send message
        const result = await bot.sendMessage(chatId, messageText, options);

        const sendResult: SendMessageResult = {
          success: true,
          messageId: result.message_id,
        };

        return {
          success: true,
          data: sendResult,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        return {
          success: false,
          error: errorMessage,
          data: {
            success: false,
            error: errorMessage,
          } as SendMessageResult,
        };
      }
    },
  };
}
