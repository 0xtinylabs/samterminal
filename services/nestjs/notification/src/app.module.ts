import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { NotificationService } from './notification/notification.service';
import { NotificationController } from './notification/notification.controller';
import { DatabaseModule } from './database/database.module';
import { UserBotModule } from './user-bot/user-bot.module';
import { TelegramModule } from './telegram/telegram.module';
import { ApiKeyGuard } from '@samterminal/shared-deps';

@Module({
  imports: [DatabaseModule, UserBotModule, TelegramModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
