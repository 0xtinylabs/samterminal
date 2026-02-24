/**
 * Onboarding types for @samterminal/plugin-onboarding
 */

/**
 * User profile status
 */
export type UserStatus = 'new' | 'onboarding' | 'active' | 'inactive' | 'suspended';

/**
 * Onboarding step status
 */
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';

/**
 * Step type
 */
export type StepType =
  | 'info'
  | 'action'
  | 'input'
  | 'verification'
  | 'wallet_connect'
  | 'confirmation'
  | 'custom';

/**
 * User profile
 */
export interface UserProfile {
  /** Unique user ID */
  id: string;

  /** Display name */
  name?: string;

  /** Email address */
  email?: string;

  /** Phone number */
  phone?: string;

  /** Telegram user ID */
  telegramId?: string;

  /** Telegram username */
  telegramUsername?: string;

  /** Primary wallet address */
  walletAddress?: string;

  /** All connected wallet addresses */
  wallets?: WalletInfo[];

  /** User status */
  status: UserStatus;

  /** User preferences */
  preferences?: UserPreferences;

  /** Custom metadata */
  metadata?: Record<string, unknown>;

  /** Profile creation timestamp */
  createdAt: number;

  /** Last update timestamp */
  updatedAt: number;

  /** Last active timestamp */
  lastActiveAt?: number;
}

/**
 * Connected wallet info
 */
export interface WalletInfo {
  /** Wallet address */
  address: string;

  /** Chain ID */
  chainId?: string;

  /** Wallet label */
  label?: string;

  /** Is primary wallet */
  isPrimary?: boolean;

  /** Connected timestamp */
  connectedAt: number;

  /** Last used timestamp */
  lastUsedAt?: number;
}

/**
 * User preferences
 */
export interface UserPreferences {
  /** Preferred language */
  language?: string;

  /** Preferred currency */
  currency?: string;

  /** Timezone */
  timezone?: string;

  /** Notification settings */
  notifications?: {
    email?: boolean;
    telegram?: boolean;
    push?: boolean;
  };

  /** Theme preference */
  theme?: 'light' | 'dark' | 'system';

  /** Default chain */
  defaultChain?: string;

  /** Custom preferences */
  custom?: Record<string, unknown>;
}

/**
 * Onboarding flow definition
 */
export interface OnboardingFlow {
  /** Flow ID */
  id: string;

  /** Flow name */
  name: string;

  /** Flow description */
  description?: string;

  /** Flow version */
  version?: string;

  /** Steps in the flow */
  steps: OnboardingStep[];

  /** Flow requirements */
  requirements?: FlowRequirement[];

  /** Is flow active */
  active?: boolean;

  /** Flow metadata */
  metadata?: Record<string, unknown>;

  /** Created timestamp */
  createdAt: number;

  /** Updated timestamp */
  updatedAt: number;
}

/**
 * Flow requirement
 */
export interface FlowRequirement {
  /** Requirement type */
  type: 'wallet' | 'email' | 'telegram' | 'verification' | 'custom';

  /** Is required */
  required: boolean;

  /** Requirement description */
  description?: string;
}

/**
 * Onboarding step definition
 */
export interface OnboardingStep {
  /** Step ID */
  id: string;

  /** Step name */
  name: string;

  /** Step description */
  description?: string;

  /** Step type */
  type: StepType;

  /** Step order (for sorting) */
  order: number;

  /** Is step required */
  required?: boolean;

  /** Can step be skipped */
  skippable?: boolean;

  /** Step content/instructions */
  content?: StepContent;

  /** Input fields (for input type) */
  inputs?: StepInput[];

  /** Validation rules */
  validation?: StepValidation;

  /** Action to execute (for action type) */
  action?: StepAction;

  /** Depends on step IDs */
  dependsOn?: string[];

  /** Step metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Step content
 */
export interface StepContent {
  /** Title */
  title?: string;

  /** Body text/markdown */
  body?: string;

  /** Image URL */
  image?: string;

  /** Video URL */
  video?: string;

  /** Help text */
  help?: string;

  /** Buttons/CTAs */
  buttons?: StepButton[];
}

/**
 * Step button
 */
export interface StepButton {
  /** Button ID */
  id: string;

  /** Button label */
  label: string;

  /** Button action */
  action: 'next' | 'skip' | 'back' | 'complete' | 'custom';

  /** Custom action name */
  customAction?: string;

  /** Button style */
  style?: 'primary' | 'secondary' | 'danger';

  /** Is disabled */
  disabled?: boolean;
}

/**
 * Step input field
 */
export interface StepInput {
  /** Input ID */
  id: string;

  /** Input name */
  name: string;

  /** Input type */
  type: 'text' | 'email' | 'phone' | 'number' | 'select' | 'checkbox' | 'wallet';

  /** Input label */
  label: string;

  /** Placeholder */
  placeholder?: string;

  /** Default value */
  defaultValue?: unknown;

  /** Is required */
  required?: boolean;

  /** Validation pattern */
  pattern?: string;

  /** Options (for select) */
  options?: Array<{ value: string; label: string }>;

  /** Help text */
  help?: string;
}

/**
 * Step validation rules
 */
export interface StepValidation {
  /** Validation type */
  type: 'input' | 'action' | 'external';

  /** Validation rules */
  rules?: Record<string, unknown>;

  /** Custom validation function name */
  customValidator?: string;

  /** Error message */
  errorMessage?: string;
}

/**
 * Step action definition
 */
export interface StepAction {
  /** Action type */
  type: 'api' | 'plugin' | 'custom';

  /** Action name/endpoint */
  name: string;

  /** Action parameters */
  params?: Record<string, unknown>;

  /** Success criteria */
  successCriteria?: Record<string, unknown>;
}

/**
 * User's onboarding progress
 */
export interface OnboardingProgress {
  /** User ID */
  userId: string;

  /** Flow ID */
  flowId: string;

  /** Current step ID */
  currentStepId: string;

  /** Completed step IDs */
  completedSteps: string[];

  /** Skipped step IDs */
  skippedSteps: string[];

  /** Failed step IDs */
  failedSteps: string[];

  /** Step data collected */
  stepData: Record<string, unknown>;

  /** Progress percentage */
  progressPercent: number;

  /** Is flow completed */
  isCompleted: boolean;

  /** Started timestamp */
  startedAt: number;

  /** Completed timestamp */
  completedAt?: number;

  /** Last activity timestamp */
  lastActivityAt: number;
}

/**
 * Step completion request
 */
export interface CompleteStepRequest {
  /** User ID */
  userId: string;

  /** Flow ID */
  flowId: string;

  /** Step ID */
  stepId: string;

  /** Step data/inputs */
  data?: Record<string, unknown>;

  /** Skip the step */
  skip?: boolean;
}

/**
 * Step completion result
 */
export interface CompleteStepResult {
  /** Success status */
  success: boolean;

  /** Next step ID (if any) */
  nextStepId?: string;

  /** Is flow completed */
  isFlowCompleted: boolean;

  /** Updated progress */
  progress: OnboardingProgress;

  /** Error message */
  error?: string;

  /** Validation errors */
  validationErrors?: Record<string, string>;
}

/**
 * Plugin configuration
 */
export interface OnboardingPluginConfig {
  /** Default flow ID */
  defaultFlowId?: string;

  /** Auto-start onboarding for new users */
  autoStart?: boolean;

  /** Allow skipping required steps */
  allowSkipRequired?: boolean;

  /** Require email verification */
  requireEmailVerification?: boolean;

  /** Require wallet connection */
  requireWallet?: boolean;

  /** Session timeout in milliseconds */
  sessionTimeout?: number;

  /** Maximum retries for failed steps */
  maxRetries?: number;

  /** Custom validators */
  validators?: Record<string, (value: unknown) => boolean>;
}

/**
 * Database adapter for onboarding persistence
 */
export interface OnboardingDatabaseAdapter {
  // User profiles
  createUser(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile>;
  getUser(userId: string): Promise<UserProfile | null>;
  getUserByTelegramId(telegramId: string): Promise<UserProfile | null>;
  getUserByWallet(walletAddress: string): Promise<UserProfile | null>;
  getUserByEmail(email: string): Promise<UserProfile | null>;
  updateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;
  deleteUser(userId: string): Promise<void>;

  // Onboarding flows
  getFlow(flowId: string): Promise<OnboardingFlow | null>;
  listFlows(options?: { active?: boolean }): Promise<OnboardingFlow[]>;
  createFlow(flow: Omit<OnboardingFlow, 'id' | 'createdAt' | 'updatedAt'>): Promise<OnboardingFlow>;
  updateFlow(flowId: string, updates: Partial<OnboardingFlow>): Promise<OnboardingFlow>;
  deleteFlow(flowId: string): Promise<void>;

  // Progress tracking
  getProgress(userId: string, flowId: string): Promise<OnboardingProgress | null>;
  saveProgress(progress: OnboardingProgress): Promise<void>;
  listUserProgress(userId: string): Promise<OnboardingProgress[]>;
  deleteProgress(userId: string, flowId: string): Promise<void>;
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(
  completedSteps: string[],
  skippedSteps: string[],
  totalSteps: number,
): number {
  if (totalSteps === 0) return 100;
  const completed = completedSteps.length + skippedSteps.length;
  return Math.round((completed / totalSteps) * 100);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate wallet address format (EVM)
 */
export function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
}
