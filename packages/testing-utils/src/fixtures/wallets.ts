/**
 * Wallet fixtures for testing
 * NOTE: These are TEST ADDRESSES ONLY - never use real private keys in tests
 */

export interface WalletFixture {
  address: string;
  type: 'evm';
  label: string;
}

/**
 * Test wallet addresses
 * These are derived from well-known test mnemonics
 */
export const WALLETS = {
  // EVM addresses (derived from "test test test..." mnemonic)
  EVM_WALLET_1: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    type: 'evm',
    label: 'Test Wallet 1',
  },
  EVM_WALLET_2: {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    type: 'evm',
    label: 'Test Wallet 2',
  },
  EVM_WALLET_3: {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    type: 'evm',
    label: 'Test Wallet 3',
  },

  // Known addresses for testing
  ZERO_ADDRESS: {
    address: '0x0000000000000000000000000000000000000000',
    type: 'evm',
    label: 'Zero Address',
  },
  DEAD_ADDRESS: {
    address: '0x000000000000000000000000000000000000dEaD',
    type: 'evm',
    label: 'Dead Address',
  },
} as const satisfies Record<string, WalletFixture>;

/**
 * Get a random EVM wallet
 */
export function getRandomEVMWallet(): WalletFixture {
  const evmWallets = Object.values(WALLETS).filter((w) => w.type === 'evm' && !w.label.includes('Zero') && !w.label.includes('Dead'));
  return evmWallets[Math.floor(Math.random() * evmWallets.length)];
}

/**
 * Check if address is a valid EVM address format
 */
export function isValidEVMAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

