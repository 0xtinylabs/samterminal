import { Injectable } from '@nestjs/common';
import {
  GetUserBotStatesRequest,
  GetUserBotStatesResponse,
  GetUserBotURLRequest,
  GetUserBotURLResponse,
  ToggleBotStateRequest,
  ToggleBotStateResponse,
} from '@/proto-generated/notification';
import { UserBotRepository } from '@/user-bot/user-bot.repository';

@Injectable()
export class UserBotService {
  constructor(private repository: UserBotRepository) {}

  async getUserBotURL(
    request: GetUserBotURLRequest,
  ): Promise<GetUserBotURLResponse> {
    const response = await this.repository.getUserBotURL(request);
    return response;
  }

  async getUserBotStates(
    request: GetUserBotStatesRequest,
  ): Promise<GetUserBotStatesResponse> {
    const botStates = await this.repository.getUserBotStates(request.userId);
    return {
      botStates: botStates,
      success: true,
    };
  }

  async toggleBotState(
    request: ToggleBotStateRequest,
  ): Promise<ToggleBotStateResponse> {
    const toggled = await this.repository.toggleBotstate(request);
    const botStates = await this.repository.getUserBotStates(request.userId);

    return {
      botStates: botStates,
      success: toggled,
    };
  }
}
