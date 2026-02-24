import { Module, forwardRef } from '@nestjs/common';
import { UserBotService } from '@/user-bot/user-bot.service';
import { UserBotController } from '@/user-bot/user-bot.controller';
import { UserBotRepository } from '@/user-bot/user-bot.repository';
import { TelegramModule } from '@/telegram/telegram.module';

@Module({
  providers: [UserBotService, UserBotRepository],
  imports: [forwardRef(() => TelegramModule)],
  controllers: [UserBotController],
  exports: [UserBotService, UserBotRepository],
})
export class UserBotModule {}
