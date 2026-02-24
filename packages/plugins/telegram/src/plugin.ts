/**
 * Telegram Plugin
 * Provides Telegram notification capabilities for SamTerminal
 */

import TelegramBot from 'node-telegram-bot-api';
import type { SamTerminalPlugin, SamTerminalCore, Action, Provider, Hook } from '@samterminal/core';
import { createLogger } from '@samterminal/core';
import type {
  TelegramPluginConfig,
  TelegramBotType,
  TelegramMessages,
  DEFAULT_MESSAGES,
} from './types/index.js';
import { createSendMessageAction } from './actions/send-message.js';
import { createToggleNotificationsAction } from './actions/toggle-notifications.js';
import { createBotStateProvider } from './providers/bot-state.js';
import { createBotUrlProvider } from './providers/bot-url.js';
import { validateCode } from './utils/code.js';

const logger = createLogger({ prefix: 'TelegramPlugin' });

/**
 * Default messages for the plugin
 */
const defaultMessages: TelegramMessages = {
  enterCode: 'Please enter the auth code you received:',
  codeIncorrect: '❌ The auth code is incorrect. Please enter the correct code shared with you!',
  codeCorrect: 'The auth code is correct. Hang on…',
  activated: '✅ Your Telegram account has been linked successfully!',
  deactivated: 'You\'ve disconnected your Telegram profile.',
  alreadyConnected: 'You\'re already connected!',
};

/**
 * Telegram Plugin Implementation
 */
export class TelegramPlugin implements SamTerminalPlugin {
  readonly name = '@samterminal/plugin-telegram';
  readonly version = '1.0.0';
  readonly description = 'Telegram notification and bot integration for SamTerminal';
  readonly author = 'TinyLabs';

  private config: TelegramPluginConfig;
  private bots: Map<TelegramBotType, TelegramBot | null> = new Map();
  private core: SamTerminalCore | null = null;
  private messages: TelegramMessages;

  actions: Action[] = [];
  providers: Provider[] = [];
  hooks: Hook[] = [];

  constructor(config?: TelegramPluginConfig) {
    this.config = config ?? {};
    this.messages = { ...defaultMessages, ...config?.messages };
  }

  /**
   * Initialize the plugin
   */
  async init(core: SamTerminalCore): Promise<void> {
    this.core = core;

    // Initialize bots
    this.createBots();

    // Create actions
    this.actions = [
      createSendMessageAction(() => this.bots, this.config),
      createToggleNotificationsAction(this.config),
    ];

    // Create providers
    this.providers = [
      createBotStateProvider(this.config),
      createBotUrlProvider(() => this.bots, this.config),
    ];

    // Set up bot listeners
    this.setupListeners();
  }

  /**
   * Destroy the plugin
   */
  async destroy(): Promise<void> {
    // Remove all listeners and stop polling for all bots
    for (const bot of this.bots.values()) {
      if (bot) {
        bot.removeAllListeners();
        bot.stopPolling();
      }
    }

    this.bots.clear();
    this.core = null;
  }

  /**
   * Create bot instances
   */
  private createBots(): void {
    const polling = this.config.polling ?? true;

    // Create main bot
    if (this.config.mainBotToken) {
      try {
        const mainBot = new TelegramBot(this.config.mainBotToken, { polling });
        this.bots.set('main', mainBot);
      } catch (error) {
        logger.error('Failed to initialize main Telegram bot', error instanceof Error ? error : new Error(String(error)));
        this.bots.set('main', null);
      }
    } else {
      this.bots.set('main', null);
    }

    // Create user bot
    if (this.config.userBotToken) {
      try {
        const userBot = new TelegramBot(this.config.userBotToken, { polling });
        this.bots.set('user', userBot);
      } catch (error) {
        logger.error('Failed to initialize user Telegram bot', error instanceof Error ? error : new Error(String(error)));
        this.bots.set('user', null);
      }
    } else {
      this.bots.set('user', null);
    }
  }

  /**
   * Set up bot event listeners
   */
  private setupListeners(): void {
    const userBot = this.bots.get('user');
    if (!userBot || !this.config.database) {
      return;
    }

    // /start command listener
    userBot.onText(/\/start(.*)/, async (msg, match) => {
      const chatId = msg.chat.id.toString();
      const ref = match?.[1]?.trim() ?? '';

      if (!ref) {
        return;
      }

      try {
        // Check if already verified
        const isVerified = await this.config.database!.isUserVerified(ref);

        if (isVerified) {
          await userBot.sendMessage(chatId, this.messages.alreadyConnected);
          return;
        }

        // Connect Telegram to user
        const telegramId = msg.from?.id?.toString();
        if (telegramId) {
          await this.config.database!.connectTelegram(ref, telegramId);
        }

        // Send verification prompt
        await userBot.sendMessage(chatId, this.messages.enterCode);
      } catch (error) {
        logger.error('Error handling /start command', error instanceof Error ? error : new Error(String(error)));
      }
    });

    // Message listener for verification codes
    userBot.on('message', async (msg) => {
      // Ignore group messages
      if (msg.chat.type !== 'private') {
        return;
      }

      // Ignore commands
      if (msg.text?.startsWith('/')) {
        return;
      }

      const chatId = msg.chat.id.toString();
      const text = msg.text?.trim() ?? '';
      const telegramId = msg.from?.id?.toString() ?? '';

      if (!text || !telegramId) {
        return;
      }

      try {
        // Try to verify the code
        const verified = await this.config.database!.verifyUser(telegramId, text);

        if (verified) {
          await userBot.sendMessage(chatId, this.messages.codeCorrect);
          await userBot.sendMessage(chatId, this.messages.activated);
        } else {
          await userBot.sendMessage(chatId, this.messages.codeIncorrect);
        }
      } catch (error) {
        logger.error('Error handling verification message', error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Get bot instance
   */
  getBot(type: TelegramBotType): TelegramBot | null {
    return this.bots.get(type) ?? null;
  }

  /**
   * Get bot username
   */
  async getBotUsername(type: TelegramBotType): Promise<string | null> {
    const bot = this.bots.get(type);
    if (!bot) {
      return null;
    }

    try {
      const info = await bot.getMe();
      return info.username ?? null;
    } catch (_error) {
      return null;
    }
  }
}

/**
 * Create the Telegram plugin
 */
export function createTelegramPlugin(config?: TelegramPluginConfig): TelegramPlugin {
  return new TelegramPlugin(config);
}

/**
 * Default export
 */
export default createTelegramPlugin;
