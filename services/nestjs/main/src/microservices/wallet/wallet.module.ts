import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { WalletGrpcService } from './wallet.service';

import config from '@/config';
import { SCANNER_WALLET_SERVICE_NAME, SCANNER_WALLET_PACKAGE_NAME } from '../../proto-generated/wallet/wallet';
import { WalletController } from './wallet.controller';

const host =
    config.profile.microservices.wallet.host + ':' + config.profile.microservices.wallet.port;

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
    join(PROTODIR, 'wallet', 'wallet.proto'),
]

@Global()
@Module({
    providers: [WalletGrpcService],
    exports: [WalletGrpcService],
    controllers: [],
    imports: [
        ClientsModule.register([
            {
                transport: Transport.GRPC,
                name: SCANNER_WALLET_SERVICE_NAME,
                options: {
                    package: SCANNER_WALLET_PACKAGE_NAME,
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
export class WalletGrpcModule { }
