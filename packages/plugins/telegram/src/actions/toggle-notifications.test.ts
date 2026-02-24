/**
 * Toggle Notifications Action tests
 */


import { createToggleNotificationsAction } from './toggle-notifications.js';
import type { ActionContext } from '@samterminal/core';
import type { TelegramPluginConfig } from '../types/index.js';

describe('Toggle Notifications Action', () => {
  let action: ReturnType<typeof createToggleNotificationsAction>;
  let mockDatabase: {
    toggleNotifications: ReturnType<typeof jest.fn>;
  };

  beforeEach(() => {
    mockDatabase = {
      toggleNotifications: jest.fn().mockResolvedValue(true),
    };
  });

  describe('metadata', () => {
    it('should have correct name', () => {
      action = createToggleNotificationsAction({});
      expect(action.name).toBe('telegram:toggle');
    });

    it('should have correct description', () => {
      action = createToggleNotificationsAction({});
      expect(action.description).toBe('Toggle Telegram notifications for a user');
    });

    it('should have correct category', () => {
      action = createToggleNotificationsAction({});
      expect(action.category).toBe('notification');
    });
  });

  describe('validate', () => {
    beforeEach(() => {
      action = createToggleNotificationsAction({});
    });

    it('should pass for valid input', () => {
      const result = action.validate!({ userId: 'user123' });
      expect(result.valid).toBe(true);
    });

    it('should fail if userId is missing', () => {
      const result = action.validate!({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('userId is required and must be a string');
    });

    it('should fail if userId is not a string', () => {
      const result = action.validate!({ userId: 123 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('userId is required and must be a string');
    });
  });

  describe('execute', () => {
    it('should fail if database is not configured', async () => {
      action = createToggleNotificationsAction({});

      const context: ActionContext = {
        input: { userId: 'user123' },
        pluginName: 'telegram',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database adapter not configured');
    });

    it('should toggle notifications successfully', async () => {
      const config: TelegramPluginConfig = {
        database: mockDatabase as any,
      };
      action = createToggleNotificationsAction(config);

      const context: ActionContext = {
        input: { userId: 'user123' },
        pluginName: 'telegram',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ isActive: true });
      expect(mockDatabase.toggleNotifications).toHaveBeenCalledWith('user123');
    });

    it('should return new state after toggle', async () => {
      mockDatabase.toggleNotifications.mockResolvedValue(false);

      const config: TelegramPluginConfig = {
        database: mockDatabase as any,
      };
      action = createToggleNotificationsAction(config);

      const context: ActionContext = {
        input: { userId: 'user123' },
        pluginName: 'telegram',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ isActive: false });
    });

    it('should handle database error', async () => {
      mockDatabase.toggleNotifications.mockRejectedValue(new Error('DB error'));

      const config: TelegramPluginConfig = {
        database: mockDatabase as any,
      };
      action = createToggleNotificationsAction(config);

      const context: ActionContext = {
        input: { userId: 'user123' },
        pluginName: 'telegram',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB error');
    });
  });
});
