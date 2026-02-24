/**
 * Bot State Provider tests
 */


import { createBotStateProvider } from './bot-state.js';
import type { ProviderContext } from '@samterminal/core';
import type { TelegramPluginConfig, BotState } from '../types/index.js';

describe('Bot State Provider', () => {
  let mockDatabase: {
    getBotState: ReturnType<typeof jest.fn>;
  };

  beforeEach(() => {
    mockDatabase = {
      getBotState: jest.fn(),
    };
  });

  describe('metadata', () => {
    it('should have correct name', () => {
      const provider = createBotStateProvider({});
      expect(provider.name).toBe('telegram:state');
    });

    it('should have correct type', () => {
      const provider = createBotStateProvider({});
      expect(provider.type).toBe('social');
    });

    it('should have correct description', () => {
      const provider = createBotStateProvider({});
      expect(provider.description).toBe('Get Telegram bot connection state for a user');
    });

    it('should have query schema', () => {
      const provider = createBotStateProvider({});
      expect(provider.querySchema).toBeDefined();
      expect(provider.querySchema?.required).toContain('userId');
    });

    it('should have response schema', () => {
      const provider = createBotStateProvider({});
      expect(provider.responseSchema).toBeDefined();
      expect(provider.responseSchema?.properties).toHaveProperty('isActive');
      expect(provider.responseSchema?.properties).toHaveProperty('isVerified');
    });
  });

  describe('get', () => {
    it('should fail if database is not configured', async () => {
      const provider = createBotStateProvider({});

      const context: ProviderContext = {
        query: { userId: 'user123' },
        pluginName: 'telegram',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database adapter not configured');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should return default state when user not found', async () => {
      mockDatabase.getBotState.mockResolvedValue(null);

      const config: TelegramPluginConfig = {
        database: mockDatabase as any,
      };
      const provider = createBotStateProvider(config);

      const context: ProviderContext = {
        query: { userId: 'user123' },
        pluginName: 'telegram',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        type: 'user',
        isActive: false,
        isVerified: false,
      });
      expect(mockDatabase.getBotState).toHaveBeenCalledWith('user123');
    });

    it('should return user state when found', async () => {
      const userState: BotState = {
        type: 'user',
        isActive: true,
        isVerified: true,
      };
      mockDatabase.getBotState.mockResolvedValue(userState);

      const config: TelegramPluginConfig = {
        database: mockDatabase as any,
      };
      const provider = createBotStateProvider(config);

      const context: ProviderContext = {
        query: { userId: 'user123' },
        pluginName: 'telegram',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(userState);
    });

    it('should return inactive verified state', async () => {
      const userState: BotState = {
        type: 'user',
        isActive: false,
        isVerified: true,
      };
      mockDatabase.getBotState.mockResolvedValue(userState);

      const config: TelegramPluginConfig = {
        database: mockDatabase as any,
      };
      const provider = createBotStateProvider(config);

      const context: ProviderContext = {
        query: { userId: 'user456' },
        pluginName: 'telegram',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        type: 'user',
        isActive: false,
        isVerified: true,
      });
    });

    it('should handle database error', async () => {
      mockDatabase.getBotState.mockRejectedValue(new Error('Database connection failed'));

      const config: TelegramPluginConfig = {
        database: mockDatabase as any,
      };
      const provider = createBotStateProvider(config);

      const context: ProviderContext = {
        query: { userId: 'user123' },
        pluginName: 'telegram',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });

    it('should handle non-Error exceptions', async () => {
      mockDatabase.getBotState.mockRejectedValue('String error');

      const config: TelegramPluginConfig = {
        database: mockDatabase as any,
      };
      const provider = createBotStateProvider(config);

      const context: ProviderContext = {
        query: { userId: 'user123' },
        pluginName: 'telegram',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('String error');
    });
  });
});
