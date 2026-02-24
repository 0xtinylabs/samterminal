/**
 * Onboarding Flow Example
 *
 * Demonstrates how to create a multi-step onboarding flow
 * using the onboarding plugin.
 */

import { createCore } from '@samterminal/core';
import { OnboardingPlugin } from '@samterminal/plugin-onboarding';

// Simulated user responses
const simulateUserResponse = (step: string): string => {
  const responses: Record<string, string> = {
    welcome: 'continue',
    wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0Ab1D',
    chain: 'base',
    notifications: 'yes',
    complete: 'done',
  };
  return responses[step] ?? 'skip';
};

async function main() {
  console.log('=== SamTerminal Onboarding Flow Example ===\n');

  const core = createCore({ logLevel: 'info' });

  // Define onboarding steps
  const onboardingConfig = {
    welcomeMessage: 'Welcome to SamTerminal! Let\'s get you set up.',
    steps: [
      {
        id: 'welcome',
        type: 'message' as const,
        message: 'This setup will help you configure your preferences.',
        actions: [
          { label: 'Continue', value: 'continue' },
          { label: 'Skip Setup', value: 'skip' },
        ],
      },
      {
        id: 'wallet',
        type: 'input' as const,
        message: 'Enter your wallet address to track:',
        validation: {
          pattern: '^0x[a-fA-F0-9]{40}$',
          errorMessage: 'Please enter a valid Ethereum address',
        },
        optional: true,
      },
      {
        id: 'chain',
        type: 'select' as const,
        message: 'Which chain do you primarily use?',
        options: [
          { label: 'Base', value: 'base' },
          { label: 'Ethereum', value: 'ethereum' },
          { label: 'Arbitrum', value: 'arbitrum' },
          { label: 'Polygon', value: 'polygon' },
        ],
      },
      {
        id: 'notifications',
        type: 'confirm' as const,
        message: 'Would you like to receive price alerts?',
        default: true,
      },
    ],
    onComplete: async (data: Record<string, unknown>) => {
      console.log('\n[Onboarding Complete]');
      console.log('User preferences:', JSON.stringify(data, null, 2));
    },
  };

  // Register onboarding plugin
  const onboardingPlugin = new OnboardingPlugin();
  await core.plugins.register(onboardingPlugin, onboardingConfig);

  await core.initialize();
  await core.start();

  // Get onboarding provider for session management
  const onboardingProvider = core.services.getProvider('onboarding:session');

  // Start onboarding flow
  console.log('Starting onboarding flow...\n');
  console.log('─'.repeat(40));

  // Use action to start session
  const session = await core.runtime.executeAction('onboarding:startSession', {
    userId: 'demo-user-123',
  }) as { id: string };

  // Process each step using actions
  let currentStep = await core.runtime.getData('onboarding:currentStep', {
    sessionId: session.id,
  }) as { id: string; message: string; options?: { label: string }[] } | null;

  while (currentStep) {
    console.log(`\n[Step: ${currentStep.id}]`);
    console.log(`Message: ${currentStep.message}`);

    if (currentStep.options) {
      console.log('Options:', currentStep.options.map((o) => o.label).join(', '));
    }

    // Simulate user response
    const response = simulateUserResponse(currentStep.id);
    console.log(`User Response: ${response}`);

    // Submit response using action
    await core.runtime.executeAction('onboarding:submitResponse', {
      sessionId: session.id,
      stepId: currentStep.id,
      value: response,
    });

    // Get next step
    currentStep = await core.runtime.getData('onboarding:currentStep', {
      sessionId: session.id,
    }) as { id: string; message: string; options?: { label: string }[] } | null;
  }

  console.log('\n' + '─'.repeat(40));
  console.log('\n[Session Summary]');

  const sessionData = await core.runtime.getData('onboarding:sessionData', {
    sessionId: session.id,
  });
  console.log('Collected Data:', JSON.stringify(sessionData, null, 2));

  // Cleanup
  await core.stop();
  console.log('\n=== Onboarding Example Complete ===');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
