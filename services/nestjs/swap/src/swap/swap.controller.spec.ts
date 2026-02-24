// Mock Prisma and dependencies before imports
jest.mock('@/generated/prisma/client', () => ({
  PrismaClient: jest.fn(),
  Prisma: {},
}));

jest.mock('./swap.service', () => ({
  SwapService: jest.fn().mockImplementation(() => ({
    swap: jest.fn(),
    swapError: jest.fn(),
    fee: jest.fn(),
  })),
}));

jest.mock('../database/repositories/swap.repository', () => ({
  SwapRepository: jest.fn().mockImplementation(() => ({
    createSwap: jest.fn(),
  })),
}));

jest.mock('../database/repositories/wallet-owner.repository', () => ({
  WalletOwnerRepository: jest.fn().mockImplementation(() => ({
    getWalletOwnerID: jest.fn(),
  })),
}));

jest.mock('../database/repositories/swap-error.repository', () => ({
  SwapErrorRepository: jest.fn().mockImplementation(() => ({
    createSwapError: jest.fn(),
  })),
}));

jest.mock('./onchain/onchain.service', () => ({
  OnchainService: jest.fn().mockImplementation(() => ({
    swap: jest.fn(),
    getFee: jest.fn(),
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { SwapController } from './swap.controller';
import { SwapService } from './swap.service';

describe('SwapController', () => {
  let controller: SwapController;

  beforeEach(async () => {
    const mockSwapService = {
      swap: jest.fn(),
      swapError: jest.fn(),
      fee: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SwapController],
      providers: [
        {
          provide: SwapService,
          useValue: mockSwapService,
        },
      ],
    }).compile();

    controller = module.get<SwapController>(SwapController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
