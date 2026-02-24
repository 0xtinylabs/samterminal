import { Injectable } from '@nestjs/common';
import {
  NotificationType,
  SendNotificationRequest,
  SendNotificationResponse,
} from '@/proto-generated/notification';
import { TelegramService } from '@/telegram/telegram.service';

@Injectable()
export class NotificationService {
  constructor(public telegramService: TelegramService) {}
  public async send(
    request: SendNotificationRequest,
  ): Promise<SendNotificationResponse> {
    const service = this.handleRequestType(request.type);
    const response = await service?.sendMessage(request);
    return response ?? { success: false };
  }

  public handleRequestType(type: NotificationType) {
    if (type === NotificationType.TELEGRAM) {
      return this.telegramService;
    }
    return null;
  }
}
