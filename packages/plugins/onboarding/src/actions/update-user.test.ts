/**
 * Update User Action tests
 */


import { createUpdateUserAction } from './update-user.js';
import { InMemoryStorage, createInMemoryStorage } from '../utils/storage.js';
import type { ActionContext } from '@samterminal/core';
import type { OnboardingPluginConfig, UserProfile } from '../types/index.js';

describe('Update User Action', () => {
  let storage: InMemoryStorage;
  let action: ReturnType<typeof createUpdateUserAction>;
  let config: OnboardingPluginConfig;
  let testUser: UserProfile;

  beforeEach(async () => {
    storage = createInMemoryStorage();
    config = {};
    action = createUpdateUserAction(() => storage, config);

    testUser = await storage.createUser({
      name: 'Test User',
      email: 'test@example.com',
      status: 'active',
    });
  });

  describe('metadata', () => {
    it('should have correct name', () => {
      expect(action.name).toBe('onboarding:update-user');
    });

    it('should have correct description', () => {
      expect(action.description).toBe('Update user profile');
    });
  });

  describe('execute', () => {
    it('should require userId', async () => {
      const context: ActionContext = {
        input: { name: 'New Name' },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
    });

    it('should fail for non-existent user', async () => {
      const context: ActionContext = {
        input: {
          userId: 'non-existent',
          name: 'New Name',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should update name', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
          name: 'Updated Name',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Name');
    });

    it('should update email', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
          email: 'newemail@example.com',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('newemail@example.com');
    });

    it('should fail for invalid email', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
          email: 'invalid-email',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should fail for duplicate email', async () => {
      await storage.createUser({
        email: 'taken@example.com',
        status: 'active',
      });

      const context: ActionContext = {
        input: {
          userId: testUser.id,
          email: 'taken@example.com',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already in use by another user');
    });

    it('should update status', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
          status: 'inactive',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('inactive');
    });

    it('should add wallet', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
          addWallet: {
            address: '0x1234567890123456789012345678901234567890',
            label: 'Main Wallet',
          },
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.wallets?.length).toBe(1);
      expect(result.data?.wallets?.[0].isPrimary).toBe(true);
      expect(result.data?.walletAddress).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should fail for invalid wallet address when adding', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
          addWallet: {
            address: '0x123',
          },
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid wallet address format');
    });

    it('should fail when adding duplicate wallet', async () => {
      // Add first wallet
      await storage.updateUser(testUser.id, {
        wallets: [
          {
            address: '0x1234567890123456789012345678901234567890',
            isPrimary: true,
            connectedAt: Date.now(),
          },
        ],
      });

      const context: ActionContext = {
        input: {
          userId: testUser.id,
          addWallet: {
            address: '0x1234567890123456789012345678901234567890',
          },
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wallet already connected');
    });

    it('should remove wallet', async () => {
      await storage.updateUser(testUser.id, {
        walletAddress: '0x1234567890123456789012345678901234567890',
        wallets: [
          {
            address: '0x1234567890123456789012345678901234567890',
            isPrimary: true,
            connectedAt: Date.now(),
          },
          {
            address: '0xABCDEF1234567890abcdef1234567890ABCDEF12',
            isPrimary: false,
            connectedAt: Date.now(),
          },
        ],
      });

      const context: ActionContext = {
        input: {
          userId: testUser.id,
          removeWallet: '0x1234567890123456789012345678901234567890',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.wallets?.length).toBe(1);
      // Second wallet should become primary
      expect(result.data?.wallets?.[0].isPrimary).toBe(true);
    });

    it('should set primary wallet', async () => {
      await storage.updateUser(testUser.id, {
        wallets: [
          {
            address: '0x1234567890123456789012345678901234567890',
            isPrimary: true,
            connectedAt: Date.now(),
          },
          {
            address: '0xABCDEF1234567890abcdef1234567890ABCDEF12',
            isPrimary: false,
            connectedAt: Date.now(),
          },
        ],
      });

      const context: ActionContext = {
        input: {
          userId: testUser.id,
          setPrimaryWallet: '0xABCDEF1234567890abcdef1234567890ABCDEF12',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      const primaryWallet = result.data?.wallets?.find((w: any) => w.isPrimary);
      expect(primaryWallet?.address.toLowerCase()).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
    });

    it('should fail setting primary for non-existent wallet', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
          setPrimaryWallet: '0x1234567890123456789012345678901234567890',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wallet not found');
    });

    it('should update preferences', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
          preferences: {
            language: 'tr',
            theme: 'dark',
          },
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.preferences?.language).toBe('tr');
      expect(result.data?.preferences?.theme).toBe('dark');
    });

    it('should merge preferences', async () => {
      await storage.updateUser(testUser.id, {
        preferences: { language: 'en', currency: 'USD' },
      });

      const context: ActionContext = {
        input: {
          userId: testUser.id,
          preferences: {
            language: 'tr',
          },
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.preferences?.language).toBe('tr');
      expect(result.data?.preferences?.currency).toBe('USD');
    });

    it('should update metadata', async () => {
      const context: ActionContext = {
        input: {
          userId: testUser.id,
          metadata: { key: 'value' },
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.metadata?.key).toBe('value');
    });

    it('should update lastActiveAt', async () => {
      const before = Date.now();

      const context: ActionContext = {
        input: {
          userId: testUser.id,
          name: 'New Name',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.lastActiveAt).toBeGreaterThanOrEqual(before);
    });
  });
});
