/**
 * InMemoryStorage tests
 */


import { InMemoryStorage, createInMemoryStorage } from './storage.js';
import type { UserProfile, OnboardingFlow, OnboardingProgress } from '../types/index.js';

describe('InMemoryStorage', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = createInMemoryStorage();
  });

  describe('createInMemoryStorage', () => {
    it('should create a new InMemoryStorage instance', () => {
      const instance = createInMemoryStorage();
      expect(instance).toBeInstanceOf(InMemoryStorage);
    });
  });

  describe('User operations', () => {
    describe('createUser', () => {
      it('should create a user with generated ID and timestamps', async () => {
        const user = await storage.createUser({
          name: 'Test User',
          email: 'test@example.com',
          status: 'new',
        });

        expect(user.id).toBeDefined();
        expect(user.name).toBe('Test User');
        expect(user.email).toBe('test@example.com');
        expect(user.status).toBe('new');
        expect(user.createdAt).toBeGreaterThan(0);
        expect(user.updatedAt).toBeGreaterThan(0);
      });

      it('should index user by telegramId', async () => {
        const user = await storage.createUser({
          telegramId: 'tg123',
          status: 'new',
        });

        const found = await storage.getUserByTelegramId('tg123');
        expect(found?.id).toBe(user.id);
      });

      it('should index user by wallet address (case insensitive)', async () => {
        const user = await storage.createUser({
          walletAddress: '0xABCDEF1234567890abcdef1234567890ABCDEF12',
          status: 'new',
        });

        const found = await storage.getUserByWallet('0xabcdef1234567890abcdef1234567890abcdef12');
        expect(found?.id).toBe(user.id);
      });

      it('should index user by email (case insensitive)', async () => {
        const user = await storage.createUser({
          email: 'Test@Example.COM',
          status: 'new',
        });

        const found = await storage.getUserByEmail('test@example.com');
        expect(found?.id).toBe(user.id);
      });
    });

    describe('getUser', () => {
      it('should return user by ID', async () => {
        const created = await storage.createUser({
          name: 'Test',
          status: 'new',
        });

        const found = await storage.getUser(created.id);
        expect(found?.id).toBe(created.id);
      });

      it('should return null for non-existent user', async () => {
        const found = await storage.getUser('non-existent');
        expect(found).toBeNull();
      });
    });

    describe('updateUser', () => {
      it('should update user fields', async () => {
        const user = await storage.createUser({
          name: 'Original',
          status: 'new',
        });

        const updated = await storage.updateUser(user.id, {
          name: 'Updated',
          status: 'active',
        });

        expect(updated.name).toBe('Updated');
        expect(updated.status).toBe('active');
        expect(updated.updatedAt).toBeGreaterThanOrEqual(user.createdAt);
      });

      it('should not modify id and createdAt', async () => {
        const user = await storage.createUser({
          name: 'Test',
          status: 'new',
        });

        const updated = await storage.updateUser(user.id, {
          id: 'new-id' as any,
          createdAt: 0 as any,
        });

        expect(updated.id).toBe(user.id);
        expect(updated.createdAt).toBe(user.createdAt);
      });

      it('should update indexes when identifiers change', async () => {
        const user = await storage.createUser({
          telegramId: 'old-tg',
          email: 'old@test.com',
          walletAddress: '0x1234567890123456789012345678901234567890',
          status: 'new',
        });

        await storage.updateUser(user.id, {
          telegramId: 'new-tg',
          email: 'new@test.com',
          walletAddress: '0xABCDEF1234567890abcdef1234567890ABCDEF12',
        });

        expect(await storage.getUserByTelegramId('old-tg')).toBeNull();
        expect(await storage.getUserByTelegramId('new-tg')).not.toBeNull();
        expect(await storage.getUserByEmail('old@test.com')).toBeNull();
        expect(await storage.getUserByEmail('new@test.com')).not.toBeNull();
        expect(await storage.getUserByWallet('0x1234567890123456789012345678901234567890')).toBeNull();
        expect(await storage.getUserByWallet('0xABCDEF1234567890abcdef1234567890ABCDEF12')).not.toBeNull();
      });

      it('should throw for non-existent user', async () => {
        await expect(storage.updateUser('non-existent', { name: 'Test' }))
          .rejects.toThrow('User non-existent not found');
      });
    });

    describe('deleteUser', () => {
      it('should delete user and remove from indexes', async () => {
        const user = await storage.createUser({
          telegramId: 'tg123',
          email: 'test@example.com',
          walletAddress: '0x1234567890123456789012345678901234567890',
          status: 'new',
        });

        await storage.deleteUser(user.id);

        expect(await storage.getUser(user.id)).toBeNull();
        expect(await storage.getUserByTelegramId('tg123')).toBeNull();
        expect(await storage.getUserByEmail('test@example.com')).toBeNull();
        expect(await storage.getUserByWallet('0x1234567890123456789012345678901234567890')).toBeNull();
      });

      it('should handle deleting non-existent user', async () => {
        await expect(storage.deleteUser('non-existent')).resolves.toBeUndefined();
      });
    });
  });

  describe('Flow operations', () => {
    describe('createFlow', () => {
      it('should create a flow with generated ID and timestamps', async () => {
        const flow = await storage.createFlow({
          name: 'Test Flow',
          steps: [],
          active: true,
        });

        expect(flow.id).toBeDefined();
        expect(flow.name).toBe('Test Flow');
        expect(flow.active).toBe(true);
        expect(flow.createdAt).toBeGreaterThan(0);
        expect(flow.updatedAt).toBeGreaterThan(0);
      });
    });

    describe('getFlow', () => {
      it('should return flow by ID', async () => {
        const created = await storage.createFlow({
          name: 'Test',
          steps: [],
        });

        const found = await storage.getFlow(created.id);
        expect(found?.id).toBe(created.id);
      });

      it('should return null for non-existent flow', async () => {
        const found = await storage.getFlow('non-existent');
        expect(found).toBeNull();
      });
    });

    describe('listFlows', () => {
      it('should return all flows', async () => {
        await storage.createFlow({ name: 'Flow 1', steps: [], active: true });
        await storage.createFlow({ name: 'Flow 2', steps: [], active: false });

        const flows = await storage.listFlows();
        expect(flows.length).toBe(2);
      });

      it('should filter by active status', async () => {
        await storage.createFlow({ name: 'Active', steps: [], active: true });
        await storage.createFlow({ name: 'Inactive', steps: [], active: false });

        const activeFlows = await storage.listFlows({ active: true });
        expect(activeFlows.length).toBe(1);
        expect(activeFlows[0].name).toBe('Active');

        const inactiveFlows = await storage.listFlows({ active: false });
        expect(inactiveFlows.length).toBe(1);
        expect(inactiveFlows[0].name).toBe('Inactive');
      });
    });

    describe('updateFlow', () => {
      it('should update flow fields', async () => {
        const flow = await storage.createFlow({
          name: 'Original',
          steps: [],
        });

        const updated = await storage.updateFlow(flow.id, {
          name: 'Updated',
          active: true,
        });

        expect(updated.name).toBe('Updated');
        expect(updated.active).toBe(true);
      });

      it('should throw for non-existent flow', async () => {
        await expect(storage.updateFlow('non-existent', { name: 'Test' }))
          .rejects.toThrow('Flow non-existent not found');
      });
    });

    describe('deleteFlow', () => {
      it('should delete a flow', async () => {
        const flow = await storage.createFlow({
          name: 'Test',
          steps: [],
        });

        await storage.deleteFlow(flow.id);
        expect(await storage.getFlow(flow.id)).toBeNull();
      });
    });
  });

  describe('Progress operations', () => {
    describe('saveProgress and getProgress', () => {
      it('should save and retrieve progress', async () => {
        const progress: OnboardingProgress = {
          userId: 'user1',
          flowId: 'flow1',
          currentStepId: 'step1',
          completedSteps: [],
          skippedSteps: [],
          failedSteps: [],
          stepData: {},
          progressPercent: 0,
          isCompleted: false,
          startedAt: Date.now(),
          lastActivityAt: Date.now(),
        };

        await storage.saveProgress(progress);
        const found = await storage.getProgress('user1', 'flow1');

        expect(found?.userId).toBe('user1');
        expect(found?.flowId).toBe('flow1');
      });

      it('should return null for non-existent progress', async () => {
        const found = await storage.getProgress('user1', 'flow1');
        expect(found).toBeNull();
      });
    });

    describe('listUserProgress', () => {
      it('should return all progress for a user', async () => {
        await storage.saveProgress({
          userId: 'user1',
          flowId: 'flow1',
          currentStepId: 'step1',
          completedSteps: [],
          skippedSteps: [],
          failedSteps: [],
          stepData: {},
          progressPercent: 0,
          isCompleted: false,
          startedAt: Date.now(),
          lastActivityAt: Date.now(),
        });

        await storage.saveProgress({
          userId: 'user1',
          flowId: 'flow2',
          currentStepId: 'step1',
          completedSteps: [],
          skippedSteps: [],
          failedSteps: [],
          stepData: {},
          progressPercent: 0,
          isCompleted: false,
          startedAt: Date.now(),
          lastActivityAt: Date.now(),
        });

        await storage.saveProgress({
          userId: 'user2',
          flowId: 'flow1',
          currentStepId: 'step1',
          completedSteps: [],
          skippedSteps: [],
          failedSteps: [],
          stepData: {},
          progressPercent: 0,
          isCompleted: false,
          startedAt: Date.now(),
          lastActivityAt: Date.now(),
        });

        const user1Progress = await storage.listUserProgress('user1');
        expect(user1Progress.length).toBe(2);

        const user2Progress = await storage.listUserProgress('user2');
        expect(user2Progress.length).toBe(1);
      });
    });

    describe('deleteProgress', () => {
      it('should delete progress', async () => {
        await storage.saveProgress({
          userId: 'user1',
          flowId: 'flow1',
          currentStepId: 'step1',
          completedSteps: [],
          skippedSteps: [],
          failedSteps: [],
          stepData: {},
          progressPercent: 0,
          isCompleted: false,
          startedAt: Date.now(),
          lastActivityAt: Date.now(),
        });

        await storage.deleteProgress('user1', 'flow1');
        expect(await storage.getProgress('user1', 'flow1')).toBeNull();
      });
    });
  });

  describe('Utility methods', () => {
    describe('clear', () => {
      it('should clear all data', async () => {
        await storage.createUser({ name: 'Test', status: 'new' });
        await storage.createFlow({ name: 'Test', steps: [] });
        await storage.saveProgress({
          userId: 'user1',
          flowId: 'flow1',
          currentStepId: 'step1',
          completedSteps: [],
          skippedSteps: [],
          failedSteps: [],
          stepData: {},
          progressPercent: 0,
          isCompleted: false,
          startedAt: Date.now(),
          lastActivityAt: Date.now(),
        });

        storage.clear();

        expect(storage.getUserCount()).toBe(0);
        expect(storage.getFlowCount()).toBe(0);
      });
    });

    describe('getUserCount', () => {
      it('should return number of users', async () => {
        expect(storage.getUserCount()).toBe(0);

        await storage.createUser({ name: 'User 1', status: 'new' });
        expect(storage.getUserCount()).toBe(1);

        await storage.createUser({ name: 'User 2', status: 'new' });
        expect(storage.getUserCount()).toBe(2);
      });
    });

    describe('getFlowCount', () => {
      it('should return number of flows', async () => {
        expect(storage.getFlowCount()).toBe(0);

        await storage.createFlow({ name: 'Flow 1', steps: [] });
        expect(storage.getFlowCount()).toBe(1);
      });
    });
  });
});
