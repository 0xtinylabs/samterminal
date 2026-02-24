/**
 * Wallet and RPC utilities for swap execution
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
  type PublicClient,
  type WalletClient,
  type Account,
  type Chain,
  encodeFunctionData,
  maxUint256,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, mainnet, arbitrum, polygon, optimism, bsc } from 'viem/chains';
import type { ChainId } from '@samterminal/plugin-tokendata';
import type { SwapPluginConfig } from '../types/index.js';

/**
 * Chain configurations
 */
const CHAINS: Record<string, Chain> = {
  base,
  ethereum: mainnet,
  arbitrum,
  polygon,
  optimism,
  bsc,
};

/**
 * ERC20 ABI for common operations
 */
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

export class WalletManager {
  private publicClients: Map<ChainId, PublicClient> = new Map();
  private config: SwapPluginConfig;

  constructor(config: SwapPluginConfig = {}) {
    this.config = config;
  }

  /**
   * Get public client for chain
   */
  getPublicClient(chainId: ChainId): PublicClient {
    let client = this.publicClients.get(chainId);
    if (client) return client;

    const chain = CHAINS[chainId];
    if (!chain) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    let rpcUrl = this.config.rpcUrls?.[chainId];

    if (!rpcUrl && this.config.alchemyApiKey) {
      const alchemyNetworkMap: Partial<Record<ChainId, string>> = {
        base: 'base-mainnet',
        ethereum: 'eth-mainnet',
        arbitrum: 'arb-mainnet',
        polygon: 'polygon-mainnet',
        optimism: 'opt-mainnet',
      };
      const network = alchemyNetworkMap[chainId];
      if (network) {
        rpcUrl = `https://${network}.g.alchemy.com/v2/${this.config.alchemyApiKey}`;
      }
    }

    client = createPublicClient({
      chain,
      transport: http(rpcUrl),
    }) as PublicClient;

    this.publicClients.set(chainId, client);
    return client;
  }

  /**
   * Create wallet client from private key
   */
  createWalletClient(privateKey: string, chainId: ChainId): WalletClient {
    const chain = CHAINS[chainId];
    if (!chain) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`);

    let rpcUrl = this.config.rpcUrls?.[chainId];

    if (!rpcUrl && this.config.alchemyApiKey) {
      const alchemyNetworkMap: Partial<Record<ChainId, string>> = {
        base: 'base-mainnet',
        ethereum: 'eth-mainnet',
        arbitrum: 'arb-mainnet',
        polygon: 'polygon-mainnet',
        optimism: 'opt-mainnet',
      };
      const network = alchemyNetworkMap[chainId];
      if (network) {
        rpcUrl = `https://${network}.g.alchemy.com/v2/${this.config.alchemyApiKey}`;
      }
    }

    return createWalletClient({
      account,
      chain,
      transport: http(rpcUrl),
    });
  }

  /**
   * Get account from private key
   */
  getAccount(privateKey: string): Account {
    return privateKeyToAccount(privateKey as `0x${string}`);
  }

  /**
   * Get native balance
   */
  async getNativeBalance(address: string, chainId: ChainId): Promise<bigint> {
    const client = this.getPublicClient(chainId);
    return client.getBalance({ address: address as `0x${string}` });
  }

  /**
   * Get token balance
   */
  async getTokenBalance(
    tokenAddress: string,
    walletAddress: string,
    chainId: ChainId,
  ): Promise<bigint> {
    const client = this.getPublicClient(chainId);

    const balance = await client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`],
    });

    return balance;
  }

  /**
   * Get token decimals
   */
  async getTokenDecimals(tokenAddress: string, chainId: ChainId): Promise<number> {
    const client = this.getPublicClient(chainId);

    const decimals = await client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'decimals',
    });

    return decimals;
  }

  /**
   * Get token allowance
   */
  async getTokenAllowance(
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string,
    chainId: ChainId,
  ): Promise<bigint> {
    const client = this.getPublicClient(chainId);

    const allowance = await client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [ownerAddress as `0x${string}`, spenderAddress as `0x${string}`],
    });

    return allowance;
  }

  /**
   * Approve token spending
   */
  async approveToken(
    tokenAddress: string,
    spenderAddress: string,
    amount: bigint | 'unlimited',
    privateKey: string,
    chainId: ChainId,
  ): Promise<string> {
    const chain = CHAINS[chainId];
    if (!chain) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    const walletClient = this.createWalletClient(privateKey, chainId);
    const publicClient = this.getPublicClient(chainId);
    const account = this.getAccount(privateKey);

    const approveAmount = amount === 'unlimited' ? maxUint256 : amount;

    const hash = await walletClient.writeContract({
      account,
      chain,
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spenderAddress as `0x${string}`, approveAmount],
    });

    // Wait for transaction and check status
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status === 'reverted') {
      throw new Error(`Token approval transaction reverted: ${hash}`);
    }

    return hash;
  }

  /**
   * Send transaction
   */
  async sendTransaction(
    to: string,
    data: string,
    value: string,
    gas: string,
    gasPrice: string,
    privateKey: string,
    chainId: ChainId,
  ): Promise<string> {
    const chain = CHAINS[chainId];
    if (!chain) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    const walletClient = this.createWalletClient(privateKey, chainId);
    const publicClient = this.getPublicClient(chainId);
    const account = this.getAccount(privateKey);

    const hash = await walletClient.sendTransaction({
      account,
      chain,
      to: to as `0x${string}`,
      data: data as `0x${string}`,
      value: BigInt(value),
      gas: BigInt(gas),
      gasPrice: BigInt(gasPrice),
    });

    // Wait for transaction and check status
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status === 'reverted') {
      throw new Error(`Transaction reverted: ${hash}`);
    }

    return hash;
  }

  /**
   * Sign typed data (EIP-712)
   */
  async signTypedData(
    privateKey: string,
    domain: {
      name: string;
      chainId: number;
      verifyingContract: string;
    },
    types: Record<string, Array<{ name: string; type: string }>>,
    primaryType: string,
    message: Record<string, unknown>,
    chainId: ChainId,
  ): Promise<string> {
    const walletClient = this.createWalletClient(privateKey, chainId);
    const account = this.getAccount(privateKey);

    const signature = await walletClient.signTypedData({
      account,
      domain: {
        ...domain,
        verifyingContract: domain.verifyingContract as `0x${string}`,
      },
      types,
      primaryType,
      message,
    });

    return signature;
  }

  /**
   * Get current gas price
   */
  async getGasPrice(chainId: ChainId): Promise<bigint> {
    const client = this.getPublicClient(chainId);
    return client.getGasPrice();
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(
    to: string,
    data: string,
    value: string,
    from: string,
    chainId: ChainId,
  ): Promise<bigint> {
    const client = this.getPublicClient(chainId);

    return client.estimateGas({
      to: to as `0x${string}`,
      data: data as `0x${string}`,
      value: BigInt(value),
      account: from as `0x${string}`,
    });
  }
}

/**
 * Convert float to bigint with decimals
 */
export function floatToBigInt(value: number | string, decimals: number): bigint {
  // Accept string to avoid IEEE-754 precision loss for large amounts
  const valueStr = typeof value === 'string' ? value : value.toFixed(decimals);
  return parseUnits(valueStr, decimals);
}

/**
 * Convert bigint to float with decimals
 */
export function bigIntToFloat(value: bigint, decimals: number): number {
  return parseFloat(formatUnits(value, decimals));
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: bigint, decimals: number, maxDecimals: number = 6): string {
  const value = bigIntToFloat(amount, decimals);

  if (value === 0) return '0';
  if (value < 0.000001) return value.toExponential(2);
  if (value < 1) return value.toFixed(maxDecimals);
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;

  return value.toFixed(Math.min(maxDecimals, 2));
}

/**
 * Wallet manager configuration
 */
export interface WalletManagerConfig {
  rpcUrls?: Partial<Record<ChainId, string>>;
  alchemyApiKey?: string;
}

/**
 * Create a new WalletManager instance
 */
export function createWalletManager(config: WalletManagerConfig = {}): WalletManager {
  return new WalletManager({
    rpcUrls: config.rpcUrls,
    alchemyApiKey: config.alchemyApiKey,
  });
}
