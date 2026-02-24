/**
 * In-memory storage for onboarding data (fallback when no database adapter)
 */

import type {
  UserProfile,
  OnboardingFlow,
  OnboardingProgress,
  OnboardingDatabaseAdapter,
} from '../types/index.js';
import { generateId } from '../types/index.js';

/**
 * In-memory storage implementation
 */
export class InMemoryStorage implements OnboardingDatabaseAdapter {
  private users = new Map<string, UserProfile>();
  private usersByTelegramId = new Map<string, string>();
  private usersByWallet = new Map<string, string>();
  private usersByEmail = new Map<string, string>();
  private flows = new Map<string, OnboardingFlow>();
  private progress = new Map<string, OnboardingProgress>();

  // User methods
  async createUser(
    profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<UserProfile> {
    const now = Date.now();
    const user: UserProfile = {
      ...profile,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(user.id, user);

    // Index by identifiers
    if (user.telegramId) {
      this.usersByTelegramId.set(user.telegramId, user.id);
    }
    if (user.walletAddress) {
      this.usersByWallet.set(user.walletAddress.toLowerCase(), user.id);
    }
    if (user.email) {
      this.usersByEmail.set(user.email.toLowerCase(), user.id);
    }

    return user;
  }

  async getUser(userId: string): Promise<UserProfile | null> {
    return this.users.get(userId) ?? null;
  }

  async getUserByTelegramId(telegramId: string): Promise<UserProfile | null> {
    const userId = this.usersByTelegramId.get(telegramId);
    if (!userId) return null;
    return this.users.get(userId) ?? null;
  }

  async getUserByWallet(walletAddress: string): Promise<UserProfile | null> {
    const userId = this.usersByWallet.get(walletAddress.toLowerCase());
    if (!userId) return null;
    return this.users.get(userId) ?? null;
  }

  async getUserByEmail(email: string): Promise<UserProfile | null> {
    const userId = this.usersByEmail.get(email.toLowerCase());
    if (!userId) return null;
    return this.users.get(userId) ?? null;
  }

  async updateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const existing = this.users.get(userId);
    if (!existing) {
      throw new Error(`User ${userId} not found`);
    }

    const updated: UserProfile = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    };

    this.users.set(userId, updated);

    // Update indexes
    if (updates.telegramId !== undefined) {
      if (existing.telegramId) {
        this.usersByTelegramId.delete(existing.telegramId);
      }
      if (updates.telegramId) {
        this.usersByTelegramId.set(updates.telegramId, userId);
      }
    }
    if (updates.walletAddress !== undefined) {
      if (existing.walletAddress) {
        this.usersByWallet.delete(existing.walletAddress.toLowerCase());
      }
      if (updates.walletAddress) {
        this.usersByWallet.set(updates.walletAddress.toLowerCase(), userId);
      }
    }
    if (updates.email !== undefined) {
      if (existing.email) {
        this.usersByEmail.delete(existing.email.toLowerCase());
      }
      if (updates.email) {
        this.usersByEmail.set(updates.email.toLowerCase(), userId);
      }
    }

    return updated;
  }

  async deleteUser(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      if (user.telegramId) {
        this.usersByTelegramId.delete(user.telegramId);
      }
      if (user.walletAddress) {
        this.usersByWallet.delete(user.walletAddress.toLowerCase());
      }
      if (user.email) {
        this.usersByEmail.delete(user.email.toLowerCase());
      }
      this.users.delete(userId);
    }
  }

  // Flow methods
  async getFlow(flowId: string): Promise<OnboardingFlow | null> {
    return this.flows.get(flowId) ?? null;
  }

  async listFlows(options?: { active?: boolean }): Promise<OnboardingFlow[]> {
    let flows = Array.from(this.flows.values());
    if (options?.active !== undefined) {
      flows = flows.filter((f) => f.active === options.active);
    }
    return flows;
  }

  async createFlow(
    flow: Omit<OnboardingFlow, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<OnboardingFlow> {
    const now = Date.now();
    const newFlow: OnboardingFlow = {
      ...flow,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    this.flows.set(newFlow.id, newFlow);
    return newFlow;
  }

  async updateFlow(
    flowId: string,
    updates: Partial<OnboardingFlow>,
  ): Promise<OnboardingFlow> {
    const existing = this.flows.get(flowId);
    if (!existing) {
      throw new Error(`Flow ${flowId} not found`);
    }

    const updated: OnboardingFlow = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    };

    this.flows.set(flowId, updated);
    return updated;
  }

  async deleteFlow(flowId: string): Promise<void> {
    this.flows.delete(flowId);
  }

  // Progress methods
  async getProgress(userId: string, flowId: string): Promise<OnboardingProgress | null> {
    const key = `${userId}:${flowId}`;
    return this.progress.get(key) ?? null;
  }

  async saveProgress(progress: OnboardingProgress): Promise<void> {
    const key = `${progress.userId}:${progress.flowId}`;
    this.progress.set(key, progress);
  }

  async listUserProgress(userId: string): Promise<OnboardingProgress[]> {
    return Array.from(this.progress.values()).filter((p) => p.userId === userId);
  }

  async deleteProgress(userId: string, flowId: string): Promise<void> {
    const key = `${userId}:${flowId}`;
    this.progress.delete(key);
  }

  // Utility methods
  clear(): void {
    this.users.clear();
    this.usersByTelegramId.clear();
    this.usersByWallet.clear();
    this.usersByEmail.clear();
    this.flows.clear();
    this.progress.clear();
  }

  getUserCount(): number {
    return this.users.size;
  }

  getFlowCount(): number {
    return this.flows.size;
  }
}

/**
 * Create in-memory storage instance
 */
export function createInMemoryStorage(): InMemoryStorage {
  return new InMemoryStorage();
}
