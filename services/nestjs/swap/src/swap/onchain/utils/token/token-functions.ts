import { Contract, Transaction } from 'ethers';
import { TokenEstimateFunctions, TokenFunctions } from './types/token';

export const tokenFunctions = (token: Contract): TokenFunctions => {
  return {
    name: async (...args) => (await token.name(...args)) as string,
    symbol: async (...args) => (await token.symbol(...args)) as string,
    version: async (...args) => (await token.version(...args)) as number,
    nonce: async (...args) => (await token.nonces(...args)) as number,
    getBalance: async (...args) => (await token.balanceOf(...args)) as bigint,
    decimals: async (...args) => (await token.decimals(...args)) as bigint,
    transfer: async (...args) => (await token.transfer(...args)) as Transaction,
    allowance: async (...args) => (await token.allowance(...args)) as bigint,
    approve: async (...args) =>
      (await token.approve(...args)) as { wait: () => Promise<void> },
    transferFrom: async (...args) =>
      (await token.transfer(...args)) as Transaction,
  };
};

export const tokenFunctionsEstimate = (
  token: Contract,
): TokenEstimateFunctions => {
  return {
    approve: async (...args) => await token.approve.estimateGas(...args),
  };
};
