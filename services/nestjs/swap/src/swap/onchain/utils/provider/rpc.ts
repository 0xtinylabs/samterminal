import { ethers } from 'ethers';
import { CONFIG } from '@/config/config';

export const rpcProvider = new ethers.JsonRpcProvider(CONFIG.rpc_url);
