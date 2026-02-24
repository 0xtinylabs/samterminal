import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { Platform, PlatformName } from '@/generated/prisma/client';
import {
  GetUserBotURLRequest,
  GetUserBotURLResponse,
  NotificationType,
  TelegramBotTypes,
  ToggleBotStateRequest,
  UserBotData,
} from '@/proto-generated/notification';
import { TelegramService } from '@/telegram/telegram.service';
import { codeUtil } from '@/utils/code';
import { linkUtil } from '@/utils/link';

@Injectable()
export class UserBotRepository {
  constructor(
    @Inject(forwardRef(() => TelegramService))
    private telegramService: TelegramService,
    private db: DatabaseService,
  ) {}

  async getUserBotURL(
    request: GetUserBotURLRequest,
  ): Promise<GetUserBotURLResponse> {
    const user = await this.createOrGetUser(request.userId);
    const botName = await this.telegramService.getBotName(
      TelegramBotTypes.USER,
    );
    const data: UserBotData[] = [];
    if (user && botName) {
      data.push({
        code: user?.verificationCode,
        url: linkUtil.getTelegramBotStartLink(botName, user.ref),
        type: NotificationType.TELEGRAM,
      });
    }
    return { urls: data };
  }

  async getUser(
    value: string,
    keyType: 'connectionKey' | 'ref' = 'connectionKey',
  ) {
    const user = await this.db.user.findMany({
      where: {
        [keyType]: value,
      },
      include: {
        platforms: true,
      },
    });
    return user?.[0];
  }

  async createUser(connectionKey: string) {
    const ref = codeUtil.generateCode(12);
    const code = codeUtil.generateCode(4);
    const user = await this.db.user.create({
      data: {
        connectionKey: connectionKey,
        ref: ref,
        verificationCode: code,
      },
    });
    return user;
  }

  async createOrGetUser(connectionKey: string) {
    const user = await this.getUser(connectionKey);
    if (user) {
      return user;
    } else {
      const user = await this.createUser(connectionKey);
      return user;
    }
  }

  public isUserConnectedPlatform(
    platforms: Platform[] = [],
    platformName: PlatformName,
  ) {
    return !!platforms.find((p) => p.platformName === platformName);
  }

  public isUserVerifiedForPlatformForRef(
    platforms: Platform[],
    platformName: PlatformName,
    platformId: any,
  ) {
    return !!platforms.find(
      (p) =>
        p.platformName === platformName &&
        p.isVerified === true &&
        p.platformId === String(platformId),
    );
  }

  public async isUserVerifiedForPlatform(
    platformId: any,
    platformName: PlatformName,
  ) {
    const platform = await this.db.platform.findMany({
      where: {
        platformName: platformName,
        platformId: String(platformId),
        isVerified: true,
      },
    });
    return platform.length > 0;
  }

  async isBotSyncedToUser(userId: string, platform: PlatformName) {
    const user = await this.getUser(userId);
    const isConnected = this.isUserConnectedPlatform(user?.platforms, platform);
    if (!user || !isConnected) {
      return false;
    } else {
      return true;
    }
  }

  async isBotVerifiedUserForRef(
    ref: string,
    telegramUserId: any,
    platform: PlatformName,
  ) {
    try {
      const user = await this.getUser(ref, 'ref');
      const isVerified = this.isUserVerifiedForPlatformForRef(
        user.platforms,
        platform,
        telegramUserId,
      );
      if (!isVerified) {
        return false;
      } else {
        return true;
      }
    } catch (_error) {
      return false;
    }
  }

  async isBotVerifiedUser(platformId: any, platform: PlatformName) {
    try {
      const isVerified = await this.isUserVerifiedForPlatform(
        platformId,
        platform,
      );
      if (!isVerified) {
        return false;
      } else {
        return true;
      }
    } catch (_error) {
      return false;
    }
  }

  async connectPlatformToUser(
    ref: string,
    platformId: any,
    platformName: PlatformName,
  ) {
    try {
      await this.db.platform.create({
        data: {
          platformId: String(platformId),
          platformName: platformName,
          User: {
            connect: {
              ref: ref,
            },
          },
        },
      });
    } catch (_error) {
      // Platform connection failed
    }
  }

  async getUserByPlatformId(platformId: any, platformName: PlatformName) {
    try {
      const users = await this.db.user.findMany({
        where: {
          platforms: {
            some: {
              platformId: String(platformId),
              platformName: platformName,
            },
          },
        },
      });
      return users?.[0];
    } catch (_error) {
      return undefined;
    }
  }

  async getPlatformByConnectionKey(
    connectionKey: string,
    platformName: PlatformName,
  ) {
    const user = await this.db.user.findUnique({
      where: {
        connectionKey: connectionKey,
      },
      select: {
        platforms: {
          where: {
            platformName: platformName,
          },
          select: {
            isActive: true,
            platformId: true,
            id: true,
          },
        },
      },
    });
    return user?.platforms?.[0];
  }

  async getPlatformByPlatformId(platformId: string) {
    const platform = await this.db.platform.findFirst({
      where: {
        platformId: platformId,
      },
    });
    return platform;
  }

  async getPlatformIdByConnectionKey(
    connectionKey: string,
    platformName: PlatformName,
  ) {
    try {
      const platform = await this.getPlatformByConnectionKey(
        connectionKey,
        platformName,
      );
      return platform?.platformId;
    } catch (_error) {
      return undefined;
    }
  }

  async getCodeForUser(platformId: any, platformName: PlatformName) {
    const user = await this.getUserByPlatformId(platformId, platformName);
    return user?.verificationCode;
  }

  async getUserBotStates(connectionKey: string) {
    try {
      const user = await this.getUser(connectionKey);
      const platforms = user.platforms.map((p) => ({
        type: p.platformName as NotificationType,
        isActive: p.isActive,
      }));
      return platforms;
    } catch (_error) {
      return [];
    }
  }

  async getUserBotState(platformId: string) {
    const platform = await this.getPlatformByPlatformId(platformId);
    return platform?.isActive;
  }

  async togglePlatformState(platformId: string, oldValue: boolean) {
    try {
      await this.db.platform.update({
        where: {
          id: platformId,
        },
        data: {
          isActive: !oldValue,
        },
      });
      return true;
    } catch (_error) {
      return false;
    }
  }

  async toggleBotstate(request: ToggleBotStateRequest) {
    try {
      const platform = await this.getPlatformByConnectionKey(
        request.userId,
        request.type,
      );

      if (!platform?.id) {
        return false;
      }

      return await this.togglePlatformState(platform?.id, platform?.isActive);
    } catch (_error) {
      return false;
    }
  }

  async syncUserToPlatform(
    ref: string,
    platformId: any,
    platformName: PlatformName,
  ) {
    try {
      await this.connectPlatformToUser(ref, platformId, platformName);
      return true;
    } catch (_error) {
      return false;
    }
  }

  async verifyUserToPlatform(platformId: any, platformName: PlatformName) {
    try {
      await this.db.platform.updateMany({
        where: {
          platformId: String(platformId),
          platformName: platformName,
        },
        data: { isVerified: true, isActive: true },
      });
      return true;
    } catch (_error) {
      return false;
    }
  }
}
