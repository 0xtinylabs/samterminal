/**
 * SwapRepository Unit Tests
 * Swap record creation tests
 */

// Mock Prisma client before any imports
jest.mock('@/generated/prisma/client', () => ({
  PrismaClient: jest.fn(),
  Prisma: {},
}));

// Mock DatabaseService
jest.mock('@/database/database.service', () => {
  const mockSwap = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  };

  return {
    DatabaseService: jest.fn().mockImplementation(() => ({
      swap: mockSwap,
    })),
    __mockSwap: mockSwap,
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { SwapRepository } from '@/database/repositories/swap.repository';
import { DatabaseService } from '@/database/database.service';

describe('SwapRepository', () => {
  let repository: SwapRepository;
  let mockSwap: any;

  const TEST_OWNER_ID = 'owner-uuid-12345';

  const createSwapInput = {
    fromTokenAddress: '0xFromToken1234567890abcdef1234567890abcd',
    toTokenAddress: '0xToToken1234567890abcdef1234567890abcdef',
    fromAmount: '1000000000000000000',
    toAmount: '2000000000',
    txHash: '0xTxHash1234567890abcdef1234567890abcdef12345678',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const dbService = require('@/database/database.service');
    mockSwap = dbService.__mockSwap;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwapRepository,
        {
          provide: DatabaseService,
          useFactory: () => ({
            swap: mockSwap,
          }),
        },
      ],
    }).compile();

    repository = module.get<SwapRepository>(SwapRepository);
  });

  describe('constructor', () => {
    it('should initialize model from database service', () => {
      expect(repository.model).toBeDefined();
      expect(repository.model).toBe(mockSwap);
    });
  });

  describe('createSwap', () => {
    describe('successful creation', () => {
      it('should create swap with owner connection', async () => {
        mockSwap.create.mockResolvedValue({
          id: 'swap-uuid-12345',
          ...createSwapInput,
          walletOwnerId: TEST_OWNER_ID,
          createdAt: new Date(),
        });

        await repository.createSwap(TEST_OWNER_ID, createSwapInput as any);

        expect(mockSwap.create).toHaveBeenCalledTimes(1);
      });

      it('should spread swap data and connect wallet owner', async () => {
        mockSwap.create.mockResolvedValue({
          id: 'swap-uuid-12345',
          ...createSwapInput,
          walletOwnerId: TEST_OWNER_ID,
          createdAt: new Date(),
        });

        await repository.createSwap(TEST_OWNER_ID, createSwapInput as any);

        expect(mockSwap.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            fromTokenAddress: createSwapInput.fromTokenAddress,
            toTokenAddress: createSwapInput.toTokenAddress,
            fromAmount: createSwapInput.fromAmount,
            toAmount: createSwapInput.toAmount,
            txHash: createSwapInput.txHash,
            walletOwner: {
              connect: {
                id: TEST_OWNER_ID,
              },
            },
          }),
        });
      });

      it('should not return any value (void)', async () => {
        mockSwap.create.mockResolvedValue({
          id: 'swap-uuid-12345',
          ...createSwapInput,
          walletOwnerId: TEST_OWNER_ID,
          createdAt: new Date(),
        });

        const result = await repository.createSwap(TEST_OWNER_ID, createSwapInput as any);

        expect(result).toBeUndefined();
      });
    });

    describe('data handling', () => {
      it('should handle minimal swap data', async () => {
        const minimalSwap = {
          fromTokenAddress: '0xFrom',
          toTokenAddress: '0xTo',
        };

        mockSwap.create.mockResolvedValue({
          id: 'swap-uuid-12345',
          ...minimalSwap,
          fromAmount: null,
          toAmount: null,
          txHash: null,
          walletOwnerId: TEST_OWNER_ID,
          createdAt: new Date(),
        });

        await repository.createSwap(TEST_OWNER_ID, minimalSwap as any);

        expect(mockSwap.create).toHaveBeenCalled();
      });

      it('should handle swap data with extra fields', async () => {
        const swapWithExtras = {
          ...createSwapInput,
          someExtraField: 'ignored-value',
        };

        mockSwap.create.mockResolvedValue({
          id: 'swap-uuid-12345',
          ...createSwapInput,
          walletOwnerId: TEST_OWNER_ID,
          createdAt: new Date(),
        });

        await repository.createSwap(TEST_OWNER_ID, swapWithExtras as any);

        expect(mockSwap.create).toHaveBeenCalled();
      });
    });

    describe('different owner IDs', () => {
      it('should use provided owner ID for connection', async () => {
        const differentOwnerId = 'different-owner-uuid-67890';
        mockSwap.create.mockResolvedValue({
          id: 'swap-uuid-12345',
          ...createSwapInput,
          walletOwnerId: differentOwnerId,
          createdAt: new Date(),
        });

        await repository.createSwap(differentOwnerId, createSwapInput as any);

        expect(mockSwap.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            walletOwner: {
              connect: {
                id: differentOwnerId,
              },
            },
          }),
        });
      });
    });

    describe('error handling', () => {
      it('should propagate database errors', async () => {
        const dbError = new Error('Database connection failed');
        mockSwap.create.mockRejectedValue(dbError);

        await expect(
          repository.createSwap(TEST_OWNER_ID, createSwapInput as any)
        ).rejects.toThrow('Database connection failed');
      });

      it('should propagate foreign key constraint errors', async () => {
        const fkError = new Error('Foreign key constraint failed');
        mockSwap.create.mockRejectedValue(fkError);

        await expect(
          repository.createSwap('nonexistent-owner', createSwapInput as any)
        ).rejects.toThrow('Foreign key constraint failed');
      });

      it('should propagate validation errors', async () => {
        const validationError = new Error('Invalid data format');
        mockSwap.create.mockRejectedValue(validationError);

        await expect(
          repository.createSwap(TEST_OWNER_ID, {} as any)
        ).rejects.toThrow('Invalid data format');
      });
    });
  });
});
