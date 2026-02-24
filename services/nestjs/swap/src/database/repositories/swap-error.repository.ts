import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { Prisma } from '@/generated/prisma/client';

@Injectable()
export class SwapErrorRepository {
  model: DatabaseService['swapError'];

  constructor(database: DatabaseService) {
    this.model = database.swapError;
  }

  async createSwapError(ownerID: string, swap: Prisma.SwapErrorCreateInput) {
    await this.model.create({
      data: {
        ...swap,
        walletOwner: {
          connect: {
            id: ownerID,
          },
        },
      },
    });
  }
}
