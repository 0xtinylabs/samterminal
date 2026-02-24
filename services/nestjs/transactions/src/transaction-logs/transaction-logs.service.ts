import { Injectable } from '@nestjs/common';
import {
  LogTransactionRequest,
  LogTransactionResponse,
  UpdateLoggedTransactionStatusRequest,
  UpdateLoggedTransactionStatusResponse,
} from '@/proto-generated/transactions';
import { TransactionLogRepository } from '@/transaction-logs/transaction-logs-repository';

@Injectable()
export class TransactionLogsService {
  constructor(public transactionLogsRepository: TransactionLogRepository) {}

  public async logTransaction(
    request: LogTransactionRequest,
  ): Promise<LogTransactionResponse> {
    const response =
      await this.transactionLogsRepository.logTransaction(request);
    return response;
  }

  public async updateLoggedTransactionStatus(
    request: UpdateLoggedTransactionStatusRequest,
  ): Promise<UpdateLoggedTransactionStatusResponse> {
    const response =
      await this.transactionLogsRepository.updateLoggedTransactionStatus(
        request,
      );
    return response;
  }
}
