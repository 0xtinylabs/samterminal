/**
 * Plugin mocks for testing
 */

/**
 * Minimal plugin interface for testing
 * (Defined here to avoid circular deps with @samterminal/core)
 */
export interface MockPluginDefinition {
  name: string;
  version?: string;
  description?: string;
  dependencies?: string[];
  actions?: Array<{ name: string; description?: string; handler?: () => Promise<unknown> }>;
  providers?: Array<{ name: string; description?: string; get?: () => Promise<unknown> }>;
  evaluators?: Array<{ name: string; description?: string; evaluate?: () => Promise<boolean> }>;
  hooks?: Array<{ name: string; event?: string; handler?: () => Promise<void> }>;
  init?: () => Promise<void>;
  destroy?: () => Promise<void>;
}

/**
 * Create a mock plugin for testing
 */
export function createMockPlugin(
  overrides: Partial<MockPluginDefinition> & { name: string },
): MockPluginDefinition {
  const { name, version = '1.0.0', dependencies = [], ...rest } = overrides;

  return {
    name,
    version,
    description: `Mock plugin: ${name}`,
    dependencies,
    actions: rest.actions ?? [
      {
        name: `${name}-action`,
        description: `Mock action for ${name}`,
        handler: jest.fn().mockResolvedValue({ success: true }),
      },
    ],
    providers: rest.providers ?? [
      {
        name: `${name}-provider`,
        description: `Mock provider for ${name}`,
        get: jest.fn().mockResolvedValue({ data: {} }),
      },
    ],
    evaluators: rest.evaluators,
    hooks: rest.hooks,
    init: rest.init ?? jest.fn().mockResolvedValue(undefined),
    destroy: rest.destroy ?? jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Create multiple mock plugins
 */
export function createMockPlugins(
  definitions: Array<Partial<MockPluginDefinition> & { name: string }>,
): MockPluginDefinition[] {
  return definitions.map(createMockPlugin);
}

/**
 * Create a mock plugin that throws on init
 */
export function createFailingPlugin(
  name: string,
  error: Error = new Error('Init failed'),
): MockPluginDefinition {
  return {
    name,
    version: '1.0.0',
    description: 'Failing plugin',
    dependencies: [],
    actions: [],
    providers: [],
    init: jest.fn().mockRejectedValue(error),
    destroy: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Create mock plugins with dependencies for dependency testing
 */
export function createDependencyChain(): MockPluginDefinition[] {
  return [
    createMockPlugin({ name: 'plugin-a' }),
    createMockPlugin({ name: 'plugin-b', dependencies: ['plugin-a'] }),
    createMockPlugin({ name: 'plugin-c', dependencies: ['plugin-b'] }),
  ];
}

/**
 * Create mock plugins with circular dependency (for error testing)
 */
export function createCircularDependency(): MockPluginDefinition[] {
  return [
    createMockPlugin({ name: 'plugin-x', dependencies: ['plugin-y'] }),
    createMockPlugin({ name: 'plugin-y', dependencies: ['plugin-x'] }),
  ];
}
