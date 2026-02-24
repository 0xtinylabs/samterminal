import TelegramBot from 'node-telegram-bot-api';
import { configs } from '@/config/config';
import {
  SendNotificationRequest,
  SendNotificationResponse,
  TelegramBotTypes,
} from '@/proto-generated/notification';
import { TelegramMessageService } from '@/telegram/message/message.service';
import { TelegramListenerService } from '@/telegram/listener/listener.service';
import { Injectable, Logger } from '@nestjs/common';
import { UserBotRepository } from '@/user-bot/user-bot.repository';
import { PlatformName } from '@/generated/prisma/enums';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private BOT_TOKENS: Record<TelegramBotTypes, string> = {
    MAIN: configs.botTokens.main,
    USER: configs.botTokens.user,
  };

  private Bots: Record<TelegramBotTypes, TelegramBot | null> = {
    MAIN: null,
    USER: null,
  };

  constructor(
    private messageService: TelegramMessageService,
    private listenerService: TelegramListenerService,
    private userBotRepository: UserBotRepository,
  ) {
    this.createBots();
    this.listenBots();
  }

  private getCorrectBot(type: TelegramBotTypes) {
    const bot = this.Bots[type];
    return bot;
  }

  public async getBotName(type: TelegramBotTypes) {
    const bot = this.getCorrectBot(type);
    const me = await bot?.getMe();
    return me?.username;
  }

  public async sendMessage(
    request: SendNotificationRequest,
  ): Promise<SendNotificationResponse> {
    const bot = this.getCorrectBot(request.botName);
    if (!bot) {
      return { success: false };
    }
    const to = await this.getChatId(request);
    if (request.botName !== TelegramBotTypes.MAIN && !request.bypass) {
      const isBotActive = await this.userBotRepository.getUserBotState(to);
      if (!isBotActive) {
        return { success: false };
      }
    }
    const response = await this.messageService.sendMessage({
      bot: bot,
      extras: request.extras,
      message: request.message,
      to: to,
    });
    return response;
  }

  private async getChatId(request: SendNotificationRequest) {
    if (request.botName === TelegramBotTypes.MAIN) {
      return configs.group_ids.main;
    }
    if (request.botName === TelegramBotTypes.USER) {
      const userTelegramID =
        await this.userBotRepository.getPlatformIdByConnectionKey(
          request.to,
          PlatformName.TELEGRAM,
        );
      if (userTelegramID) {
        return userTelegramID;
      }
    }
    return '';
  }

  private createBots() {
    (Object.keys(TelegramBotTypes) as TelegramBotTypes[]).map((type) => {
      const bot_token = this.BOT_TOKENS[type];
      if (bot_token) {
        try {
          this.Bots[type] = new TelegramBot(bot_token, { polling: true });
          this.logger.log(`Bot created: ${type}`);
        } catch (error) {
          this.logger.error(`Failed to create bot ${type}: ${error instanceof Error ? error.message : error}`);
        }
      }
    });
  }

  private listenBots() {
    (Object.keys(TelegramBotTypes) as TelegramBotTypes[]).map((type) => {
      const bot = this.getCorrectBot(type);
      if (!bot) {
        return;
      }
      this.listenerService.addStartListener(bot);
      this.listenerService.addMessageListener(bot);
    });
  }
}
