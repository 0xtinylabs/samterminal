/**
 * Evaluator Interface
 * Evaluators check conditions and return boolean results
 */

import type { EvaluatorContext, FlowCondition } from '../types/index.js';

/**
 * Evaluator interface for condition checking
 */
export interface Evaluator {
  /**
   * Unique name of the evaluator (e.g., "balance:check", "time:between")
   */
  readonly name: string;

  /**
   * Human-readable description
   */
  readonly description?: string;

  /**
   * Category for grouping related evaluators
   */
  readonly category?: string;

  /**
   * Evaluate a condition against provided data
   * @param context - Evaluation context with condition and data
   * @returns Boolean result of evaluation
   */
  evaluate(context: EvaluatorContext): Promise<boolean>;

  /**
   * Supported condition operators
   */
  readonly supportedOperators?: string[];

  /**
   * Schema for condition input
   */
  readonly conditionSchema?: EvaluatorSchema;

  /**
   * Tags for categorization and search
   */
  readonly tags?: string[];
}

/**
 * Schema for evaluator conditions
 */
export interface EvaluatorSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, EvaluatorSchemaProperty>;
  required?: string[];
  description?: string;
}

export interface EvaluatorSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  default?: unknown;
  enum?: unknown[];
}

/**
 * Composite evaluator for combining multiple conditions
 */
export interface CompositeEvaluator extends Evaluator {
  /**
   * Evaluate multiple conditions with AND/OR logic
   */
  evaluateAll(
    conditions: FlowCondition[],
    data: unknown,
    operator: 'and' | 'or',
  ): Promise<boolean>;
}

/**
 * Standard condition operators
 */
export const CONDITION_OPERATORS = {
  // Equality
  EQ: 'eq',
  NEQ: 'neq',

  // Comparison
  GT: 'gt',
  GTE: 'gte',
  LT: 'lt',
  LTE: 'lte',

  // String
  CONTAINS: 'contains',
  STARTS_WITH: 'startsWith',
  ENDS_WITH: 'endsWith',
  MATCHES: 'matches',

  // Array
  IN: 'in',
  NOT_IN: 'notIn',

  // Null checks
  IS_NULL: 'isNull',
  IS_NOT_NULL: 'isNotNull',

  // Type checks
  IS_TYPE: 'isType',
  IS_EMPTY: 'isEmpty',
  IS_NOT_EMPTY: 'isNotEmpty',
} as const;

export type ConditionOperatorType =
  (typeof CONDITION_OPERATORS)[keyof typeof CONDITION_OPERATORS];

/**
 * Built-in evaluator implementations
 */
export interface BuiltInEvaluators {
  /**
   * Compare two values
   */
  compare(left: unknown, operator: ConditionOperatorType, right: unknown): boolean;

  /**
   * Check if value matches pattern
   */
  matchPattern(value: string, pattern: string): boolean;

  /**
   * Check if value is in array
   */
  inArray(value: unknown, array: unknown[]): boolean;

  /**
   * Check value type
   */
  isType(value: unknown, type: string): boolean;
}

/**
 * Evaluator builder for fluent evaluator creation
 */
export interface EvaluatorBuilder {
  name(name: string): EvaluatorBuilder;
  description(description: string): EvaluatorBuilder;
  category(category: string): EvaluatorBuilder;
  operators(operators: string[]): EvaluatorBuilder;
  conditionSchema(schema: EvaluatorSchema): EvaluatorBuilder;
  evaluate(evaluator: (context: EvaluatorContext) => Promise<boolean>): EvaluatorBuilder;
  build(): Evaluator;
}
