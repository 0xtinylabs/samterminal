/**
 * 0x API response fixtures for testing
 */

/**
 * Route fill info
 */
export interface ZeroXRouteFill {
  source: string;
  proportionBps: string;
  from: string;
  to: string;
}

/**
 * Route info
 */
export interface ZeroXRoute {
  fills: ZeroXRouteFill[];
}

/**
 * Transaction data from 0x
 */
export interface ZeroXTransaction {
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
}

/**
 * Permit2 EIP-712 data
 */
export interface ZeroXPermit2Data {
  eip712: {
    domain: {
      name: string;
      chainId: number;
      verifyingContract: string;
    };
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    message: Record<string, unknown>;
  };
}

/**
 * 0x Price response
 */
export interface ZeroXPriceResponse {
  sellAmount: string;
  buyAmount: string;
  price: string;
  minBuyAmount: string;
  liquidityAvailable: boolean;
  gas: string;
  gasPrice: string;
  route: ZeroXRoute;
}

/**
 * 0x Quote response (includes transaction data)
 */
export interface ZeroXQuoteResponse extends ZeroXPriceResponse {
  transaction: ZeroXTransaction;
  permit2?: ZeroXPermit2Data;
}

/**
 * Default ETH->USDC price response on Base
 */
export const ZEROX_PRICE_ETH_USDC: ZeroXPriceResponse = {
  sellAmount: '1000000000000000000', // 1 ETH
  buyAmount: '3250000000', // 3250 USDC (6 decimals)
  price: '3250',
  minBuyAmount: '3217500000', // 1% slippage
  liquidityAvailable: true,
  gas: '200000',
  gasPrice: '1000000', // 0.001 gwei (Base is cheap)
  route: {
    fills: [
      {
        source: 'Uniswap_V3',
        proportionBps: '10000',
        from: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      },
    ],
  },
};

/**
 * Default ETH->USDC quote response on Base
 */
export const ZEROX_QUOTE_ETH_USDC: ZeroXQuoteResponse = {
  ...ZEROX_PRICE_ETH_USDC,
  transaction: {
    to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff', // 0x Exchange Proxy
    data: '0x415565b0000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda029130000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000bfb2be00',
    value: '1000000000000000000',
    gas: '200000',
    gasPrice: '1000000',
  },
};

/**
 * USDC->WETH quote response (ERC20 to ERC20)
 */
export const ZEROX_QUOTE_USDC_WETH: ZeroXQuoteResponse = {
  sellAmount: '1000000000', // 1000 USDC
  buyAmount: '307692307692307692', // ~0.307 WETH
  price: '0.000307692',
  minBuyAmount: '304615384615384615',
  liquidityAvailable: true,
  gas: '250000',
  gasPrice: '1000000',
  route: {
    fills: [
      {
        source: 'Uniswap_V3',
        proportionBps: '6000',
        from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        to: '0x4200000000000000000000000000000000000006',
      },
      {
        source: 'Aerodrome',
        proportionBps: '4000',
        from: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        to: '0x4200000000000000000000000000000000000006',
      },
    ],
  },
  transaction: {
    to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
    data: '0x415565b0000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda0291300000000000000000000000042000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000003b9aca00',
    value: '0',
    gas: '250000',
    gasPrice: '1000000',
  },
  permit2: {
    eip712: {
      domain: {
        name: 'Permit2',
        chainId: 8453,
        verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
      },
      types: {
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
      },
      primaryType: 'PermitTransferFrom',
      message: {
        permitted: {
          token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: '1000000000',
        },
        spender: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
        nonce: '12345678901234567890',
        deadline: '1700000000',
      },
    },
  },
};

/**
 * No liquidity response
 */
export const ZEROX_NO_LIQUIDITY: ZeroXPriceResponse = {
  sellAmount: '1000000000000000000',
  buyAmount: '0',
  price: '0',
  minBuyAmount: '0',
  liquidityAvailable: false,
  gas: '0',
  gasPrice: '0',
  route: { fills: [] },
};

/**
 * Create custom 0x price response
 */
export function createZeroXPriceResponse(
  overrides: Partial<ZeroXPriceResponse>,
): ZeroXPriceResponse {
  return {
    ...ZEROX_PRICE_ETH_USDC,
    ...overrides,
  };
}

/**
 * Create custom 0x quote response
 */
export function createZeroXQuoteResponse(
  overrides: Partial<ZeroXQuoteResponse>,
): ZeroXQuoteResponse {
  return {
    ...ZEROX_QUOTE_ETH_USDC,
    ...overrides,
  };
}

/**
 * Create 0x error response
 */
export function createZeroXErrorResponse(
  code: string,
  reason: string,
): { code: string; reason: string } {
  return { code, reason };
}

/**
 * Common 0x API errors
 */
export const ZEROX_ERRORS = {
  INSUFFICIENT_LIQUIDITY: createZeroXErrorResponse(
    'INSUFFICIENT_LIQUIDITY',
    'Insufficient liquidity for this trade',
  ),
  INVALID_TOKEN: createZeroXErrorResponse(
    'INVALID_TOKEN',
    'Token address is not valid',
  ),
  RATE_LIMITED: createZeroXErrorResponse(
    'RATE_LIMITED',
    'Too many requests',
  ),
  UNSUPPORTED_CHAIN: createZeroXErrorResponse(
    'UNSUPPORTED_CHAIN',
    'Chain not supported',
  ),
};
