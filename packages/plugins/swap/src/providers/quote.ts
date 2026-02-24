/**
 * Swap quote provider
 */

import type { Provider, ProviderContext, ProviderResult } from '@samterminal/core';
import type { ChainId } from '@samterminal/plugin-tokendata';
import type {
  SwapPluginConfig,
  QuoteRequest,
  SwapQuote,
  SwapSource,
} from '../types/index.js';
import { isNativeToken, getWrappedNativeToken } from '../types/index.js';
import type { ZeroXClient } from '../utils/zerox.js';
import type { WalletManager } from '../utils/wallet.js';
import { createCacheKey, floatToBigInt, bigIntToFloat } from '../utils/index.js';

export function createQuoteProvider(
  getZeroX: () => ZeroXClient | null,
  getWallet: () => WalletManager,
  config: SwapPluginConfig,
): Provider {
  // Internal cache
  const cache = new Map<string, { data: SwapQuote; expiresAt: number }>();

  const getCached = (key: string): SwapQuote | undefined => {
    const entry = cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      return undefined;
    }
    return entry.data;
  };

  const setCache = (key: string, data: SwapQuote, ttl: number) => {
    cache.set(key, { data, expiresAt: Date.now() + ttl });
  };

  return {
    name: 'swap:quote',
    type: 'token',
    description: 'Get swap quote for token pair',

    async get(context: ProviderContext): Promise<ProviderResult> {
      const query = context.query as QuoteRequest;

      if (!query.fromToken) {
        return {
          success: false,
          error: 'Source token address is required',
          timestamp: new Date(),
        };
      }

      if (!query.toToken) {
        return {
          success: false,
          error: 'Destination token address is required',
          timestamp: new Date(),
        };
      }

      if (!query.amount || query.amount <= 0) {
        return {
          success: false,
          error: 'Amount must be greater than 0',
          timestamp: new Date(),
        };
      }

      const chainId = query.chainId ?? config.defaultChain ?? 'base';
      const slippageBps = query.slippageBps ?? config.defaultSlippageBps ?? 100;

      // Check cache
      const cacheKey = createCacheKey('quote', {
        fromToken: query.fromToken,
        toToken: query.toToken,
        amount: query.amount,
        chainId,
        slippageBps,
      });

      if (config.enableCache !== false) {
        const cached = getCached(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            cached: true,
            timestamp: new Date(),
          };
        }
      }

      try {
        const zeroX = getZeroX();
        if (!zeroX) {
          return {
            success: false,
            error: '0x API key required for quotes',
            timestamp: new Date(),
          };
        }

        const wallet = getWallet();

        // Handle native token addresses
        let sellToken = query.fromToken;
        let buyToken = query.toToken;

        if (isNativeToken(sellToken)) {
          sellToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
        }
        if (isNativeToken(buyToken)) {
          buyToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
        }

        // Get token decimals for sell token
        let sellDecimals = 18;
        if (!isNativeToken(query.fromToken)) {
          sellDecimals = await wallet.getTokenDecimals(query.fromToken, chainId as ChainId);
        }

        // Convert amount to wei
        const sellAmountWei = floatToBigInt(query.amount, sellDecimals).toString();

        // Get price (indicative quote without taker)
        const priceResponse = await zeroX.getPrice({
          sellToken,
          buyToken,
          sellAmount: sellAmountWei,
          chainId: chainId as ChainId,
          taker: query.taker,
          slippageBps,
        });

        if (!priceResponse.liquidityAvailable) {
          return {
            success: false,
            error: 'No liquidity available for this pair',
            timestamp: new Date(),
          };
        }

        // Get token decimals for buy token
        let buyDecimals = 18;
        if (!isNativeToken(query.toToken)) {
          buyDecimals = await wallet.getTokenDecimals(query.toToken, chainId as ChainId);
        }

        // Parse sources from route
        const sources: SwapSource[] = priceResponse.route.fills.map((fill) => ({
          name: fill.source,
          proportion: parseInt(fill.proportionBps, 10) / 10000,
        }));

        // Calculate values
        const sellAmount = bigIntToFloat(BigInt(priceResponse.sellAmount), sellDecimals);
        const buyAmount = bigIntToFloat(BigInt(priceResponse.buyAmount), buyDecimals);
        const minBuyAmount = bigIntToFloat(BigInt(priceResponse.minBuyAmount), buyDecimals);
        const price = buyAmount / sellAmount;

        // Gas calculations
        const gasEstimate = priceResponse.gas;
        const gasPrice = priceResponse.gasPrice;
        const gasCostWei = BigInt(gasEstimate) * BigInt(gasPrice);
        const gasCostNative = bigIntToFloat(gasCostWei, 18);

        const quote: SwapQuote = {
          fromToken: query.fromToken,
          toToken: query.toToken,
          sellAmount: sellAmount.toString(),
          buyAmount: buyAmount.toString(),
          price,
          gasEstimate,
          gasPrice,
          gasCostNative: gasCostNative.toString(),
          minimumBuyAmount: minBuyAmount.toString(),
          slippageBps,
          sources,
          allowanceTarget: '0x000000000022D473030F116dDEE9F6B43aC78BA3', // Permit2
          expiresAt: Date.now() + 30000, // 30 seconds
          timestamp: Date.now(),
        };

        // Cache result
        if (config.enableCache !== false) {
          setCache(cacheKey, quote, config.cacheTtl ?? 10000);
        }

        return {
          success: true,
          data: quote,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get quote',
          timestamp: new Date(),
        };
      }
    },
  };
}
