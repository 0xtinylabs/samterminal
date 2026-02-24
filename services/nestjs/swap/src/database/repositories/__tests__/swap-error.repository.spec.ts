/**
 * SwapErrorRepository Unit Tests
 * Swap error record creation tests
 */

// Mock Prisma client before any imports
jest.mock('@/generated/prisma/client', () => ({
  PrismaClient: jest.fn(),
  Prisma: {},
}));

// Mock DatabaseService
jest.mock('@/database/database.service', () => {
  const mockSwapError = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  };

  return {
    DatabaseService: jest.fn().mockImplementation(() => ({
      swapError: mockSwapError,
    })),
    __mockSwapError: mockSwapError,
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { SwapErrorRepository } from '@/database/repositories/swap-error.repository';
import { DatabaseService } from '@/database/database.service';

describe('SwapErrorRepository', () => {
  let repository: SwapErrorRepository;
  let mockSwapError: any;

  const TEST_OWNER_ID = 'owner-uuid-12345';

  beforeEach(async () => {
    jest.clearAllMocks();

    const dbService = require('@/database/database.service');
    mockSwapError = dbService.__mockSwapError;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwapErrorRepository,
        {
          provide: DatabaseService,
          useFactory: () => ({
            swapError: mockSwapError,
          }),
        },
      ],
    }).compile();

    repository = module.get<SwapErrorRepository>(SwapErrorRepository);
  });

  describe('constructor', () => {
    it('should initialize model from database service', () => {
      expect(repository.model).toBeDefined();
      expect(repository.model).toBe(mockSwapError);
    });
  });

  describe('createSwapError', () => {
    const swapErrorData = {
      error: 'Insufficient balance',
      fromTokenAddress: '0xFromToken1234567890abcdef1234567890abcd',
      toTokenAddress: '0xToToken1234567890abcdef1234567890abcdef',
    };

    describe('successful creation', () => {
      it('should create swap error with owner connection', async () => {
        mockSwapError.create.mockResolvedValue({
          id: 'error-uuid-12345',
          ...swapErrorData,
          walletOwnerId: TEST_OWNER_ID,
          createdAt: new Date(),
        });

        await repository.createSwapError(TEST_OWNER_ID, swapErrorData as any);

        expect(mockSwapError.create).toHaveBeenCalledTimes(1);
      });

      it('should spread error data and connect wallet owner', async () => {
        mockSwapError.create.mockResolvedValue({
          id: 'error-uuid-12345',
          ...swapErrorData,
          walletOwnerId: TEST_OWNER_ID,
          createdAt: new Date(),
        });

        await repository.createSwapError(TEST_OWNER_ID, swapErrorData as any);

        expect(mockSwapError.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            error: swapErrorData.error,
            fromTokenAddress: swapErrorData.fromTokenAddress,
            toTokenAddress: swapErrorData.toTokenAddress,
            walletOwner: {
              connect: {
                id: TEST_OWNER_ID,
              },
            },
          }),
        });
      });

      it('should not return any value (void)', async () => {
        mockSwapError.create.mockResolvedValue({
          id: 'error-uuid-12345',
          ...swapErrorData,
          walletOwnerId: TEST_OWNER_ID,
          createdAt: new Date(),
        });

        const result = await repository.createSwapError(TEST_OWNER_ID, swapErrorData as any);

        expect(result).toBeUndefined();
      });
    });

    describe('error types', () => {
      it('should handle insufficient balance error', async () => {
        const insufficientError = {
          error: 'Insufficient balance for swap',
          fromTokenAddress: '0xToken',
          toTokenAddress: '0xOther',
        };

        mockSwapError.create.mockResolvedValue({
          id: 'error-uuid-12345',
          ...insufficientError,
          walletOwnerId: TEST_OWNER_ID,
          createdAt: new Date(),
        });

        await repository.createSwapError(TEST_OWNER_ID, insufficientError as any);

        expect(mockSwapError.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            error: 'Insufficient balance for swap',
          }),
        });
      });

      it('should handle slippage error', async () => {
        const slippageError = {
          error: 'Slippage too high',
          fromTokenAddress: '0xToken',
          toTokenAddress: '0xOther',
        };

        mockSwapError.create.mockResolvedValue({
          id: 'error-uuid-12345',
          ...slippageError,
          walletOwnerId: TEST_OWNER_ID,
          createdAt: new Date(),
        });

        await repository.createSwapError(TEST_OWNER_ID, slippageError as any);

        expect(mockSwapError.create).toHaveBeenCalled();
      });

      it('should handle transaction revert error', async () => {
        const revertError = {
          error: 'Transaction reverted: execution failed',
          fromTokenAddress: '0xToken',
          toTokenAddress: '0xOther',
        };

        mockSwapError.create.mockResolvedValue({
          id: 'error-uuid-12345',
          ...revertError,
          walletOwnerId: TEST_OWNER_ID,
          createdAt: new Date(),
        });

        await repository.createSwapError(TEST_OWNER_ID, revertError as any);

        expect(mockSwapError.create).toHaveBeenCalled();
      });

      it('should handle RPC error', async () => {
        const rpcError = {
          error: 'RPC provider unreachable',
          fromTokenAddress: '0xToken',
          toTokenAddress: '0xOther',
        };

        mockSwapError.create.mockResolvedValue({
          id: 'error-uuid-12345',
          ...rpcError,
          walletOwnerId: TEST_OWNER_ID,
          createdAt: new Date(),
        });

        await repository.createSwapError(TEST_OWNER_ID, rpcError as any);

        expect(mockSwapError.create).toHaveBeenCalled();
      });
    });

    describe('different owner IDs', () => {
      it('should use provided owner ID for connection', async () => {
        const differentOwnerId = 'different-owner-uuid-67890';
        mockSwapError.create.mockResolvedValue({
          id: 'error-uuid-12345',
          ...swapErrorData,
          walletOwnerId: differentOwnerId,
          createdAt: new Date(),
        });

        await repository.createSwapError(differentOwnerId, swapErrorData as any);

        expect(mockSwapError.create).toHaveBeenCalledWith({
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
        mockSwapError.create.mockRejectedValue(dbError);

        await expect(
          repository.createSwapError(TEST_OWNER_ID, swapErrorData as any)
        ).rejects.toThrow('Database connection failed');
      });

      it('should propagate foreign key constraint errors', async () => {
        const fkError = new Error('Foreign key constraint failed');
        mockSwapError.create.mockRejectedValue(fkError);

        await expect(
          repository.createSwapError('nonexistent-owner', swapErrorData as any)
        ).rejects.toThrow('Foreign key constraint failed');
      });

      it('should propagate validation errors', async () => {
        const validationError = new Error('Invalid data format');
        mockSwapError.create.mockRejectedValue(validationError);

        await expect(
          repository.createSwapError(TEST_OWNER_ID, {} as any)
        ).rejects.toThrow('Invalid data format');
      });
    });
  });
});
