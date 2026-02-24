import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  type GetUserBotStatesRequest,
  type GetUserBotURLRequest,
  type ToggleBotStateRequest,
  GetUserBotStatesResponse,
  GetUserBotURLResponse,
  NOTIFICATION_PACKAGE_NAME,
  NOTIFICATION_SERVICE_NAME,
  ToggleBotStateResponse,
} from '@/proto-generated/notification';
import { UserBotService } from '@/user-bot/user-bot.service';

@Controller(NOTIFICATION_PACKAGE_NAME)
export class UserBotController {
  constructor(private userService: UserBotService) {}

  @GrpcMethod(NOTIFICATION_SERVICE_NAME, 'getUserBotURL')
  async getUserBotURL(
    request: GetUserBotURLRequest,
  ): Promise<GetUserBotURLResponse> {
    const response = await this.userService.getUserBotURL(request);
    return response;
  }

  @GrpcMethod(NOTIFICATION_SERVICE_NAME, 'getUserBotStates')
  async getUserBotStates(
    request: GetUserBotStatesRequest,
  ): Promise<GetUserBotStatesResponse> {
    const response = await this.userService.getUserBotStates(request);
    return response;
  }

  @GrpcMethod(NOTIFICATION_SERVICE_NAME, 'toggleBotState')
  async toggleBotState(
    request: ToggleBotStateRequest,
  ): Promise<ToggleBotStateResponse> {
    const response = await this.userService.toggleBotState(request);
    return response;
  }
}
