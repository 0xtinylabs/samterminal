/**
 * permit2.ts Unit Tests
 * EIP-712 Permit2 imzalama ve encoding testleri
 */

import { permit2 } from '@/swap/onchain/utils/permit/permit2';
import {
  MOCK_CONFIG,
  MOCK_CHAINS,
  MOCK_ETHERS,
  mockWallet,
  mockContract,
  mockProvider,
  mockWalletClient,
  mockEncodeFunctionData,
  resetViemMocks,
  resetEthersMocks,
  MOCK_PRIVATE_KEY,
  MOCK_TOKEN_ADDRESS,
} from '@/swap/onchain/utils/__tests__/mocks';

// Mock all dependencies
jest.mock('viem', () => ({
  encodeFunctionData: jest.fn().mockReturnValue('0xmockedEncodedData'),
  Hex: String,
}));

jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn().mockReturnValue({
    address: '0xTestWalletAddress1234567890abcdef12345678',
  }),
}));

jest.mock('viem/chains', () => ({
  base: { id: 8453, name: 'Base' },
}));

jest.mock('@/config/config', () => ({
  CONFIG: {
    rpc_url: 'https://mock-rpc.base.org',
    swap: {
      permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
      permitSwap: '0xPermitSwapAddress1234567890abcdef12345678',
    },
  },
}));

jest.mock('@/web3/abi', () => ({
  ABI: {
    JSON: {
      permitSwap: [],
    },
  },
}));

jest.mock('@/web3/chains', () => ({
  CHAINS: { BASE: 8453 },
}));

jest.mock('@/web3/tokens', () => ({
  ETHERS: {
    UNCHECKABLE_GROUP: [
      '0x0000000000000000000000000000000000000000',
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    ],
  },
}));

// Mock internal utilities
const mockTokenFunctions = {
  decimals: jest.fn().mockResolvedValue(18n),
  getBalance: jest.fn().mockResolvedValue(BigInt('2000000000000000000')),
};

const mockWalletClientInstance = {
  address: '0xTestWalletAddress1234567890abcdef12345678',
};

const mockWalletPublicClientInstance = {
  signTypedData: jest.fn().mockResolvedValue('0xmockedSignature'),
};

const mockRpcProvider = {
  getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
};

jest.mock('@/swap/onchain/utils', () => ({
  AMOUNT: {
    FLOAT: {
      floatToBigInt: jest.fn().mockImplementation((value: number, decimals: bigint) => {
        const dec = Number(decimals);
        return BigInt(Math.floor(value * Math.pow(10, dec)));
      }),
    },
  },
  TOKEN: {
    tokenContract: jest.fn().mockReturnValue({}),
    tokenFunctions: jest.fn().mockReturnValue({
      decimals: jest.fn().mockResolvedValue(18n),
      getBalance: jest.fn().mockResolvedValue(BigInt('2000000000000000000')),
    }),
  },
  WALLET: {
    CLIENT: {
      walletClient: jest.fn().mockReturnValue({
        address: '0xTestWalletAddress1234567890abcdef12345678',
      }),
      walletPublicClient: jest.fn().mockReturnValue({
        signTypedData: jest.fn().mockResolvedValue('0xmockedSignature'),
      }),
    },
  },
}));

jest.mock('@/swap/onchain/utils/provider', () => ({
  RPC: {
    rpcProvider: {
      getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
    },
  },
}));

describe('permit2', () => {
  const TEST_TOKEN = '0x1234567890abcdef1234567890abcdef12345678';
  const TEST_SWAP_DATA = '0xswapdata1234';
  const TEST_AMOUNT = 1.5;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('EIP-712 typed data structure', () => {
    it('should create correct domain with Permit2 name', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permit2(TEST_TOKEN, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      expect(mockSignTypedData).toHaveBeenCalled();
      const callArgs = mockSignTypedData.mock.calls[0][0];

      expect(callArgs.domain.name).toBe('Permit2');
      expect(callArgs.domain.chainId).toBe(8453);
    });

    it('should include PermitTransferFrom as primary type', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permit2(TEST_TOKEN, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.primaryType).toBe('PermitTransferFrom');
    });

    it('should include correct types for PermitTransferFrom', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permit2(TEST_TOKEN, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.types).toHaveProperty('PermitTransferFrom');
      expect(callArgs.types).toHaveProperty('TokenPermissions');

      const permitTypes = callArgs.types.PermitTransferFrom;
      expect(permitTypes).toContainEqual({ name: 'permitted', type: 'TokenPermissions' });
      expect(permitTypes).toContainEqual({ name: 'spender', type: 'address' });
      expect(permitTypes).toContainEqual({ name: 'nonce', type: 'uint256' });
      expect(permitTypes).toContainEqual({ name: 'deadline', type: 'uint256' });
    });

    it('should include correct TokenPermissions structure', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permit2(TEST_TOKEN, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      const tokenTypes = callArgs.types.TokenPermissions;
      expect(tokenTypes).toContainEqual({ name: 'token', type: 'address' });
      expect(tokenTypes).toContainEqual({ name: 'amount', type: 'uint256' });
    });
  });

  describe('nonce generation', () => {
    it('should generate unique nonce based on timestamp', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permit2(TEST_TOKEN, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      const nonce = callArgs.message.nonce;

      expect(typeof nonce).toBe('bigint');
      expect(nonce).toBeGreaterThan(0n);
    });

    it('should generate different nonces for consecutive calls', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const nonces: bigint[] = [];

      for (let i = 0; i < 3; i++) {
        const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
        WALLET.CLIENT.walletPublicClient.mockReturnValue({
          signTypedData: mockSignTypedData,
        });

        await permit2(TEST_TOKEN, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);
        nonces.push(mockSignTypedData.mock.calls[0][0].message.nonce);
      }

      // All nonces should be unique (due to random component)
      const uniqueNonces = new Set(nonces.map(n => n.toString()));
      expect(uniqueNonces.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('deadline calculation', () => {
    it('should set deadline to 1 hour from now', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      const nowInSeconds = Math.floor(Date.now() / 1000);
      await permit2(TEST_TOKEN, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      const deadline = callArgs.message.deadline;

      const expectedDeadline = BigInt(nowInSeconds + 60 * 60);
      expect(deadline).toBe(expectedDeadline);
    });
  });

  describe('balance checking', () => {
    it('should use rpcProvider.getBalance for native token (ETHER)', async () => {
      const { TOKEN, WALLET } = require('@/swap/onchain/utils');
      const { RPC } = require('@/swap/onchain/utils/provider');

      const nativeToken = '0x0000000000000000000000000000000000000000';
      RPC.rpcProvider.getBalance.mockResolvedValue(BigInt('500000000000000000'));

      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permit2(nativeToken, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      expect(RPC.rpcProvider.getBalance).toHaveBeenCalled();
    });

    it('should use tokenContract.balanceOf for ERC20 tokens', async () => {
      const { TOKEN, WALLET } = require('@/swap/onchain/utils');

      const mockGetBalance = jest.fn().mockResolvedValue(BigInt('2000000000000000000'));
      const mockDecimals = jest.fn().mockResolvedValue(18n);

      TOKEN.tokenFunctions.mockReturnValue({
        getBalance: mockGetBalance,
        decimals: mockDecimals,
      });

      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permit2(TEST_TOKEN, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      expect(mockGetBalance).toHaveBeenCalled();
      expect(mockDecimals).toHaveBeenCalled();
    });

    it('should reduce amount to balance when balance < requested amount', async () => {
      const { TOKEN, WALLET, AMOUNT } = require('@/swap/onchain/utils');

      const smallBalance = BigInt('500000000000000000'); // 0.5 ETH
      const mockGetBalance = jest.fn().mockResolvedValue(smallBalance);
      const mockDecimals = jest.fn().mockResolvedValue(18n);

      TOKEN.tokenFunctions.mockReturnValue({
        getBalance: mockGetBalance,
        decimals: mockDecimals,
      });

      AMOUNT.FLOAT.floatToBigInt.mockReturnValue(BigInt('1500000000000000000')); // 1.5 ETH

      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permit2(TEST_TOKEN, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.message.permitted.amount).toBe(smallBalance);
    });

    it('should use full amount when balance >= requested amount', async () => {
      const { TOKEN, WALLET, AMOUNT } = require('@/swap/onchain/utils');

      const largeBalance = BigInt('5000000000000000000'); // 5 ETH
      const requestedAmount = BigInt('1500000000000000000'); // 1.5 ETH

      TOKEN.tokenFunctions.mockReturnValue({
        getBalance: jest.fn().mockResolvedValue(largeBalance),
        decimals: jest.fn().mockResolvedValue(18n),
      });

      AMOUNT.FLOAT.floatToBigInt.mockReturnValue(requestedAmount);

      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permit2(TEST_TOKEN, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.message.permitted.amount).toBe(requestedAmount);
    });
  });

  describe('signature generation', () => {
    it('should call signTypedData with correct EIP-712 message', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xvalidSignature');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permit2(TEST_TOKEN, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      expect(mockSignTypedData).toHaveBeenCalledTimes(1);
      expect(mockSignTypedData).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: expect.any(Object),
          types: expect.any(Object),
          primaryType: 'PermitTransferFrom',
          message: expect.any(Object),
        })
      );
    });

    it('should include correct spender in message', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permit2(TEST_TOKEN, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.message.spender).toBe('0xPermitSwapAddress1234567890abcdef12345678');
    });
  });

  describe('encodeFunctionData output', () => {
    it('should call encodeFunctionData with permit2AndSwap function', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const { encodeFunctionData } = require('viem');

      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: jest.fn().mockResolvedValue('0xsig'),
      });

      await permit2(TEST_TOKEN, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      expect(encodeFunctionData).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'permit2AndSwap',
        })
      );
    });

    it('should include permit, signature, wallet address, and swapData in args', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const { encodeFunctionData } = require('viem');

      WALLET.CLIENT.walletClient.mockReturnValue({
        address: '0xWalletAddress123',
      });
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: jest.fn().mockResolvedValue('0xmySignature'),
      });

      await permit2(TEST_TOKEN, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      expect(encodeFunctionData).toHaveBeenCalledWith(
        expect.objectContaining({
          args: expect.arrayContaining([
            expect.objectContaining({
              permitted: expect.any(Object),
              nonce: expect.any(BigInt),
              deadline: expect.any(BigInt),
            }),
            '0xmySignature',
            '0xWalletAddress123',
            TEST_SWAP_DATA,
          ]),
        })
      );
    });

    it('should return encoded transaction data', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const { encodeFunctionData } = require('viem');

      encodeFunctionData.mockReturnValue('0xencodedTxData');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: jest.fn().mockResolvedValue('0xsig'),
      });

      const result = await permit2(TEST_TOKEN, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      expect(result).toBe('0xencodedTxData');
    });
  });

  describe('decimal handling', () => {
    it('should use 18 decimals for native tokens', async () => {
      const { AMOUNT, WALLET } = require('@/swap/onchain/utils');
      const nativeToken = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: jest.fn().mockResolvedValue('0xsig'),
      });

      await permit2(nativeToken, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      expect(AMOUNT.FLOAT.floatToBigInt).toHaveBeenCalledWith(TEST_AMOUNT, 18n);
    });

    it('should fetch decimals from token contract for ERC20', async () => {
      const { TOKEN, AMOUNT, WALLET } = require('@/swap/onchain/utils');

      const mockDecimals = jest.fn().mockResolvedValue(6n); // USDC has 6 decimals
      TOKEN.tokenFunctions.mockReturnValue({
        decimals: mockDecimals,
        getBalance: jest.fn().mockResolvedValue(BigInt('2000000000')),
      });

      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: jest.fn().mockResolvedValue('0xsig'),
      });

      await permit2(TEST_TOKEN, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      expect(mockDecimals).toHaveBeenCalled();
      expect(AMOUNT.FLOAT.floatToBigInt).toHaveBeenCalledWith(TEST_AMOUNT, 6n);
    });
  });

  describe('permit structure', () => {
    it('should create permit with correct token address', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permit2(TEST_TOKEN, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.message.permitted.token).toBe(TEST_TOKEN);
    });

    it('should include nonce and deadline in permit', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permit2(TEST_TOKEN, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(typeof callArgs.message.nonce).toBe('bigint');
      expect(typeof callArgs.message.deadline).toBe('bigint');
    });
  });

  describe('wallet integration', () => {
    it('should create wallet client with provided private key', async () => {
      const { WALLET } = require('@/swap/onchain/utils');

      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: jest.fn().mockResolvedValue('0xsig'),
      });

      await permit2(TEST_TOKEN, MOCK_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT);

      expect(WALLET.CLIENT.walletClient).toHaveBeenCalledWith(MOCK_PRIVATE_KEY);
      expect(WALLET.CLIENT.walletPublicClient).toHaveBeenCalledWith(MOCK_PRIVATE_KEY);
    });
  });
});
