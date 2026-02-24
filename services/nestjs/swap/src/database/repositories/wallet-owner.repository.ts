import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

@Injectable()
export class WalletOwnerRepository {
  model: DatabaseService['walletOwner'];

  constructor(database: DatabaseService) {
    this.model = database.walletOwner;
  }

  async getWalletOwnerID(wallet_address: string) {
    const walletAddress = wallet_address.toLowerCase();
    const walletOwner = await this.model.upsert({
      create: {
        walletAddress: walletAddress,
      },
      where: {
        walletAddress: walletAddress,
      },
      update: {},
    });
    return walletOwner.id;
  }
}
