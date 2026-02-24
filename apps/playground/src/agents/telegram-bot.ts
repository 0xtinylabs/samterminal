/**
 * Telegram Bot Agent Example
 *
 * This example demonstrates how to create a Telegram bot
 * with AI chat capabilities and onboarding flow.
 */

import { createCore, type AgentConfig } from '@samterminal/core';
import { TelegramPlugin } from '@samterminal/plugin-telegram';
import { AIPlugin } from '@samterminal/plugin-ai';
import { OnboardingPlugin } from '@samterminal/plugin-onboarding';

async function main() {
  console.log('=== SamTerminal Telegram Bot Example ===\n');

  // Validate environment
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('Error: TELEGRAM_BOT_TOKEN is required');
    console.log('Please set it in your .env file');
    process.exit(1);
  }

  // Create core
  const core = createCore({
    logLevel: 'info',
  });

  // Register Telegram plugin
  console.log('Registering Telegram plugin...');
  const telegramPlugin = new TelegramPlugin();
  await core.plugins.register(telegramPlugin, {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    defaultChatId: process.env.TELEGRAM_CHAT_ID,
    commands: [
      { command: 'start', description: 'Start the bot' },
      { command: 'help', description: 'Show help message' },
      { command: 'chat', description: 'Start AI chat' },
      { command: 'status', description: 'Show bot status' },
    ],
  });

  // Register AI plugin (optional but recommended)
  if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) {
    console.log('Registering AI plugin...');
    const aiPlugin = new AIPlugin();
    await core.plugins.register(aiPlugin, {
      provider: process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'openai',
      apiKey: process.env.ANTHROPIC_API_KEY ?? process.env.OPENAI_API_KEY,
      model: process.env.ANTHROPIC_API_KEY ? 'claude-3-sonnet-20240229' : 'gpt-4-turbo-preview',
      systemPrompt: `You are a helpful Web3 assistant powered by SamTerminal.
You can help users with:
- Token prices and market data
- Wallet tracking
- DeFi operations
Be concise and friendly.`,
    });
  }

  // Register Onboarding plugin
  console.log('Registering Onboarding plugin...');
  const onboardingPlugin = new OnboardingPlugin();
  await core.plugins.register(onboardingPlugin, {
    welcomeMessage: 'Welcome to SamTerminal Bot! I can help you with Web3 tasks.',
    steps: [
      {
        id: 'wallet',
        message: 'Would you like to connect a wallet for tracking?',
        optional: true,
      },
      {
        id: 'notifications',
        message: 'Would you like to enable price alerts?',
        optional: true,
      },
    ],
  });

  // Initialize and start
  await core.initialize();
  await core.start();

  // Create agent
  const agentConfig: AgentConfig = {
    name: 'telegram-bot',
    description: 'Telegram bot with AI chat and onboarding',
    plugins: ['telegram', 'ai', 'onboarding'],
  };

  const agent = await core.createAgent(agentConfig);

  // Setup message handlers using actions
  core.events.on('telegram:message', async (message) => {
    console.log(`[Telegram] Received: ${message.text}`);

    // Handle commands using actions
    if (message.text?.startsWith('/')) {
      const command = message.text.split(' ')[0].substring(1);
      const sendMessageAction = core.services.getAction('telegram:sendMessage');

      switch (command) {
        case 'start':
          // Trigger onboarding
          core.events.emit('onboarding:start', { userId: message.from.id });
          break;

        case 'help':
          if (sendMessageAction) {
            await core.runtime.executeAction('telegram:sendMessage', {
              chatId: message.chat.id,
              text: `Available commands:
/start - Start the bot
/help - Show this help
/chat <message> - Chat with AI
/status - Show bot status`,
            });
          }
          break;

        case 'chat':
          const chatMessage = message.text.substring(6).trim();
          const chatAction = core.services.getAction('ai:chat');
          if (chatMessage && chatAction) {
            const response = await core.runtime.executeAction('ai:chat', { message: chatMessage });
            if (sendMessageAction) {
              await core.runtime.executeAction('telegram:sendMessage', {
                chatId: message.chat.id,
                text: response as string,
              });
            }
          }
          break;

        case 'status':
          if (sendMessageAction) {
            await core.runtime.executeAction('telegram:sendMessage', {
              chatId: message.chat.id,
              text: `Bot Status: Running
Agent: ${agent.name}
Plugins: ${core.plugins.getAll().map((p) => p.name).join(', ')}`,
            });
          }
          break;
      }
    }
  });

  // Handle onboarding events
  core.events.on('onboarding:complete', (data) => {
    console.log(`[Onboarding] User ${data.userId} completed onboarding`);
  });

  console.log(`\nTelegram Bot "${agent.name}" is running!`);
  console.log('Send /start to your bot to begin.');
  console.log('Press Ctrl+C to stop.\n');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await core.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
