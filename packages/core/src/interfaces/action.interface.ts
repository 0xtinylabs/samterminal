/**
 * Action Interface
 * Actions are executable operations that plugins provide
 */

import type {
  ActionContext,
  ActionResult,
  ChainId,
  ValidationResult,
} from '../types/index.js';

/**
 * Action interface for executable plugin operations
 */
export interface Action {
  /**
   * Unique name of the action (e.g., "swap:execute", "telegram:send")
   */
  readonly name: string;

  /**
   * Human-readable description of what this action does
   */
  readonly description?: string;

  /**
   * Category for grouping related actions
   */
  readonly category?: string;

  /**
   * Execute the action with the given context
   * @param context - Execution context with input data
   * @returns Action result with success status and output
   */
  execute(context: ActionContext): Promise<ActionResult>;

  /**
   * Validate input before execution
   * @param input - Raw input to validate
   * @returns Validation result with errors if invalid
   */
  validate?(input: unknown): ValidationResult;

  /**
   * Chains this action supports
   * If undefined, action is chain-agnostic
   */
  readonly chains?: ChainId[];

  /**
   * Whether this action modifies state (true) or is read-only (false)
   */
  readonly mutates?: boolean;

  /**
   * Whether this action requires user confirmation
   */
  readonly requiresConfirmation?: boolean;

  /**
   * Estimated gas cost for on-chain actions
   */
  readonly estimatedGas?: bigint;

  /**
   * Schema for action input (JSON Schema format)
   */
  readonly inputSchema?: ActionSchema;

  /**
   * Schema for action output (JSON Schema format)
   */
  readonly outputSchema?: ActionSchema;

  /**
   * Tags for categorization and search
   */
  readonly tags?: string[];
}

/**
 * JSON Schema-like definition for action I/O
 */
export interface ActionSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, ActionSchemaProperty>;
  required?: string[];
  items?: ActionSchemaProperty;
  description?: string;
}

export interface ActionSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  default?: unknown;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  properties?: Record<string, ActionSchemaProperty>;
  items?: ActionSchemaProperty;
}

/**
 * Action execution options
 */
export interface ActionExecutionOptions {
  /**
   * Timeout in milliseconds
   */
  timeout?: number;

  /**
   * Whether to retry on failure
   */
  retry?: boolean;

  /**
   * Maximum retry attempts
   */
  maxRetries?: number;

  /**
   * Delay between retries in milliseconds
   */
  retryDelay?: number;

  /**
   * Whether to simulate the action without executing
   */
  simulate?: boolean;

  /**
   * Skip validation before execution
   */
  skipValidation?: boolean;
}

/**
 * Action builder for fluent action creation
 */
export interface ActionBuilder {
  name(name: string): ActionBuilder;
  description(description: string): ActionBuilder;
  category(category: string): ActionBuilder;
  chains(chains: ChainId[]): ActionBuilder;
  inputSchema(schema: ActionSchema): ActionBuilder;
  outputSchema(schema: ActionSchema): ActionBuilder;
  validate(validator: (input: unknown) => ValidationResult): ActionBuilder;
  execute(
    executor: (context: ActionContext) => Promise<ActionResult>,
  ): ActionBuilder;
  build(): Action;
}
