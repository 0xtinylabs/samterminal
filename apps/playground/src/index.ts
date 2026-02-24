/**
 * SamTerminal Playground - Main Entry Point
 *
 * This is the main entry point for the playground application.
 * It demonstrates how to initialize SamTerminal with multiple plugins
 * and create a fully-featured agent.
 */

import { createCore, type AgentConfig } from '@samterminal/core';
import { TelegramPlugin } from '@samterminal/plugin-telegram';
import { AIPlugin } from '@samterminal/plugin-ai';
import { TokenDataPlugin } from '@samterminal/plugin-tokendata';
import { WalletDataPlugin } from '@samterminal/plugin-walletdata';
import { SwapPlugin } from '@samterminal/plugin-swap';
import { OnboardingPlugin } from '@samterminal/plugin-onboarding';

async function main() {
  console.log('Starting SamTerminal Playground...\n');

  // Create SamTerminal core instance
  const core = createCore({
    logLevel: 'info',
  });

  // Register plugins
  console.log('Registering plugins...');

  const telegramPlugin = new TelegramPlugin();
  await core.plugins.register(telegramPlugin, {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    defaultChatId: process.env.TELEGRAM_CHAT_ID,
  });

  const aiPlugin = new AIPlugin();
  await core.plugins.register(aiPlugin, {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4-turbo-preview',
  });

  const tokenDataPlugin = new TokenDataPlugin();
  await core.plugins.register(tokenDataPlugin, {
    primarySource: 'dexscreener',
    cacheTtl: 60000, // 1 minute
  });

  const walletDataPlugin = new WalletDataPlugin();
  await core.plugins.register(walletDataPlugin, {
    defaultChain: 'base',
  });

  const swapPlugin = new SwapPlugin();
  await core.plugins.register(swapPlugin, {
    defaultSlippage: 0.5,
    maxSlippage: 5,
  });

  const onboardingPlugin = new OnboardingPlugin();
  await core.plugins.register(onboardingPlugin, {
    welcomeMessage: 'Welcome to SamTerminal Playground!',
  });

  // Initialize core
  console.log('Initializing SamTerminal...');
  await core.initialize();

  // Start core
  console.log('Starting SamTerminal...');
  await core.start();

  // Create agent configuration
  const agentConfig: AgentConfig = {
    name: 'playground-agent',
    description: 'A demo agent showcasing SamTerminal capabilities',
    plugins: [
      'telegram',
      'ai',
      'tokendata',
      'walletdata',
      'swap',
      'onboarding',
    ],
  };

  // Create and start the agent
  console.log('Creating agent...');
  const agent = await core.createAgent(agentConfig);

  console.log(`\nAgent "${agent.name}" is running!`);
  console.log('Press Ctrl+C to stop.\n');

  // Listen for events
  core.events.on('message', (message) => {
    console.log(`[Message] ${JSON.stringify(message)}`);
  });

  core.events.on('action:executed', (action) => {
    console.log(`[Action] ${action.name} executed`);
  });

  core.events.on('error', (error) => {
    console.error(`[Error] ${error.message}`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await core.stop();
    console.log('Goodbye!');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await core.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
