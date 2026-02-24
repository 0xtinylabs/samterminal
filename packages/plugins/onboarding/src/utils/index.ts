/**
 * Utilities for @samterminal/plugin-onboarding
 */

import type { OnboardingStep, StepType, StepInput } from '../types/index.js';

export { InMemoryStorage, createInMemoryStorage } from './storage.js';
export { FlowEngine, createFlowEngine } from './flow-engine.js';

/**
 * Default onboarding flow template
 */
export function createDefaultFlow(): {
  name: string;
  description: string;
  steps: OnboardingStep[];
  active: boolean;
} {
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      name: 'Welcome',
      description: 'Welcome to the platform',
      type: 'info' as StepType,
      order: 1,
      required: true,
      skippable: false,
      content: {
        title: 'Welcome!',
        body: 'Welcome to SamTerminal. Let\'s get you set up.',
      },
    },
    {
      id: 'profile',
      name: 'Profile Setup',
      description: 'Set up your profile',
      type: 'input' as StepType,
      order: 2,
      required: true,
      skippable: false,
      inputs: [
        {
          id: 'name',
          name: 'name',
          type: 'text',
          label: 'Your Name',
          required: true,
          placeholder: 'Enter your name',
        },
        {
          id: 'email',
          name: 'email',
          type: 'email',
          label: 'Email Address',
          required: false,
          placeholder: 'Enter your email (optional)',
        },
      ] satisfies StepInput[],
    },
    {
      id: 'wallet',
      name: 'Connect Wallet',
      description: 'Connect your wallet',
      type: 'wallet_connect' as StepType,
      order: 3,
      required: false,
      skippable: true,
      content: {
        title: 'Connect Your Wallet',
        body: 'Connect your wallet to access all features.',
      },
    },
    {
      id: 'preferences',
      name: 'Preferences',
      description: 'Set your preferences',
      type: 'input' as StepType,
      order: 4,
      required: false,
      skippable: true,
      inputs: [
        {
          id: 'language',
          name: 'language',
          type: 'select',
          label: 'Language',
          required: false,
        },
        {
          id: 'notifications',
          name: 'notifications',
          type: 'checkbox',
          label: 'Enable Notifications',
          required: false,
        },
      ] satisfies StepInput[],
    },
    {
      id: 'complete',
      name: 'Complete',
      description: 'Onboarding complete',
      type: 'confirmation' as StepType,
      order: 5,
      required: true,
      skippable: false,
      content: {
        title: 'All Done!',
        body: 'You\'re all set up and ready to go.',
      },
    },
  ];

  return {
    name: 'Default Onboarding',
    description: 'Standard user onboarding flow',
    active: true,
    steps,
  };
}

/**
 * Merge user preferences
 */
export function mergePreferences(
  existing: Record<string, unknown> | undefined,
  updates: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...existing,
    ...updates,
  };
}

/**
 * Format progress for display
 */
export function formatProgress(progress: {
  completedSteps: string[];
  skippedSteps: string[];
  progressPercent: number;
  isCompleted: boolean;
}): string {
  if (progress.isCompleted) {
    return 'Completed';
  }

  const completed = progress.completedSteps.length;
  const skipped = progress.skippedSteps.length;
  const total = completed + skipped;

  if (total === 0) {
    return 'Not started';
  }

  return `${progress.progressPercent}% (${completed} completed${skipped > 0 ? `, ${skipped} skipped` : ''})`;
}

/**
 * Check if user needs onboarding
 */
export function needsOnboarding(user: {
  status: string;
  walletAddress?: string;
  name?: string;
}): boolean {
  if (user.status === 'new') {
    return true;
  }
  if (user.status === 'onboarding') {
    return true;
  }
  return false;
}
