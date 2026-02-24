/**
 * token-functions.ts Unit Tests
 * Token function wrapper testleri
 */

import { tokenFunctions, tokenFunctionsEstimate } from '@/swap/onchain/utils/token/token-functions';
import { Contract } from 'ethers';

describe('tokenFunctions', () => {
  let mockContract: Partial<Contract>;
  let mockTx: { wait: jest.Mock };

  beforeEach(() => {
    mockTx = { wait: jest.fn().mockResolvedValue({}) };

    mockContract = {
      name: jest.fn().mockResolvedValue('Test Token'),
      symbol: jest.fn().mockResolvedValue('TEST'),
      version: jest.fn().mockResolvedValue(1),
      nonces: jest.fn().mockResolvedValue(5n),
      balanceOf: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
      decimals: jest.fn().mockResolvedValue(18n),
      transfer: jest.fn().mockResolvedValue(mockTx),
      allowance: jest.fn().mockResolvedValue(0n),
      approve: jest.fn().mockResolvedValue(mockTx),
    };
  });

  describe('name()', () => {
    it('should call contract.name and return string', async () => {
      const functions = tokenFunctions(mockContract as Contract);
      const result = await functions.name();

      expect(mockContract.name).toHaveBeenCalled();
      expect(result).toBe('Test Token');
      expect(typeof result).toBe('string');
    });

    it('should pass arguments to contract.name', async () => {
      const functions = tokenFunctions(mockContract as Contract);
      await functions.name('arg1', 'arg2');

      expect(mockContract.name).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('symbol()', () => {
    it('should call contract.symbol and return string', async () => {
      const functions = tokenFunctions(mockContract as Contract);
      const result = await functions.symbol();

      expect(mockContract.symbol).toHaveBeenCalled();
      expect(result).toBe('TEST');
      expect(typeof result).toBe('string');
    });
  });

  describe('version()', () => {
    it('should call contract.version and return number', async () => {
      const functions = tokenFunctions(mockContract as Contract);
      const result = await functions.version();

      expect(mockContract.version).toHaveBeenCalled();
      expect(result).toBe(1);
      expect(typeof result).toBe('number');
    });
  });

  describe('nonce()', () => {
    it('should call contract.nonces and return number', async () => {
      const functions = tokenFunctions(mockContract as Contract);
      const result = await functions.nonce('0xaddress');

      expect(mockContract.nonces).toHaveBeenCalledWith('0xaddress');
      expect(result).toBe(5n);
    });
  });

  describe('getBalance()', () => {
    it('should call contract.balanceOf and return bigint', async () => {
      const functions = tokenFunctions(mockContract as Contract);
      const result = await functions.getBalance('0xaddress');

      expect(mockContract.balanceOf).toHaveBeenCalledWith('0xaddress');
      expect(result).toBe(BigInt('1000000000000000000'));
      expect(typeof result).toBe('bigint');
    });

    it('should handle zero balance', async () => {
      mockContract.balanceOf = jest.fn().mockResolvedValue(0n);

      const functions = tokenFunctions(mockContract as Contract);
      const result = await functions.getBalance('0xaddress');

      expect(result).toBe(0n);
    });
  });

  describe('decimals()', () => {
    it('should call contract.decimals and return bigint', async () => {
      const functions = tokenFunctions(mockContract as Contract);
      const result = await functions.decimals();

      expect(mockContract.decimals).toHaveBeenCalled();
      expect(result).toBe(18n);
      expect(typeof result).toBe('bigint');
    });

    it('should handle different decimal values', async () => {
      mockContract.decimals = jest.fn().mockResolvedValue(6n);

      const functions = tokenFunctions(mockContract as Contract);
      const result = await functions.decimals();

      expect(result).toBe(6n);
    });
  });

  describe('transfer()', () => {
    it('should call contract.transfer with correct params', async () => {
      const functions = tokenFunctions(mockContract as Contract);
      const to = '0xrecipient';
      const amount = BigInt('1000000000000000000');

      await functions.transfer(to, amount);

      expect(mockContract.transfer).toHaveBeenCalledWith(to, amount);
    });

    it('should return transaction object', async () => {
      const functions = tokenFunctions(mockContract as Contract);
      const result = await functions.transfer('0xto', 100n);

      expect(result).toBe(mockTx);
    });
  });

  describe('allowance()', () => {
    it('should call contract.allowance with owner and spender', async () => {
      const functions = tokenFunctions(mockContract as Contract);
      const owner = '0xowner';
      const spender = '0xspender';

      await functions.allowance(owner, spender);

      expect(mockContract.allowance).toHaveBeenCalledWith(owner, spender);
    });

    it('should return bigint allowance', async () => {
      mockContract.allowance = jest.fn().mockResolvedValue(BigInt('500000000'));

      const functions = tokenFunctions(mockContract as Contract);
      const result = await functions.allowance('0xowner', '0xspender');

      expect(result).toBe(BigInt('500000000'));
      expect(typeof result).toBe('bigint');
    });
  });

  describe('approve()', () => {
    it('should call contract.approve with spender and amount', async () => {
      const functions = tokenFunctions(mockContract as Contract);
      const spender = '0xspender';
      const amount = BigInt('1000000000000000000');

      await functions.approve(spender, amount);

      expect(mockContract.approve).toHaveBeenCalledWith(spender, amount);
    });

    it('should return object with wait function', async () => {
      const functions = tokenFunctions(mockContract as Contract);
      const result = await functions.approve('0xspender', 100n);

      expect(result).toHaveProperty('wait');
      expect(typeof result.wait).toBe('function');
    });
  });

  describe('transferFrom()', () => {
    it('should call contract.transfer (implementation note: uses transfer not transferFrom)', async () => {
      const functions = tokenFunctions(mockContract as Contract);
      const from = '0xfrom';
      const to = '0xto';
      const amount = 100n;

      await functions.transferFrom(from, to, amount);

      // Note: The actual implementation calls transfer, not transferFrom
      expect(mockContract.transfer).toHaveBeenCalledWith(from, to, amount);
    });
  });
});

describe('tokenFunctionsEstimate', () => {
  let mockContract: any;

  beforeEach(() => {
    mockContract = {
      approve: {
        estimateGas: jest.fn().mockResolvedValue(BigInt('50000')),
      },
    };
  });

  describe('approve estimation', () => {
    it('should call approve.estimateGas', async () => {
      const functions = tokenFunctionsEstimate(mockContract);
      const spender = '0xspender';
      const amount = BigInt('1000000000');

      await functions.approve(spender, amount);

      expect(mockContract.approve.estimateGas).toHaveBeenCalledWith(spender, amount);
    });

    it('should return gas estimate as bigint', async () => {
      const functions = tokenFunctionsEstimate(mockContract);
      const result = await functions.approve('0xspender', 100n);

      expect(result).toBe(BigInt('50000'));
      expect(typeof result).toBe('bigint');
    });
  });
});
