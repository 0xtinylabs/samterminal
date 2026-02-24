import { Global, Module, forwardRef } from '@nestjs/common';
import { TelegramService } from '@/telegram/telegram.service';
import { TelegramMessageService } from '@/telegram/message/message.service';
import { TelegramSyncService } from '@/telegram/sync/sync.service';
import { TelegramListenerService } from '@/telegram/listener/listener.service';
import { UserBotModule } from '@/user-bot/user-bot.module';

@Global()
@Module({
  imports: [forwardRef(() => UserBotModule)],
  providers: [
    TelegramService,
    TelegramMessageService,
    TelegramListenerService,
    TelegramSyncService,
  ],
  exports: [
    TelegramService,
    TelegramMessageService,
    TelegramListenerService,
    TelegramSyncService,
  ],
})
export class TelegramModule {}
