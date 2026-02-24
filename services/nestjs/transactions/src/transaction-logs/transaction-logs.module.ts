import { Module } from '@nestjs/common';
import { TransactionLogsController } from '@/transaction-logs/transaction-logs.controller';
import { TransactionLogsService } from '@/transaction-logs/transaction-logs.service';
import { TransactionLogRepository } from '@/transaction-logs/transaction-logs-repository';
import { DatabaseService } from '@/database/database.service';

@Module({
  controllers: [TransactionLogsController],
  providers: [
    TransactionLogsService,
    DatabaseService,
    TransactionLogRepository,
  ],
})
export class TransactionLogsModule {}
