/**
 * Track wallet actions tests
 */


import {
  createTrackWalletAction,
  createUntrackWalletAction,
  createGetTrackedWalletsAction,
  createSetWalletLabelAction,
} from './track-wallet.js';
import type { WalletDataPluginConfig, WalletDataDatabaseAdapter } from '../types/index.js';
import type { MoralisWalletClient } from '../utils/moralis.js';
import type { ActionContext } from '@samterminal/core';

describe('TrackWalletAction', () => {
  let mockDatabase: WalletDataDatabaseAdapter;
  let mockMoralis: MoralisWalletClient;
  let config: WalletDataPluginConfig;

  beforeEach(() => {
    mockDatabase = {
      isWalletTracked: jest.fn(),
      addTrackedWallet: jest.fn(),
      removeTrackedWallet: jest.fn(),
      getTrackedWallets: jest.fn(),
      setWalletLabel: jest.fn(),
      getWalletLabel: jest.fn(),
    } as unknown as WalletDataDatabaseAdapter;

    mockMoralis = {
      resolveEns: jest.fn(),
    } as unknown as MoralisWalletClient;

    config = {
      defaultChain: 'base',
    };
  });

  const createContext = (input: unknown): ActionContext => ({
    input,
    params: {},
    user: undefined,
    metadata: {},
  });

  describe('createTrackWalletAction', () => {
    it('should return error when userId is missing', async () => {
      const action = createTrackWalletAction(
        config,
        () => mockDatabase,
        () => mockMoralis,
      );

      const result = await action.execute(createContext({
        address: '0x1234567890123456789012345678901234567890',
      }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
    });

    it('should return error when address is missing', async () => {
      const action = createTrackWalletAction(
        config,
        () => mockDatabase,
        () => mockMoralis,
      );

      const result = await action.execute(createContext({
        userId: 'user123',
      }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wallet address is required');
    });

    it('should return error when database not configured', async () => {
      const action = createTrackWalletAction(
        config,
        () => undefined,
        () => mockMoralis,
      );

      const result = await action.execute(createContext({
        userId: 'user123',
        address: '0x1234567890123456789012345678901234567890',
      }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database adapter not configured');
    });

    it('should return error for invalid address format', async () => {
      const action = createTrackWalletAction(
        config,
        () => mockDatabase,
        () => mockMoralis,
      );

      const result = await action.execute(createContext({
        userId: 'user123',
        address: '0x123', // Invalid
      }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid wallet address format');
    });

    it('should resolve ENS name to address', async () => {
      jest.mocked(mockMoralis.resolveEns).mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890',
      });
      jest.mocked(mockDatabase.isWalletTracked).mockResolvedValue(false);
      jest.mocked(mockDatabase.addTrackedWallet).mockResolvedValue(true);

      const action = createTrackWalletAction(
        config,
        () => mockDatabase,
        () => mockMoralis,
      );

      const result = await action.execute(createContext({
        userId: 'user123',
        address: 'vitalik.eth',
      }));

      expect(mockMoralis.resolveEns).toHaveBeenCalledWith('vitalik.eth');
      expect(result.success).toBe(true);
      expect(result.data?.address).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should return error when ENS resolution fails', async () => {
      jest.mocked(mockMoralis.resolveEns).mockResolvedValue(null);

      const action = createTrackWalletAction(
        config,
        () => mockDatabase,
        () => mockMoralis,
      );

      const result = await action.execute(createContext({
        userId: 'user123',
        address: 'nonexistent.eth',
      }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Could not resolve ENS name');
    });

    it('should return alreadyTracked when wallet is already tracked', async () => {
      jest.mocked(mockDatabase.isWalletTracked).mockResolvedValue(true);

      const action = createTrackWalletAction(
        config,
        () => mockDatabase,
        () => mockMoralis,
      );

      const result = await action.execute(createContext({
        userId: 'user123',
        address: '0x1234567890123456789012345678901234567890',
      }));

      expect(result.success).toBe(true);
      expect(result.data?.alreadyTracked).toBe(true);
    });

    it('should add wallet to tracking', async () => {
      jest.mocked(mockDatabase.isWalletTracked).mockResolvedValue(false);
      jest.mocked(mockDatabase.addTrackedWallet).mockResolvedValue(true);

      const action = createTrackWalletAction(
        config,
        () => mockDatabase,
        () => mockMoralis,
      );

      const result = await action.execute(createContext({
        userId: 'user123',
        address: '0x1234567890123456789012345678901234567890',
        chainId: 'ethereum',
        label: 'My Wallet',
      }));

      expect(mockDatabase.addTrackedWallet).toHaveBeenCalledWith(
        'user123',
        '0x1234567890123456789012345678901234567890',
        'ethereum',
      );
      expect(mockDatabase.setWalletLabel).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        'My Wallet',
      );
      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Wallet added to tracking');
    });

    it('should return error when adding fails', async () => {
      jest.mocked(mockDatabase.isWalletTracked).mockResolvedValue(false);
      jest.mocked(mockDatabase.addTrackedWallet).mockResolvedValue(false);

      const action = createTrackWalletAction(
        config,
        () => mockDatabase,
        () => mockMoralis,
      );

      const result = await action.execute(createContext({
        userId: 'user123',
        address: '0x1234567890123456789012345678901234567890',
      }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to add wallet to tracking');
    });
  });

  describe('createUntrackWalletAction', () => {
    it('should return error when userId is missing', async () => {
      const action = createUntrackWalletAction(config, () => mockDatabase);

      const result = await action.execute(createContext({
        address: '0x1234567890123456789012345678901234567890',
      }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
    });

    it('should return error when address is missing', async () => {
      const action = createUntrackWalletAction(config, () => mockDatabase);

      const result = await action.execute(createContext({
        userId: 'user123',
      }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wallet address is required');
    });

    it('should return error when database not configured', async () => {
      const action = createUntrackWalletAction(config, () => undefined);

      const result = await action.execute(createContext({
        userId: 'user123',
        address: '0x1234567890123456789012345678901234567890',
      }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database adapter not configured');
    });

    it('should remove wallet from tracking', async () => {
      jest.mocked(mockDatabase.removeTrackedWallet).mockResolvedValue(true);

      const action = createUntrackWalletAction(config, () => mockDatabase);

      const result = await action.execute(createContext({
        userId: 'user123',
        address: '0x1234567890123456789012345678901234567890',
        chainId: 'ethereum',
      }));

      expect(mockDatabase.removeTrackedWallet).toHaveBeenCalledWith(
        'user123',
        '0x1234567890123456789012345678901234567890',
        'ethereum',
      );
      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Wallet removed from tracking');
    });

    it('should return error when wallet was not tracked', async () => {
      jest.mocked(mockDatabase.removeTrackedWallet).mockResolvedValue(false);

      const action = createUntrackWalletAction(config, () => mockDatabase);

      const result = await action.execute(createContext({
        userId: 'user123',
        address: '0x1234567890123456789012345678901234567890',
      }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wallet was not being tracked');
    });
  });

  describe('createGetTrackedWalletsAction', () => {
    it('should return error when userId is missing', async () => {
      const action = createGetTrackedWalletsAction(() => mockDatabase);

      const result = await action.execute(createContext({}));

      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
    });

    it('should return error when database not configured', async () => {
      const action = createGetTrackedWalletsAction(() => undefined);

      const result = await action.execute(createContext({
        userId: 'user123',
      }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database adapter not configured');
    });

    it('should return tracked wallets with labels', async () => {
      jest.mocked(mockDatabase.getTrackedWallets).mockResolvedValue([
        { address: '0xWallet1', chainId: 'base' },
        { address: '0xWallet2', chainId: 'ethereum' },
      ]);
      jest.mocked(mockDatabase.getWalletLabel)
        .mockResolvedValueOnce('My Base Wallet')
        .mockResolvedValueOnce('My ETH Wallet');

      const action = createGetTrackedWalletsAction(() => mockDatabase);

      const result = await action.execute(createContext({
        userId: 'user123',
      }));

      expect(result.success).toBe(true);
      expect(result.data?.wallets).toHaveLength(2);
      expect(result.data?.wallets[0].label).toBe('My Base Wallet');
      expect(result.data?.wallets[1].label).toBe('My ETH Wallet');
    });
  });

  describe('createSetWalletLabelAction', () => {
    it('should return error when address is missing', async () => {
      const action = createSetWalletLabelAction(() => mockDatabase);

      const result = await action.execute(createContext({
        label: 'My Wallet',
      }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wallet address is required');
    });

    it('should return error when label is missing', async () => {
      const action = createSetWalletLabelAction(() => mockDatabase);

      const result = await action.execute(createContext({
        address: '0x1234567890123456789012345678901234567890',
      }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Label is required');
    });

    it('should return error when database not configured', async () => {
      const action = createSetWalletLabelAction(() => undefined);

      const result = await action.execute(createContext({
        address: '0x1234567890123456789012345678901234567890',
        label: 'My Wallet',
      }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database adapter not configured');
    });

    it('should set wallet label', async () => {
      jest.mocked(mockDatabase.setWalletLabel).mockResolvedValue(undefined);

      const action = createSetWalletLabelAction(() => mockDatabase);

      const result = await action.execute(createContext({
        address: '0x1234567890123456789012345678901234567890',
        label: 'My Wallet',
      }));

      expect(mockDatabase.setWalletLabel).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        'My Wallet',
      );
      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Wallet label updated');
    });
  });
});
