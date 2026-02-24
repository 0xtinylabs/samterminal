import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { TokenGrpcService } from './token.service';

import config from '@/config';
import { SCANNER_TOKEN_SERVICE_NAME, SCANNER_TOKEN_PACKAGE_NAME } from '../../proto-generated/token/token';
import { TokenController } from './token.controller';

const host =
    config.profile.microservices.token.host + ':' + config.profile.microservices.token.port;

const PROTODIR = config.is_docker
    ? join(__dirname, '..', '..', 'proto')
    : join(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        '..',
        '..',
        'proto',
    );

const protos = [
    join(PROTODIR, 'token', 'token.proto'),
]

@Global()
@Module({
    providers: [TokenGrpcService],
    exports: [TokenGrpcService],
    controllers: [TokenController],
    imports: [
        ClientsModule.register([
            {
                transport: Transport.GRPC,
                name: SCANNER_TOKEN_SERVICE_NAME,
                options: {
                    package: SCANNER_TOKEN_PACKAGE_NAME,
                    protoPath: protos,
                    url: host,
                    loader: {
                        longs: Number,
                        enums: String,
                        includeDirs: [PROTODIR],
                    },
                },
            },
        ]),
    ],
})
export class TokenGrpcModule { }
