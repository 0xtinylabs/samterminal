/**
 * RPC client for blockchain queries
 */

import { createPublicClient, http, type PublicClient, formatEther, isAddress } from 'viem';
import { base, mainnet, arbitrum, polygon, optimism, bsc } from 'viem/chains';
import type { ChainId } from '@samterminal/plugin-tokendata';

/**
 * Chain configurations for viem
 */
const CHAIN_CONFIGS = {
  base,
  ethereum: mainnet,
  arbitrum,
  polygon,
  optimism,
  bsc,
} as const;

export interface RpcClientConfig {
  alchemyApiKey?: string;
  rpcUrls?: Partial<Record<ChainId, string>>;
  timeout?: number;
}

export class RpcClient {
  private clients: Map<ChainId, PublicClient> = new Map();
  private config: RpcClientConfig;

  constructor(config: RpcClientConfig = {}) {
    this.config = config;
  }

  /**
   * Get or create a viem client for a chain
   */
  private getClient(chainId: ChainId): PublicClient {
    let client = this.clients.get(chainId);
    if (client) {
      return client;
    }

    const chain = CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS];
    if (!chain) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    // Build RPC URL
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
      transport: http(rpcUrl, {
        timeout: this.config.timeout ?? 15000,
      }),
    }) as PublicClient;

    this.clients.set(chainId, client);
    return client;
  }

  /**
   * Get native balance for an address
   */
  async getNativeBalance(
    address: string,
    chainId: ChainId,
  ): Promise<{ balance: string; balanceFormatted: number }> {
    if (!isAddress(address)) {
      throw new Error(`Invalid address format: ${address}`);
    }

    const client = this.getClient(chainId);

    const balance = await client.getBalance({
      address: address as `0x${string}`,
    });

    return {
      balance: balance.toString(),
      balanceFormatted: parseFloat(formatEther(balance)),
    };
  }

  /**
   * Get current block number
   */
  async getBlockNumber(chainId: ChainId): Promise<bigint> {
    const client = this.getClient(chainId);
    return client.getBlockNumber();
  }

  /**
   * Get block by number
   */
  async getBlock(chainId: ChainId, blockNumber?: bigint) {
    const client = this.getClient(chainId);
    return client.getBlock({ blockNumber });
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(chainId: ChainId, hash: string) {
    const client = this.getClient(chainId);
    return client.getTransaction({ hash: hash as `0x${string}` });
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(chainId: ChainId, hash: string) {
    const client = this.getClient(chainId);
    return client.getTransactionReceipt({ hash: hash as `0x${string}` });
  }

  /**
   * Check if address is a contract
   */
  async isContract(address: string, chainId: ChainId): Promise<boolean> {
    if (!isAddress(address)) {
      throw new Error(`Invalid address format: ${address}`);
    }

    const client = this.getClient(chainId);
    const code = await client.getBytecode({
      address: address as `0x${string}`,
    });
    return !!code && code !== '0x';
  }

  /**
   * Get ERC20 token balance
   */
  async getErc20Balance(
    walletAddress: string,
    tokenAddress: string,
    chainId: ChainId,
  ): Promise<bigint> {
    if (!isAddress(walletAddress) || !isAddress(tokenAddress)) {
      throw new Error('Invalid address format');
    }

    const client = this.getClient(chainId);

    const balance = await client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
        },
      ],
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`],
    });

    return balance;
  }

  /**
   * Get ERC20 token allowance
   */
  async getErc20Allowance(
    ownerAddress: string,
    spenderAddress: string,
    tokenAddress: string,
    chainId: ChainId,
  ): Promise<bigint> {
    if (!isAddress(ownerAddress) || !isAddress(spenderAddress) || !isAddress(tokenAddress)) {
      throw new Error('Invalid address format');
    }

    const client = this.getClient(chainId);

    const allowance = await client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: [
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
      ],
      functionName: 'allowance',
      args: [ownerAddress as `0x${string}`, spenderAddress as `0x${string}`],
    });

    return allowance;
  }

  /**
   * Batch get multiple native balances
   */
  async getBatchNativeBalances(
    addresses: string[],
    chainId: ChainId,
  ): Promise<Map<string, { balance: string; balanceFormatted: number }>> {
    const results = new Map<string, { balance: string; balanceFormatted: number }>();

    // Process in parallel with some concurrency limit
    const batchSize = 10;
    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);
      const promises = batch.map((address) =>
        this.getNativeBalance(address, chainId)
          .then((balance) => ({ address, balance }))
          .catch(() => ({ address, balance: { balance: '0', balanceFormatted: 0 } })),
      );

      const batchResults = await Promise.all(promises);
      for (const { address, balance } of batchResults) {
        results.set(address.toLowerCase(), balance);
      }
    }

    return results;
  }
}
