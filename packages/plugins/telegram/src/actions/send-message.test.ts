/**
 * Send Message Action tests
 */


import { createSendMessageAction } from './send-message.js';
import type { ActionContext } from '@samterminal/core';
import type { TelegramPluginConfig, TelegramBotType } from '../types/index.js';

describe('Send Message Action', () => {
  const mockBot = {
    sendMessage: jest.fn().mockResolvedValue({ message_id: 123 }),
  };

  const mockBots = new Map<TelegramBotType, any>();
  const getBots = () => mockBots;

  const config: TelegramPluginConfig = {
    mainGroupChatId: 'main-group-123',
  };

  let action: ReturnType<typeof createSendMessageAction>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBots.clear();
    mockBots.set('user', mockBot);
    mockBots.set('main', mockBot);
    action = createSendMessageAction(getBots, config);
  });

  describe('metadata', () => {
    it('should have correct name', () => {
      expect(action.name).toBe('telegram:send');
    });

    it('should have correct description', () => {
      expect(action.description).toBe('Send a message to a Telegram chat');
    });

    it('should have correct category', () => {
      expect(action.category).toBe('notification');
    });
  });

  describe('validate', () => {
    it('should pass for valid input', () => {
      const result = action.validate!({
        message: 'Hello',
        to: 'user123',
      });

      expect(result.valid).toBe(true);
    });

    it('should fail if message is missing', () => {
      const result = action.validate!({
        to: 'user123',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('message is required and must be a string');
    });

    it('should fail if to is missing', () => {
      const result = action.validate!({
        message: 'Hello',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('to is required and must be a string');
    });

    it('should fail for invalid botType', () => {
      const result = action.validate!({
        message: 'Hello',
        to: 'user123',
        botType: 'invalid',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('botType must be "main" or "user"');
    });

    it('should pass for valid botType', () => {
      const result = action.validate!({
        message: 'Hello',
        to: 'user123',
        botType: 'main',
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('execute', () => {
    it('should send message using user bot by default', async () => {
      const context: ActionContext = {
        input: {
          message: 'Hello World',
          to: '12345',
        },
        pluginName: 'telegram',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        '12345',
        'Hello World',
        expect.objectContaining({
          parse_mode: 'HTML',
        })
      );
    });

    it('should send message using main bot when specified', async () => {
      const context: ActionContext = {
        input: {
          message: 'Group message',
          to: '',
          botType: 'main',
        },
        pluginName: 'telegram',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        'main-group-123',
        'Group message',
        expect.any(Object)
      );
    });

    it('should fail if bot is not configured', async () => {
      mockBots.delete('user');

      const context: ActionContext = {
        input: {
          message: 'Hello',
          to: '12345',
        },
        pluginName: 'telegram',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('should include inline keyboard when buttons are provided', async () => {
      const context: ActionContext = {
        input: {
          message: 'Choose an option',
          to: '12345',
          buttons: [
            { label: 'Option 1', data: 'opt1', type: 'callback' },
            { label: 'Link', data: 'https://example.com', type: 'link' },
          ],
        },
        pluginName: 'telegram',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        '12345',
        'Choose an option',
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.any(Array),
          }),
        })
      );
    });

    it('should check user active status when database is provided', async () => {
      const mockDatabase = {
        isUserActive: jest.fn().mockResolvedValue(false),
        getTelegramId: jest.fn().mockResolvedValue('12345'),
      };

      const configWithDb: TelegramPluginConfig = {
        ...config,
        database: mockDatabase as any,
      };

      const actionWithDb = createSendMessageAction(getBots, configWithDb);

      const context: ActionContext = {
        input: {
          message: 'Hello',
          to: 'user-key',
        },
        pluginName: 'telegram',
      };

      const result = await actionWithDb.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('notifications disabled');
    });

    it('should bypass active check when bypass is true', async () => {
      const mockDatabase = {
        isUserActive: jest.fn().mockResolvedValue(false),
        getTelegramId: jest.fn().mockResolvedValue('12345'),
      };

      const configWithDb: TelegramPluginConfig = {
        ...config,
        database: mockDatabase as any,
      };

      const actionWithDb = createSendMessageAction(getBots, configWithDb);

      const context: ActionContext = {
        input: {
          message: 'Hello',
          to: 'user-key',
          bypass: true,
        },
        pluginName: 'telegram',
      };

      const result = await actionWithDb.execute(context);

      expect(result.success).toBe(true);
      expect(mockDatabase.isUserActive).not.toHaveBeenCalled();
    });

    it('should handle sendMessage error', async () => {
      mockBot.sendMessage.mockRejectedValueOnce(new Error('Telegram API error'));

      const context: ActionContext = {
        input: {
          message: 'Hello',
          to: '12345',
        },
        pluginName: 'telegram',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Telegram API error');
    });

    it('should return message ID on success', async () => {
      const context: ActionContext = {
        input: {
          message: 'Hello',
          to: '12345',
        },
        pluginName: 'telegram',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        success: true,
        messageId: 123,
      });
    });
  });
});
