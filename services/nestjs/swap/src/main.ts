import { config } from 'dotenv';
import { join } from 'path';
// Load root .env (single source of truth)
config({ path: join(__dirname, '..', '..', '..', '..', '.env') });
// Database: Uses USER_DATABASE_URL with 'swap' schema (configured in prisma/schema.prisma)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SWAP_PACKAGE_NAME } from './proto-generated/swap';
import { Logger } from '@nestjs/common';
import { GlobalRpcExceptionFilter } from '@samterminal/shared-deps';

const PROTODIR = process.env.DOCKER === 'true'
  ? join(__dirname, 'proto', 'swap.proto')
  : join(__dirname, '..', '..', '..', '..', 'proto', 'swap.proto');

async function bootstrapMicroservice() {
  const logger = new Logger('SwapMicroservice');
  const PORT = process.env.SWAP_PORT ?? 50059;
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        loader: {
          enums: String,
        },
        package: SWAP_PACKAGE_NAME,
        protoPath: PROTODIR,
        url: (process.env.SWAP_HOSTNAME ?? 'localhost') + ':' + PORT,
      },
    },
  );

  app.useGlobalFilters(new GlobalRpcExceptionFilter());

  await app.listen();

  logger.log(`Swap microservice listening at port: ${PORT}`);
}

bootstrapMicroservice();
