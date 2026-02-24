/**
 * Ethers Mock - Web3 Test Infrastructure
 * Wallet, Contract, Provider için mock'lar
 */

export const MOCK_PRIVATE_KEY = '0x' + 'a'.repeat(64);
export const MOCK_WALLET_ADDRESS = '0xTestWalletAddress1234567890abcdef12345678';
export const MOCK_TOKEN_ADDRESS = '0xTokenAddress1234567890abcdef1234567890ab';
export const MOCK_PERMIT2_ADDRESS = '0xPermit2Address1234567890abcdef123456789';

export const mockWallet = {
  address: MOCK_WALLET_ADDRESS,
  privateKey: MOCK_PRIVATE_KEY,
  connect: jest.fn().mockReturnThis(),
  signMessage: jest.fn().mockResolvedValue('0xsignedMessage'),
  signTypedData: jest.fn().mockResolvedValue('0xsignedTypedData'),
};

export const mockContract = {
  name: jest.fn().mockResolvedValue('Test Token'),
  symbol: jest.fn().mockResolvedValue('TEST'),
  decimals: jest.fn().mockResolvedValue(18n),
  balanceOf: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
  allowance: jest.fn().mockResolvedValue(0n),
  approve: jest.fn().mockResolvedValue({
    wait: jest.fn().mockResolvedValue({}),
    hash: '0xmockedTxHash',
  }),
  transfer: jest.fn().mockResolvedValue({
    wait: jest.fn().mockResolvedValue({}),
    hash: '0xmockedTxHash',
  }),
  nonces: jest.fn().mockResolvedValue(0n),
  version: jest.fn().mockResolvedValue(1),
  connect: jest.fn().mockReturnThis(),
};

export const mockProvider = {
  getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
  getTransactionCount: jest.fn().mockResolvedValue(0),
  getFeeData: jest.fn().mockResolvedValue({
    gasPrice: BigInt('1000000000'),
    maxFeePerGas: BigInt('2000000000'),
    maxPriorityFeePerGas: BigInt('100000000'),
  }),
  getNetwork: jest.fn().mockResolvedValue({ chainId: 8453n }),
  getBlock: jest.fn().mockResolvedValue({ timestamp: Math.floor(Date.now() / 1000) }),
};

// Ethers module mock factory
export const createEthersMock = () => ({
  Wallet: jest.fn().mockImplementation(() => mockWallet),
  Contract: jest.fn().mockImplementation(() => mockContract),
  JsonRpcProvider: jest.fn().mockImplementation(() => mockProvider),
  parseUnits: jest.fn().mockImplementation((value: string, decimals: number | bigint) => {
    const dec = typeof decimals === 'bigint' ? Number(decimals) : decimals;
    return BigInt(Math.floor(parseFloat(value) * Math.pow(10, dec)));
  }),
  formatUnits: jest.fn().mockImplementation((value: bigint, decimals: number) => {
    return (Number(value) / Math.pow(10, decimals)).toString();
  }),
  getBigInt: jest.fn().mockImplementation((value: string | number | bigint) => {
    if (typeof value === 'bigint') return value;
    return BigInt(value);
  }),
});

export const ethersMock = createEthersMock();

// Reset all mocks helper
export const resetEthersMocks = () => {
  mockWallet.connect.mockClear();
  mockWallet.signMessage.mockClear();
  mockWallet.signTypedData.mockClear();
  mockContract.name.mockClear();
  mockContract.symbol.mockClear();
  mockContract.decimals.mockClear();
  mockContract.balanceOf.mockClear();
  mockContract.allowance.mockClear();
  mockContract.approve.mockClear();
  mockContract.transfer.mockClear();
  mockProvider.getBalance.mockClear();
  mockProvider.getTransactionCount.mockClear();
  mockProvider.getFeeData.mockClear();
};
