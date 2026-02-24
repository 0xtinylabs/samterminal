/**
 * Test Utilities - Web3 Unit Tests
 * Common test helpers and factories
 */

import {
  MOCK_PRIVATE_KEY,
  MOCK_WALLET_ADDRESS,
  MOCK_TOKEN_ADDRESS,
  mockContract,
  mockWallet,
  mockProvider,
} from './mocks';

// Test Fixtures
export const TEST_FIXTURES = {
  privateKey: MOCK_PRIVATE_KEY,
  walletAddress: MOCK_WALLET_ADDRESS,
  tokenAddress: MOCK_TOKEN_ADDRESS,
  amount: 1.5,
  swapData: '0x1234567890abcdef',
  toAddress: '0xToAddress1234567890abcdef123456789012345',
  deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
  nonce: BigInt(Date.now()) * BigInt(1000000),
  decimals: 18n,
  balance: BigInt('1500000000000000000'), // 1.5 ETH
};

// Time utilities for testing
export const TIME_UTILS = {
  /**
   * Mock Date.now() for consistent test results
   */
  mockNow: (timestamp: number) => {
    jest.spyOn(Date, 'now').mockReturnValue(timestamp);
  },

  /**
   * Restore Date.now()
   */
  restoreNow: () => {
    jest.spyOn(Date, 'now').mockRestore();
  },

  /**
   * Get timestamp for N seconds from now
   */
  futureTimestamp: (seconds: number) => {
    return Math.floor(Date.now() / 1000) + seconds;
  },
};

// Factory functions for creating test data
export const createTestPermit = (overrides?: Partial<typeof TEST_FIXTURES>) => {
  const data = { ...TEST_FIXTURES, ...overrides };
  return {
    permitted: {
      token: data.tokenAddress,
      amount: BigInt('1500000000000000000'),
    },
    nonce: data.nonce,
    deadline: data.deadline,
  };
};

export const createTestEip712Domain = () => ({
  name: 'Permit2',
  chainId: 8453,
  verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
});

export const createTestTokenPermissions = () => ({
  token: TEST_FIXTURES.tokenAddress,
  amount: BigInt('1500000000000000000'),
});

// Setup helpers
export const setupTokenMocks = (options?: {
  balance?: bigint;
  decimals?: bigint;
  allowance?: bigint;
}) => {
  const { balance = BigInt('1500000000000000000'), decimals = 18n, allowance = 0n } = options ?? {};

  mockContract.balanceOf.mockResolvedValue(balance);
  mockContract.decimals.mockResolvedValue(decimals);
  mockContract.allowance.mockResolvedValue(allowance);

  return mockContract;
};

export const setupProviderMocks = (options?: {
  balance?: bigint;
  nonce?: number;
  gasPrice?: bigint;
}) => {
  const {
    balance = BigInt('1000000000000000000'),
    nonce = 0,
    gasPrice = BigInt('1000000000')
  } = options ?? {};

  mockProvider.getBalance.mockResolvedValue(balance);
  mockProvider.getTransactionCount.mockResolvedValue(nonce);
  mockProvider.getFeeData.mockResolvedValue({
    gasPrice,
    maxFeePerGas: gasPrice * 2n,
    maxPriorityFeePerGas: gasPrice / 10n,
  });

  return mockProvider;
};

// Assertion helpers
export const expectValidEip712Structure = (message: any) => {
  expect(message).toHaveProperty('domain');
  expect(message).toHaveProperty('types');
  expect(message).toHaveProperty('primaryType');
  expect(message).toHaveProperty('message');

  expect(message.domain).toHaveProperty('name');
  expect(message.domain).toHaveProperty('chainId');
  expect(message.domain).toHaveProperty('verifyingContract');
};

export const expectValidPermitStructure = (permit: any) => {
  expect(permit).toHaveProperty('permitted');
  expect(permit).toHaveProperty('nonce');
  expect(permit).toHaveProperty('deadline');

  expect(permit.permitted).toHaveProperty('token');
  expect(permit.permitted).toHaveProperty('amount');

  expect(typeof permit.nonce).toBe('bigint');
  expect(typeof permit.deadline).toBe('bigint');
};

// Error test helpers
export const expectToThrowAsync = async (fn: () => Promise<any>, errorMessage?: string) => {
  let error: Error | undefined;
  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }
  expect(error).toBeDefined();
  if (errorMessage) {
    expect(error?.message).toContain(errorMessage);
  }
  return error;
};
