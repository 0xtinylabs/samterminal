import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  NOTIFICATION_PACKAGE_NAME,
  NOTIFICATION_SERVICE_NAME,
  type SendNotificationRequest,
  SendNotificationResponse,
} from '@/proto-generated/notification';
import { NotificationService } from '@/notification/notification.service';

@Controller(NOTIFICATION_PACKAGE_NAME)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @GrpcMethod(NOTIFICATION_SERVICE_NAME, 'send')
  async send(
    request: SendNotificationRequest,
  ): Promise<SendNotificationResponse> {
    const response = await this.notificationService.send(request);
    return response;
  }
}
