import { Injectable } from '@nestjs/common';
import TelegramBot, {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
} from 'node-telegram-bot-api';
import {
  NotificationButton,
  NotificationButtonType,
  NotificationExtrasType,
  SendNotificationResponse,
} from '@/proto-generated/notification';

@Injectable()
export class TelegramMessageService {
  async sendMessage(params: {
    message: string;
    extras?: NotificationExtrasType;
    to: string;
    bot: TelegramBot;
  }): Promise<SendNotificationResponse> {
    try {
      const { bot, message, to } = params;
      const options = this.handleExtras(params.extras);
      await bot.sendMessage(Number(to), message, options);
      return { success: true };
    } catch (_error) {
      return { success: false };
    }
  }

  handleExtras(
    extras: NotificationExtrasType | undefined,
  ): TelegramBot.SendMessageOptions {
    const options: TelegramBot.SendMessageOptions = {};

    if (!extras) {
      return options;
    }
    if (extras.buttons) {
      options.reply_markup = this.handleButtons(extras.buttons);
    }

    return options;
  }

  handleButtons(buttons: NotificationButton[]): InlineKeyboardMarkup {
    const result: InlineKeyboardMarkup = { inline_keyboard: [] };
    for (const button of buttons) {
      const res = this.handleButton(button);
      if (res) {
        result.inline_keyboard.push([res]);
      }
    }
    return result;
  }

  handleButton(button: NotificationButton): InlineKeyboardButton | null {
    if (button.type === NotificationButtonType.LINK) {
      return { text: button.label, url: button.data };
    }
    if (button.type === NotificationButtonType.FUNCTION) {
      return { text: button.label, callback_data: button.data };
    }
    return null;
  }
}
