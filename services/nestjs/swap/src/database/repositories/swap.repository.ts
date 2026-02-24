import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { Prisma } from '@/generated/prisma/client';

@Injectable()
export class SwapRepository {
  model: DatabaseService['swap'];

  constructor(database: DatabaseService) {
    this.model = database.swap;
  }

  async createSwap(ownerID: string, swap: Prisma.SwapCreateInput) {
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
