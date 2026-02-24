import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';
import { RpcArgumentsHost } from '@nestjs/common/interfaces';

export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const args: RpcArgumentsHost = context.switchToRpc();
    const metadata = args.getContext() as Metadata;
    const apiKey = metadata.get('apiKey')?.[0];
    const expectedKey = process.env.API_KEY;
    if (!expectedKey) return false;
    return expectedKey === apiKey;
  }
}
