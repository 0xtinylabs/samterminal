/**
 * Permit2 fixtures for testing
 */

/**
 * Permit2 universal address
 */
export const PERMIT2_ADDRESS =
  '0x000000000022D473030F116dDEE9F6B43aC78BA3' as const;

/**
 * Permit data structure
 */
export interface PermitDataFixture {
  permitted: {
    token: string;
    amount: bigint;
  };
  nonce: bigint;
  deadline: bigint;
  spender: string;
}

/**
 * Witness data structure
 */
export interface WitnessDataFixture {
  target: string;
  callDataHash: string;
}

/**
 * EIP-712 domain for Permit2
 */
export interface Permit2DomainFixture {
  name: string;
  chainId: number;
  verifyingContract: string;
}

/**
 * Permit2 types for EIP-712
 */
export const PERMIT2_TYPES = {
  PermitTransferFrom: [
    { name: 'permitted', type: 'TokenPermissions' },
    { name: 'spender', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
  TokenPermissions: [
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint256' },
  ],
} as const;

/**
 * Permit2 with witness types for EIP-712
 */
export const PERMIT2_WITNESS_TYPES = {
  PermitWitnessTransferFrom: [
    { name: 'permitted', type: 'TokenPermissions' },
    { name: 'spender', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'witness', type: 'Payload' },
  ],
  TokenPermissions: [
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint256' },
  ],
  Payload: [
    { name: 'target', type: 'address' },
    { name: 'callDataHash', type: 'bytes32' },
  ],
} as const;

/**
 * Default Permit2 domain for Base
 */
export const PERMIT2_DOMAIN_BASE: Permit2DomainFixture = {
  name: 'Permit2',
  chainId: 8453,
  verifyingContract: PERMIT2_ADDRESS,
};

/**
 * Default Permit2 domain for Ethereum
 */
export const PERMIT2_DOMAIN_ETHEREUM: Permit2DomainFixture = {
  name: 'Permit2',
  chainId: 1,
  verifyingContract: PERMIT2_ADDRESS,
};

/**
 * Get Permit2 domain for chain
 */
export function getPermit2Domain(chainId: number): Permit2DomainFixture {
  return {
    name: 'Permit2',
    chainId,
    verifyingContract: PERMIT2_ADDRESS,
  };
}

/**
 * Default permit data (USDC on Base)
 */
export const DEFAULT_PERMIT_DATA: PermitDataFixture = {
  permitted: {
    token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    amount: BigInt('1000000000'), // 1000 USDC
  },
  nonce: BigInt('1234567890123456'),
  deadline: BigInt(Math.floor(Date.now() / 1000) + 60), // 60 seconds from now
  spender: '0xdef1c0ded9bec7f1a1670819833240f027b25eff', // 0x Exchange Proxy
};

/**
 * Default witness data
 */
export const DEFAULT_WITNESS_DATA: WitnessDataFixture = {
  target: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
  callDataHash:
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
};

/**
 * Mock signature (valid format, not cryptographically valid)
 */
export const MOCK_PERMIT2_SIGNATURE =
  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab1c';

/**
 * Create custom permit data
 */
export function createPermitData(
  overrides: Partial<PermitDataFixture>,
): PermitDataFixture {
  return {
    ...DEFAULT_PERMIT_DATA,
    deadline: BigInt(Math.floor(Date.now() / 1000) + 60),
    ...overrides,
  };
}

/**
 * Create custom witness data
 */
export function createWitnessData(
  overrides: Partial<WitnessDataFixture>,
): WitnessDataFixture {
  return {
    ...DEFAULT_WITNESS_DATA,
    ...overrides,
  };
}

/**
 * Create permit message for signing
 */
export function createPermitMessage(
  permit: PermitDataFixture,
): Record<string, unknown> {
  return {
    permitted: {
      token: permit.permitted.token,
      amount: permit.permitted.amount,
    },
    spender: permit.spender,
    nonce: permit.nonce,
    deadline: permit.deadline,
  };
}

/**
 * Create permit with witness message for signing
 */
export function createPermitWithWitnessMessage(
  permit: PermitDataFixture,
  witness: WitnessDataFixture,
): Record<string, unknown> {
  return {
    permitted: {
      token: permit.permitted.token,
      amount: permit.permitted.amount,
    },
    spender: permit.spender,
    nonce: permit.nonce,
    deadline: permit.deadline,
    witness: {
      target: witness.target,
      callDataHash: witness.callDataHash,
    },
  };
}

/**
 * PermitSwap contract address (example)
 */
export const PERMIT_SWAP_ADDRESS =
  '0x1234567890123456789012345678901234567890' as const;

/**
 * Common spender addresses
 */
export const SPENDER_ADDRESSES = {
  ZERO_X_EXCHANGE_PROXY: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
  UNISWAP_ROUTER: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  PERMIT_SWAP: PERMIT_SWAP_ADDRESS,
} as const;
