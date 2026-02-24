/**
 * Permit2 utilities for secure token approvals
 */

import { randomBytes } from 'crypto';
import { encodeFunctionData, keccak256, type Hex } from 'viem';
import {
  PERMIT2_ADDRESS,
  PERMIT_DEADLINE_SECURE,
} from '../constants/chains.js';
import {
  PERMIT2_TYPES,
  PERMIT2_WITNESS_TYPES,
  PERMIT2_DOMAIN_NAME,
  PERMIT_SWAP_ABI,
} from '../constants/abi.js';

/**
 * Permit data structure
 */
export interface PermitData {
  permitted: {
    token: string;
    amount: bigint;
  };
  nonce: bigint;
  deadline: bigint;
  spender: string;
}

/**
 * Witness data for secure permit
 */
export interface WitnessData {
  target: string;
  callDataHash: Hex;
}

/**
 * Signed permit result
 */
export interface SignedPermit {
  permit: PermitData;
  signature: Hex;
  encodedData: Hex;
}

/**
 * Generate a unique nonce for permit
 */
export function generateNonce(): bigint {
  // Use cryptographically secure random bytes for nonce generation
  // 96-bit nonce to fit Permit2 nonce space
  const bytes = randomBytes(12);
  return BigInt('0x' + bytes.toString('hex'));
}

/**
 * Generate deadline timestamp
 */
export function generateDeadline(seconds: number = PERMIT_DEADLINE_SECURE): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + seconds);
}

/**
 * Create EIP-712 domain for Permit2
 */
export function createPermit2Domain(chainId: number, permit2Address: string = PERMIT2_ADDRESS) {
  return {
    name: PERMIT2_DOMAIN_NAME,
    chainId,
    verifyingContract: permit2Address as Hex,
  };
}

/**
 * Create permit message for standard permit
 */
export function createPermitMessage(permit: PermitData) {
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
 * Create permit message with witness for secure permit
 */
export function createPermitWithWitnessMessage(permit: PermitData, witness: WitnessData) {
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
 * Create witness data from swap call data
 */
export function createWitnessFromCallData(targetAddress: string, swapCallData: string): WitnessData {
  return {
    target: targetAddress,
    callDataHash: keccak256(swapCallData as Hex),
  };
}

// Type helper for EIP-712 types
type TypedDataTypes = Record<string, Array<{ name: string; type: string }>>;

/**
 * Sign standard Permit2 transfer
 */
export async function signPermit2(
  walletClient: {
    signTypedData: (params: {
      domain: { name: string; chainId: number; verifyingContract: Hex };
      types: TypedDataTypes;
      primaryType: string;
      message: Record<string, unknown>;
    }) => Promise<Hex>;
  },
  permit: PermitData,
  chainId: number,
  permit2Address: string = PERMIT2_ADDRESS,
): Promise<Hex> {
  const domain = createPermit2Domain(chainId, permit2Address);
  const message = createPermitMessage(permit);

  // Cast readonly types to mutable for viem compatibility
  const types = {
    PermitTransferFrom: [...PERMIT2_TYPES.PermitTransferFrom],
    TokenPermissions: [...PERMIT2_TYPES.TokenPermissions],
  } as TypedDataTypes;

  return walletClient.signTypedData({
    domain,
    types,
    primaryType: 'PermitTransferFrom',
    message,
  });
}

/**
 * Sign Permit2 transfer with witness (secure permit)
 */
export async function signPermitWithWitness(
  walletClient: {
    signTypedData: (params: {
      domain: { name: string; chainId: number; verifyingContract: Hex };
      types: TypedDataTypes;
      primaryType: string;
      message: Record<string, unknown>;
    }) => Promise<Hex>;
  },
  permit: PermitData,
  witness: WitnessData,
  chainId: number,
  permit2Address: string = PERMIT2_ADDRESS,
): Promise<Hex> {
  const domain = createPermit2Domain(chainId, permit2Address);
  const message = createPermitWithWitnessMessage(permit, witness);

  // Cast readonly types to mutable for viem compatibility
  const types = {
    PermitWitnessTransferFrom: [...PERMIT2_WITNESS_TYPES.PermitWitnessTransferFrom],
    TokenPermissions: [...PERMIT2_WITNESS_TYPES.TokenPermissions],
    Payload: [...PERMIT2_WITNESS_TYPES.Payload],
  } as TypedDataTypes;

  return walletClient.signTypedData({
    domain,
    types,
    primaryType: 'PermitWitnessTransferFrom',
    message,
  });
}

/**
 * Encode permit2AndSwap transaction data
 */
export function encodePermit2AndSwap(
  permit: {
    permitted: { token: string; amount: bigint };
    nonce: bigint;
    deadline: bigint;
  },
  signature: Hex,
  owner: string,
  swapData: Hex,
): Hex {
  const permitWithHex = {
    permitted: {
      token: permit.permitted.token as Hex,
      amount: permit.permitted.amount,
    },
    nonce: permit.nonce,
    deadline: permit.deadline,
  };

  return encodeFunctionData({
    abi: PERMIT_SWAP_ABI,
    functionName: 'permit2AndSwap',
    args: [permitWithHex, signature, owner as Hex, swapData],
  });
}

/**
 * Encode rathExecutePermit2WithWitness transaction data
 */
export function encodePermit2WithWitness(
  permit: {
    permitted: { token: string; amount: bigint };
    nonce: bigint;
    deadline: bigint;
  },
  owner: string,
  swapData: Hex,
  signature: Hex,
): Hex {
  const permitWithHex = {
    permitted: {
      token: permit.permitted.token as Hex,
      amount: permit.permitted.amount,
    },
    nonce: permit.nonce,
    deadline: permit.deadline,
  };

  return encodeFunctionData({
    abi: PERMIT_SWAP_ABI,
    functionName: 'rathExecutePermit2WithWitness',
    args: [permitWithHex, owner as Hex, swapData, signature],
  });
}

/**
 * Build complete permit2 secure swap transaction
 * This handles the full flow: create permit, sign with witness, encode for relay
 */
export async function buildSecureSwapTransaction(params: {
  tokenAddress: string;
  amount: bigint;
  walletClient: {
    signTypedData: (params: {
      domain: { name: string; chainId: number; verifyingContract: Hex };
      types: TypedDataTypes;
      primaryType: string;
      message: Record<string, unknown>;
    }) => Promise<Hex>;
  };
  walletAddress: string;
  swapTargetAddress: string;
  swapCallData: Hex;
  permitSwapAddress: string;
  chainId: number;
  permit2Address?: string;
  deadlineSeconds?: number;
}): Promise<{ callData: Hex; permit: PermitData; signature: Hex }> {
  const {
    tokenAddress,
    amount,
    walletClient,
    walletAddress,
    swapTargetAddress,
    swapCallData,
    permitSwapAddress,
    chainId,
    permit2Address = PERMIT2_ADDRESS,
    deadlineSeconds = PERMIT_DEADLINE_SECURE,
  } = params;

  // Create permit data
  const permit: PermitData = {
    permitted: {
      token: tokenAddress,
      amount,
    },
    nonce: generateNonce(),
    deadline: generateDeadline(deadlineSeconds),
    spender: permitSwapAddress,
  };

  // Create witness from swap call data
  const witness = createWitnessFromCallData(swapTargetAddress, swapCallData);

  // Sign permit with witness
  const signature = await signPermitWithWitness(
    walletClient,
    permit,
    witness,
    chainId,
    permit2Address,
  );

  // Encode final transaction data
  const callData = encodePermit2WithWitness(
    {
      permitted: { token: permit.permitted.token, amount: permit.permitted.amount },
      nonce: permit.nonce,
      deadline: permit.deadline,
    },
    walletAddress,
    swapCallData,
    signature,
  );

  return {
    callData,
    permit,
    signature,
  };
}
