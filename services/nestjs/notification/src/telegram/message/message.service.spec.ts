import { Test, TestingModule } from '@nestjs/testing';
import { TelegramMessageService } from './message.service';

describe('TelegramMessageService', () => {
  let service: TelegramMessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TelegramMessageService],
    }).compile();

    service = module.get<TelegramMessageService>(TelegramMessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
