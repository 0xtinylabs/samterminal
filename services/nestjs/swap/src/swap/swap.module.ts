import { Module } from '@nestjs/common';
import { SwapController } from './swap.controller';
import { SwapService } from './swap.service';
import { OnchainModule } from './onchain/onchain.module';

@Module({
  controllers: [SwapController],
  providers: [SwapService],
  exports: [SwapService],
  imports: [OnchainModule],
})
export class SwapModule {}
