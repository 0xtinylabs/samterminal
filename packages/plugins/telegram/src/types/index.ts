/**
 * Telegram Plugin Types
 */

/**
 * Telegram bot types
 */
export type TelegramBotType = 'main' | 'user';

/**
 * Button types for inline keyboards
 */
export type TelegramButtonType = 'link' | 'callback';

/**
 * Telegram button definition
 */
export interface TelegramButton {
  /**
   * Button display text
   */
  label: string;

  /**
   * URL for link buttons, callback data for callback buttons
   */
  data?: string;

  /**
   * Button type
   */
  type: TelegramButtonType;
}

/**
 * Send message input
 */
export interface SendMessageInput {
  /**
   * Message text (supports Markdown/HTML based on parse_mode)
   */
  message: string;

  /**
   * Target chat ID or connection key
   * - For 'main' bot: group chat ID
   * - For 'user' bot: user's connection key (resolved to Telegram ID)
   */
  to: string;

  /**
   * Which bot to use
   * @default 'user'
   */
  botType?: TelegramBotType;

  /**
   * Optional inline keyboard buttons
   */
  buttons?: TelegramButton[];

  /**
   * Bypass active status check for user bot
   * @default false
   */
  bypass?: boolean;

  /**
   * Parse mode for message formatting
   * @default 'HTML'
   */
  parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML';

  /**
   * Disable link previews
   * @default false
   */
  disableWebPagePreview?: boolean;

  /**
   * Disable notification sound
   * @default false
   */
  disableNotification?: boolean;
}

/**
 * Send message result
 */
export interface SendMessageResult {
  /**
   * Whether the message was sent successfully
   */
  success: boolean;

  /**
   * Message ID if sent successfully
   */
  messageId?: number;

  /**
   * Error message if failed
   */
  error?: string;
}

/**
 * Bot state
 */
export interface BotState {
  /**
   * Bot type
   */
  type: TelegramBotType;

  /**
   * Whether notifications are enabled
   */
  isActive: boolean;

  /**
   * Whether the user has verified their connection
   */
  isVerified: boolean;
}

/**
 * User bot URL data
 */
export interface UserBotUrl {
  /**
   * Verification code
   */
  code: string;

  /**
   * Full Telegram bot URL with start parameter
   */
  url: string;

  /**
   * Bot username
   */
  botUsername: string;
}

/**
 * Plugin configuration
 */
export interface TelegramPluginConfig {
  /**
   * Main bot token (for group broadcasts)
   */
  mainBotToken?: string;

  /**
   * User bot token (for personal notifications)
   */
  userBotToken?: string;

  /**
   * Main group chat ID
   */
  mainGroupChatId?: string;

  /**
   * Whether to use polling mode (for development)
   * @default true
   */
  polling?: boolean;

  /**
   * Database connection for user management
   * If not provided, user bot features are disabled
   */
  database?: TelegramDatabaseAdapter;

  /**
   * Pre-defined messages
   */
  messages?: TelegramMessages;
}

/**
 * Database adapter interface for user management
 */
export interface TelegramDatabaseAdapter {
  /**
   * Get user's Telegram ID by connection key
   */
  getTelegramId(connectionKey: string): Promise<string | null>;

  /**
   * Check if user has active notifications
   */
  isUserActive(connectionKey: string): Promise<boolean>;

  /**
   * Get or create user by connection key
   */
  getOrCreateUser(connectionKey: string): Promise<{
    ref: string;
    verificationCode: string;
  }>;

  /**
   * Connect Telegram ID to user
   */
  connectTelegram(
    ref: string,
    telegramId: string,
  ): Promise<boolean>;

  /**
   * Verify user's Telegram connection
   */
  verifyUser(telegramId: string, code: string): Promise<boolean>;

  /**
   * Check if user is verified
   */
  isUserVerified(connectionKey: string): Promise<boolean>;

  /**
   * Toggle user's notification state
   */
  toggleNotifications(connectionKey: string): Promise<boolean>;

  /**
   * Get user's bot state
   */
  getBotState(connectionKey: string): Promise<BotState | null>;
}

/**
 * Pre-defined messages
 */
export interface TelegramMessages {
  enterCode: string;
  codeIncorrect: string;
  codeCorrect: string;
  activated: string;
  deactivated: string;
  alreadyConnected: string;
}

/**
 * Default messages
 */
export const DEFAULT_MESSAGES: TelegramMessages = {
  enterCode: 'Please enter the auth code you received:',
  codeIncorrect: '❌ The auth code is incorrect. Please enter the correct code shared with you!',
  codeCorrect: 'The auth code is correct. Hang on…',
  activated: '✅ Your Telegram account has been linked successfully!',
  deactivated: 'You\'ve disconnected your Telegram profile.',
  alreadyConnected: 'You\'re already connected!',
};
