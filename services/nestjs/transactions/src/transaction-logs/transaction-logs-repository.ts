import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import {
  LogTransactionRequest,
  LogTransactionResponse,
  UpdateLoggedTransactionStatusRequest,
  UpdateLoggedTransactionStatusResponse,
} from '@/proto-generated/transactions';

@Injectable()
export class TransactionLogRepository {
  constructor(public databaseService: DatabaseService) {}

  public async logTransaction(
    request: LogTransactionRequest,
  ): Promise<LogTransactionResponse> {
    try {
      await this.databaseService.transactionLog.create({
        data: request,
      });
      return { saved: true };
    } catch (_error) {
      return { saved: false };
    }
  }

  public async updateLoggedTransactionStatus(
    request: UpdateLoggedTransactionStatusRequest,
  ): Promise<UpdateLoggedTransactionStatusResponse> {
    try {
      await this.databaseService.transactionLog.update({
        data: request,
        where: { txHash: request.txHash },
      });
      return { saved: true };
    } catch (_error) {
      return { saved: false };
    }
  }
}
