import * as dotenv from 'dotenv';
import * as path from 'path';

// Load root .env (single source of truth)
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

export const is_production = process.env.PROFILE_ENV === 'production';

export const config = {
  is_docker: process.env.DOCKER === 'true',
  profile: {
    microservices: {
      token: {
        host: process.env.MAIN_TOKEN_SERVICE_HOST ?? 'localhost',
        port: process.env.MAIN_TOKEN_SERVICE_PORT ?? '50061',
      },
      wallet: {
        host: process.env.MAIN_WALLET_SERVICE_HOST ?? 'localhost',
        port: process.env.MAIN_WALLET_SERVICE_PORT ?? '50062',
      },
    },
    web3: {
      provider: {
        base: process.env.RPC_URL_BASE ?? '',
      },
    },
  },
};

export default config;

// Validate required environment variables (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  const requiredEnvVars = ['API_KEY'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}
