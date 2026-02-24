/**
 * WalletManager and wallet utility tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Create mock functions at module level
const mockGetBalance = jest.fn();
const mockGetGasPrice = jest.fn();
const mockEstimateGas = jest.fn();
const mockReadContract = jest.fn();
const mockWaitForTransactionReceipt = jest.fn();
const mockSignTypedData = jest.fn();
const mockSendTransaction = jest.fn();
const mockWriteContract = jest.fn();

// Mock viem with ESM-compatible mocking
jest.unstable_mockModule('viem', () => ({
  createPublicClient: jest.fn().mockReturnValue({
    getBalance: (...args: unknown[]) => mockGetBalance(...args),
    getGasPrice: (...args: unknown[]) => mockGetGasPrice(...args),
    estimateGas: (...args: unknown[]) => mockEstimateGas(...args),
    readContract: (...args: unknown[]) => mockReadContract(...args),
    waitForTransactionReceipt: (...args: unknown[]) => mockWaitForTransactionReceipt(...args),
  } as never),
  createWalletClient: jest.fn().mockReturnValue({
    account: {
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    },
    signTypedData: (...args: unknown[]) => mockSignTypedData(...args),
    sendTransaction: (...args: unknown[]) => mockSendTransaction(...args),
    writeContract: (...args: unknown[]) => mockWriteContract(...args),
  } as never),
  http: jest.fn().mockReturnValue({} as never),
  parseUnits: jest.fn((value: string, decimals: number) => {
    const [intPart, decPart = ''] = value.split('.');
    const paddedDec = decPart.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(intPart + paddedDec);
  }),
  formatUnits: jest.fn((value: bigint, decimals: number) => {
    const str = value.toString().padStart(decimals + 1, '0');
    const intPart = str.slice(0, str.length - decimals) || '0';
    const decPart = str.slice(str.length - decimals);
    return decPart ? `${intPart}.${decPart}` : intPart;
  }),
  encodeFunctionData: jest.fn().mockReturnValue('0x' as never),
  maxUint256: BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935'),
}));

jest.unstable_mockModule('viem/accounts', () => ({
  privateKeyToAccount: jest.fn().mockReturnValue({
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  } as never),
}));

jest.unstable_mockModule('viem/chains', () => ({
  base: { id: 8453, name: 'Base' },
  mainnet: { id: 1, name: 'Ethereum' },
  arbitrum: { id: 42161, name: 'Arbitrum' },
  polygon: { id: 137, name: 'Polygon' },
  optimism: { id: 10, name: 'Optimism' },
  bsc: { id: 56, name: 'BSC' },
}));

// Import after mock is set up
const {
  WalletManager,
  createWalletManager,
  floatToBigInt,
  bigIntToFloat,
  formatTokenAmount,
} = await import('./wallet.js');

type WalletManagerInstance = InstanceType<typeof WalletManager>;
type ChainId = import('@samterminal/plugin-tokendata').ChainId;

describe('WalletManager', () => {
  let walletManager: WalletManagerInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Set default mock implementations
    mockGetBalance.mockResolvedValue(BigInt('1000000000000000000') as never);
    mockGetGasPrice.mockResolvedValue(BigInt('20000000000') as never);
    mockEstimateGas.mockResolvedValue(BigInt('21000') as never);
    mockReadContract.mockResolvedValue(BigInt('0') as never);
    mockWaitForTransactionReceipt.mockResolvedValue({
      status: 'success',
      blockNumber: BigInt(1234567),
    } as never);
    mockSignTypedData.mockResolvedValue('0xsignature' as never);
    mockSendTransaction.mockResolvedValue('0xtxhash' as never);
    mockWriteContract.mockResolvedValue('0xtxhash' as never);
    walletManager = new WalletManager();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      expect(walletManager).toBeInstanceOf(WalletManager);
    });

    it('should create with custom config', () => {
      const manager = new WalletManager({
        rpcUrls: { base: 'https://custom-rpc.example.com' },
        alchemyApiKey: 'test-api-key',
      });
      expect(manager).toBeInstanceOf(WalletManager);
    });
  });

  describe('createWalletManager factory', () => {
    it('should create manager with config', () => {
      const manager = createWalletManager({
        alchemyApiKey: 'test-key',
      });
      expect(manager).toBeInstanceOf(WalletManager);
    });
  });

  describe('getPublicClient', () => {
    it('should return public client for supported chain', () => {
      const client = walletManager.getPublicClient('base' as ChainId);
      expect(client).toBeDefined();
    });

    it('should cache public clients', () => {
      const client1 = walletManager.getPublicClient('base' as ChainId);
      const client2 = walletManager.getPublicClient('base' as ChainId);
      expect(client1).toBe(client2);
    });

    it('should throw for unsupported chain', () => {
      expect(() =>
        walletManager.getPublicClient('invalid' as ChainId),
      ).toThrow('Unsupported chain: invalid');
    });
  });

  describe('createWalletClient', () => {
    const testPrivateKey =
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

    it('should create wallet client for supported chain', () => {
      const client = walletManager.createWalletClient(
        testPrivateKey,
        'base' as ChainId,
      );
      expect(client).toBeDefined();
    });

    it('should throw for unsupported chain', () => {
      expect(() =>
        walletManager.createWalletClient(testPrivateKey, 'invalid' as ChainId),
      ).toThrow('Unsupported chain: invalid');
    });
  });

  describe('getAccount', () => {
    it('should return account from private key', () => {
      const testPrivateKey =
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const account = walletManager.getAccount(testPrivateKey);

      expect(account).toBeDefined();
      expect(account.address).toBe(
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      );
    });
  });

  describe('getNativeBalance', () => {
    it('should return native balance for address', async () => {
      const balance = await walletManager.getNativeBalance(
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        'base' as ChainId,
      );

      expect(balance).toBe(BigInt('1000000000000000000'));
    });
  });

  describe('getTokenBalance', () => {
    it('should return token balance', async () => {
      mockReadContract.mockResolvedValue(BigInt('1000000000') as never);

      const balance = await walletManager.getTokenBalance(
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        'base' as ChainId,
      );

      expect(balance).toBe(BigInt('1000000000'));
    });
  });

  describe('getTokenDecimals', () => {
    it('should return token decimals', async () => {
      mockReadContract.mockResolvedValue(6 as never);

      const decimals = await walletManager.getTokenDecimals(
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        'base' as ChainId,
      );

      expect(decimals).toBe(6);
    });
  });

  describe('getTokenAllowance', () => {
    it('should return token allowance', async () => {
      mockReadContract.mockResolvedValue(BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935') as never);

      const allowance = await walletManager.getTokenAllowance(
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x1234567890123456789012345678901234567890',
        'base' as ChainId,
      );

      expect(allowance).toBeGreaterThan(0n);
    });
  });

  describe('approveToken', () => {
    const testPrivateKey =
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

    it('should approve specific amount', async () => {
      const txHash = await walletManager.approveToken(
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        '0xSpender',
        BigInt('1000000000'),
        testPrivateKey,
        'base' as ChainId,
      );

      expect(txHash).toBeDefined();
    });

    it('should approve unlimited amount', async () => {
      const txHash = await walletManager.approveToken(
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        '0xSpender',
        'unlimited',
        testPrivateKey,
        'base' as ChainId,
      );

      expect(txHash).toBeDefined();
    });

  });

  describe('sendTransaction', () => {
    const testPrivateKey =
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

    it('should send transaction', async () => {
      const txHash = await walletManager.sendTransaction(
        '0xTo',
        '0xData',
        '0',
        '21000',
        '20000000000',
        testPrivateKey,
        'base' as ChainId,
      );

      expect(txHash).toBeDefined();
    });

  });

  describe('signTypedData', () => {
    const testPrivateKey =
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

    it('should sign typed data', async () => {
      const signature = await walletManager.signTypedData(
        testPrivateKey,
        {
          name: 'Test',
          chainId: 8453,
          verifyingContract: '0x1234567890123456789012345678901234567890',
        },
        {
          Test: [{ name: 'value', type: 'uint256' }],
        },
        'Test',
        { value: 123 },
        'base' as ChainId,
      );

      expect(signature).toBeDefined();
    });
  });

  describe('getGasPrice', () => {
    it('should return gas price', async () => {
      const gasPrice = await walletManager.getGasPrice('base' as ChainId);
      expect(gasPrice).toBe(BigInt('20000000000'));
    });
  });

  describe('estimateGas', () => {
    it('should estimate gas', async () => {
      const gas = await walletManager.estimateGas(
        '0xTo',
        '0xData',
        '0',
        '0xFrom',
        'base' as ChainId,
      );

      expect(gas).toBe(BigInt('21000'));
    });
  });
});

describe('floatToBigInt', () => {
  it('should convert float to bigint with decimals', () => {
    expect(floatToBigInt(1, 18)).toBe(BigInt('1000000000000000000'));
    expect(floatToBigInt(1.5, 18)).toBe(BigInt('1500000000000000000'));
    expect(floatToBigInt(100, 6)).toBe(BigInt('100000000'));
    expect(floatToBigInt(0.001, 18)).toBe(BigInt('1000000000000000'));
  });

  it('should handle zero', () => {
    expect(floatToBigInt(0, 18)).toBe(BigInt('0'));
  });

  it('should handle small values', () => {
    expect(floatToBigInt(0.000001, 18)).toBe(BigInt('1000000000000'));
  });

  it('should handle different decimal places', () => {
    expect(floatToBigInt(1, 6)).toBe(BigInt('1000000'));
    expect(floatToBigInt(1, 8)).toBe(BigInt('100000000'));
    expect(floatToBigInt(1, 0)).toBe(BigInt('1'));
  });
});

describe('bigIntToFloat', () => {
  it('should convert bigint to float with decimals', () => {
    expect(bigIntToFloat(BigInt('1000000000000000000'), 18)).toBe(1);
    expect(bigIntToFloat(BigInt('1500000000000000000'), 18)).toBe(1.5);
    expect(bigIntToFloat(BigInt('100000000'), 6)).toBe(100);
  });

  it('should handle zero', () => {
    expect(bigIntToFloat(BigInt('0'), 18)).toBe(0);
  });

  it('should handle small values', () => {
    expect(bigIntToFloat(BigInt('1000000000000'), 18)).toBeCloseTo(0.000001, 10);
  });

  it('should handle different decimal places', () => {
    expect(bigIntToFloat(BigInt('1000000'), 6)).toBe(1);
    expect(bigIntToFloat(BigInt('100000000'), 8)).toBe(1);
    expect(bigIntToFloat(BigInt('1'), 0)).toBe(1);
  });
});

describe('formatTokenAmount', () => {
  it('should format zero', () => {
    expect(formatTokenAmount(BigInt('0'), 18)).toBe('0');
  });

  it('should format very small values in exponential', () => {
    expect(formatTokenAmount(BigInt('100'), 18)).toMatch(/e/);
  });

  it('should format small values', () => {
    const result = formatTokenAmount(BigInt('500000000000000000'), 18);
    expect(result).toBe('0.500000');
  });

  it('should format regular values', () => {
    const result = formatTokenAmount(BigInt('1000000000000000000'), 18);
    expect(result).toBe('1.00');
  });

  it('should format thousands with K suffix', () => {
    const result = formatTokenAmount(BigInt('5000000000000000000000'), 18);
    expect(result).toBe('5.00K');
  });

  it('should format millions with M suffix', () => {
    const result = formatTokenAmount(BigInt('5000000000000000000000000'), 18);
    expect(result).toBe('5.00M');
  });

  it('should format billions with B suffix', () => {
    const result = formatTokenAmount(BigInt('5000000000000000000000000000'), 18);
    expect(result).toBe('5.00B');
  });

  it('should respect maxDecimals parameter', () => {
    const result = formatTokenAmount(BigInt('500000000000000000'), 18, 2);
    expect(result).toBe('0.50');
  });
});
