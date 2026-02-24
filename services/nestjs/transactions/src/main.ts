import { config } from 'dotenv';
import { join } from 'path';
// Load root .env (single source of truth)
config({ path: join(__dirname, '..', '..', '..', '..', '.env') });
// Database: Uses USER_DATABASE_URL with 'transactions' schema (configured in prisma/schema.prisma)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { GlobalRpcExceptionFilter } from '@samterminal/shared-deps';

const PROTODIR = process.env.DOCKER === 'true'
  ? join(__dirname, 'proto', 'transactions.proto')
  : join(__dirname, '..', '..', '..', '..', 'proto', 'transactions.proto');

async function bootstrap() {
  const logger = new Logger('TransactionsMicroservice');
  const PORT = process.env.TRANSACTIONS_PORT ?? 50054;
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        loader: {
          enums: String,
        },
        package: 'transactions',
        protoPath: PROTODIR,
        url: (process.env.TRANSACTIONS_HOSTNAME ?? 'localhost') + ':' + PORT,
      },
    },
  );
  app.useGlobalFilters(new GlobalRpcExceptionFilter());

  await app.listen();
  logger.log(`Transaction microservice listening at port: ${PORT}`);
}
bootstrap();
