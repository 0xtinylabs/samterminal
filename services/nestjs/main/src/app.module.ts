import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScannerModule } from './scanner/scanner.module';
import { ApiKeyGuard } from '@samterminal/shared-deps';

@Module({
  imports: [ScannerModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
