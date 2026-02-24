import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { SCANNER_PACKAGE_NAME } from './proto-generated/index';
import config from './config';
import { Logger } from '@nestjs/common';
import { GlobalRpcExceptionFilter } from '@samterminal/shared-deps';

const PROTODIR = config.is_docker ? join(__dirname, "proto") : join(__dirname, "..", "..", "..", "..", "proto");

const protos = [
  join(PROTODIR, "index.proto"),
];

async function bootstrap() {
  const logger = new Logger('ScannerMicroservice');
  const PORT = process.env.MAIN_PORT ?? 50060;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        loader: {
          enums: String,
          includeDirs: [PROTODIR],
        },
        package: SCANNER_PACKAGE_NAME,
        keepalive: {
          keepaliveTimeMs: 10000,
          keepaliveTimeoutMs: 5000,
          http2MaxPingsWithoutData: 0,
        },
        protoPath: protos,
        url: (process.env.MAIN_HOSTNAME ?? 'localhost') + ':' + PORT,
      },
    },
  );

  app.useGlobalFilters(new GlobalRpcExceptionFilter());

  await app.listen();
  logger.log(`Scanner microservice listening at port: ${PORT}`);
}
bootstrap();
