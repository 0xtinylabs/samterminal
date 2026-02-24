import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@/generated/prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to Database');
    } catch (error) {
      this.logger.error('Failed to connect to Database', error instanceof Error ? error.message : error);
      await this.$disconnect();
      throw error;
    }
  }
}
