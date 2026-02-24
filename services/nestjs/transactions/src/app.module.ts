import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TransactionLogsModule } from './transaction-logs/transaction-logs.module';
import { ApiKeyGuard } from '@samterminal/shared-deps';

@Module({
  imports: [TransactionLogsModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
