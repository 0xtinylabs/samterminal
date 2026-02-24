/**
 * RPC client tests
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

import type { ChainId } from '@samterminal/plugin-tokendata';

// Valid EVM test addresses
const WALLET_ADDR = '0x1111111111111111111111111111111111111111';
const WALLET_ADDR2 = '0x2222222222222222222222222222222222222222';
const WALLET_ADDR3 = '0x3333333333333333333333333333333333333333';
const CONTRACT_ADDR = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const TOKEN_ADDR = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const OWNER_ADDR = '0xcccccccccccccccccccccccccccccccccccccccc';
const SPENDER_ADDR = '0xdddddddddddddddddddddddddddddddddddddd';
const EOA_ADDR = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

// Create mock functions at module level
const mockGetBalance = jest.fn();
const mockGetBlockNumber = jest.fn();
const mockGetBlock = jest.fn();
const mockGetTransaction = jest.fn();
const mockGetTransactionReceipt = jest.fn();
const mockGetBytecode = jest.fn();
const mockReadContract = jest.fn();

jest.unstable_mockModule('viem', () => ({
  createPublicClient: () => ({
    getBalance: (...args: unknown[]) => mockGetBalance(...args),
    getBlockNumber: (...args: unknown[]) => mockGetBlockNumber(...args),
    getBlock: (...args: unknown[]) => mockGetBlock(...args),
    getTransaction: (...args: unknown[]) => mockGetTransaction(...args),
    getTransactionReceipt: (...args: unknown[]) => mockGetTransactionReceipt(...args),
    getBytecode: (...args: unknown[]) => mockGetBytecode(...args),
    readContract: (...args: unknown[]) => mockReadContract(...args),
  }),
  http: () => ({}),
  formatEther: (value: bigint) => (Number(value) / 1e18).toString(),
  isAddress: () => true,
}));

jest.unstable_mockModule('viem/chains', () => ({
  base: { id: 8453, name: 'Base' },
  mainnet: { id: 1, name: 'Ethereum' },
  arbitrum: { id: 42161, name: 'Arbitrum One' },
  polygon: { id: 137, name: 'Polygon' },
  optimism: { id: 10, name: 'OP Mainnet' },
  bsc: { id: 56, name: 'BNB Smart Chain' },
}));

// Import after mocks
const { RpcClient } = await import('./rpc.js');

describe('RpcClient', () => {
  let client: InstanceType<typeof RpcClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new RpcClient();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create client with default config', () => {
      const rpcClient = new RpcClient();
      expect(rpcClient).toBeInstanceOf(RpcClient);
    });

    it('should create client with Alchemy API key', () => {
      const rpcClient = new RpcClient({ alchemyApiKey: 'test-key' });
      expect(rpcClient).toBeInstanceOf(RpcClient);
    });

    it('should create client with custom RPC URLs', () => {
      const rpcClient = new RpcClient({
        rpcUrls: { base: 'https://custom-rpc.com' },
      });
      expect(rpcClient).toBeInstanceOf(RpcClient);
    });
  });

  describe('getNativeBalance', () => {
    it('should return native balance', async () => {
      mockGetBalance.mockResolvedValue(BigInt('1000000000000000000') as never);

      const result = await client.getNativeBalance(WALLET_ADDR, 'base');

      expect(mockGetBalance).toHaveBeenCalledWith({
        address: WALLET_ADDR,
      });
      expect(result.balance).toBe('1000000000000000000');
      expect(result.balanceFormatted).toBe(1);
    });

    it('should work for all supported chains', async () => {
      mockGetBalance.mockResolvedValue(BigInt('1000000000000000000') as never);

      const chains: ChainId[] = ['base', 'ethereum', 'arbitrum', 'polygon', 'optimism', 'bsc'];

      for (const chainId of chains) {
        const result = await client.getNativeBalance(WALLET_ADDR, chainId);
        expect(result.balance).toBe('1000000000000000000');
      }
    });
  });

  describe('getBlockNumber', () => {
    it('should return current block number', async () => {
      mockGetBlockNumber.mockResolvedValue(BigInt(12345678) as never);

      const result = await client.getBlockNumber('base');

      expect(result).toBe(BigInt(12345678));
    });

  });

  describe('getBlock', () => {
    it('should return block by number', async () => {
      const mockBlock = {
        number: BigInt(12345678),
        hash: '0xBlockHash',
        timestamp: BigInt(1700000000),
      };
      mockGetBlock.mockResolvedValue(mockBlock as never);

      const result = await client.getBlock('base', BigInt(12345678));

      expect(mockGetBlock).toHaveBeenCalledWith({ blockNumber: BigInt(12345678) });
      expect(result).toEqual(mockBlock);
    });

    it('should return latest block when no number specified', async () => {
      mockGetBlock.mockResolvedValue({ number: BigInt(12345678) } as never);

      await client.getBlock('ethereum');

      expect(mockGetBlock).toHaveBeenCalledWith({ blockNumber: undefined });
    });
  });

  describe('getTransaction', () => {
    it('should return transaction by hash', async () => {
      const mockTx = {
        hash: '0xTxHash',
        from: '0xSender',
        to: '0xRecipient',
        value: BigInt('1000000000000000000'),
      };
      mockGetTransaction.mockResolvedValue(mockTx as never);

      const result = await client.getTransaction('base', '0xTxHash');

      expect(mockGetTransaction).toHaveBeenCalledWith({ hash: '0xTxHash' });
      expect(result).toEqual(mockTx);
    });
  });

  describe('getTransactionReceipt', () => {
    it('should return transaction receipt', async () => {
      const mockReceipt = {
        transactionHash: '0xTxHash',
        status: 'success',
        gasUsed: BigInt(21000),
      };
      mockGetTransactionReceipt.mockResolvedValue(mockReceipt as never);

      const result = await client.getTransactionReceipt('base', '0xTxHash');

      expect(mockGetTransactionReceipt).toHaveBeenCalledWith({ hash: '0xTxHash' });
      expect(result).toEqual(mockReceipt);
    });
  });

  describe('isContract', () => {
    it('should return true for contract address', async () => {
      mockGetBytecode.mockResolvedValue('0x6080604052' as never);

      const result = await client.isContract(CONTRACT_ADDR, 'base');

      expect(result).toBe(true);
    });

    it('should return false for EOA', async () => {
      mockGetBytecode.mockResolvedValue(undefined as never);

      const result = await client.isContract(EOA_ADDR, 'base');

      expect(result).toBe(false);
    });

    it('should return false for empty bytecode', async () => {
      mockGetBytecode.mockResolvedValue('0x' as never);

      const result = await client.isContract(WALLET_ADDR, 'base');

      expect(result).toBe(false);
    });
  });

  describe('getErc20Balance', () => {
    it('should return ERC20 token balance', async () => {
      mockReadContract.mockResolvedValue(BigInt('1000000') as never);

      const result = await client.getErc20Balance(WALLET_ADDR, TOKEN_ADDR, 'base');

      expect(mockReadContract).toHaveBeenCalledWith({
        address: TOKEN_ADDR,
        abi: expect.any(Array),
        functionName: 'balanceOf',
        args: [WALLET_ADDR],
      });
      expect(result).toBe(BigInt('1000000'));
    });
  });

  describe('getErc20Allowance', () => {
    it('should return ERC20 allowance', async () => {
      mockReadContract.mockResolvedValue(BigInt('500000') as never);

      const result = await client.getErc20Allowance(OWNER_ADDR, SPENDER_ADDR, TOKEN_ADDR, 'base');

      expect(mockReadContract).toHaveBeenCalledWith({
        address: TOKEN_ADDR,
        abi: expect.any(Array),
        functionName: 'allowance',
        args: [OWNER_ADDR, SPENDER_ADDR],
      });
      expect(result).toBe(BigInt('500000'));
    });
  });

  describe('getBatchNativeBalances', () => {
    it('should return balances for multiple addresses', async () => {
      mockGetBalance
        .mockResolvedValueOnce(BigInt('1000000000000000000') as never)
        .mockResolvedValueOnce(BigInt('2000000000000000000') as never)
        .mockResolvedValueOnce(BigInt('3000000000000000000') as never);

      const addresses = [WALLET_ADDR, WALLET_ADDR2, WALLET_ADDR3];
      const result = await client.getBatchNativeBalances(addresses, 'base');

      expect(result.size).toBe(3);
      expect(result.get(WALLET_ADDR.toLowerCase())?.balanceFormatted).toBe(1);
      expect(result.get(WALLET_ADDR2.toLowerCase())?.balanceFormatted).toBe(2);
      expect(result.get(WALLET_ADDR3.toLowerCase())?.balanceFormatted).toBe(3);
    });

    it('should handle errors gracefully', async () => {
      mockGetBalance
        .mockResolvedValueOnce(BigInt('1000000000000000000') as never)
        .mockRejectedValueOnce(new Error('RPC error') as never)
        .mockResolvedValueOnce(BigInt('3000000000000000000') as never);

      const addresses = [WALLET_ADDR, WALLET_ADDR2, WALLET_ADDR3];
      const result = await client.getBatchNativeBalances(addresses, 'base');

      expect(result.size).toBe(3);
      expect(result.get(WALLET_ADDR.toLowerCase())?.balanceFormatted).toBe(1);
      expect(result.get(WALLET_ADDR2.toLowerCase())?.balanceFormatted).toBe(0); // Error fallback
      expect(result.get(WALLET_ADDR3.toLowerCase())?.balanceFormatted).toBe(3);
    });

    it('should process in batches of 10', async () => {
      // Create 25 valid addresses
      const addresses = Array.from({ length: 25 }, (_, i) =>
        `0x${i.toString(16).padStart(40, '0')}`,
      );
      mockGetBalance.mockResolvedValue(BigInt('1000000000000000000') as never);

      await client.getBatchNativeBalances(addresses, 'base');

      // Should be called 25 times (3 batches: 10 + 10 + 5)
      expect(mockGetBalance).toHaveBeenCalledTimes(25);
    });
  });
});
