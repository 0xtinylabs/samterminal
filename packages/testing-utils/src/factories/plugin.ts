/**
 * Plugin factory for creating test plugins
 */
import type { MockPluginDefinition } from '../mocks/plugin.js';

let pluginCounter = 0;

/**
 * Reset plugin counter (call in beforeEach)
 */
export function resetPluginCounter(): void {
  pluginCounter = 0;
}

/**
 * Plugin factory options
 */
export interface PluginFactoryOptions {
  namePrefix?: string;
  withActions?: boolean;
  withProviders?: boolean;
  withEvaluators?: boolean;
  withHooks?: boolean;
  actionCount?: number;
  providerCount?: number;
}

/**
 * Create a unique test plugin
 */
export function createTestPlugin(options: PluginFactoryOptions = {}): MockPluginDefinition {
  const {
    namePrefix = 'test-plugin',
    withActions = true,
    withProviders = true,
    withEvaluators = false,
    withHooks = false,
    actionCount = 1,
    providerCount = 1,
  } = options;

  const id = ++pluginCounter;
  const name = `${namePrefix}-${id}`;

  const actions = withActions
    ? Array.from({ length: actionCount }, (_, i) => ({
        name: `${name}-action-${i + 1}`,
        description: `Test action ${i + 1}`,
        handler: jest.fn().mockResolvedValue({ success: true, data: { actionId: i + 1 } }),
      }))
    : undefined;

  const providers = withProviders
    ? Array.from({ length: providerCount }, (_, i) => ({
        name: `${name}-provider-${i + 1}`,
        description: `Test provider ${i + 1}`,
        get: jest.fn().mockResolvedValue({ data: { providerId: i + 1 } }),
      }))
    : undefined;

  const evaluators = withEvaluators
    ? [
        {
          name: `${name}-evaluator`,
          description: 'Test evaluator',
          evaluate: jest.fn().mockResolvedValue(true),
        },
      ]
    : undefined;

  const hooks = withHooks
    ? [
        {
          name: `${name}-hook`,
          event: 'test-event',
          handler: jest.fn().mockResolvedValue(undefined),
        },
      ]
    : undefined;

  return {
    name,
    version: '1.0.0',
    description: `Test plugin ${id}`,
    dependencies: [],
    actions,
    providers,
    evaluators,
    hooks,
    init: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Create multiple test plugins
 */
export function createTestPlugins(
  count: number,
  options: PluginFactoryOptions = {},
): MockPluginDefinition[] {
  return Array.from({ length: count }, () => createTestPlugin(options));
}

/**
 * Create a plugin with specific actions
 */
export function createPluginWithActions(
  actions: Array<{ name: string; result?: unknown }>,
): MockPluginDefinition {
  const plugin = createTestPlugin({ withActions: false, withProviders: false });

  plugin.actions = actions.map((a) => ({
    name: a.name,
    description: `Action: ${a.name}`,
    handler: jest.fn().mockResolvedValue(a.result ?? { success: true }),
  }));

  return plugin;
}

/**
 * Create a plugin with specific providers
 */
export function createPluginWithProviders(
  providers: Array<{ name: string; data?: unknown }>,
): MockPluginDefinition {
  const plugin = createTestPlugin({ withActions: false, withProviders: false });

  plugin.providers = providers.map((p) => ({
    name: p.name,
    description: `Provider: ${p.name}`,
    get: jest.fn().mockResolvedValue(p.data ?? { data: {} }),
  }));

  return plugin;
}
