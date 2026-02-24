/**
 * Viem Mock - Web3 Test Infrastructure
 * EIP-712 signing, encoding, hashing için mock'lar
 */

export const mockEncodeFunctionData = jest.fn().mockReturnValue('0xmockedEncodedData');
export const mockKeccak256 = jest.fn().mockReturnValue('0xmockedHash');
export const mockMaxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

export const mockWalletClient = {
  account: {
    address: '0xTestWalletAddress1234567890abcdef12345678',
  },
  chain: {
    id: 8453,
    name: 'Base',
  },
  signTypedData: jest.fn().mockResolvedValue('0xmockedSignature'),
  sendTransaction: jest.fn().mockResolvedValue('0xmockedTxHash'),
};

export const mockPublicClient = {
  chain: {
    id: 8453,
    name: 'Base',
  },
  getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
};

export const mockPrivateKeyToAccount = jest.fn().mockReturnValue({
  address: '0xTestWalletAddress1234567890abcdef12345678',
  signMessage: jest.fn(),
  signTypedData: jest.fn(),
});

export const mockCreateWalletClient = jest.fn().mockReturnValue(mockWalletClient);
export const mockCreatePublicClient = jest.fn().mockReturnValue(mockPublicClient);

// Viem module mock
export const viemMock = {
  encodeFunctionData: mockEncodeFunctionData,
  keccak256: mockKeccak256,
  maxUint256: mockMaxUint256,
  createWalletClient: mockCreateWalletClient,
  createPublicClient: mockCreatePublicClient,
};

// Reset all mocks helper
export const resetViemMocks = () => {
  mockEncodeFunctionData.mockClear();
  mockKeccak256.mockClear();
  mockWalletClient.signTypedData.mockClear();
  mockWalletClient.sendTransaction.mockClear();
  mockPublicClient.getBalance.mockClear();
  mockPrivateKeyToAccount.mockClear();
  mockCreateWalletClient.mockClear();
  mockCreatePublicClient.mockClear();
};
