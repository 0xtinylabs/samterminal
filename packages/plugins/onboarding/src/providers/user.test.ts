/**
 * User Provider tests
 */


import { createUserProvider } from './user.js';
import { InMemoryStorage, createInMemoryStorage } from '../utils/storage.js';
import type { ProviderContext } from '@samterminal/core';
import type { UserProfile } from '../types/index.js';

describe('User Provider', () => {
  let storage: InMemoryStorage;
  let provider: ReturnType<typeof createUserProvider>;
  let testUser: UserProfile;

  beforeEach(async () => {
    storage = createInMemoryStorage();
    provider = createUserProvider(() => storage, {});

    testUser = await storage.createUser({
      name: 'Test User',
      email: 'test@example.com',
      telegramId: 'tg123',
      walletAddress: '0x1234567890123456789012345678901234567890',
      status: 'active',
    });
  });

  describe('metadata', () => {
    it('should have correct name', () => {
      expect(provider.name).toBe('onboarding:user');
    });

    it('should have correct type', () => {
      expect(provider.type).toBe('token');
    });

    it('should have correct description', () => {
      expect(provider.description).toBe('Get user profile');
    });
  });

  describe('get', () => {
    it('should require at least one identifier', async () => {
      const context: ProviderContext = {
        query: {},
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID, Telegram ID, wallet address, or email is required');
    });

    it('should find user by userId', async () => {
      const context: ProviderContext = {
        query: { userId: testUser.id },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(testUser.id);
      expect(result.data?.name).toBe('Test User');
    });

    it('should find user by telegramId', async () => {
      const context: ProviderContext = {
        query: { telegramId: 'tg123' },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(testUser.id);
    });

    it('should find user by walletAddress', async () => {
      const context: ProviderContext = {
        query: { walletAddress: '0x1234567890123456789012345678901234567890' },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(testUser.id);
    });

    it('should find user by email', async () => {
      const context: ProviderContext = {
        query: { email: 'test@example.com' },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(testUser.id);
    });

    it('should return error for non-existent user', async () => {
      const context: ProviderContext = {
        query: { userId: 'non-existent' },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should prioritize userId over other identifiers', async () => {
      const context: ProviderContext = {
        query: {
          userId: testUser.id,
          telegramId: 'other-tg',
          email: 'other@example.com',
        },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(testUser.id);
    });

    it('should include timestamp in response', async () => {
      const context: ProviderContext = {
        query: { userId: testUser.id },
        pluginName: 'onboarding',
      };

      const result = await provider.get(context);

      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });
});
