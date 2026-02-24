/**
 * AI Chat Example
 *
 * Demonstrates how to use the AI plugin for conversational
 * interactions with context and memory.
 */

import { createCore } from '@samterminal/core';
import { AIPlugin } from '@samterminal/plugin-ai';
import * as readline from 'readline';

async function main() {
  console.log('=== SamTerminal AI Chat Example ===\n');

  // Check for API keys
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  if (!hasOpenAI && !hasAnthropic) {
    console.error('Error: No AI API key found.');
    console.log('Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env file');
    process.exit(1);
  }

  const core = createCore({ logLevel: 'info' });

  // Configure AI plugin
  const provider = hasAnthropic ? 'anthropic' : 'openai';
  const apiKey = hasAnthropic ? process.env.ANTHROPIC_API_KEY : process.env.OPENAI_API_KEY;
  const model = hasAnthropic ? 'claude-3-sonnet-20240229' : 'gpt-4-turbo-preview';

  console.log(`Using provider: ${provider}`);
  console.log(`Model: ${model}\n`);

  const aiPlugin = new AIPlugin();
  await core.plugins.register(aiPlugin, {
    provider,
    apiKey,
    model,
    systemPrompt: `You are a helpful Web3 assistant powered by SamTerminal.
You have knowledge about:
- Cryptocurrency and blockchain technology
- DeFi protocols and trading
- Smart contracts and Solidity
- Popular chains like Ethereum, Base, and Arbitrum

Be concise, friendly, and technically accurate.
If you don't know something, say so.`,
    maxTokens: 1000,
    temperature: 0.7,
  });

  await core.initialize();
  await core.start();

  // Create conversation using action
  const conversation = await core.runtime.executeAction('ai:createConversation', {
    id: 'demo-chat',
    metadata: {
      user: 'demo-user',
      startedAt: new Date().toISOString(),
    },
  }) as { id: string };

  console.log('Chat initialized! Type your messages below.');
  console.log('Commands:');
  console.log('  /clear - Clear conversation history');
  console.log('  /context - Show conversation context');
  console.log('  /exit - Exit the chat\n');
  console.log('─'.repeat(50));

  // Setup readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question('\nYou: ', async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        prompt();
        return;
      }

      // Handle commands
      if (trimmed.startsWith('/')) {
        const command = trimmed.toLowerCase();

        if (command === '/exit') {
          console.log('\nGoodbye!');
          rl.close();
          await core.stop();
          process.exit(0);
        }

        if (command === '/clear') {
          await core.runtime.executeAction('ai:clearConversation', {
            conversationId: conversation.id,
          });
          console.log('\n[Conversation cleared]');
          prompt();
          return;
        }

        if (command === '/context') {
          const context = await core.runtime.getData('ai:conversationContext', {
            conversationId: conversation.id,
          }) as { messageCount: number; estimatedTokens: number };
          console.log('\n[Conversation Context]');
          console.log(`Messages: ${context.messageCount}`);
          console.log(`Tokens used: ~${context.estimatedTokens}`);
          prompt();
          return;
        }

        console.log('\nUnknown command. Try /clear, /context, or /exit');
        prompt();
        return;
      }

      // Send message to AI using action
      try {
        process.stdout.write('\nAI: ');

        const response = await core.runtime.executeAction('ai:chat', {
          conversationId: conversation.id,
          message: trimmed,
        }) as string;

        console.log(response);
      } catch (error) {
        console.error(`\n[Error: ${(error as Error).message}]`);
      }

      prompt();
    });
  };

  prompt();

  // Handle Ctrl+C
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down...');
    rl.close();
    await core.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
