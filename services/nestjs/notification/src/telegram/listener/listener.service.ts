import TelegramBot from 'node-telegram-bot-api';
import { TelegramSyncService } from '@/telegram/sync/sync.service';
import { TelegramMessageService } from '@/telegram/message/message.service';
import { Injectable } from '@nestjs/common';
import * as messages from '@/telegram/message/messages.json';

@Injectable()
export class TelegramListenerService {
  constructor(
    private syncService: TelegramSyncService,
    private messageService: TelegramMessageService,
  ) {}

  private isGroup(params: TelegramBot.Message) {
    return params.chat.type === 'group' || params.chat.type === 'supergroup';
  }

  private getTelegramUserId(params: TelegramBot.Message) {
    return params.from?.id ? String(params.from.id) : null;
  }

  addStartListener(bot: TelegramBot) {
    bot.onText(/\/start\s?(.*)/, async (params, texts) => {
      const isGroup = this.isGroup(params);
      if (isGroup || !texts) {
        return false;
      }
      const ref = texts?.[1];
      const user_id = this.getTelegramUserId(params);
      if (!user_id) {
        return false;
      }
      const isVerified = await this.syncService.getIsUserVerifiedForRef(
        ref,
        user_id,
      );
      if (isVerified) {
        await this.messageService.sendMessage({
          bot: bot,
          message: messages.user_talking,
          to: String(user_id),
        });
      } else {
        const isSynced = await this.syncService.syncUserToPlatform(
          ref,
          user_id,
        );
        if (isSynced) {
          await this.messageService.sendMessage({
            bot: bot,
            message: messages.enter_code,
            to: String(user_id),
          });
        }
      }
    });
  }

  addMessageListener(bot: TelegramBot) {
    bot.on('message', async (params) => {
      if (params.text?.startsWith('/start')) {
        return;
      }
      /**
       * Guard for group message
       */
      const isGroup = this.isGroup(params);
      if (isGroup) {
        return;
      }
      /**
       * Guard for user
       */
      const user = this.getTelegramUserId(params);
      if (!user) {
        return;
      }

      const code = await this.syncService.getCodeForUser(user);
      const text = params.text;
      const isVerified = await this.syncService.isUserVerifiedForPlatform(user);
      if (
        code &&
        text?.trim().toLocaleUpperCase() === code.toLocaleUpperCase() &&
        !isVerified
      ) {
        await this.syncService.verifyUser(user);
        await this.messageService.sendMessage({
          bot,
          message: messages.code_correct,
          to: user,
        });
        await this.messageService.sendMessage({
          bot,
          message: messages.activated,
          to: user,
        });
      }
      if (
        code &&
        text?.trim().toLocaleUpperCase() !== code.toLocaleUpperCase() &&
        !isVerified
      ) {
        await this.messageService.sendMessage({
          bot,
          message: messages.code_incorrect,
          to: user,
        });
      }
      if (isVerified) {
        await this.messageService.sendMessage({
          bot,
          message: messages.user_talking,
          to: user,
        });
      }
    });
  }
}
