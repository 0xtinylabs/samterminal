export type ENV = {
  // DATABASE
  USER_DATABASE_URL: string;
  // RPC
  RPC_URL: string;
  // SWAP
  SWAP_CONTRACT: string;
  SWAPPER_ADDRESS: string;
  PERMIT_2: string;
  PERMIT_SWAP: string;
  // API
  MATCHA_API_KEY: string;
  // FEE
  FEE_RECEIVER_WALLET: string;
  FEE_RECEIVE_TOKEN: string;
  FEE_BPS: string;
  FEE_BPS_REFERRED: string;
  // WALLET
  WALLET_PRIVATE_KEY?: string;
  // SERVER
  API_KEY: string;
};
