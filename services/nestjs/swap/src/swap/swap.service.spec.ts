// Mock Prisma and dependencies before imports
jest.mock('@/generated/prisma/client', () => ({
  PrismaClient: jest.fn(),
  Prisma: {},
}));

jest.mock('@/database/repositories/swap.repository', () => ({
  SwapRepository: jest.fn().mockImplementation(() => ({
    createSwap: jest.fn(),
  })),
}));

jest.mock('@/database/repositories/wallet-owner.repository', () => ({
  WalletOwnerRepository: jest.fn().mockImplementation(() => ({
    getWalletOwnerID: jest.fn(),
  })),
}));

jest.mock('@/database/repositories/swap-error.repository', () => ({
  SwapErrorRepository: jest.fn().mockImplementation(() => ({
    createSwapError: jest.fn(),
  })),
}));

jest.mock('@/swap/onchain/onchain.service', () => ({
  OnchainService: jest.fn().mockImplementation(() => ({
    swap: jest.fn(),
    getFee: jest.fn(),
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { SwapService } from '@/swap/swap.service';
import { SwapRepository } from '@/database/repositories/swap.repository';
import { WalletOwnerRepository } from '@/database/repositories/wallet-owner.repository';
import { SwapErrorRepository } from '@/database/repositories/swap-error.repository';
import { OnchainService } from '@/swap/onchain/onchain.service';

describe('SwapService', () => {
  let service: SwapService;

  beforeEach(async () => {
    const mockSwapRepository = {
      createSwap: jest.fn(),
    };
    const mockWalletOwnerRepository = {
      getWalletOwnerID: jest.fn(),
    };
    const mockSwapErrorRepository = {
      createSwapError: jest.fn(),
    };
    const mockOnchainService = {
      swap: jest.fn(),
      getFee: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwapService,
        { provide: SwapRepository, useValue: mockSwapRepository },
        { provide: WalletOwnerRepository, useValue: mockWalletOwnerRepository },
        { provide: SwapErrorRepository, useValue: mockSwapErrorRepository },
        { provide: OnchainService, useValue: mockOnchainService },
      ],
    }).compile();

    service = module.get<SwapService>(SwapService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
