/**
 * Permit2 utility tests
 */

import { jest, describe, it, expect } from '@jest/globals';

import {
  generateNonce,
  generateDeadline,
  createPermit2Domain,
  createPermitMessage,
  createPermitWithWitnessMessage,
  createWitnessFromCallData,
  signPermit2,
  signPermitWithWitness,
  encodePermit2AndSwap,
  encodePermit2WithWitness,
  buildSecureSwapTransaction,
  type PermitData,
  type WitnessData,
} from './permit2.js';
import { PERMIT2_ADDRESS } from '../constants/chains.js';

describe('Permit2 Utilities', () => {
  describe('generateNonce', () => {
    it('should generate a unique nonce', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();

      expect(typeof nonce1).toBe('bigint');
      expect(nonce1).toBeGreaterThan(0n);
      // Very unlikely to be the same due to timestamp + random
      expect(nonce1).not.toBe(nonce2);
    });

    it('should generate cryptographically random nonce', () => {
      const nonce = generateNonce();

      // Nonce should be a positive bigint (from crypto.randomBytes)
      expect(typeof nonce).toBe('bigint');
      expect(nonce).toBeGreaterThan(0n);
    });
  });

  describe('generateDeadline', () => {
    it('should generate deadline in the future', () => {
      const now = Math.floor(Date.now() / 1000);
      const deadline = generateDeadline(60);

      expect(deadline).toBeGreaterThan(BigInt(now));
      expect(deadline).toBeLessThanOrEqual(BigInt(now + 61));
    });

    it('should use default seconds if not provided', () => {
      const now = Math.floor(Date.now() / 1000);
      const deadline = generateDeadline();

      // Default is PERMIT_DEADLINE_SECURE (60 seconds)
      expect(deadline).toBeGreaterThan(BigInt(now));
      expect(deadline).toBeLessThanOrEqual(BigInt(now + 61));
    });

    it('should respect custom seconds', () => {
      const now = Math.floor(Date.now() / 1000);
      const deadline = generateDeadline(3600); // 1 hour

      expect(deadline).toBeGreaterThan(BigInt(now + 3500));
      expect(deadline).toBeLessThanOrEqual(BigInt(now + 3601));
    });
  });

  describe('createPermit2Domain', () => {
    it('should create domain with default Permit2 address', () => {
      const domain = createPermit2Domain(8453);

      expect(domain).toEqual({
        name: 'Permit2',
        chainId: 8453,
        verifyingContract: PERMIT2_ADDRESS,
      });
    });

    it('should create domain with custom Permit2 address', () => {
      const customAddress = '0x1234567890123456789012345678901234567890';
      const domain = createPermit2Domain(1, customAddress);

      expect(domain).toEqual({
        name: 'Permit2',
        chainId: 1,
        verifyingContract: customAddress,
      });
    });

    it('should work with different chain IDs', () => {
      expect(createPermit2Domain(1).chainId).toBe(1);
      expect(createPermit2Domain(8453).chainId).toBe(8453);
      expect(createPermit2Domain(42161).chainId).toBe(42161);
    });
  });

  describe('createPermitMessage', () => {
    it('should create permit message from permit data', () => {
      const permit: PermitData = {
        permitted: {
          token: '0xToken',
          amount: BigInt('1000000'),
        },
        nonce: BigInt('12345'),
        deadline: BigInt('1700000000'),
        spender: '0xSpender',
      };

      const message = createPermitMessage(permit);

      expect(message).toEqual({
        permitted: {
          token: '0xToken',
          amount: BigInt('1000000'),
        },
        spender: '0xSpender',
        nonce: BigInt('12345'),
        deadline: BigInt('1700000000'),
      });
    });
  });

  describe('createPermitWithWitnessMessage', () => {
    it('should create permit message with witness', () => {
      const permit: PermitData = {
        permitted: {
          token: '0xToken',
          amount: BigInt('1000000'),
        },
        nonce: BigInt('12345'),
        deadline: BigInt('1700000000'),
        spender: '0xSpender',
      };

      const witness: WitnessData = {
        target: '0xTarget',
        callDataHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const message = createPermitWithWitnessMessage(permit, witness);

      expect(message).toEqual({
        permitted: {
          token: '0xToken',
          amount: BigInt('1000000'),
        },
        spender: '0xSpender',
        nonce: BigInt('12345'),
        deadline: BigInt('1700000000'),
        witness: {
          target: '0xTarget',
          callDataHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      });
    });
  });

  describe('createWitnessFromCallData', () => {
    it('should create witness with target and call data hash', () => {
      const targetAddress = '0xdef1c0ded9bec7f1a1670819833240f027b25eff';
      const swapCallData = '0x1234567890abcdef';

      const witness = createWitnessFromCallData(targetAddress, swapCallData);

      expect(witness.target).toBe(targetAddress);
      expect(witness.callDataHash).toBeDefined();
      expect(witness.callDataHash.startsWith('0x')).toBe(true);
      expect(witness.callDataHash.length).toBe(66); // 0x + 64 hex chars
    });

    it('should generate consistent hash for same input', () => {
      const witness1 = createWitnessFromCallData('0xTarget', '0xData123');
      const witness2 = createWitnessFromCallData('0xTarget', '0xData123');

      expect(witness1.callDataHash).toBe(witness2.callDataHash);
    });

    it('should generate different hash for different input', () => {
      const witness1 = createWitnessFromCallData('0xTarget', '0xData1');
      const witness2 = createWitnessFromCallData('0xTarget', '0xData2');

      expect(witness1.callDataHash).not.toBe(witness2.callDataHash);
    });
  });

  describe('signPermit2', () => {
    it('should sign permit with wallet client', async () => {
      const mockSignature = '0xmocksignature123' as `0x${string}`;
      const mockWalletClient = {
        signTypedData: jest.fn().mockResolvedValue(mockSignature as never),
      };

      const permit: PermitData = {
        permitted: {
          token: '0xToken',
          amount: BigInt('1000000'),
        },
        nonce: BigInt('12345'),
        deadline: BigInt('1700000000'),
        spender: '0xSpender',
      };

      const signature = await signPermit2(mockWalletClient, permit, 8453);

      expect(mockWalletClient.signTypedData).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: expect.objectContaining({
            name: 'Permit2',
            chainId: 8453,
          }),
          primaryType: 'PermitTransferFrom',
        }),
      );
      expect(signature).toBe(mockSignature);
    });

    it('should use custom permit2 address', async () => {
      const mockWalletClient = {
        signTypedData: jest.fn().mockResolvedValue('0xsig' as never),
      };

      const permit: PermitData = {
        permitted: { token: '0xToken', amount: BigInt('1') },
        nonce: BigInt('1'),
        deadline: BigInt('1'),
        spender: '0xSpender',
      };

      const customAddress = '0x1234567890123456789012345678901234567890';
      await signPermit2(mockWalletClient, permit, 1, customAddress);

      expect(mockWalletClient.signTypedData).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: expect.objectContaining({
            verifyingContract: customAddress,
          }),
        }),
      );
    });
  });

  describe('signPermitWithWitness', () => {
    it('should sign permit with witness using wallet client', async () => {
      const mockSignature = '0xmocksignature456' as `0x${string}`;
      const mockWalletClient = {
        signTypedData: jest.fn().mockResolvedValue(mockSignature as never),
      };

      const permit: PermitData = {
        permitted: {
          token: '0xToken',
          amount: BigInt('1000000'),
        },
        nonce: BigInt('12345'),
        deadline: BigInt('1700000000'),
        spender: '0xSpender',
      };

      const witness: WitnessData = {
        target: '0xTarget',
        callDataHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const signature = await signPermitWithWitness(
        mockWalletClient,
        permit,
        witness,
        8453,
      );

      expect(mockWalletClient.signTypedData).toHaveBeenCalledWith(
        expect.objectContaining({
          primaryType: 'PermitWitnessTransferFrom',
          types: expect.objectContaining({
            Payload: expect.any(Array),
          }),
        }),
      );
      expect(signature).toBe(mockSignature);
    });
  });

  describe('encodePermit2AndSwap', () => {
    it('should encode permit2AndSwap transaction data', () => {
      const permit = {
        permitted: {
          token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: BigInt('1000000000'),
        },
        nonce: BigInt('12345'),
        deadline: BigInt('1700000000'),
      };

      const signature = '0x1234567890abcdef' as `0x${string}`;
      const owner = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      const swapData = '0xabcdef123456' as `0x${string}`;

      const encoded = encodePermit2AndSwap(permit, signature, owner, swapData);

      expect(encoded).toBeDefined();
      expect(encoded.startsWith('0x')).toBe(true);
      expect(encoded.length).toBeGreaterThan(10);
    });
  });

  describe('encodePermit2WithWitness', () => {
    it('should encode permit2 with witness transaction data', () => {
      const permit = {
        permitted: {
          token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: BigInt('1000000000'),
        },
        nonce: BigInt('12345'),
        deadline: BigInt('1700000000'),
      };

      const owner = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      const swapData = '0xabcdef123456' as `0x${string}`;
      const signature = '0x1234567890abcdef' as `0x${string}`;

      const encoded = encodePermit2WithWitness(
        permit,
        owner,
        swapData,
        signature,
      );

      expect(encoded).toBeDefined();
      expect(encoded.startsWith('0x')).toBe(true);
      expect(encoded.length).toBeGreaterThan(10);
    });
  });

  describe('buildSecureSwapTransaction', () => {
    it('should build complete secure swap transaction', async () => {
      const mockSignature =
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab1c' as `0x${string}`;

      const mockWalletClient = {
        signTypedData: jest.fn().mockResolvedValue(mockSignature as never),
      };

      const result = await buildSecureSwapTransaction({
        tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        amount: BigInt('1000000000'),
        walletClient: mockWalletClient,
        walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        swapTargetAddress: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
        swapCallData: '0x1234567890abcdef' as `0x${string}`,
        permitSwapAddress: '0x1234567890123456789012345678901234567890',
        chainId: 8453,
      });

      expect(result.callData).toBeDefined();
      expect(result.callData.startsWith('0x')).toBe(true);
      expect(result.permit).toBeDefined();
      expect(result.permit.permitted.token).toBe(
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      );
      expect(result.permit.permitted.amount).toBe(BigInt('1000000000'));
      expect(result.signature).toBe(mockSignature);
    });

    it('should use custom deadline seconds', async () => {
      const mockWalletClient = {
        signTypedData: jest.fn().mockResolvedValue('0xsig' as never),
      };

      const beforeTime = Math.floor(Date.now() / 1000);

      const result = await buildSecureSwapTransaction({
        tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        amount: BigInt('1'),
        walletClient: mockWalletClient,
        walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        swapTargetAddress: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
        swapCallData: '0x' as `0x${string}`,
        permitSwapAddress: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        deadlineSeconds: 120,
      });

      const afterTime = Math.floor(Date.now() / 1000);

      expect(Number(result.permit.deadline)).toBeGreaterThanOrEqual(
        beforeTime + 120,
      );
      expect(Number(result.permit.deadline)).toBeLessThanOrEqual(
        afterTime + 121,
      );
    });

    it('should use custom permit2 address', async () => {
      const mockWalletClient = {
        signTypedData: jest.fn().mockResolvedValue('0xsig' as never),
      };

      const customPermit2 = '0x0000000000000000000000000000000000000002';

      await buildSecureSwapTransaction({
        tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        amount: BigInt('1'),
        walletClient: mockWalletClient,
        walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        swapTargetAddress: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
        swapCallData: '0x' as `0x${string}`,
        permitSwapAddress: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        permit2Address: customPermit2,
      });

      expect(mockWalletClient.signTypedData).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: expect.objectContaining({
            verifyingContract: customPermit2,
          }),
        }),
      );
    });
  });
});
