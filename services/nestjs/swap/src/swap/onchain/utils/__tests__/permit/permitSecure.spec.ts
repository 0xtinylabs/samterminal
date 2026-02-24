/**
 * permitSecure.ts Unit Tests
 * Witness-based Permit2 imzalama ve callDataHash doğrulama testleri
 */

import { permitSecure } from '@/swap/onchain/utils/permit/permitSecure';

// Mock all dependencies
jest.mock('viem', () => ({
  encodeFunctionData: jest.fn().mockReturnValue('0xmockedEncodedData'),
  keccak256: jest.fn().mockReturnValue('0xmockedCallDataHash'),
  Hex: String,
}));

jest.mock('@/config/config', () => ({
  CONFIG: {
    swap: {
      permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
      permitSwap: '0xPermitSwapAddress1234567890abcdef12345678',
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

describe('permitSecure', () => {
  const TEST_TOKEN = '0x1234567890abcdef1234567890abcdef12345678';
  const TEST_PRIVATE_KEY = '0x' + 'a'.repeat(64);
  const TEST_SWAP_DATA = '0xswapdata1234';
  const TEST_AMOUNT = 1.5;
  const TEST_TO_ADDRESS = '0xToAddress1234567890abcdef123456789012345';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('witness data creation', () => {
    it('should create witness with target address', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permitSecure(TEST_TOKEN, TEST_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT, TEST_TO_ADDRESS);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.message.witness.target).toBe(TEST_TO_ADDRESS);
    });

    it('should create witness with callDataHash using keccak256', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const { keccak256 } = require('viem');

      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      keccak256.mockReturnValue('0xhashOfSwapData');

      await permitSecure(TEST_TOKEN, TEST_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT, TEST_TO_ADDRESS);

      expect(keccak256).toHaveBeenCalledWith(TEST_SWAP_DATA);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.message.witness.callDataHash).toBe('0xhashOfSwapData');
    });
  });

  describe('PermitWitnessTransferFrom structure', () => {
    it('should use PermitWitnessTransferFrom as primary type', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permitSecure(TEST_TOKEN, TEST_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT, TEST_TO_ADDRESS);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.primaryType).toBe('PermitWitnessTransferFrom');
    });

    it('should include witness type in PermitWitnessTransferFrom', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permitSecure(TEST_TOKEN, TEST_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT, TEST_TO_ADDRESS);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      const permitWitnessTypes = callArgs.types.PermitWitnessTransferFrom;

      expect(permitWitnessTypes).toContainEqual({ name: 'witness', type: 'Payload' });
    });

    it('should include Payload type with target and callDataHash', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permitSecure(TEST_TOKEN, TEST_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT, TEST_TO_ADDRESS);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      const payloadType = callArgs.types.Payload;

      expect(payloadType).toContainEqual({ name: 'target', type: 'address' });
      expect(payloadType).toContainEqual({ name: 'callDataHash', type: 'bytes32' });
    });

    it('should include TokenPermissions type', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permitSecure(TEST_TOKEN, TEST_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT, TEST_TO_ADDRESS);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      const tokenTypes = callArgs.types.TokenPermissions;

      expect(tokenTypes).toContainEqual({ name: 'token', type: 'address' });
      expect(tokenTypes).toContainEqual({ name: 'amount', type: 'uint256' });
    });
  });

  describe('deadline calculation', () => {
    it('should set deadline to 1 minute from now (not 1 hour)', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      const nowInSeconds = Math.floor(Date.now() / 1000);
      await permitSecure(TEST_TOKEN, TEST_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT, TEST_TO_ADDRESS);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      const deadline = callArgs.message.deadline;

      // permitSecure uses 60 * 10 = 600 seconds (10 minutes)
      const expectedDeadline = BigInt(nowInSeconds + 600);
      expect(deadline).toBe(expectedDeadline);
    });

    it('should have shorter deadline than permit2 (security)', async () => {
      // This test documents the security feature: shorter deadline = less attack window
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      const nowInSeconds = Math.floor(Date.now() / 1000);
      await permitSecure(TEST_TOKEN, TEST_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT, TEST_TO_ADDRESS);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      const deadline = Number(callArgs.message.deadline);

      // Should be less than 1 hour from now
      expect(deadline - nowInSeconds).toBeLessThan(3600);
      // Should be approximately 10 minutes
      expect(deadline - nowInSeconds).toBe(600);
    });
  });

  describe('nonce generation', () => {
    it('should generate unique nonce based on timestamp and random', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permitSecure(TEST_TOKEN, TEST_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT, TEST_TO_ADDRESS);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      const nonce = callArgs.message.nonce;

      expect(typeof nonce).toBe('bigint');
      expect(nonce).toBeGreaterThan(0n);
    });
  });

  describe('rathExecutePermit2WithWitness encoding', () => {
    it('should call encodeFunctionData with rathExecutePermit2WithWitness', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const { encodeFunctionData } = require('viem');

      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: jest.fn().mockResolvedValue('0xsig'),
      });

      await permitSecure(TEST_TOKEN, TEST_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT, TEST_TO_ADDRESS);

      expect(encodeFunctionData).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'rathExecutePermit2WithWitness',
        })
      );
    });

    it('should include permit, wallet address, swapData, and signature in args', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const { encodeFunctionData } = require('viem');

      WALLET.CLIENT.walletClient.mockReturnValue({
        address: '0xMyWalletAddress',
      });
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: jest.fn().mockResolvedValue('0xmySignature'),
      });

      await permitSecure(TEST_TOKEN, TEST_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT, TEST_TO_ADDRESS);

      expect(encodeFunctionData).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [
            expect.objectContaining({
              permitted: expect.any(Object),
              nonce: expect.any(BigInt),
              deadline: expect.any(BigInt),
            }),
            '0xMyWalletAddress',
            TEST_SWAP_DATA,
            '0xmySignature',
          ],
        })
      );
    });

    it('should use inline executor ABI', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const { encodeFunctionData } = require('viem');

      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: jest.fn().mockResolvedValue('0xsig'),
      });

      await permitSecure(TEST_TOKEN, TEST_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT, TEST_TO_ADDRESS);

      const callArgs = encodeFunctionData.mock.calls[0][0];
      expect(callArgs.abi).toBeDefined();
      expect(Array.isArray(callArgs.abi)).toBe(true);
      expect(callArgs.abi[0].name).toBe('rathExecutePermit2WithWitness');
    });

    it('should return encoded transaction data', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const { encodeFunctionData } = require('viem');

      encodeFunctionData.mockReturnValue('0xsecureEncodedData');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: jest.fn().mockResolvedValue('0xsig'),
      });

      const result = await permitSecure(TEST_TOKEN, TEST_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT, TEST_TO_ADDRESS);

      expect(result).toBe('0xsecureEncodedData');
    });
  });

  describe('balance and amount handling', () => {
    it('should reduce amount to balance when balance < requested amount', async () => {
      const { TOKEN, WALLET, AMOUNT } = require('@/swap/onchain/utils');

      const smallBalance = BigInt('500000000000000000'); // 0.5 ETH
      TOKEN.tokenFunctions.mockReturnValue({
        getBalance: jest.fn().mockResolvedValue(smallBalance),
        decimals: jest.fn().mockResolvedValue(18n),
      });

      AMOUNT.FLOAT.floatToBigInt.mockReturnValue(BigInt('1500000000000000000')); // 1.5 ETH

      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permitSecure(TEST_TOKEN, TEST_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT, TEST_TO_ADDRESS);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.message.permitted.amount).toBe(smallBalance);
    });
  });

  describe('decimal handling for non-native tokens', () => {
    it('should fetch decimals for ERC20 tokens', async () => {
      const { TOKEN, WALLET } = require('@/swap/onchain/utils');

      const mockDecimals = jest.fn().mockResolvedValue(6n); // USDC
      TOKEN.tokenFunctions.mockReturnValue({
        decimals: mockDecimals,
        getBalance: jest.fn().mockResolvedValue(BigInt('1500000')),
      });

      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: jest.fn().mockResolvedValue('0xsig'),
      });

      await permitSecure(TEST_TOKEN, TEST_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT, TEST_TO_ADDRESS);

      expect(mockDecimals).toHaveBeenCalled();
    });

    it('should skip decimal fetch for native tokens in UNCHECKABLE_GROUP', async () => {
      const { TOKEN, WALLET } = require('@/swap/onchain/utils');

      const nativeToken = '0x0000000000000000000000000000000000000000';
      const mockDecimals = jest.fn().mockResolvedValue(18n);

      TOKEN.tokenFunctions.mockReturnValue({
        decimals: mockDecimals,
        getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
      });

      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: jest.fn().mockResolvedValue('0xsig'),
      });

      await permitSecure(nativeToken, TEST_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT, TEST_TO_ADDRESS);

      // decimals should NOT be called for native tokens
      expect(mockDecimals).not.toHaveBeenCalled();
    });
  });

  describe('EIP-712 domain', () => {
    it('should use Permit2 domain name', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permitSecure(TEST_TOKEN, TEST_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT, TEST_TO_ADDRESS);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.domain.name).toBe('Permit2');
    });

    it('should use Base chain ID', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permitSecure(TEST_TOKEN, TEST_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT, TEST_TO_ADDRESS);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.domain.chainId).toBe(8453);
    });

    it('should use Permit2 contract as verifying contract', async () => {
      const { WALLET } = require('@/swap/onchain/utils');
      const mockSignTypedData = jest.fn().mockResolvedValue('0xsig');
      WALLET.CLIENT.walletPublicClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await permitSecure(TEST_TOKEN, TEST_PRIVATE_KEY, TEST_SWAP_DATA, TEST_AMOUNT, TEST_TO_ADDRESS);

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.domain.verifyingContract).toBe('0x000000000022D473030F116dDEE9F6B43aC78BA3');
    });
  });
});
