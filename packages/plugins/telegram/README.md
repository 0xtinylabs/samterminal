# @samterminal/plugin-telegram

Telegram notification and bot integration for SamTerminal.

## Features

- Send messages to Telegram chats (groups and users)
- Inline keyboard buttons (links and callbacks)
- User verification flow for personal notifications
- Multiple bot support (main and user bots)
- Database adapter for user management

## Installation

```bash
pnpm add @samterminal/plugin-telegram
```

## Quick Start

```typescript
import { createCore } from '@samterminal/core';
import { createTelegramPlugin } from '@samterminal/plugin-telegram';

const core = createCore();

// Create plugin with configuration
const telegramPlugin = createTelegramPlugin({
  mainBotToken: process.env.MAIN_BOT_TOKEN,
  userBotToken: process.env.USER_BOT_TOKEN,
  mainGroupChatId: process.env.MAIN_GROUP_CHAT_ID,
});

// Register and initialize
await core.plugins.register(telegramPlugin);
await core.initialize();
await core.start();

// Send a message
await core.runtime.executeAction('telegram:send', {
  message: 'Hello from SamTerminal!',
  to: '123456789', // Chat ID
  botType: 'main',
});

// Send with buttons
await core.runtime.executeAction('telegram:send', {
  message: 'Check this out:',
  to: 'user-connection-key',
  botType: 'user',
  buttons: [
    { label: 'Visit Website', data: 'https://example.com', type: 'link' },
    { label: 'Click Me', data: 'callback_action', type: 'callback' },
  ],
});
```

## Configuration

```typescript
interface TelegramPluginConfig {
  // Bot tokens
  mainBotToken?: string;    // For group broadcasts
  userBotToken?: string;    // For personal notifications

  // Group chat ID for main bot
  mainGroupChatId?: string;

  // Polling mode (default: true)
  polling?: boolean;

  // Database adapter for user management
  database?: TelegramDatabaseAdapter;

  // Custom messages
  messages?: TelegramMessages;
}
```

## Actions

### `telegram:send`

Send a message to a Telegram chat.

```typescript
interface SendMessageInput {
  message: string;           // Message text (HTML/Markdown)
  to: string;               // Chat ID or connection key
  botType?: 'main' | 'user'; // Which bot to use (default: 'user')
  buttons?: TelegramButton[]; // Inline keyboard buttons
  bypass?: boolean;         // Bypass active status check
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disableWebPagePreview?: boolean;
  disableNotification?: boolean;
}
```

### `telegram:toggle`

Toggle notifications for a user.

```typescript
interface ToggleNotificationsInput {
  userId: string;  // User connection key
}
```

## Providers

### `telegram:state`

Get bot connection state for a user.

```typescript
// Query
{ userId: string }

// Response
{
  type: 'user',
  isActive: boolean,
  isVerified: boolean
}
```

### `telegram:url`

Get Telegram bot URL for user connection.

```typescript
// Query
{ userId: string }

// Response
{
  code: string,      // Verification code
  url: string,       // Bot start URL
  botUsername: string
}
```

## Database Adapter

To enable user management features, implement the `TelegramDatabaseAdapter` interface:

```typescript
interface TelegramDatabaseAdapter {
  getTelegramId(connectionKey: string): Promise<string | null>;
  isUserActive(connectionKey: string): Promise<boolean>;
  getOrCreateUser(connectionKey: string): Promise<{ ref: string; verificationCode: string }>;
  connectTelegram(ref: string, telegramId: string): Promise<boolean>;
  verifyUser(telegramId: string, code: string): Promise<boolean>;
  isUserVerified(connectionKey: string): Promise<boolean>;
  toggleNotifications(connectionKey: string): Promise<boolean>;
  getBotState(connectionKey: string): Promise<BotState | null>;
}
```

## User Verification Flow

1. Call `telegram:url` provider to get bot URL and verification code
2. User clicks the URL and starts the bot with `/start {ref}`
3. Bot prompts user to enter verification code
4. User sends the code
5. Bot verifies and activates notifications

## Button Types

### Link Button
Opens a URL when clicked.

```typescript
{
  label: 'Visit Website',
  data: 'https://example.com',
  type: 'link'
}
```

### Callback Button
Triggers a callback_data event.

```typescript
{
  label: 'Click Me',
  data: 'action_name',
  type: 'callback'
}
```

## Environment Variables

```env
MAIN_BOT_TOKEN=your_main_bot_token
USER_BOT_TOKEN=your_user_bot_token
MAIN_GROUP_CHAT_ID=-1001234567890
```

## License

MIT
