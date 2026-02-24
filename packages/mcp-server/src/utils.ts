import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { fileURLToPath } from 'url';
import path from 'path';
import { createCore, type SamTerminalCore } from '@samterminal/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROTO_DIR = path.resolve(__dirname, '../../../proto');

const GRPC_HOST = process.env.SAM_GRPC_HOST ?? 'localhost';

const SERVICE_PORTS: Record<string, string> = {
  token: process.env.SAM_TOKEN_PORT ?? '50061',
  wallet: process.env.SAM_WALLET_PORT ?? '50062',
  swap: process.env.SAM_SWAP_PORT ?? '50059',
  main: process.env.SAM_MAIN_PORT ?? '50060',
  notification: process.env.SAM_NOTIFICATION_PORT ?? '50056',
  ai: process.env.SAM_AI_PORT ?? '50057',
};

const LOADER_OPTIONS: protoLoader.Options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [PROTO_DIR],
};

const grpcClients = new Map<string, grpc.Client>();

export function loadProto(protoFile: string): grpc.GrpcObject {
  const protoPath = path.join(PROTO_DIR, protoFile);
  const packageDefinition = protoLoader.loadSync(protoPath, LOADER_OPTIONS);
  return grpc.loadPackageDefinition(packageDefinition);
}

export function getGrpcClient<T extends grpc.Client>(
  serviceName: string,
  protoFile: string,
  packagePath: string,
  serviceClass: string,
): T {
  const cacheKey = `${serviceName}:${serviceClass}`;

  if (grpcClients.has(cacheKey)) {
    return grpcClients.get(cacheKey) as T;
  }

  const proto = loadProto(protoFile);

  const parts = packagePath.split('.');
  let servicePackage: Record<string, unknown> = proto as Record<string, unknown>;
  for (const part of parts) {
    servicePackage = servicePackage[part] as Record<string, unknown>;
  }

  const ServiceConstructor = servicePackage[serviceClass] as new (
    address: string,
    credentials: grpc.ChannelCredentials,
  ) => T;

  const address = `${GRPC_HOST}:${SERVICE_PORTS[serviceName]}`;
  const client = new ServiceConstructor(address, grpc.credentials.createInsecure());

  grpcClients.set(cacheKey, client);
  return client;
}

export function callGrpc<TReq, TRes>(
  client: grpc.Client,
  method: string,
  request: TReq,
): Promise<TRes> {
  return new Promise((resolve, reject) => {
    const fn = (client as Record<string, Function>)[method];
    if (!fn) {
      reject(new Error(`Method ${method} not found on gRPC client`));
      return;
    }
    fn.call(client, request, (error: grpc.ServiceError | null, response: TRes) => {
      if (error) {
        reject(new Error(`gRPC error [${method}]: ${error.message}`));
      } else {
        resolve(response);
      }
    });
  });
}

let coreInstance: SamTerminalCore | undefined;

export async function getCore(): Promise<SamTerminalCore> {
  if (coreInstance) return coreInstance;

  const instance = createCore();
  try {
    await instance.initialize();
    await instance.start();
    coreInstance = instance;
    return coreInstance;
  } catch (error) {
    // coreInstance remains undefined so next call retries
    throw error;
  }
}

export async function shutdownCore(): Promise<void> {
  if (coreInstance) {
    await coreInstance.stop();
    coreInstance = undefined;
  }
}

export function closeAllGrpcClients(): void {
  for (const client of grpcClients.values()) {
    client.close();
  }
  grpcClients.clear();
}

export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
};
