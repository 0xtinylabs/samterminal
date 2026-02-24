/**
 * Telegram Plugin tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { SamTerminalCore } from '@samterminal/core';

// Create mock bot instance
const mockBotInstance = {
  stopPolling: jest.fn(),
  removeAllListeners: jest.fn(),
  sendMessage: jest.fn().mockResolvedValue({ message_id: 123 } as never),
  getMe: jest.fn().mockResolvedValue({ username: 'testbot' } as never),
  onText: jest.fn(),
  on: jest.fn(),
};

// Mock node-telegram-bot-api before importing the plugin
jest.unstable_mockModule('node-telegram-bot-api', () => ({
  default: jest.fn().mockImplementation(() => mockBotInstance),
}));

// Dynamic import after mock setup
const { TelegramPlugin, createTelegramPlugin } = await import('./plugin.js');

describe('TelegramPlugin', () => {
  let plugin: InstanceType<typeof TelegramPlugin>;
  let mockCore: SamTerminalCore;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCore = {
      services: {
        registerAction: jest.fn(),
        registerProvider: jest.fn(),
        unregisterPlugin: jest.fn(),
      },
      events: {
        emit: jest.fn(),
      },
    } as unknown as SamTerminalCore;
  });

  describe('constructor', () => {
    it('should create plugin with default config', () => {
      plugin = new TelegramPlugin();

      expect(plugin.name).toBe('@samterminal/plugin-telegram');
      expect(plugin.version).toBe('1.0.0');
    });

    it('should accept custom config', () => {
      plugin = new TelegramPlugin({
        mainBotToken: 'main-token',
        userBotToken: 'user-token',
        polling: false,
      });

      expect(plugin).toBeDefined();
    });

    it('should merge custom messages with defaults', () => {
      plugin = new TelegramPlugin({
        messages: {
          enterCode: 'Custom enter code message',
        },
      });

      expect(plugin).toBeDefined();
    });
  });

  describe('init', () => {
    it('should initialize without tokens', async () => {
      plugin = new TelegramPlugin();
      await plugin.init(mockCore);

      expect(plugin.actions).toHaveLength(2);
      expect(plugin.providers).toHaveLength(2);
    });

    it('should create bots when tokens are provided', async () => {
      plugin = new TelegramPlugin({
        mainBotToken: 'main-token',
        userBotToken: 'user-token',
        polling: false,
      });

      await plugin.init(mockCore);

      expect(plugin.getBot('main')).toBeDefined();
      expect(plugin.getBot('user')).toBeDefined();
    });

    it('should set up listeners when database is provided', async () => {
      const mockDatabase = {
        isUserVerified: jest.fn().mockResolvedValue(false as never),
        connectTelegram: jest.fn().mockResolvedValue(undefined as never),
        verifyUser: jest.fn().mockResolvedValue(true as never),
      };

      plugin = new TelegramPlugin({
        userBotToken: 'user-token',
        database: mockDatabase as unknown as Parameters<typeof TelegramPlugin.prototype.init>[0] extends { database?: infer D } ? D : never,
        polling: false,
      });

      await plugin.init(mockCore);

      const bot = plugin.getBot('user');
      expect(bot).toBeDefined();
    });
  });

  describe('destroy', () => {
    it('should stop polling and clear bots', async () => {
      plugin = new TelegramPlugin({
        mainBotToken: 'main-token',
        polling: false,
      });
      await plugin.init(mockCore);

      const bot = plugin.getBot('main');
      expect(bot).toBeDefined();

      await plugin.destroy();

      // Bots should be cleared
      expect(plugin.getBot('main')).toBeNull();
    });
  });

  describe('getBot', () => {
    it('should return null for unconfigured bot', async () => {
      plugin = new TelegramPlugin();
      await plugin.init(mockCore);

      expect(plugin.getBot('main')).toBeNull();
      expect(plugin.getBot('user')).toBeNull();
    });

    it('should return bot instance when configured', async () => {
      plugin = new TelegramPlugin({
        mainBotToken: 'main-token',
        polling: false,
      });
      await plugin.init(mockCore);

      expect(plugin.getBot('main')).toBeDefined();
    });
  });

  describe('getBotUsername', () => {
    it('should return null for unconfigured bot', async () => {
      plugin = new TelegramPlugin();
      await plugin.init(mockCore);

      const username = await plugin.getBotUsername('main');

      expect(username).toBeNull();
    });

    it('should return username for configured bot', async () => {
      plugin = new TelegramPlugin({
        mainBotToken: 'main-token',
        polling: false,
      });
      await plugin.init(mockCore);

      const username = await plugin.getBotUsername('main');

      expect(username).toBe('testbot');
    });
  });
});

describe('createTelegramPlugin', () => {
  it('should create a new TelegramPlugin instance', () => {
    const plugin = createTelegramPlugin();

    expect(plugin).toBeInstanceOf(TelegramPlugin);
  });

  it('should accept config', () => {
    const plugin = createTelegramPlugin({
      mainBotToken: 'token',
      polling: false,
    });

    expect(plugin).toBeInstanceOf(TelegramPlugin);
  });
});
