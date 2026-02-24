/**
 * UserBotRepository Unit Tests
 * User bot management and platform connection tests
 */

// Mock Prisma client before any imports
jest.mock('@/generated/prisma/client', () => ({
  PrismaClient: jest.fn(),
  Prisma: {},
  PlatformName: {
    TELEGRAM: 'TELEGRAM',
    DISCORD: 'DISCORD',
  },
}));

// Mock DatabaseService
jest.mock('@/database/database.service', () => {
  const mockUser = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  };
  const mockPlatform = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };

  return {
    DatabaseService: jest.fn().mockImplementation(() => ({
      user: mockUser,
      platform: mockPlatform,
    })),
    __mockUser: mockUser,
    __mockPlatform: mockPlatform,
  };
});

// Mock TelegramService
jest.mock('@/telegram/telegram.service', () => ({
  TelegramService: jest.fn().mockImplementation(() => ({
    getBotName: jest.fn(),
  })),
}));

// Mock utils
jest.mock('@/utils/code', () => ({
  codeUtil: {
    generateCode: jest.fn(),
  },
}));

jest.mock('@/utils/link', () => ({
  linkUtil: {
    getTelegramBotStartLink: jest.fn(),
  },
}));

// Mock proto-generated
jest.mock('@/proto-generated/notification', () => ({
  NotificationType: {
    TELEGRAM: 'TELEGRAM',
    DISCORD: 'DISCORD',
  },
  TelegramBotTypes: {
    USER: 'USER',
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { UserBotRepository } from '@/user-bot/user-bot.repository';
import { DatabaseService } from '@/database/database.service';
import { TelegramService } from '@/telegram/telegram.service';
import { codeUtil } from '@/utils/code';
import { linkUtil } from '@/utils/link';

describe('UserBotRepository', () => {
  let repository: UserBotRepository;
  let mockUser: any;
  let mockPlatform: any;
  let mockTelegramService: any;

  const TEST_CONNECTION_KEY = 'test-connection-key-12345';
  const TEST_REF = 'test-ref-abcd';
  const TEST_PLATFORM_ID = '123456789';
  const TELEGRAM_PLATFORM = 'TELEGRAM';

  const mockUserData = {
    id: 'user-uuid-12345',
    connectionKey: TEST_CONNECTION_KEY,
    ref: TEST_REF,
    verificationCode: '1234',
    createdAt: new Date(),
    platforms: [],
  };

  const mockPlatformData = {
    id: 'platform-uuid-12345',
    platformId: TEST_PLATFORM_ID,
    platformName: TELEGRAM_PLATFORM,
    isActive: true,
    isVerified: true,
    userId: 'user-uuid-12345',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const dbService = require('@/database/database.service');
    mockUser = dbService.__mockUser;
    mockPlatform = dbService.__mockPlatform;

    mockTelegramService = {
      getBotName: jest.fn(),
    };

    (codeUtil.generateCode as jest.Mock).mockImplementation((length: number) => {
      return length === 12 ? TEST_REF : '1234';
    });

    (linkUtil.getTelegramBotStartLink as jest.Mock).mockReturnValue(
      `https://t.me/testbot?start=${TEST_REF}`
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserBotRepository,
        {
          provide: DatabaseService,
          useFactory: () => ({
            user: mockUser,
            platform: mockPlatform,
          }),
        },
        {
          provide: TelegramService,
          useValue: mockTelegramService,
        },
      ],
    }).compile();

    repository = module.get<UserBotRepository>(UserBotRepository);
  });

  describe('getUser', () => {
    it('should find user by connectionKey by default', async () => {
      mockUser.findMany.mockResolvedValue([mockUserData]);

      const result = await repository.getUser(TEST_CONNECTION_KEY);

      expect(mockUser.findMany).toHaveBeenCalledWith({
        where: { connectionKey: TEST_CONNECTION_KEY },
        include: { platforms: true },
      });
      expect(result).toEqual(mockUserData);
    });

    it('should find user by ref when specified', async () => {
      mockUser.findMany.mockResolvedValue([mockUserData]);

      const result = await repository.getUser(TEST_REF, 'ref');

      expect(mockUser.findMany).toHaveBeenCalledWith({
        where: { ref: TEST_REF },
        include: { platforms: true },
      });
      expect(result).toEqual(mockUserData);
    });

    it('should return undefined when no user found', async () => {
      mockUser.findMany.mockResolvedValue([]);

      const result = await repository.getUser('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('createUser', () => {
    it('should create user with generated ref and code', async () => {
      mockUser.create.mockResolvedValue(mockUserData);

      const result = await repository.createUser(TEST_CONNECTION_KEY);

      expect(mockUser.create).toHaveBeenCalledWith({
        data: {
          connectionKey: TEST_CONNECTION_KEY,
          ref: TEST_REF,
          verificationCode: '1234',
        },
      });
      expect(result).toEqual(mockUserData);
    });

    it('should generate codes with correct lengths', async () => {
      mockUser.create.mockResolvedValue(mockUserData);

      await repository.createUser(TEST_CONNECTION_KEY);

      expect(codeUtil.generateCode).toHaveBeenCalledWith(12);
      expect(codeUtil.generateCode).toHaveBeenCalledWith(4);
    });
  });

  describe('createOrGetUser', () => {
    it('should return existing user when found', async () => {
      mockUser.findMany.mockResolvedValue([mockUserData]);

      const result = await repository.createOrGetUser(TEST_CONNECTION_KEY);

      expect(result).toEqual(mockUserData);
      expect(mockUser.create).not.toHaveBeenCalled();
    });

    it('should create new user when not found', async () => {
      mockUser.findMany.mockResolvedValue([]);
      mockUser.create.mockResolvedValue(mockUserData);

      const result = await repository.createOrGetUser(TEST_CONNECTION_KEY);

      expect(mockUser.create).toHaveBeenCalled();
      expect(result).toEqual(mockUserData);
    });
  });

  describe('getUserBotURL', () => {
    it('should return bot URL data when user and bot exist', async () => {
      mockUser.findMany.mockResolvedValue([mockUserData]);
      mockTelegramService.getBotName.mockResolvedValue('testbot');

      const result = await repository.getUserBotURL({ userId: TEST_CONNECTION_KEY });

      expect(result.urls).toHaveLength(1);
      expect(result.urls[0]).toEqual({
        code: '1234',
        url: `https://t.me/testbot?start=${TEST_REF}`,
        type: 'TELEGRAM',
      });
    });

    it('should return empty urls when bot name not found', async () => {
      mockUser.findMany.mockResolvedValue([mockUserData]);
      mockTelegramService.getBotName.mockResolvedValue(null);

      const result = await repository.getUserBotURL({ userId: TEST_CONNECTION_KEY });

      expect(result.urls).toHaveLength(0);
    });
  });

  describe('isUserConnectedPlatform', () => {
    it('should return true when platform exists', () => {
      const platforms = [mockPlatformData];

      const result = repository.isUserConnectedPlatform(platforms as any, TELEGRAM_PLATFORM as any);

      expect(result).toBe(true);
    });

    it('should return false when platform not found', () => {
      const platforms = [mockPlatformData];

      const result = repository.isUserConnectedPlatform(platforms as any, 'DISCORD' as any);

      expect(result).toBe(false);
    });

    it('should return false for empty platforms', () => {
      const result = repository.isUserConnectedPlatform([], TELEGRAM_PLATFORM as any);

      expect(result).toBe(false);
    });
  });

  describe('isUserVerifiedForPlatformForRef', () => {
    it('should return true when platform is verified with matching ID', () => {
      const platforms = [mockPlatformData];

      const result = repository.isUserVerifiedForPlatformForRef(
        platforms as any,
        TELEGRAM_PLATFORM as any,
        TEST_PLATFORM_ID
      );

      expect(result).toBe(true);
    });

    it('should return false when platform not verified', () => {
      const platforms = [{ ...mockPlatformData, isVerified: false }];

      const result = repository.isUserVerifiedForPlatformForRef(
        platforms as any,
        TELEGRAM_PLATFORM as any,
        TEST_PLATFORM_ID
      );

      expect(result).toBe(false);
    });

    it('should return false when platform ID does not match', () => {
      const platforms = [mockPlatformData];

      const result = repository.isUserVerifiedForPlatformForRef(
        platforms as any,
        TELEGRAM_PLATFORM as any,
        'different-id'
      );

      expect(result).toBe(false);
    });
  });

  describe('isUserVerifiedForPlatform', () => {
    it('should return true when verified platform exists in DB', async () => {
      mockPlatform.findMany.mockResolvedValue([mockPlatformData]);

      const result = await repository.isUserVerifiedForPlatform(
        TEST_PLATFORM_ID,
        TELEGRAM_PLATFORM as any
      );

      expect(result).toBe(true);
      expect(mockPlatform.findMany).toHaveBeenCalledWith({
        where: {
          platformName: TELEGRAM_PLATFORM,
          platformId: TEST_PLATFORM_ID,
          isVerified: true,
        },
      });
    });

    it('should return false when no verified platform found', async () => {
      mockPlatform.findMany.mockResolvedValue([]);

      const result = await repository.isUserVerifiedForPlatform(
        TEST_PLATFORM_ID,
        TELEGRAM_PLATFORM as any
      );

      expect(result).toBe(false);
    });
  });

  describe('isBotSyncedToUser', () => {
    it('should return true when user has connected platform', async () => {
      const userWithPlatform = { ...mockUserData, platforms: [mockPlatformData] };
      mockUser.findMany.mockResolvedValue([userWithPlatform]);

      const result = await repository.isBotSyncedToUser(TEST_CONNECTION_KEY, TELEGRAM_PLATFORM as any);

      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      mockUser.findMany.mockResolvedValue([]);

      const result = await repository.isBotSyncedToUser(TEST_CONNECTION_KEY, TELEGRAM_PLATFORM as any);

      expect(result).toBe(false);
    });

    it('should return false when platform not connected', async () => {
      mockUser.findMany.mockResolvedValue([mockUserData]);

      const result = await repository.isBotSyncedToUser(TEST_CONNECTION_KEY, TELEGRAM_PLATFORM as any);

      expect(result).toBe(false);
    });
  });

  describe('isBotVerifiedUserForRef', () => {
    it('should return true when user verified for ref', async () => {
      const userWithPlatform = { ...mockUserData, platforms: [mockPlatformData] };
      mockUser.findMany.mockResolvedValue([userWithPlatform]);

      const result = await repository.isBotVerifiedUserForRef(
        TEST_REF,
        TEST_PLATFORM_ID,
        TELEGRAM_PLATFORM as any
      );

      expect(result).toBe(true);
    });

    it('should return false when user not verified', async () => {
      const userWithUnverified = {
        ...mockUserData,
        platforms: [{ ...mockPlatformData, isVerified: false }],
      };
      mockUser.findMany.mockResolvedValue([userWithUnverified]);

      const result = await repository.isBotVerifiedUserForRef(
        TEST_REF,
        TEST_PLATFORM_ID,
        TELEGRAM_PLATFORM as any
      );

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockUser.findMany.mockRejectedValue(new Error('DB error'));

      const result = await repository.isBotVerifiedUserForRef(
        TEST_REF,
        TEST_PLATFORM_ID,
        TELEGRAM_PLATFORM as any
      );

      expect(result).toBe(false);
    });
  });

  describe('isBotVerifiedUser', () => {
    it('should return true when platform is verified', async () => {
      mockPlatform.findMany.mockResolvedValue([mockPlatformData]);

      const result = await repository.isBotVerifiedUser(TEST_PLATFORM_ID, TELEGRAM_PLATFORM as any);

      expect(result).toBe(true);
    });

    it('should return false when platform not verified', async () => {
      mockPlatform.findMany.mockResolvedValue([]);

      const result = await repository.isBotVerifiedUser(TEST_PLATFORM_ID, TELEGRAM_PLATFORM as any);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockPlatform.findMany.mockRejectedValue(new Error('DB error'));

      const result = await repository.isBotVerifiedUser(TEST_PLATFORM_ID, TELEGRAM_PLATFORM as any);

      expect(result).toBe(false);
    });
  });

  describe('connectPlatformToUser', () => {
    it('should create platform connection', async () => {
      mockPlatform.create.mockResolvedValue(mockPlatformData);

      await repository.connectPlatformToUser(TEST_REF, TEST_PLATFORM_ID, TELEGRAM_PLATFORM as any);

      expect(mockPlatform.create).toHaveBeenCalledWith({
        data: {
          platformId: TEST_PLATFORM_ID,
          platformName: TELEGRAM_PLATFORM,
          User: {
            connect: { ref: TEST_REF },
          },
        },
      });
    });

    it('should handle errors gracefully', async () => {
      mockPlatform.create.mockRejectedValue(new Error('Already connected'));

      // Should not throw - errors are caught silently
      await expect(
        repository.connectPlatformToUser(TEST_REF, TEST_PLATFORM_ID, TELEGRAM_PLATFORM as any)
      ).resolves.not.toThrow();
    });
  });

  describe('getUserByPlatformId', () => {
    it('should return user by platform ID', async () => {
      mockUser.findMany.mockResolvedValue([mockUserData]);

      const result = await repository.getUserByPlatformId(TEST_PLATFORM_ID, TELEGRAM_PLATFORM as any);

      expect(mockUser.findMany).toHaveBeenCalledWith({
        where: {
          platforms: {
            some: {
              platformId: TEST_PLATFORM_ID,
              platformName: TELEGRAM_PLATFORM,
            },
          },
        },
      });
      expect(result).toEqual(mockUserData);
    });

    it('should return undefined when not found', async () => {
      mockUser.findMany.mockResolvedValue([]);

      const result = await repository.getUserByPlatformId('nonexistent', TELEGRAM_PLATFORM as any);

      expect(result).toBeUndefined();
    });

    it('should return undefined on error', async () => {
      mockUser.findMany.mockRejectedValue(new Error('DB error'));

      const result = await repository.getUserByPlatformId(TEST_PLATFORM_ID, TELEGRAM_PLATFORM as any);

      expect(result).toBeUndefined();
    });
  });

  describe('getPlatformByConnectionKey', () => {
    it('should return platform by connection key', async () => {
      mockUser.findUnique.mockResolvedValue({
        platforms: [{ isActive: true, platformId: TEST_PLATFORM_ID, id: 'platform-id' }],
      });

      const result = await repository.getPlatformByConnectionKey(
        TEST_CONNECTION_KEY,
        TELEGRAM_PLATFORM as any
      );

      expect(result).toEqual({ isActive: true, platformId: TEST_PLATFORM_ID, id: 'platform-id' });
    });

    it('should return undefined when user not found', async () => {
      mockUser.findUnique.mockResolvedValue(null);

      const result = await repository.getPlatformByConnectionKey(
        TEST_CONNECTION_KEY,
        TELEGRAM_PLATFORM as any
      );

      expect(result).toBeUndefined();
    });
  });

  describe('getPlatformByPlatformId', () => {
    it('should return platform by platform ID', async () => {
      mockPlatform.findFirst.mockResolvedValue(mockPlatformData);

      const result = await repository.getPlatformByPlatformId(TEST_PLATFORM_ID);

      expect(mockPlatform.findFirst).toHaveBeenCalledWith({
        where: { platformId: TEST_PLATFORM_ID },
      });
      expect(result).toEqual(mockPlatformData);
    });
  });

  describe('getPlatformIdByConnectionKey', () => {
    it('should return platform ID', async () => {
      mockUser.findUnique.mockResolvedValue({
        platforms: [{ platformId: TEST_PLATFORM_ID }],
      });

      const result = await repository.getPlatformIdByConnectionKey(
        TEST_CONNECTION_KEY,
        TELEGRAM_PLATFORM as any
      );

      expect(result).toBe(TEST_PLATFORM_ID);
    });

    it('should return undefined on error', async () => {
      mockUser.findUnique.mockRejectedValue(new Error('DB error'));

      const result = await repository.getPlatformIdByConnectionKey(
        TEST_CONNECTION_KEY,
        TELEGRAM_PLATFORM as any
      );

      expect(result).toBeUndefined();
    });
  });

  describe('getCodeForUser', () => {
    it('should return verification code for user', async () => {
      mockUser.findMany.mockResolvedValue([mockUserData]);

      const result = await repository.getCodeForUser(TEST_PLATFORM_ID, TELEGRAM_PLATFORM as any);

      expect(result).toBe('1234');
    });
  });

  describe('getUserBotStates', () => {
    it('should return bot states for user', async () => {
      const userWithPlatform = { ...mockUserData, platforms: [mockPlatformData] };
      mockUser.findMany.mockResolvedValue([userWithPlatform]);

      const result = await repository.getUserBotStates(TEST_CONNECTION_KEY);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: TELEGRAM_PLATFORM,
        isActive: true,
      });
    });

    it('should return empty array on error', async () => {
      mockUser.findMany.mockRejectedValue(new Error('DB error'));

      const result = await repository.getUserBotStates(TEST_CONNECTION_KEY);

      expect(result).toEqual([]);
    });
  });

  describe('getUserBotState', () => {
    it('should return isActive state for platform', async () => {
      mockPlatform.findFirst.mockResolvedValue(mockPlatformData);

      const result = await repository.getUserBotState(TEST_PLATFORM_ID);

      expect(result).toBe(true);
    });

    it('should return undefined when platform not found', async () => {
      mockPlatform.findFirst.mockResolvedValue(null);

      const result = await repository.getUserBotState(TEST_PLATFORM_ID);

      expect(result).toBeUndefined();
    });
  });

  describe('togglePlatformState', () => {
    it('should toggle platform state', async () => {
      mockPlatform.update.mockResolvedValue({ ...mockPlatformData, isActive: false });

      const result = await repository.togglePlatformState('platform-id', true);

      expect(mockPlatform.update).toHaveBeenCalledWith({
        where: { id: 'platform-id' },
        data: { isActive: false },
      });
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockPlatform.update.mockRejectedValue(new Error('Update failed'));

      const result = await repository.togglePlatformState('platform-id', true);

      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('toggleBotstate', () => {
    it('should toggle bot state', async () => {
      mockUser.findUnique.mockResolvedValue({
        platforms: [{ id: 'platform-id', isActive: true, platformId: TEST_PLATFORM_ID }],
      });
      mockPlatform.update.mockResolvedValue({ isActive: false });

      const result = await repository.toggleBotstate({
        userId: TEST_CONNECTION_KEY,
        type: TELEGRAM_PLATFORM as any,
      });

      expect(result).toBe(true);
    });

    it('should return false when platform not found', async () => {
      mockUser.findUnique.mockResolvedValue({ platforms: [] });

      const result = await repository.toggleBotstate({
        userId: TEST_CONNECTION_KEY,
        type: TELEGRAM_PLATFORM as any,
      });

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockUser.findUnique.mockRejectedValue(new Error('DB error'));

      const result = await repository.toggleBotstate({
        userId: TEST_CONNECTION_KEY,
        type: TELEGRAM_PLATFORM as any,
      });

      expect(result).toBe(false);
    });
  });

  describe('syncUserToPlatform', () => {
    it('should sync user to platform', async () => {
      mockPlatform.create.mockResolvedValue(mockPlatformData);

      const result = await repository.syncUserToPlatform(
        TEST_REF,
        TEST_PLATFORM_ID,
        TELEGRAM_PLATFORM as any
      );

      expect(result).toBe(true);
    });

    it('should return true even when connectPlatformToUser has internal error (catches errors)', async () => {
      // connectPlatformToUser catches errors internally and logs "Not connected"
      // so syncUserToPlatform still returns true
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockPlatform.create.mockRejectedValue(new Error('Create failed'));

      const result = await repository.syncUserToPlatform(
        TEST_REF,
        TEST_PLATFORM_ID,
        TELEGRAM_PLATFORM as any
      );

      expect(result).toBe(true); // Returns true because try block completed
      consoleSpy.mockRestore();
    });
  });

  describe('verifyUserToPlatform', () => {
    it('should verify user to platform', async () => {
      mockPlatform.updateMany.mockResolvedValue({ count: 1 });

      const result = await repository.verifyUserToPlatform(TEST_PLATFORM_ID, TELEGRAM_PLATFORM as any);

      expect(mockPlatform.updateMany).toHaveBeenCalledWith({
        where: {
          platformId: TEST_PLATFORM_ID,
          platformName: TELEGRAM_PLATFORM,
        },
        data: { isVerified: true, isActive: true },
      });
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockPlatform.updateMany.mockRejectedValue(new Error('Update failed'));

      const result = await repository.verifyUserToPlatform(TEST_PLATFORM_ID, TELEGRAM_PLATFORM as any);

      expect(result).toBe(false);
    });
  });
});
