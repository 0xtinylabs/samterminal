/**
 * Core mocks for testing
 */

/**
 * Mock services interface
 */
export interface MockServices {
  registerAction: jest.Mock;
  registerProvider: jest.Mock;
  registerEvaluator: jest.Mock;
  unregisterPlugin: jest.Mock;
  getAction: jest.Mock;
  getProvider: jest.Mock;
  executeAction: jest.Mock;
}

/**
 * Mock hooks interface
 */
export interface MockHooks {
  register: jest.Mock;
  unregisterPlugin: jest.Mock;
  emit: jest.Mock;
  on: jest.Mock;
  off: jest.Mock;
}

/**
 * Mock chains interface
 */
export interface MockChains {
  register: jest.Mock;
  get: jest.Mock;
  getAll: jest.Mock;
}

/**
 * Mock SamTerminal Core interface
 */
export interface MockCore {
  services: MockServices;
  hooks: MockHooks;
  chains: MockChains;
  config: Record<string, unknown>;
}

/**
 * Create a mock SamTerminal core instance for testing
 */
export function createMockCore(overrides?: Partial<MockCore>): MockCore {
  const services: MockServices = {
    registerAction: jest.fn(),
    registerProvider: jest.fn(),
    registerEvaluator: jest.fn(),
    unregisterPlugin: jest.fn(),
    getAction: jest.fn(),
    getProvider: jest.fn(),
    executeAction: jest.fn().mockResolvedValue({ success: true }),
    ...overrides?.services,
  };

  const hooks: MockHooks = {
    register: jest.fn(),
    unregisterPlugin: jest.fn(),
    emit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn().mockReturnValue(() => {}),
    off: jest.fn(),
    ...overrides?.hooks,
  };

  const chains: MockChains = {
    register: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn().mockReturnValue([]),
    ...overrides?.chains,
  };

  return {
    services,
    hooks,
    chains,
    config: overrides?.config ?? {},
  };
}

/**
 * Reset all mocks in a MockCore instance
 */
export function resetMockCore(core: MockCore): void {
  Object.values(core.services).forEach((fn) => fn.mockClear());
  Object.values(core.hooks).forEach((fn) => fn.mockClear());
  Object.values(core.chains).forEach((fn) => fn.mockClear());
}
