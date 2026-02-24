import { CanActivate, ExecutionContext } from '@nestjs/common';
import { CONFIG } from '@/config/config';
import { Metadata } from '@grpc/grpc-js';
import { RpcArgumentsHost } from '@nestjs/common/interfaces';

export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const args: RpcArgumentsHost = context.switchToRpc();

    const metadata = args.getContext() as Metadata;

    const apiKey = metadata.get('apiKey')?.[0];

    if (CONFIG.server.key === apiKey) {
      return true;
    } else {
      return false;
    }
  }
}
