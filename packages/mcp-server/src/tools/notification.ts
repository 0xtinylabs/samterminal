import { getGrpcClient, callGrpc, type ToolDefinition } from '../utils.js';
import type * as grpc from '@grpc/grpc-js';

function getNotificationClient(): grpc.Client {
  return getGrpcClient('notification', 'notification.proto', 'notification', 'NotificationService');
}

export const notificationTools: ToolDefinition[] = [
  {
    name: 'sam_notify_send',
    description: 'Send a notification message via Telegram or Farcaster. Supports buttons (links or function callbacks).',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Notification message text' },
        type: { type: 'string', enum: ['TELEGRAM', 'FARCASTER'], description: 'Notification channel (default: TELEGRAM)' },
        botName: { type: 'string', enum: ['MAIN', 'USER'], description: 'Bot type to use (default: MAIN)' },
        to: { type: 'string', description: 'Recipient user ID or chat ID' },
        buttons: {
          type: 'array',
          description: 'Optional buttons to attach. Each button: { label, data, type: "LINK"|"FUNCTION" }',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              data: { type: 'string' },
              type: { type: 'string', enum: ['LINK', 'FUNCTION'] },
            },
            required: ['label', 'type'],
          },
        },
        bypass: { type: 'boolean', description: 'Bypass notification state checks (default: false)' },
      },
      required: ['message', 'to'],
    },
    handler: async (args) => {
      const client = getNotificationClient();
      const request: Record<string, unknown> = {
        message: args.message,
        type: args.type ?? 'TELEGRAM',
        botName: args.botName ?? 'MAIN',
        to: args.to,
        bypass: args.bypass,
      };
      if (args.buttons) {
        request.extras = { buttons: args.buttons };
      }
      return callGrpc(client, 'send', request);
    },
  },
  {
    name: 'sam_notify_bot_url',
    description: 'Get bot connection URLs for a user. Returns Telegram and Farcaster bot links with connection codes.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID' },
      },
      required: ['userId'],
    },
    handler: async (args) => {
      const client = getNotificationClient();
      return callGrpc(client, 'getUserBotURL', { userId: args.userId });
    },
  },
  {
    name: 'sam_notify_bot_state',
    description: 'Get current bot connection states for a user. Shows which notification channels (Telegram, Farcaster) are active.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID' },
      },
      required: ['userId'],
    },
    handler: async (args) => {
      const client = getNotificationClient();
      return callGrpc(client, 'getUserBotStates', { userId: args.userId });
    },
  },
  {
    name: 'sam_notify_toggle',
    description: 'Toggle a notification channel on or off for a user. Enables or disables Telegram or Farcaster notifications.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID' },
        type: { type: 'string', enum: ['TELEGRAM', 'FARCASTER'], description: 'Notification channel to toggle' },
      },
      required: ['userId', 'type'],
    },
    handler: async (args) => {
      const client = getNotificationClient();
      return callGrpc(client, 'toggleBotState', {
        userId: args.userId,
        type: args.type,
      });
    },
  },
];
