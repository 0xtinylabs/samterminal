import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  type LogTransactionRequest,
  type UpdateLoggedTransactionStatusRequest,
  TRANSACTION_SERVICE_NAME,
  TRANSACTIONS_PACKAGE_NAME,
} from '@/proto-generated/transactions';
import { TransactionLogsService } from '@/transaction-logs/transaction-logs.service';

@Controller(TRANSACTIONS_PACKAGE_NAME)
export class TransactionLogsController {
  constructor(public transactionLogsService: TransactionLogsService) {}

  @GrpcMethod(TRANSACTION_SERVICE_NAME, 'logTransaction')
  async logTransaction(request: LogTransactionRequest) {
    const res = await this.transactionLogsService.logTransaction(request);
    return res;
  }

  @GrpcMethod(TRANSACTION_SERVICE_NAME, 'updateLoggedTransactionStatus')
  async updateLoggedTransactionStatus(request: UpdateLoggedTransactionStatusRequest) {
    const res =
      await this.transactionLogsService.updateLoggedTransactionStatus(request);
    return res;
  }
}
