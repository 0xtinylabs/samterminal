/**
 * WalletOwnerRepository Unit Tests
 * Wallet owner CRUD operations
 */

// Mock Prisma client before any imports
jest.mock('@/generated/prisma/client', () => ({
  PrismaClient: jest.fn(),
  Prisma: {},
}));

// Mock DatabaseService
jest.mock('@/database/database.service', () => {
  const mockWalletOwner = {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  };

  return {
    DatabaseService: jest.fn().mockImplementation(() => ({
      walletOwner: mockWalletOwner,
    })),
    __mockWalletOwner: mockWalletOwner,
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { WalletOwnerRepository } from '@/database/repositories/wallet-owner.repository';
import { DatabaseService } from '@/database/database.service';

describe('WalletOwnerRepository', () => {
  let repository: WalletOwnerRepository;
  let mockWalletOwner: any;

  const TEST_WALLET_ADDRESS = '0xTest1234567890AbCdEf1234567890AbCdEf1234';
  const TEST_WALLET_ADDRESS_LOWER = '0xtest1234567890abcdef1234567890abcdef1234';
  const TEST_OWNER_ID = 'owner-uuid-12345';

  beforeEach(async () => {
    jest.clearAllMocks();

    const dbService = require('@/database/database.service');
    mockWalletOwner = dbService.__mockWalletOwner;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletOwnerRepository,
        {
          provide: DatabaseService,
          useFactory: () => ({
            walletOwner: mockWalletOwner,
          }),
        },
      ],
    }).compile();

    repository = module.get<WalletOwnerRepository>(WalletOwnerRepository);
  });

  describe('constructor', () => {
    it('should initialize model from database service', () => {
      expect(repository.model).toBeDefined();
      expect(repository.model).toBe(mockWalletOwner);
    });
  });

  describe('getWalletOwnerID', () => {
    describe('existing wallet owner', () => {
      it('should return existing wallet owner ID when found', async () => {
        mockWalletOwner.upsert.mockResolvedValue({
          id: TEST_OWNER_ID,
          walletAddress: TEST_WALLET_ADDRESS_LOWER,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const result = await repository.getWalletOwnerID(TEST_WALLET_ADDRESS);

        expect(result).toBe(TEST_OWNER_ID);
      });

      it('should lowercase the wallet address before query', async () => {
        mockWalletOwner.upsert.mockResolvedValue({
          id: TEST_OWNER_ID,
          walletAddress: TEST_WALLET_ADDRESS_LOWER,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await repository.getWalletOwnerID(TEST_WALLET_ADDRESS);

        expect(mockWalletOwner.upsert).toHaveBeenCalledWith({
          create: {
            walletAddress: TEST_WALLET_ADDRESS_LOWER,
          },
          where: {
            walletAddress: TEST_WALLET_ADDRESS_LOWER,
          },
          update: {},
        });
      });
    });

    describe('new wallet owner', () => {
      it('should create new wallet owner when not found', async () => {
        const newOwnerId = 'new-owner-uuid-67890';
        mockWalletOwner.upsert.mockResolvedValue({
          id: newOwnerId,
          walletAddress: TEST_WALLET_ADDRESS_LOWER,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const result = await repository.getWalletOwnerID(TEST_WALLET_ADDRESS);

        expect(result).toBe(newOwnerId);
        expect(mockWalletOwner.upsert).toHaveBeenCalledTimes(1);
      });

      it('should use upsert with empty update object', async () => {
        mockWalletOwner.upsert.mockResolvedValue({
          id: TEST_OWNER_ID,
          walletAddress: TEST_WALLET_ADDRESS_LOWER,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await repository.getWalletOwnerID(TEST_WALLET_ADDRESS);

        expect(mockWalletOwner.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            update: {},
          })
        );
      });
    });

    describe('case sensitivity', () => {
      it('should handle uppercase wallet address', async () => {
        const upperCaseAddress = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
        mockWalletOwner.upsert.mockResolvedValue({
          id: TEST_OWNER_ID,
          walletAddress: upperCaseAddress.toLowerCase(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await repository.getWalletOwnerID(upperCaseAddress);

        expect(mockWalletOwner.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              walletAddress: upperCaseAddress.toLowerCase(),
            },
          })
        );
      });

      it('should handle mixed case wallet address', async () => {
        const mixedCaseAddress = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12';
        mockWalletOwner.upsert.mockResolvedValue({
          id: TEST_OWNER_ID,
          walletAddress: mixedCaseAddress.toLowerCase(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await repository.getWalletOwnerID(mixedCaseAddress);

        expect(mockWalletOwner.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            create: {
              walletAddress: mixedCaseAddress.toLowerCase(),
            },
          })
        );
      });

      it('should handle already lowercase wallet address', async () => {
        mockWalletOwner.upsert.mockResolvedValue({
          id: TEST_OWNER_ID,
          walletAddress: TEST_WALLET_ADDRESS_LOWER,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await repository.getWalletOwnerID(TEST_WALLET_ADDRESS_LOWER);

        expect(mockWalletOwner.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              walletAddress: TEST_WALLET_ADDRESS_LOWER,
            },
          })
        );
      });
    });

    describe('error handling', () => {
      it('should propagate database errors', async () => {
        const dbError = new Error('Database connection failed');
        mockWalletOwner.upsert.mockRejectedValue(dbError);

        await expect(repository.getWalletOwnerID(TEST_WALLET_ADDRESS)).rejects.toThrow(
          'Database connection failed'
        );
      });

      it('should propagate unique constraint errors', async () => {
        const constraintError = new Error('Unique constraint violation');
        mockWalletOwner.upsert.mockRejectedValue(constraintError);

        await expect(repository.getWalletOwnerID(TEST_WALLET_ADDRESS)).rejects.toThrow(
          'Unique constraint violation'
        );
      });
    });
  });
});
