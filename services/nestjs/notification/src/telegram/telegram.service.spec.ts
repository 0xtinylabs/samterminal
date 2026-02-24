// Mock external dependencies before imports
jest.mock('node-telegram-bot-api', () => {
  return jest.fn().mockImplementation(() => ({
    getMe: jest.fn(),
    on: jest.fn(),
    sendMessage: jest.fn(),
  }));
});

jest.mock('@faker-js/faker', () => ({
  faker: {
    string: {
      alphanumeric: jest.fn().mockReturnValue('mockedcode'),
    },
  },
}));

jest.mock('@/config/config', () => ({
  configs: {
    botTokens: { main: 'mock-main-token', user: 'mock-user-token' },
    group_ids: { main: 'mock-group-id' },
  },
}));

jest.mock('@/generated/prisma/client', () => ({
  PrismaClient: jest.fn(),
  Prisma: {},
  PlatformName: { TELEGRAM: 'TELEGRAM' },
}));

jest.mock('@/database/database.service');
jest.mock('@/user-bot/user-bot.repository');
jest.mock('@/telegram/listener/listener.service');
jest.mock('@/telegram/message/message.service');

import { Test, TestingModule } from '@nestjs/testing';
import { TelegramService } from './telegram.service';
import { TelegramMessageService } from '@/telegram/message/message.service';
import { TelegramListenerService } from '@/telegram/listener/listener.service';
import { UserBotRepository } from '@/user-bot/user-bot.repository';

describe('TelegramService', () => {
  let service: TelegramService;

  const mockMessageService = {
    sendMessage: jest.fn(),
  };

  const mockListenerService = {
    addStartListener: jest.fn(),
    addMessageListener: jest.fn(),
  };

  const mockUserBotRepository = {
    getUserBotState: jest.fn(),
    getPlatformIdByConnectionKey: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        {
          provide: TelegramMessageService,
          useValue: mockMessageService,
        },
        {
          provide: TelegramListenerService,
          useValue: mockListenerService,
        },
        {
          provide: UserBotRepository,
          useValue: mockUserBotRepository,
        },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
