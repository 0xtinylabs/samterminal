import { Module } from '@nestjs/common';
import { TokenGrpcModule } from '@/microservices/token/token.module';
import { WalletGrpcModule } from '@/microservices/wallet/wallet.module';
import { ScannerController } from './scanner.controller';
import { ScannerService } from './scanner.service';

@Module({
  imports: [TokenGrpcModule, WalletGrpcModule],
  providers: [ScannerService],
  controllers: [ScannerController],
})
export class ScannerModule { }
