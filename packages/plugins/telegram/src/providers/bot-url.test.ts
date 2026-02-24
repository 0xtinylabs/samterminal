/**
 * Bot URL Provider tests
 */


import { createBotUrlProvider } from './bot-url.js';
import type { ProviderContext } from '@samterminal/core';
import type { TelegramPluginConfig, TelegramBotType } from '../types/index.js';

describe('Bot URL Provider', () => {
  const mockBot = {
    getMe: jest.fn().mockResolvedValue({ username: 'testbot' }),
  };

  const mockBots = new Map<TelegramBotType, any>();
  const getBots = () => mockBots;

  let mockDatabase: {
    getOrCreateUser: ReturnType<typeof jest.fn>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockBots.clear();
    mockBots.set('user', mockBot);

    mockDatabase = {
      getOrCreateUser: jest.fn().mockResolvedValue({
        verificationCode: 'ABCD',
        ref: 'user-ref-123',
      }),
    };
  });

  describe('metadata', () => {
    it('should have correct name', () => {
      const provider = createBotUrlProvider(getBots, {});
      expect(provider.name).toBe('telegram:url');
    });

    it('should have correct type', () => {
      const provider = createBotUrlProvider(getBots, {});
      expect(provider.type).toBe('social');
    });

    it('should have correct description', () => {
      const provider = createBotUrlProvider(getBots, {});
      expect(provider.description).toBe('Get Telegram bot connection URL for a user');
    });

    it('should have query schema', () => {
      const provider = createBotUrlProvider(getBots, {});
      expect(provider.querySchema).toBeDefined();
      expect(provider.querySchema?.required).toContain('userId');
    });

    it('should have response schema', () => {
      const provider = createBotUrlProvider(getBots, {});
      expect(provider.responseSchema).toBeDefined();
      expect(provider.responseSchema?.properties).toHaveProperty('code');
      expect(provider.responseSchema?.properties).toHaveProperty('url');
      expect(provider.responseSchema?.properties).toHaveProperty('botUsername');
    });
  });

  describe('get', () => {
    it('should fail if database is not configured', async () => {
      const provider = createBotUrlProvider(getBots, {});

      const context: ProviderContext = {
        query: { userId: 'user123' },
        pluginName: 'telegram',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database adapter not configured');
    });

    it('should fail if user bot is not configured', async () => {
      mockBots.delete('user');

      const config: TelegramPluginConfig = {
        database: mockDatabase as any,
      };
      const provider = createBotUrlProvider(getBots, config);

      const context: ProviderContext = {
        query: { userId: 'user123' },
        pluginName: 'telegram',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User bot not configured');
    });

    it('should return bot URL for valid user', async () => {
      const config: TelegramPluginConfig = {
        database: mockDatabase as any,
      };
      const provider = createBotUrlProvider(getBots, config);

      const context: ProviderContext = {
        query: { userId: 'user123' },
        pluginName: 'telegram',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        code: 'ABCD',
        url: 'https://t.me/testbot?start=user-ref-123',
        botUsername: 'testbot',
      });
      expect(mockDatabase.getOrCreateUser).toHaveBeenCalledWith('user123');
    });

    it('should handle bot without username', async () => {
      mockBot.getMe.mockResolvedValueOnce({ username: undefined });

      const config: TelegramPluginConfig = {
        database: mockDatabase as any,
      };
      const provider = createBotUrlProvider(getBots, config);

      const context: ProviderContext = {
        query: { userId: 'user123' },
        pluginName: 'telegram',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data?.botUsername).toBe('');
      expect(result.data?.url).toBe('https://t.me/?start=user-ref-123');
    });

    it('should handle database error', async () => {
      mockDatabase.getOrCreateUser.mockRejectedValue(new Error('Database error'));

      const config: TelegramPluginConfig = {
        database: mockDatabase as any,
      };
      const provider = createBotUrlProvider(getBots, config);

      const context: ProviderContext = {
        query: { userId: 'user123' },
        pluginName: 'telegram',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should handle bot API error', async () => {
      mockBot.getMe.mockRejectedValueOnce(new Error('Bot API error'));

      const config: TelegramPluginConfig = {
        database: mockDatabase as any,
      };
      const provider = createBotUrlProvider(getBots, config);

      const context: ProviderContext = {
        query: { userId: 'user123' },
        pluginName: 'telegram',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Bot API error');
    });

    it('should handle non-Error exceptions', async () => {
      mockDatabase.getOrCreateUser.mockRejectedValue('String error');

      const config: TelegramPluginConfig = {
        database: mockDatabase as any,
      };
      const provider = createBotUrlProvider(getBots, config);

      const context: ProviderContext = {
        query: { userId: 'user123' },
        pluginName: 'telegram',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('String error');
    });

    it('should include timestamp in response', async () => {
      const config: TelegramPluginConfig = {
        database: mockDatabase as any,
      };
      const provider = createBotUrlProvider(getBots, config);

      const context: ProviderContext = {
        query: { userId: 'user123' },
        pluginName: 'telegram',
      };

      const result = await provider.get(context);

      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });
});
