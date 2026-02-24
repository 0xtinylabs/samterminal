// Mock Prisma and dependencies before any imports
jest.mock('@/generated/prisma/client', () => ({
  PrismaClient: jest.fn(),
  Prisma: {},
}));

jest.mock('@/telegram/telegram.service', () => ({
  TelegramService: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { TelegramService } from '@/telegram/telegram.service';

describe('NotificationService', () => {
  let service: NotificationService;

  const mockTelegramService = {
    sendMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: TelegramService,
          useValue: mockTelegramService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
