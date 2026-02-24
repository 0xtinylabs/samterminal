import { Injectable } from '@nestjs/common';
import { PlatformName } from '@/generated/prisma/enums';
import { UserBotRepository } from '@/user-bot/user-bot.repository';

@Injectable()
export class TelegramSyncService {
  constructor(private userBotRepository: UserBotRepository) {}

  public async getIsUserSynced(userId: string) {
    const isSynced = await this.userBotRepository.isBotSyncedToUser(
      userId,
      PlatformName.TELEGRAM,
    );
    return isSynced;
  }

  public async getIsUserVerifiedForRef(ref: string, telegramUserId: any) {
    if (!ref || !telegramUserId) {
      return false;
    }
    const isVerified = await this.userBotRepository.isBotVerifiedUserForRef(
      ref,
      telegramUserId,
      PlatformName.TELEGRAM,
    );
    return isVerified;
  }

  public async getCodeForUser(telegramUserId: any) {
    if (!telegramUserId) {
      return false;
    }
    const code = await this.userBotRepository.getCodeForUser(
      telegramUserId,
      PlatformName.TELEGRAM,
    );
    return code;
  }

  public async syncUserToPlatform(ref: string, platformId: any) {
    if (!ref) {
      return false;
    }
    const isSyncedToPlatform = await this.userBotRepository.syncUserToPlatform(
      ref,
      platformId,
      PlatformName.TELEGRAM,
    );
    return isSyncedToPlatform;
  }

  public async isUserVerifiedForPlatform(platformId: any) {
    if (!platformId) {
      return false;
    }
    const isPlatformVerifiedForUser =
      await this.userBotRepository.isUserVerifiedForPlatform(
        platformId,
        PlatformName.TELEGRAM,
      );
    return isPlatformVerifiedForUser;
  }

  public async verifyUser(platformId: any) {
    if (!platformId) {
      return false;
    }
    const isPlatformVerifiedForUser =
      await this.userBotRepository.verifyUserToPlatform(
        platformId,
        PlatformName.TELEGRAM,
      );
    return isPlatformVerifiedForUser;
  }
}
