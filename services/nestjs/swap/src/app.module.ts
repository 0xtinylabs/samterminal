import { Module } from '@nestjs/common';
import { SwapModule } from './swap/swap.module';
import { DatabaseModule } from './database/database.module';
import { OnchainModule } from './swap/onchain/onchain.module';

@Module({
  imports: [SwapModule, DatabaseModule, OnchainModule],
})
export class AppModule {}
