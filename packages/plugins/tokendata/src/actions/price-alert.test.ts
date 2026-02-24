/**
 * Price Alert Action tests
 */


import {
  createAddPriceAlertAction,
  createRemovePriceAlertAction,
  createGetPriceAlertsAction,
  type AddPriceAlertInput,
  type RemovePriceAlertInput,
  type GetPriceAlertsInput,
} from './price-alert.js';
import type { ActionContext } from '@samterminal/core';
import type { TokenDataPluginConfig, TokenDataDatabaseAdapter } from '../types/index.js';

describe('createAddPriceAlertAction', () => {
  let mockDatabase: TokenDataDatabaseAdapter;
  let config: TokenDataPluginConfig;
  let getDatabase: () => TokenDataDatabaseAdapter | undefined;

  beforeEach(() => {
    mockDatabase = {
      addTrackedToken: jest.fn(),
      removeTrackedToken: jest.fn(),
      getTrackedTokens: jest.fn(),
      isTokenTracked: jest.fn(),
      addPriceAlert: jest.fn().mockResolvedValue('alert-123'),
      removePriceAlert: jest.fn().mockResolvedValue(true),
      getPriceAlerts: jest.fn().mockResolvedValue([]),
    };

    config = { defaultChain: 'base' };
    getDatabase = () => mockDatabase;
  });

  describe('action metadata', () => {
    it('should have correct name', () => {
      const action = createAddPriceAlertAction(config, getDatabase);
      expect(action.name).toBe('tokendata:alert:add');
    });

    it('should have description', () => {
      const action = createAddPriceAlertAction(config, getDatabase);
      expect(action.description).toContain('price alert');
    });
  });

  describe('validation', () => {
    it('should return error when userId is missing', async () => {
      const action = createAddPriceAlertAction(config, getDatabase);
      const context: ActionContext = {
        input: {
          address: '0x123',
          type: 'above',
          targetPrice: 100,
        } as AddPriceAlertInput,
        pluginName: 'tokendata',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('User ID');
    });

    it('should return error when address is missing', async () => {
      const action = createAddPriceAlertAction(config, getDatabase);
      const context: ActionContext = {
        input: {
          userId: 'user-1',
          type: 'above',
          targetPrice: 100,
        } as AddPriceAlertInput,
        pluginName: 'tokendata',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Token address');
    });

    it('should return error when type is invalid', async () => {
      const action = createAddPriceAlertAction(config, getDatabase);
      const context: ActionContext = {
        input: {
          userId: 'user-1',
          address: '0x123',
          type: 'invalid',
          targetPrice: 100,
        } as unknown as AddPriceAlertInput,
        pluginName: 'tokendata',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('above');
    });

    it('should return error when targetPrice is not positive', async () => {
      const action = createAddPriceAlertAction(config, getDatabase);
      const context: ActionContext = {
        input: {
          userId: 'user-1',
          address: '0x123',
          type: 'above',
          targetPrice: -10,
        } as AddPriceAlertInput,
        pluginName: 'tokendata',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('positive');
    });

    it('should return error when targetPrice is not a number', async () => {
      const action = createAddPriceAlertAction(config, getDatabase);
      const context: ActionContext = {
        input: {
          userId: 'user-1',
          address: '0x123',
          type: 'above',
          targetPrice: 'invalid',
        } as unknown as AddPriceAlertInput,
        pluginName: 'tokendata',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('positive');
    });

    it('should return error when database not configured', async () => {
      const action = createAddPriceAlertAction(config, () => undefined);
      const context: ActionContext = {
        input: {
          userId: 'user-1',
          address: '0x123',
          type: 'above',
          targetPrice: 100,
        } as AddPriceAlertInput,
        pluginName: 'tokendata',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database');
    });
  });

  describe('create alert', () => {
    it('should create price above alert', async () => {
      const action = createAddPriceAlertAction(config, getDatabase);
      const context: ActionContext = {
        input: {
          userId: 'user-1',
          address: '0xToken',
          type: 'above',
          targetPrice: 100,
        } as AddPriceAlertInput,
        pluginName: 'tokendata',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.alertId).toBe('alert-123');
      expect(result.data?.type).toBe('above');
      expect(mockDatabase.addPriceAlert).toHaveBeenCalledWith(
        'user-1',
        '0xToken',
        'base',
        'above',
        100,
      );
    });

    it('should create price below alert', async () => {
      const action = createAddPriceAlertAction(config, getDatabase);
      const context: ActionContext = {
        input: {
          userId: 'user-1',
          address: '0xToken',
          type: 'below',
          targetPrice: 50,
        } as AddPriceAlertInput,
        pluginName: 'tokendata',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('below');
      expect(mockDatabase.addPriceAlert).toHaveBeenCalledWith(
        'user-1',
        '0xToken',
        'base',
        'below',
        50,
      );
    });

    it('should use custom chainId', async () => {
      const action = createAddPriceAlertAction(config, getDatabase);
      const context: ActionContext = {
        input: {
          userId: 'user-1',
          address: '0xToken',
          chainId: 'ethereum',
          type: 'above',
          targetPrice: 100,
        } as AddPriceAlertInput,
        pluginName: 'tokendata',
      };

      await action.execute(context);

      expect(mockDatabase.addPriceAlert).toHaveBeenCalledWith(
        'user-1',
        '0xToken',
        'ethereum',
        'above',
        100,
      );
    });

    it('should handle database errors', async () => {
      jest.mocked(mockDatabase.addPriceAlert).mockRejectedValue(new Error('DB error'));

      const action = createAddPriceAlertAction(config, getDatabase);
      const context: ActionContext = {
        input: {
          userId: 'user-1',
          address: '0xToken',
          type: 'above',
          targetPrice: 100,
        } as AddPriceAlertInput,
        pluginName: 'tokendata',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB error');
    });
  });
});

describe('createRemovePriceAlertAction', () => {
  let mockDatabase: TokenDataDatabaseAdapter;

  beforeEach(() => {
    mockDatabase = {
      addTrackedToken: jest.fn(),
      removeTrackedToken: jest.fn(),
      getTrackedTokens: jest.fn(),
      isTokenTracked: jest.fn(),
      addPriceAlert: jest.fn(),
      removePriceAlert: jest.fn().mockResolvedValue(true),
      getPriceAlerts: jest.fn(),
    };
  });

  it('should have correct name', () => {
    const action = createRemovePriceAlertAction(() => mockDatabase);
    expect(action.name).toBe('tokendata:alert:remove');
  });

  it('should require alertId', async () => {
    const action = createRemovePriceAlertAction(() => mockDatabase);
    const context: ActionContext = {
      input: {} as RemovePriceAlertInput,
      pluginName: 'tokendata',
    };

    const result = await action.execute(context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Alert ID');
  });

  it('should remove alert successfully', async () => {
    const action = createRemovePriceAlertAction(() => mockDatabase);
    const context: ActionContext = {
      input: { alertId: 'alert-123' } as RemovePriceAlertInput,
      pluginName: 'tokendata',
    };

    const result = await action.execute(context);

    expect(result.success).toBe(true);
    expect(result.data?.alertId).toBe('alert-123');
    expect(mockDatabase.removePriceAlert).toHaveBeenCalledWith('alert-123');
  });

  it('should return error if alert not found', async () => {
    jest.mocked(mockDatabase.removePriceAlert).mockResolvedValue(false);

    const action = createRemovePriceAlertAction(() => mockDatabase);
    const context: ActionContext = {
      input: { alertId: 'unknown' } as RemovePriceAlertInput,
      pluginName: 'tokendata',
    };

    const result = await action.execute(context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should handle database errors', async () => {
    jest.mocked(mockDatabase.removePriceAlert).mockRejectedValue(new Error('DB error'));

    const action = createRemovePriceAlertAction(() => mockDatabase);
    const context: ActionContext = {
      input: { alertId: 'alert-123' } as RemovePriceAlertInput,
      pluginName: 'tokendata',
    };

    const result = await action.execute(context);

    expect(result.success).toBe(false);
    expect(result.error).toBe('DB error');
  });
});

describe('createGetPriceAlertsAction', () => {
  let mockDatabase: TokenDataDatabaseAdapter;
  let config: TokenDataPluginConfig;

  beforeEach(() => {
    mockDatabase = {
      addTrackedToken: jest.fn(),
      removeTrackedToken: jest.fn(),
      getTrackedTokens: jest.fn(),
      isTokenTracked: jest.fn(),
      addPriceAlert: jest.fn(),
      removePriceAlert: jest.fn(),
      getPriceAlerts: jest.fn().mockResolvedValue([
        { id: 'alert-1', type: 'above', targetPrice: 100 },
        { id: 'alert-2', type: 'below', targetPrice: 50 },
      ]),
    };
    config = { defaultChain: 'base' };
  });

  it('should have correct name', () => {
    const action = createGetPriceAlertsAction(config, () => mockDatabase);
    expect(action.name).toBe('tokendata:alert:list');
  });

  it('should require userId', async () => {
    const action = createGetPriceAlertsAction(config, () => mockDatabase);
    const context: ActionContext = {
      input: { address: '0x123' } as GetPriceAlertsInput,
      pluginName: 'tokendata',
    };

    const result = await action.execute(context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('User ID');
  });

  it('should require address', async () => {
    const action = createGetPriceAlertsAction(config, () => mockDatabase);
    const context: ActionContext = {
      input: { userId: 'user-1' } as GetPriceAlertsInput,
      pluginName: 'tokendata',
    };

    const result = await action.execute(context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Token address');
  });

  it('should return alerts', async () => {
    const action = createGetPriceAlertsAction(config, () => mockDatabase);
    const context: ActionContext = {
      input: {
        userId: 'user-1',
        address: '0xToken',
      } as GetPriceAlertsInput,
      pluginName: 'tokendata',
    };

    const result = await action.execute(context);

    expect(result.success).toBe(true);
    expect(result.data?.alerts).toHaveLength(2);
  });

  it('should use custom chainId', async () => {
    const action = createGetPriceAlertsAction(config, () => mockDatabase);
    const context: ActionContext = {
      input: {
        userId: 'user-1',
        address: '0xToken',
        chainId: 'ethereum',
      } as GetPriceAlertsInput,
      pluginName: 'tokendata',
    };

    await action.execute(context);

    expect(mockDatabase.getPriceAlerts).toHaveBeenCalledWith(
      'user-1',
      '0xToken',
      'ethereum',
    );
  });
});
