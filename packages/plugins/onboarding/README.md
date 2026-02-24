# @samterminal/plugin-onboarding

User onboarding flows and profile management plugin for SamTerminal.

## Features

- **User Profile Management** - Create and update user profiles with preferences
- **Multi-Step Onboarding Flows** - Define custom onboarding flows with multiple steps
- **Progress Tracking** - Track user progress through onboarding flows
- **Step Validation** - Built-in validation for email, phone, wallet addresses
- **Skip Logic** - Configure required and optional steps
- **Flexible Storage** - In-memory storage or custom database adapters

## Installation

```bash
pnpm add @samterminal/plugin-onboarding
```

## Quick Start

```typescript
import { SamTerminal } from '@samterminal/core';
import { createOnboardingPlugin } from '@samterminal/plugin-onboarding';

const samterminal = new SamTerminal();

// Create plugin with default settings
const onboarding = createOnboardingPlugin({
  autoStart: true,
  requireEmailVerification: false,
  requireWallet: false,
});

await samterminal.use(onboarding);
```

## Configuration

```typescript
interface OnboardingPluginOptions {
  /** Database adapter (uses in-memory if not provided) */
  database?: OnboardingDatabaseAdapter;

  /** Initialize with default flow */
  initDefaultFlow?: boolean;

  /** Default flow ID to use */
  defaultFlowId?: string;

  /** Auto-start flow for new users */
  autoStart?: boolean;

  /** Allow skipping required steps */
  allowSkipRequired?: boolean;

  /** Require email verification */
  requireEmailVerification?: boolean;

  /** Require wallet connection */
  requireWallet?: boolean;

  /** Session timeout in milliseconds */
  sessionTimeout?: number;

  /** Max retries for step completion */
  maxRetries?: number;

  /** Custom validators */
  validators?: OnboardingValidators;
}
```

## Providers

### onboarding:user

Get user profile information.

```typescript
const result = await samterminal.provide('onboarding:user', {
  userId: 'user-123',
});

// Returns: { profile, status, preferences }
```

### onboarding:progress

Get user's onboarding progress.

```typescript
const result = await samterminal.provide('onboarding:progress', {
  userId: 'user-123',
  flowId: 'default-flow', // optional
});

// Returns: { progress, currentStep, percentage, remainingSteps }
```

### onboarding:flow

Get flow definition.

```typescript
const result = await samterminal.provide('onboarding:flow', {
  flowId: 'default-flow',
  includeSteps: true,
});

// Returns: { flow, steps }
```

## Actions

### onboarding:create-user

Create a new user profile.

```typescript
const result = await samterminal.execute('onboarding:create-user', {
  email: 'user@example.com',
  displayName: 'John Doe',
  preferences: {
    theme: 'dark',
    notifications: true,
  },
});

// Returns: { user, flowStarted, initialStep }
```

### onboarding:update-user

Update user profile.

```typescript
const result = await samterminal.execute('onboarding:update-user', {
  userId: 'user-123',
  displayName: 'Jane Doe',
  preferences: {
    language: 'en',
  },
});

// Returns: { user }
```

### onboarding:start-flow

Start an onboarding flow for a user.

```typescript
const result = await samterminal.execute('onboarding:start-flow', {
  userId: 'user-123',
  flowId: 'custom-flow', // optional, uses default if not provided
});

// Returns: { progress, currentStep, flow }
```

### onboarding:complete-step

Complete an onboarding step.

```typescript
const result = await samterminal.execute('onboarding:complete-step', {
  userId: 'user-123',
  stepId: 'profile-setup',
  flowId: 'default-flow', // optional
  data: {
    displayName: 'John Doe',
    bio: 'Crypto enthusiast',
  },
  skip: false, // set to true to skip optional steps
});

// Returns: { progress, nextStep, isFlowCompleted }
```

## Custom Flows

Create custom onboarding flows:

```typescript
const onboarding = createOnboardingPlugin();

// Create a custom flow
await onboarding.createFlow({
  name: 'Pro User Onboarding',
  description: 'Enhanced onboarding for pro users',
  active: true,
  version: 1,
  steps: [
    {
      id: 'welcome',
      type: 'info',
      order: 1,
      required: true,
      content: {
        title: 'Welcome to the Platform',
        description: 'Let\'s get you started',
        image: '/images/welcome.png',
      },
    },
    {
      id: 'profile',
      type: 'form',
      order: 2,
      required: true,
      content: {
        title: 'Set Up Your Profile',
        description: 'Tell us about yourself',
        inputs: [
          { id: 'displayName', type: 'text', label: 'Display Name', required: true },
          { id: 'bio', type: 'textarea', label: 'Bio', required: false },
        ],
      },
      validation: {
        rules: { displayName: { minLength: 2, maxLength: 50 } },
      },
    },
    {
      id: 'wallet',
      type: 'wallet-connect',
      order: 3,
      required: false,
      content: {
        title: 'Connect Your Wallet',
        description: 'Optional: Connect a wallet for Web3 features',
      },
    },
  ],
  requirements: {
    minSteps: 2,
    requiredStepIds: ['welcome', 'profile'],
  },
});
```

## Custom Database Adapter

Implement the `OnboardingDatabaseAdapter` interface for custom storage:

```typescript
import type { OnboardingDatabaseAdapter } from '@samterminal/plugin-onboarding';

class PostgresAdapter implements OnboardingDatabaseAdapter {
  async createUser(data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    // Insert into PostgreSQL
  }

  async getUser(userId: string): Promise<UserProfile | null> {
    // Fetch from PostgreSQL
  }

  async updateUser(userId: string, data: Partial<UserProfile>): Promise<UserProfile | null> {
    // Update in PostgreSQL
  }

  async deleteUser(userId: string): Promise<boolean> {
    // Delete from PostgreSQL
  }

  async createFlow(data: Omit<OnboardingFlow, 'id' | 'createdAt' | 'updatedAt'>): Promise<OnboardingFlow> {
    // Insert flow
  }

  async getFlow(flowId: string): Promise<OnboardingFlow | null> {
    // Fetch flow
  }

  async updateFlow(flowId: string, data: Partial<OnboardingFlow>): Promise<OnboardingFlow | null> {
    // Update flow
  }

  async listFlows(): Promise<OnboardingFlow[]> {
    // List all flows
  }

  async createProgress(data: Omit<OnboardingProgress, 'id'>): Promise<OnboardingProgress> {
    // Insert progress
  }

  async getProgress(userId: string, flowId: string): Promise<OnboardingProgress | null> {
    // Fetch progress
  }

  async updateProgress(userId: string, flowId: string, data: Partial<OnboardingProgress>): Promise<OnboardingProgress | null> {
    // Update progress
  }
}

// Use custom adapter
const onboarding = createOnboardingPlugin({
  database: new PostgresAdapter(),
});
```

## Step Types

| Type | Description |
|------|-------------|
| `info` | Information/welcome screen |
| `form` | Form with input fields |
| `wallet-connect` | Wallet connection step |
| `email-verify` | Email verification |
| `phone-verify` | Phone verification |
| `kyc` | KYC verification |
| `preferences` | User preferences selection |
| `complete` | Completion/summary screen |

## Utilities

```typescript
import {
  generateId,
  calculateProgress,
  isValidEmail,
  isValidWalletAddress,
  isValidPhone,
  createDefaultFlow,
  needsOnboarding,
} from '@samterminal/plugin-onboarding';

// Generate unique ID
const id = generateId();

// Calculate progress percentage
const percentage = calculateProgress(completedSteps, totalSteps);

// Validate email
const isValid = isValidEmail('user@example.com');

// Check if user needs onboarding
const shouldOnboard = needsOnboarding(user);
```

## Events

The plugin emits events through the SamTerminal event system:

- `plugin:loaded` - Plugin initialized
- `plugin:unloaded` - Plugin destroyed

## License

MIT
