import { Module } from '@nestjs/common';
import { SwapRepository } from './swap.repository';
import { WalletOwnerRepository } from './wallet-owner.repository';
import { SwapErrorRepository } from './swap-error.repository';

@Module({
  providers: [SwapRepository, WalletOwnerRepository, SwapErrorRepository],
  exports: [SwapRepository, WalletOwnerRepository, SwapErrorRepository],
})
export class RepositoryModule {}
