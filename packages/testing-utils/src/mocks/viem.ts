/**
 * Viem mocks for testing
 */

/**
 * Mock account interface
 */
export interface MockAccount {
  address: `0x${string}`;
  publicKey?: `0x${string}`;
  signMessage?: jest.Mock;
  signTransaction?: jest.Mock;
  signTypedData?: jest.Mock;
}

/**
 * Mock PublicClient interface
 */
export interface MockPublicClient {
  getBalance: jest.Mock;
  getGasPrice: jest.Mock;
  estimateGas: jest.Mock;
  readContract: jest.Mock;
  waitForTransactionReceipt: jest.Mock;
  getBlockNumber: jest.Mock;
  getChainId: jest.Mock;
}

/**
 * Mock WalletClient interface
 */
export interface MockWalletClient {
  account: MockAccount;
  signTypedData: jest.Mock;
  sendTransaction: jest.Mock;
  writeContract: jest.Mock;
  signMessage: jest.Mock;
}

/**
 * Mock transaction receipt
 */
export interface MockTransactionReceipt {
  status: 'success' | 'reverted';
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
}

/**
 * Default test wallet address
 */
export const DEFAULT_TEST_ADDRESS =
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`;

/**
 * Default test private key (Foundry/Hardhat default account 0)
 */
export const DEFAULT_TEST_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as `0x${string}`;

/**
 * Default mock signature
 */
export const DEFAULT_MOCK_SIGNATURE =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1c' as `0x${string}`;

/**
 * Default mock transaction hash
 */
export const DEFAULT_MOCK_TX_HASH =
  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab' as `0x${string}`;

/**
 * Create a mock account
 */
export function createMockAccount(
  overrides?: Partial<MockAccount>,
): MockAccount {
  return {
    address: DEFAULT_TEST_ADDRESS,
    signMessage: jest.fn().mockResolvedValue(DEFAULT_MOCK_SIGNATURE),
    signTransaction: jest.fn().mockResolvedValue(DEFAULT_MOCK_SIGNATURE),
    signTypedData: jest.fn().mockResolvedValue(DEFAULT_MOCK_SIGNATURE),
    ...overrides,
  };
}

/**
 * Create a mock PublicClient
 */
export function createMockPublicClient(
  overrides?: Partial<MockPublicClient>,
): MockPublicClient {
  return {
    getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')), // 1 ETH
    getGasPrice: jest.fn().mockResolvedValue(BigInt('20000000000')), // 20 gwei
    estimateGas: jest.fn().mockResolvedValue(BigInt('21000')),
    readContract: jest.fn().mockResolvedValue(undefined),
    waitForTransactionReceipt: jest.fn().mockResolvedValue({
      status: 'success',
      blockNumber: BigInt(1234567),
      transactionHash: DEFAULT_MOCK_TX_HASH,
      gasUsed: BigInt(21000),
      effectiveGasPrice: BigInt('20000000000'),
    } as MockTransactionReceipt),
    getBlockNumber: jest.fn().mockResolvedValue(BigInt(1234567)),
    getChainId: jest.fn().mockResolvedValue(8453), // Base
    ...overrides,
  };
}

/**
 * Create a mock WalletClient
 */
export function createMockWalletClient(
  overrides?: Partial<MockWalletClient>,
): MockWalletClient {
  const account = createMockAccount(overrides?.account);

  return {
    account,
    signTypedData: jest.fn().mockResolvedValue(DEFAULT_MOCK_SIGNATURE),
    sendTransaction: jest.fn().mockResolvedValue(DEFAULT_MOCK_TX_HASH),
    writeContract: jest.fn().mockResolvedValue(DEFAULT_MOCK_TX_HASH),
    signMessage: jest.fn().mockResolvedValue(DEFAULT_MOCK_SIGNATURE),
    ...overrides,
  };
}

/**
 * Create combined mock viem clients
 */
export function createMockViemClients(): {
  publicClient: MockPublicClient;
  walletClient: MockWalletClient;
  reset: () => void;
} {
  const publicClient = createMockPublicClient();
  const walletClient = createMockWalletClient();

  const reset = () => {
    Object.values(publicClient).forEach((fn) => {
      if (typeof fn === 'function' && 'mockClear' in fn) {
        fn.mockClear();
      }
    });
    Object.values(walletClient).forEach((fn) => {
      if (typeof fn === 'function' && 'mockClear' in fn) {
        fn.mockClear();
      }
    });
  };

  return { publicClient, walletClient, reset };
}

/**
 * Mock ERC20 read contract responses
 */
export const mockERC20Responses = {
  balanceOf: (balance: bigint = BigInt('1000000000000000000')) => balance,
  decimals: (decimals: number = 18) => decimals,
  symbol: (symbol: string = 'TEST') => symbol,
  name: (name: string = 'Test Token') => name,
  allowance: (allowance: bigint = BigInt(0)) => allowance,
};

/**
 * Setup mock readContract to return ERC20 responses
 */
export function setupMockERC20(
  publicClient: MockPublicClient,
  config: {
    balance?: bigint;
    decimals?: number;
    symbol?: string;
    name?: string;
    allowance?: bigint;
  } = {},
): void {
  publicClient.readContract.mockImplementation(
    async ({ functionName }: { functionName: string }) => {
      switch (functionName) {
        case 'balanceOf':
          return mockERC20Responses.balanceOf(config.balance);
        case 'decimals':
          return mockERC20Responses.decimals(config.decimals);
        case 'symbol':
          return mockERC20Responses.symbol(config.symbol);
        case 'name':
          return mockERC20Responses.name(config.name);
        case 'allowance':
          return mockERC20Responses.allowance(config.allowance);
        default:
          return undefined;
      }
    },
  );
}
