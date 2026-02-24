import { Test, TestingModule } from '@nestjs/testing';
import { TransactionLogsController } from './transaction-logs.controller';
import { TransactionLogsService } from './transaction-logs.service';

describe('TransactionLogsController', () => {
  let controller: TransactionLogsController;

  const mockTransactionLogsService = {
    logTransaction: jest.fn(),
    updateLoggedTransactionStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionLogsController],
      providers: [
        {
          provide: TransactionLogsService,
          useValue: mockTransactionLogsService,
        },
      ],
    }).compile();

    controller = module.get<TransactionLogsController>(
      TransactionLogsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
