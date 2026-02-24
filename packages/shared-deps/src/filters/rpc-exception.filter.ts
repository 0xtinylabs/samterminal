import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

@Catch()
export class GlobalRpcExceptionFilter extends BaseRpcExceptionFilter {
  private readonly logger = new Logger('RpcExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): Observable<never> {
    const isProduction = process.env.NODE_ENV === 'production';
    const error = exception instanceof Error ? exception : new Error(String(exception));

    this.logger.error(`RPC Error: ${error.message}`, error.stack);

    const message = isProduction ? error.message : `${error.message}\n${error.stack}`;
    return throwError(() => ({ message, code: 13 }));
  }
}
