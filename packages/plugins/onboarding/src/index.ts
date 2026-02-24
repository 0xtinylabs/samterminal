/**
 * @samterminal/plugin-onboarding
 *
 * User onboarding plugin for SamTerminal
 */

// Plugin exports
export { OnboardingPlugin, createOnboardingPlugin, type OnboardingPluginOptions } from './plugin.js';

// Type exports
export type {
  UserStatus,
  StepStatus,
  StepType,
  UserProfile,
  WalletInfo,
  UserPreferences,
  OnboardingFlow,
  FlowRequirement,
  OnboardingStep,
  StepContent,
  StepButton,
  StepInput,
  StepValidation,
  StepAction,
  OnboardingProgress,
  CompleteStepRequest,
  CompleteStepResult,
  OnboardingPluginConfig,
  OnboardingDatabaseAdapter,
} from './types/index.js';

// Utility exports from types
export {
  generateId,
  calculateProgress,
  isValidEmail,
  isValidWalletAddress,
  isValidPhone,
} from './types/index.js';

// Utils exports
export { InMemoryStorage, createInMemoryStorage } from './utils/storage.js';
export { FlowEngine, createFlowEngine } from './utils/flow-engine.js';
export {
  createDefaultFlow,
  mergePreferences,
  formatProgress,
  needsOnboarding,
} from './utils/index.js';

// Provider exports
export { createUserProvider, type UserQuery } from './providers/user.js';
export { createProgressProvider, type ProgressQuery } from './providers/progress.js';
export { createFlowProvider, type FlowQuery } from './providers/flow.js';

// Action exports
export { createCreateUserAction, type CreateUserRequest } from './actions/create-user.js';
export { createUpdateUserAction, type UpdateUserRequest } from './actions/update-user.js';
export { createStartFlowAction, type StartFlowRequest } from './actions/start-flow.js';
export { createCompleteStepAction } from './actions/complete-step.js';
