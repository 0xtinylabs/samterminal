/**
 * @samterminal/plugin-swap
 *
 * Token swap plugin for SamTerminal using 0x Protocol
 */

// Plugin exports
export { SwapPlugin, createSwapPlugin, type SwapPluginOptions } from './plugin.js';

// Type exports
export type {
  SwapRequest,
  SwapQuote,
  SwapResult,
  SwapSource,
  SwapTransaction,
  PermitData,
  Eip712TypedData,
  TokenAllowance,
  ApprovalRequest,
  ApprovalResult,
  SwapPluginConfig,
  QuoteRequest,
  ZeroXQuoteResponse,
  ZeroXPriceResponse,
  SwapHistoryEntry,
  SwapDatabaseAdapter,
} from './types/index.js';

// Utility exports
export { isNativeToken, getWrappedNativeToken, CONTRACTS, NATIVE_TOKEN_ADDRESSES } from './types/index.js';

// Constants exports
export {
  PERMIT2_ADDRESS,
  CHAIN_CONFIGS,
  getNumericChainId,
  WRAPPED_NATIVE_TOKENS,
  DEFAULT_GAS_LIMIT,
  PERMIT_DEADLINE_SECURE,
  PERMIT_DEADLINE_NORMAL,
  ERC20_ABI,
  PERMIT_SWAP_ABI,
  PERMIT2_TYPES,
  PERMIT2_WITNESS_TYPES,
  PERMIT2_DOMAIN_NAME,
  type SupportedChainId,
} from './constants/index.js';

// Utils exports
export { ZeroXClient, createZeroXClient, type ZeroXClientConfig } from './utils/zerox.js';
export {
  WalletManager,
  createWalletManager,
  floatToBigInt,
  bigIntToFloat,
  formatTokenAmount,
  type WalletManagerConfig,
} from './utils/wallet.js';
export { Cache, createCacheKey } from './utils/cache.js';
export {
  isValidPrivateKey,
  ensurePrivateKeyPrefix,
  normalizeAddress,
  isValidEvmAddress,
  delay,
  retry,
  bpsToPercent,
  percentToBps,
  calculatePriceImpact,
  calculateMinimumOutput,
  weiToGwei,
  gweiToWei,
} from './utils/index.js';

// Permit2 utilities
export {
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
  type PermitData as Permit2PermitData,
  type WitnessData,
  type SignedPermit,
} from './utils/permit2.js';

// Provider exports
export { createQuoteProvider } from './providers/quote.js';
export { createAllowanceProvider, type AllowanceQuery } from './providers/allowance.js';

// Action exports
export { createApproveAction } from './actions/approve.js';
export { createSwapAction } from './actions/swap.js';
