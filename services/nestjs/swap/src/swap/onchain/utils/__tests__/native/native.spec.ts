/**
 * native.ts Unit Tests
 * Native ETH transaction testleri
 */

// Mock dependencies at the top level with factory functions
jest.mock('ethers', () => ({
  ethers: {
    getBigInt: jest.fn().mockImplementation((value: any) => {
      if (typeof value === 'bigint') return value;
      if (value === undefined || value === null) return undefined;
      return BigInt(value);
    }),
  },
}));

jest.mock('@/swap/onchain/utils', () => {
  const mockWalletClient = {
    account: {
      address: '0xTestWalletAddress',
    },
    chain: {
      id: 8453,
      name: 'Base',
    },
    sendTransaction: jest.fn().mockResolvedValue('0xmockedTxHash'),
  };

  const mockRpcProvider = {
    getTransactionCount: jest.fn().mockResolvedValue(5),
  };

  return {
    WALLET: {
      CLIENT: {
        walletPublicClient: jest.fn().mockReturnValue(mockWalletClient),
      },
    },
    PROVIDER: {
      RPC: {
        rpcProvider: mockRpcProvider,
      },
    },
    __mocks: {
      mockWalletClient,
      mockRpcProvider,
    },
  };
});

import { nativeTransaction } from '@/swap/onchain/utils/native/native';
import { NativeTransactionRequest } from '@/swap/onchain/utils/native/types/native';

describe('nativeTransaction', () => {
  const TEST_PRIVATE_KEY = '0x' + 'a'.repeat(64);
  const TEST_TO_ADDRESS = '0xRecipientAddress1234567890abcdef12345678';

  let mockBeforeSend: jest.Mock;
  let baseParams: NativeTransactionRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    mockBeforeSend = jest.fn().mockResolvedValue(undefined);

    baseParams = {
      wallet: {
        privateKey: TEST_PRIVATE_KEY,
        address: '0xSenderAddress1234567890abcdef1234567890',
      },
      transaction: {
        to: TEST_TO_ADDRESS,
        data: '0xswapdata',
        value: '1000000000000000000',
        gas: '21000',
        gasPrice: '1000000000',
      },
    };
  });

  describe('wallet client creation', () => {
    it('should create wallet client with private key', async () => {
      const { WALLET } = require('@/swap/onchain/utils');

      await nativeTransaction(baseParams, mockBeforeSend);

      expect(WALLET.CLIENT.walletPublicClient).toHaveBeenCalledWith(TEST_PRIVATE_KEY);
    });
  });

  describe('nonce handling', () => {
    it('should get nonce from RPC provider', async () => {
      const { PROVIDER } = require('@/swap/onchain/utils');

      await nativeTransaction(baseParams, mockBeforeSend);

      expect(PROVIDER.RPC.rpcProvider.getTransactionCount).toHaveBeenCalledWith(
        baseParams.wallet.address
      );
    });

    it('should use fetched nonce in transaction', async () => {
      const { PROVIDER, __mocks } = require('@/swap/onchain/utils');
      PROVIDER.RPC.rpcProvider.getTransactionCount.mockResolvedValue(10);

      await nativeTransaction(baseParams, mockBeforeSend);

      expect(__mocks.mockWalletClient.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          nonce: 10,
        })
      );
    });
  });

  describe('beforeSend callback', () => {
    it('should call beforeSend before sending transaction', async () => {
      const { __mocks } = require('@/swap/onchain/utils');
      const callOrder: string[] = [];

      mockBeforeSend.mockImplementation(async () => {
        callOrder.push('beforeSend');
      });

      __mocks.mockWalletClient.sendTransaction.mockImplementation(async () => {
        callOrder.push('sendTransaction');
        return '0xhash';
      });

      await nativeTransaction(baseParams, mockBeforeSend);

      expect(callOrder).toEqual(['beforeSend', 'sendTransaction']);
    });
  });

  describe('transaction parameters', () => {
    it('should include account in transaction', async () => {
      const { __mocks } = require('@/swap/onchain/utils');

      await nativeTransaction(baseParams, mockBeforeSend);

      expect(__mocks.mockWalletClient.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          account: __mocks.mockWalletClient.account,
        })
      );
    });

    it('should include to address', async () => {
      const { __mocks } = require('@/swap/onchain/utils');

      await nativeTransaction(baseParams, mockBeforeSend);

      expect(__mocks.mockWalletClient.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          to: TEST_TO_ADDRESS,
        })
      );
    });

    it('should include data', async () => {
      const { __mocks } = require('@/swap/onchain/utils');

      await nativeTransaction(baseParams, mockBeforeSend);

      expect(__mocks.mockWalletClient.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          data: '0xswapdata',
        })
      );
    });
  });

  describe('value conversion', () => {
    it('should convert value using ethers.getBigInt', async () => {
      const { ethers } = require('ethers');

      await nativeTransaction(baseParams, mockBeforeSend);

      expect(ethers.getBigInt).toHaveBeenCalledWith('1000000000000000000');
    });

    it('should default value to 0 when undefined', async () => {
      const { ethers } = require('ethers');

      const paramsWithoutValue = {
        ...baseParams,
        transaction: {
          ...baseParams.transaction,
          value: undefined,
        },
      };

      await nativeTransaction(paramsWithoutValue, mockBeforeSend);

      expect(ethers.getBigInt).toHaveBeenCalledWith(0);
    });
  });

  describe('return value', () => {
    it('should return transaction hash', async () => {
      const { __mocks } = require('@/swap/onchain/utils');
      __mocks.mockWalletClient.sendTransaction.mockResolvedValue('0xsuccessfulHash');

      const result = await nativeTransaction(baseParams, mockBeforeSend);

      expect(result).toEqual({ hash: '0xsuccessfulHash' });
    });

    it('should return NativeTransactionResponse type', async () => {
      const result = await nativeTransaction(baseParams, mockBeforeSend);

      expect(result).toHaveProperty('hash');
      expect(typeof result.hash).toBe('string');
    });
  });

  describe('error handling', () => {
    it('should propagate sendTransaction errors', async () => {
      const { __mocks, PROVIDER } = require('@/swap/onchain/utils');
      // Reset mocks
      PROVIDER.RPC.rpcProvider.getTransactionCount.mockResolvedValue(5);

      const txError = new Error('Transaction failed');
      __mocks.mockWalletClient.sendTransaction.mockRejectedValue(txError);

      await expect(nativeTransaction(baseParams, mockBeforeSend)).rejects.toThrow(
        'Transaction failed'
      );
    });

    it('should propagate nonce fetch errors', async () => {
      const { PROVIDER, __mocks } = require('@/swap/onchain/utils');
      // Reset other mocks
      __mocks.mockWalletClient.sendTransaction.mockResolvedValue('0xhash');

      PROVIDER.RPC.rpcProvider.getTransactionCount.mockRejectedValue(new Error('Nonce error'));

      await expect(nativeTransaction(baseParams, mockBeforeSend)).rejects.toThrow(
        'Nonce error'
      );
    });

    it('should propagate beforeSend errors', async () => {
      const { PROVIDER, __mocks } = require('@/swap/onchain/utils');
      // Reset mocks
      PROVIDER.RPC.rpcProvider.getTransactionCount.mockResolvedValue(5);
      __mocks.mockWalletClient.sendTransaction.mockResolvedValue('0xhash');

      mockBeforeSend.mockRejectedValue(new Error('beforeSend failed'));

      await expect(nativeTransaction(baseParams, mockBeforeSend)).rejects.toThrow(
        'beforeSend failed'
      );
    });
  });
});
