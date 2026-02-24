import { Module } from '@nestjs/common';
import { OnchainService } from './onchain.service';
import { ApiService } from './api/api.service';

@Module({
  providers: [OnchainService, ApiService],
  exports: [OnchainService, ApiService],
})
export class OnchainModule {}
