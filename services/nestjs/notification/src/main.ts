import { config } from 'dotenv';
import { join } from 'path';
// Load root .env (single source of truth)
config({ path: join(__dirname, '..', '..', '..', '..', '.env') });
// Database: Uses USER_DATABASE_URL with 'notification' schema (configured in prisma/schema.prisma)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NOTIFICATION_PACKAGE_NAME } from './proto-generated/notification';
import { Logger } from '@nestjs/common';
import { GlobalRpcExceptionFilter } from '@samterminal/shared-deps';

const PROTODIR = process.env.DOCKER === 'true'
  ? join(__dirname, 'proto', 'notification.proto')
  : join(__dirname, '..', '..', '..', '..', 'proto', 'notification.proto');

async function bootstrapMicroservice() {
  const logger = new Logger('NotificationMicroservice');
  const PORT = process.env.NOTIFICATION_PORT ?? 50056;
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        loader: {
          enums: String,
        },
        package: NOTIFICATION_PACKAGE_NAME,
        protoPath: PROTODIR,
        url: (process.env.NOTIFICATION_HOSTNAME ?? 'localhost') + ':' + PORT,
      },
    },
  );

  app.useGlobalFilters(new GlobalRpcExceptionFilter());

  await app.listen();

  logger.log(`Notification microservice listening at port: ${PORT}`);
}

bootstrapMicroservice();
