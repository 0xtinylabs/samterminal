/**
 * Create User Action tests
 */


import { createCreateUserAction } from './create-user.js';
import { InMemoryStorage, createInMemoryStorage } from '../utils/storage.js';
import type { ActionContext } from '@samterminal/core';
import type { OnboardingPluginConfig } from '../types/index.js';

describe('Create User Action', () => {
  let storage: InMemoryStorage;
  let action: ReturnType<typeof createCreateUserAction>;
  let config: OnboardingPluginConfig;

  beforeEach(() => {
    storage = createInMemoryStorage();
    config = { autoStart: true };
    action = createCreateUserAction(() => storage, config);
  });

  describe('metadata', () => {
    it('should have correct name', () => {
      expect(action.name).toBe('onboarding:create-user');
    });

    it('should have correct description', () => {
      expect(action.description).toBe('Create a new user profile');
    });
  });

  describe('execute', () => {
    it('should create a user with minimal data', async () => {
      const context: ActionContext = {
        input: {
          name: 'Test User',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBeDefined();
      expect(result.data?.name).toBe('Test User');
      expect(result.data?.status).toBe('onboarding'); // autoStart=true
    });

    it('should set status to new when autoStart is false', async () => {
      config.autoStart = false;
      action = createCreateUserAction(() => storage, config);

      const context: ActionContext = {
        input: {
          name: 'Test User',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('new');
    });

    it('should create user with all fields', async () => {
      const context: ActionContext = {
        input: {
          name: 'Full User',
          email: 'test@example.com',
          phone: '+12025551234',
          telegramId: 'tg123',
          telegramUsername: 'testuser',
          walletAddress: '0x1234567890123456789012345678901234567890',
          preferences: { language: 'en' },
          metadata: { source: 'test' },
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('test@example.com');
      expect(result.data?.phone).toBe('+12025551234');
      expect(result.data?.telegramId).toBe('tg123');
      expect(result.data?.walletAddress).toBe('0x1234567890123456789012345678901234567890');
      expect(result.data?.wallets?.length).toBe(1);
      expect(result.data?.wallets?.[0].isPrimary).toBe(true);
    });

    it('should fail for invalid email', async () => {
      const context: ActionContext = {
        input: {
          email: 'not-an-email',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should fail for invalid wallet address', async () => {
      const context: ActionContext = {
        input: {
          walletAddress: '0x123', // Too short
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid wallet address format');
    });

    it('should fail for invalid phone number', async () => {
      const context: ActionContext = {
        input: {
          phone: 'abc123',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid phone number format');
    });

    it('should fail for duplicate telegramId', async () => {
      // Create first user
      await storage.createUser({
        telegramId: 'tg123',
        status: 'active',
      });

      const context: ActionContext = {
        input: {
          telegramId: 'tg123',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User with this Telegram ID already exists');
      expect(result.data?.existingUserId).toBeDefined();
    });

    it('should fail for duplicate wallet address', async () => {
      await storage.createUser({
        walletAddress: '0x1234567890123456789012345678901234567890',
        status: 'active',
      });

      const context: ActionContext = {
        input: {
          walletAddress: '0x1234567890123456789012345678901234567890',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User with this wallet address already exists');
    });

    it('should fail for duplicate email', async () => {
      await storage.createUser({
        email: 'test@example.com',
        status: 'active',
      });

      const context: ActionContext = {
        input: {
          email: 'test@example.com',
        },
        pluginName: 'onboarding',
      };

      const result = await action.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User with this email already exists');
    });
  });
});
