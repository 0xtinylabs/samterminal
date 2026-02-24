/**
 * Track Token Action tests
 */


import {
  createTrackTokenAction,
  createUntrackTokenAction,
  createGetTrackedTokensAction,
  type TrackTokenInput,
} from './track-token.js';
import type { ActionContext } from '@samterminal/core';
import type { TokenDataPluginConfig, TokenDataDatabaseAdapter } from '../types/index.js';

describe('createTrackTokenAction', () => {
  let mockDatabase: TokenDataDatabaseAdapter;
  let config: TokenDataPluginConfig;
  let getDatabase: () => TokenDataDatabaseAdapter | undefined;

  beforeEach(() => {
    mockDatabase = {
      addTrackedToken: jest.fn().mockResolvedValue(true),
      removeTrackedToken: jest.fn().mockResolvedValue(true),
      getTrackedTokens: jest.fn().mockResolvedValue([]),
      isTokenTracked: jest.fn().mockResolvedValue(false),
      addPriceAlert: jest.fn(),
      removePriceAlert: jest.fn(),
      getPriceAlerts: jest.fn(),
    };

    config = { defaultChain: 'base' };
    getDatabase = () => mockDatabase;
  });

  describe('action metadata', () => {
    it('should have correct name', () => {
      const action = createTrackTokenAction(config, getDatabase);
      expect(action.name).toBe('tokendata:track');
    });

    it('should have description', () => {
      const action = createTrackTokenAction(config, getDatabase);
      expect(action.description).toContain('tracking');
    });
  });

  describe('validation', () => {
    it('should return error when userId is missing', async () => {
      const action = createTrackTokenAction(config, getDatabase);
      const context: ActionContext = {
        input: { address: '0x123' } as TrackTokenInput,
        pluginName: 'tokendata',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('User ID');
    });

    it('should return error when address is missing', async () => {
      const action = createTrackTokenAction(config, getDatabase);
      const context: ActionContext = {
        input: { userId: 'user-1' } as TrackTokenInput,
        pluginName: 'tokendata',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Token address');
    });

    it('should return error when database not configured', async () => {
      const action = createTrackTokenAction(config, () => undefined);
      const context: ActionContext = {
        input: { userId: 'user-1', address: '0x123' } as TrackTokenInput,
        pluginName: 'tokendata',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database adapter');
    });
  });

  describe('track token', () => {
    it('should track new token successfully', async () => {
      const action = createTrackTokenAction(config, getDatabase);
      const context: ActionContext = {
        input: {
          userId: 'user-1',
          address: '0xToken',
        } as TrackTokenInput,
        pluginName: 'tokendata',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.message).toContain('added');
      expect(mockDatabase.addTrackedToken).toHaveBeenCalledWith('user-1', '0xToken', 'base');
    });

    it('should use custom chainId', async () => {
      const action = createTrackTokenAction(config, getDatabase);
      const context: ActionContext = {
        input: {
          userId: 'user-1',
          address: '0xToken',
          chainId: 'ethereum',
        } as TrackTokenInput,
        pluginName: 'tokendata',
      };

      await action.execute(context);

      expect(mockDatabase.addTrackedToken).toHaveBeenCalledWith(
        'user-1',
        '0xToken',
        'ethereum',
      );
    });

    it('should return message if already tracked', async () => {
      jest.mocked(mockDatabase.isTokenTracked).mockResolvedValue(true);

      const action = createTrackTokenAction(config, getDatabase);
      const context: ActionContext = {
        input: {
          userId: 'user-1',
          address: '0xToken',
        } as TrackTokenInput,
        pluginName: 'tokendata',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.alreadyTracked).toBe(true);
      expect(mockDatabase.addTrackedToken).not.toHaveBeenCalled();
    });

    it('should return error if add fails', async () => {
      jest.mocked(mockDatabase.addTrackedToken).mockResolvedValue(false);

      const action = createTrackTokenAction(config, getDatabase);
      const context: ActionContext = {
        input: {
          userId: 'user-1',
          address: '0xToken',
        } as TrackTokenInput,
        pluginName: 'tokendata',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed');
    });

    it('should handle database errors', async () => {
      jest.mocked(mockDatabase.isTokenTracked).mockRejectedValue(new Error('DB error'));

      const action = createTrackTokenAction(config, getDatabase);
      const context: ActionContext = {
        input: {
          userId: 'user-1',
          address: '0xToken',
        } as TrackTokenInput,
        pluginName: 'tokendata',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB error');
    });
  });
});

describe('createUntrackTokenAction', () => {
  let mockDatabase: TokenDataDatabaseAdapter;
  let config: TokenDataPluginConfig;

  beforeEach(() => {
    mockDatabase = {
      addTrackedToken: jest.fn(),
      removeTrackedToken: jest.fn().mockResolvedValue(true),
      getTrackedTokens: jest.fn(),
      isTokenTracked: jest.fn(),
      addPriceAlert: jest.fn(),
      removePriceAlert: jest.fn(),
      getPriceAlerts: jest.fn(),
    };
    config = { defaultChain: 'base' };
  });

  it('should have correct name', () => {
    const action = createUntrackTokenAction(config, () => mockDatabase);
    expect(action.name).toBe('tokendata:untrack');
  });

  it('should remove token from tracking', async () => {
    const action = createUntrackTokenAction(config, () => mockDatabase);
    const context: ActionContext = {
      input: {
        userId: 'user-1',
        address: '0xToken',
      },
      pluginName: 'tokendata',
    };

    const result = await action.execute(context);

    expect(result.success).toBe(true);
    expect(mockDatabase.removeTrackedToken).toHaveBeenCalled();
  });

  it('should return error if token not tracked', async () => {
    jest.mocked(mockDatabase.removeTrackedToken).mockResolvedValue(false);

    const action = createUntrackTokenAction(config, () => mockDatabase);
    const context: ActionContext = {
      input: {
        userId: 'user-1',
        address: '0xToken',
      },
      pluginName: 'tokendata',
    };

    const result = await action.execute(context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not being tracked');
  });
});

describe('createGetTrackedTokensAction', () => {
  let mockDatabase: TokenDataDatabaseAdapter;

  beforeEach(() => {
    mockDatabase = {
      addTrackedToken: jest.fn(),
      removeTrackedToken: jest.fn(),
      getTrackedTokens: jest.fn().mockResolvedValue([
        { address: '0xToken1', chainId: 'base' },
        { address: '0xToken2', chainId: 'ethereum' },
      ]),
      isTokenTracked: jest.fn(),
      addPriceAlert: jest.fn(),
      removePriceAlert: jest.fn(),
      getPriceAlerts: jest.fn(),
    };
  });

  it('should have correct name', () => {
    const action = createGetTrackedTokensAction(() => mockDatabase);
    expect(action.name).toBe('tokendata:tracked');
  });

  it('should return tracked tokens', async () => {
    const action = createGetTrackedTokensAction(() => mockDatabase);
    const context: ActionContext = {
      input: { userId: 'user-1' },
      pluginName: 'tokendata',
    };

    const result = await action.execute(context);

    expect(result.success).toBe(true);
    expect(result.data?.tokens).toHaveLength(2);
  });

  it('should require userId', async () => {
    const action = createGetTrackedTokensAction(() => mockDatabase);
    const context: ActionContext = {
      input: {},
      pluginName: 'tokendata',
    };

    const result = await action.execute(context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('User ID');
  });
});
