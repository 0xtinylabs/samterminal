/**
 * Flow Presets
 * Pre-built flow templates for common use cases
 */

import type { Flow, FlowTemplate } from '../types/index.js';
import { uuid } from '../utils/id.js';
import {
  createTriggerNode,
  createActionNode,
  createConditionNode,
  createOutputNode,
} from './nodes.js';
import { createEdge, createTrueEdge, createFalseEdge } from './edges.js';

/**
 * Create an empty flow
 */
export function createEmptyFlow(name: string, description?: string): Flow {
  const triggerId = uuid();

  return {
    id: uuid(),
    name,
    description,
    version: '1.0.0',
    nodes: [
      createTriggerNode(
        { id: triggerId, name: 'Start', position: { x: 100, y: 100 } },
        { triggerType: 'manual', config: {} },
      ),
    ],
    edges: [],
    variables: [],
    settings: {
      maxExecutionTime: 60000,
      retryOnFailure: false,
      logLevel: 'info',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Simple action flow template
 * Trigger -> Action -> Output
 */
export const SIMPLE_ACTION_TEMPLATE: FlowTemplate = {
  id: 'simple-action',
  name: 'Simple Action',
  description: 'A basic flow with one action',
  category: 'Basic',
  flow: {
    name: 'Simple Action Flow',
    description: 'Execute a single action',
    version: '1.0.0',
    nodes: [
      createTriggerNode(
        { id: 'trigger', name: 'Start', position: { x: 100, y: 100 } },
        { triggerType: 'manual', config: {} },
      ),
      createActionNode(
        { id: 'action', name: 'Execute Action', position: { x: 300, y: 100 } },
        { pluginName: '', actionName: '', params: {} },
      ),
      createOutputNode(
        { id: 'output', name: 'End', position: { x: 500, y: 100 } },
        { outputType: 'return', config: {} },
      ),
    ],
    edges: [
      createEdge('trigger', 'action'),
      createEdge('action', 'output', { sourceHandle: 'output' }),
    ],
  },
};

/**
 * Conditional flow template
 * Trigger -> Condition -> True/False Actions -> Output
 */
export const CONDITIONAL_TEMPLATE: FlowTemplate = {
  id: 'conditional',
  name: 'Conditional Flow',
  description: 'A flow with conditional branching',
  category: 'Basic',
  flow: {
    name: 'Conditional Flow',
    description: 'Execute different actions based on condition',
    version: '1.0.0',
    nodes: [
      createTriggerNode(
        { id: 'trigger', name: 'Start', position: { x: 100, y: 200 } },
        { triggerType: 'manual', config: {} },
      ),
      createConditionNode(
        { id: 'condition', name: 'Check Condition', position: { x: 300, y: 200 } },
        { conditions: [], operator: 'and' },
      ),
      createActionNode(
        { id: 'true-action', name: 'True Action', position: { x: 500, y: 100 } },
        { pluginName: '', actionName: '', params: {} },
      ),
      createActionNode(
        { id: 'false-action', name: 'False Action', position: { x: 500, y: 300 } },
        { pluginName: '', actionName: '', params: {} },
      ),
      createOutputNode(
        { id: 'output', name: 'End', position: { x: 700, y: 200 } },
        { outputType: 'return', config: {} },
      ),
    ],
    edges: [
      createEdge('trigger', 'condition'),
      createTrueEdge('condition', 'true-action'),
      createFalseEdge('condition', 'false-action'),
      createEdge('true-action', 'output', { sourceHandle: 'output' }),
      createEdge('false-action', 'output', { sourceHandle: 'output' }),
    ],
  },
};

/**
 * Error handling flow template
 * Trigger -> Action (with error handling) -> Output
 */
export const ERROR_HANDLING_TEMPLATE: FlowTemplate = {
  id: 'error-handling',
  name: 'Error Handling',
  description: 'A flow with error handling',
  category: 'Basic',
  flow: {
    name: 'Error Handling Flow',
    description: 'Handle errors from actions',
    version: '1.0.0',
    nodes: [
      createTriggerNode(
        { id: 'trigger', name: 'Start', position: { x: 100, y: 200 } },
        { triggerType: 'manual', config: {} },
      ),
      createActionNode(
        { id: 'main-action', name: 'Main Action', position: { x: 300, y: 200 } },
        { pluginName: '', actionName: '', params: {} },
      ),
      createActionNode(
        { id: 'error-handler', name: 'Handle Error', position: { x: 500, y: 300 } },
        { pluginName: '', actionName: '', params: {} },
      ),
      createOutputNode(
        { id: 'success-output', name: 'Success', position: { x: 500, y: 100 } },
        { outputType: 'return', config: {} },
      ),
      createOutputNode(
        { id: 'error-output', name: 'Error Output', position: { x: 700, y: 300 } },
        { outputType: 'return', config: {} },
      ),
    ],
    edges: [
      createEdge('trigger', 'main-action'),
      createEdge('main-action', 'success-output', {
        sourceHandle: 'output',
        type: 'success',
        label: 'Success',
      }),
      createEdge('main-action', 'error-handler', {
        sourceHandle: 'error',
        type: 'failure',
        label: 'Error',
      }),
      createEdge('error-handler', 'error-output', { sourceHandle: 'output' }),
    ],
  },
};

/**
 * Scheduled flow template
 */
export const SCHEDULED_TEMPLATE: FlowTemplate = {
  id: 'scheduled',
  name: 'Scheduled Flow',
  description: 'A flow that runs on a schedule',
  category: 'Automation',
  flow: {
    name: 'Scheduled Flow',
    description: 'Run actions on a schedule',
    version: '1.0.0',
    nodes: [
      createTriggerNode(
        { id: 'trigger', name: 'Schedule', position: { x: 100, y: 100 } },
        {
          triggerType: 'schedule',
          config: {
            cron: '0 * * * *', // Every hour
            timezone: 'UTC',
          },
        },
      ),
      createActionNode(
        { id: 'action', name: 'Scheduled Action', position: { x: 300, y: 100 } },
        { pluginName: '', actionName: '', params: {} },
      ),
      createOutputNode(
        { id: 'output', name: 'Complete', position: { x: 500, y: 100 } },
        { outputType: 'log', config: {} },
      ),
    ],
    edges: [
      createEdge('trigger', 'action'),
      createEdge('action', 'output', { sourceHandle: 'output' }),
    ],
  },
};

/**
 * All available flow templates
 */
export const FLOW_TEMPLATES: FlowTemplate[] = [
  SIMPLE_ACTION_TEMPLATE,
  CONDITIONAL_TEMPLATE,
  ERROR_HANDLING_TEMPLATE,
  SCHEDULED_TEMPLATE,
];

/**
 * Get template by ID
 */
export function getTemplate(id: string): FlowTemplate | undefined {
  return FLOW_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): FlowTemplate[] {
  return FLOW_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Create flow from template
 */
export function createFromTemplate(templateId: string, name?: string): Flow | undefined {
  const template = getTemplate(templateId);
  if (!template) {
    return undefined;
  }

  return {
    ...template.flow,
    id: uuid(),
    name: name ?? template.flow.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Get all template categories
 */
export function getTemplateCategories(): string[] {
  const categories = new Set(FLOW_TEMPLATES.map((t) => t.category));
  return Array.from(categories);
}
