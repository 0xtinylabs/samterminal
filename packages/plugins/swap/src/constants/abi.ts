/**
 * Contract ABIs for swap plugin
 */

/**
 * ERC20 ABI - common token operations
 */
export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

/**
 * Permit2 contract ABI for permit and swap operations
 */
export const PERMIT_SWAP_ABI = [
  {
    name: 'permit2AndSwap',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'permit',
        type: 'tuple',
        components: [
          {
            name: 'permitted',
            type: 'tuple',
            components: [
              { name: 'token', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
          },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
      { name: 'signature', type: 'bytes' },
      { name: 'owner', type: 'address' },
      { name: 'swapData', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: 'rathExecutePermit2WithWitness',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'permit',
        type: 'tuple',
        internalType: 'struct ISignatureTransfer.PermitTransferFrom',
        components: [
          {
            name: 'permitted',
            type: 'tuple',
            internalType: 'struct ISignatureTransfer.TokenPermissions',
            components: [
              { name: 'token', type: 'address', internalType: 'address' },
              { name: 'amount', type: 'uint256', internalType: 'uint256' },
            ],
          },
          { name: 'nonce', type: 'uint256', internalType: 'uint256' },
          { name: 'deadline', type: 'uint256', internalType: 'uint256' },
        ],
      },
      { name: 'from', type: 'address', internalType: 'address' },
      { name: 'callData', type: 'bytes', internalType: 'bytes' },
      { name: 'signature', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [],
  },
] as const;

/**
 * Permit2 EIP-712 types for standard permit
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
 * Permit2 EIP-712 types with witness (secure permit)
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
 * Permit2 EIP-712 domain name
 */
export const PERMIT2_DOMAIN_NAME = 'Permit2' as const;
