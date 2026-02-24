import { Test, TestingModule } from '@nestjs/testing';
import { TransactionLogsService } from './transaction-logs.service';
import { TransactionLogRepository } from './transaction-logs-repository';

describe('TransactionLogsService', () => {
  let service: TransactionLogsService;

  const mockTransactionLogRepository = {
    logTransaction: jest.fn(),
    updateLoggedTransactionStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionLogsService,
        {
          provide: TransactionLogRepository,
          useValue: mockTransactionLogRepository,
        },
      ],
    }).compile();

    service = module.get<TransactionLogsService>(TransactionLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
