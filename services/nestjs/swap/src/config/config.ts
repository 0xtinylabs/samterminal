import { ENV } from './types/config';

const env: ENV = process.env as ENV;

export const CONFIG = {
  rpc_url: env.RPC_URL,
  swap: {
    contract: env.SWAP_CONTRACT,
    swapper: env.SWAPPER_ADDRESS,
    permit2: env.PERMIT_2,
    permitSwap: env.PERMIT_SWAP,
  },
  apis: {
    matcha: env.MATCHA_API_KEY,
  },
  fee: {
    bps: env.FEE_BPS,
    bps_referred: env.FEE_BPS_REFERRED,
    receive_token: env.FEE_RECEIVE_TOKEN,
    receiver_wallet: env.FEE_RECEIVER_WALLET,
  },
  wallet: {
    privateKey: env.WALLET_PRIVATE_KEY,
  },
  server: {
    key: env.API_KEY,
  },
};

// Validate required environment variables (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  const requiredEnvVars = ['API_KEY', 'RPC_URL', 'MATCHA_API_KEY'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}
