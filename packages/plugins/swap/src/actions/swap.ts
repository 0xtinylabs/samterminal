/**
 * Swap execution action
 */

import type { Action, ActionContext, ActionResult } from '@samterminal/core';
import type { ChainId } from '@samterminal/plugin-tokendata';
import { isAddress } from 'viem';
import type {
  SwapPluginConfig,
  SwapRequest,
  SwapResult,
  SwapDatabaseAdapter,
} from '../types/index.js';
import { isNativeToken } from '../types/index.js';
import type { ZeroXClient } from '../utils/zerox.js';
import type { WalletManager } from '../utils/wallet.js';
import {
  isValidPrivateKey,
  ensurePrivateKeyPrefix,
  floatToBigInt,
  bigIntToFloat,
} from '../utils/index.js';
import {
  PERMIT2_ADDRESS,
  type SupportedChainId,
} from '../constants/chains.js';

export function createSwapAction(
  getZeroX: () => ZeroXClient | null,
  getWallet: () => WalletManager,
  getDatabase: () => SwapDatabaseAdapter | undefined,
  config: SwapPluginConfig,
): Action {
  return {
    name: 'swap:execute',
    description: 'Execute a token swap',

    async execute(context: ActionContext): Promise<ActionResult> {
      const input = context.input as SwapRequest;

      if (!input.fromToken) {
        return {
          success: false,
          error: 'Source token address is required',
        };
      }

      if (!input.toToken) {
        return {
          success: false,
          error: 'Destination token address is required',
        };
      }

      if (!input.amount || input.amount <= 0) {
        return {
          success: false,
          error: 'Amount must be greater than 0',
        };
      }

      const privateKey = input.privateKey ?? config.defaultPrivateKey;
      if (!privateKey) {
        return {
          success: false,
          error: 'Private key required. Set WALLET_PRIVATE_KEY env or provide in request.',
        };
      }

      if (!isValidPrivateKey(privateKey)) {
        return {
          success: false,
          error: 'Invalid private key format',
        };
      }

      // Validate token addresses
      if (!isAddress(input.fromToken)) {
        return {
          success: false,
          error: 'Invalid source token address',
        };
      }

      if (!isAddress(input.toToken)) {
        return {
          success: false,
          error: 'Invalid destination token address',
        };
      }

      if (input.fromToken.toLowerCase() === input.toToken.toLowerCase()) {
        return {
          success: false,
          error: 'Source and destination tokens must be different',
        };
      }

      const chainId = input.chainId ?? config.defaultChain ?? 'base';
      const slippageBps = input.slippageBps ?? config.defaultSlippageBps ?? 100;
      const resolvedPrivateKey = ensurePrivateKeyPrefix(privateKey);

      try {
        const zeroX = getZeroX();
        if (!zeroX) {
          return {
            success: false,
            error: '0x API key required for swaps',
          };
        }

        const wallet = getWallet();
        const account = wallet.getAccount(resolvedPrivateKey);
        const takerAddress = input.recipient ?? account.address;

        // Handle native token addresses
        let sellToken = input.fromToken;
        let buyToken = input.toToken;
        const isFromNative = isNativeToken(sellToken);

        if (isFromNative) {
          sellToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
        }
        if (isNativeToken(buyToken)) {
          buyToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
        }

        // Get token decimals
        let sellDecimals = 18;
        if (!isFromNative) {
          sellDecimals = await wallet.getTokenDecimals(input.fromToken, chainId as ChainId);
        }

        // Convert amount to wei
        const sellAmountWei = floatToBigInt(input.amount, sellDecimals);

        // Check balance
        let balance: bigint;
        if (isFromNative) {
          balance = await wallet.getNativeBalance(account.address, chainId as ChainId);
        } else {
          balance = await wallet.getTokenBalance(
            input.fromToken,
            account.address,
            chainId as ChainId,
          );
        }

        if (!isFromNative && balance < sellAmountWei) {
          return {
            success: false,
            error: `Insufficient balance. Have: ${bigIntToFloat(balance, sellDecimals)}, Need: ${input.amount}`,
          };
        }

        // Get firm quote with transaction data
        const quoteResponse = await zeroX.getQuote({
          sellToken,
          buyToken,
          sellAmount: sellAmountWei.toString(),
          chainId: chainId as ChainId,
          taker: takerAddress,
          slippageBps,
        });

        if (!quoteResponse.liquidityAvailable) {
          return {
            success: false,
            error: 'No liquidity available for this swap',
          };
        }

        // Balance check for native tokens (needs quoteResponse for gas estimation)
        if (isFromNative) {
          const gasPrice = await wallet.getGasPrice(chainId as ChainId);
          const gasReserve = gasPrice * BigInt(quoteResponse.transaction.gas || '300000');
          if (balance < sellAmountWei + gasReserve) {
            return {
              success: false,
              error: `Insufficient balance. Have: ${bigIntToFloat(balance, sellDecimals)}, Need: ${input.amount} + gas reserve`,
            };
          }
        }

        // For native token swaps, execute directly without Permit2
        if (isFromNative) {
          // Simulate transaction before execution
          try {
            await wallet.estimateGas(
              quoteResponse.transaction.to,
              quoteResponse.transaction.data,
              quoteResponse.transaction.value,
              account.address,
              chainId as ChainId,
            );
          } catch (simError) {
            return {
              success: false,
              error: `Transaction simulation failed: ${simError instanceof Error ? simError.message : 'Unknown error'}`,
            };
          }

          const txHash = await wallet.sendTransaction(
            quoteResponse.transaction.to,
            quoteResponse.transaction.data,
            quoteResponse.transaction.value,
            quoteResponse.transaction.gas,
            input.gasPrice ?? quoteResponse.transaction.gasPrice,
            resolvedPrivateKey,
            chainId as ChainId,
          );

          let buyDecimals = 18;
          if (!isNativeToken(input.toToken)) {
            buyDecimals = await wallet.getTokenDecimals(input.toToken, chainId as ChainId);
          }

          const result: SwapResult = {
            success: true,
            txHash,
            sellAmount: bigIntToFloat(BigInt(quoteResponse.sellAmount), sellDecimals).toString(),
            buyAmount: bigIntToFloat(BigInt(quoteResponse.buyAmount), buyDecimals).toString(),
            timestamp: Date.now(),
          };

          await logSwapResult(getDatabase, input, result, chainId as ChainId, account.address);
          return { success: true, data: result };
        }

        // For ERC20 tokens, check and ensure Permit2 allowance
        const permit2Address = config.permit2Address ?? PERMIT2_ADDRESS;
        const allowance = await wallet.getTokenAllowance(
          input.fromToken,
          account.address,
          permit2Address,
          chainId as ChainId,
        );

        if (allowance < sellAmountWei) {
          // Approve Permit2
          await wallet.approveToken(
            input.fromToken,
            permit2Address,
            'unlimited',
            resolvedPrivateKey,
            chainId as ChainId,
          );
        }

        // Handle Permit2 signature if required
        if (quoteResponse.permit2?.eip712) {
          const signature = await wallet.signTypedData(
            resolvedPrivateKey,
            quoteResponse.permit2.eip712.domain,
            quoteResponse.permit2.eip712.types,
            quoteResponse.permit2.eip712.primaryType,
            quoteResponse.permit2.eip712.message,
            chainId as ChainId,
          );

          // 0x API Permit2 flow: append signature to transaction data
          if (signature && quoteResponse.transaction) {
            const sigBytes = signature.startsWith('0x') ? signature.slice(2) : signature;
            quoteResponse.transaction.data = `${quoteResponse.transaction.data}${sigBytes}` as `0x${string}`;
          }
        }

        // Simulate transaction before execution
        try {
          await wallet.estimateGas(
            quoteResponse.transaction.to,
            quoteResponse.transaction.data,
            quoteResponse.transaction.value,
            account.address,
            chainId as ChainId,
          );
        } catch (simError) {
          return {
            success: false,
            error: `Transaction simulation failed: ${simError instanceof Error ? simError.message : 'Unknown error'}`,
          };
        }

        // Execute transaction
        const txHash = await wallet.sendTransaction(
          quoteResponse.transaction.to,
          quoteResponse.transaction.data,
          quoteResponse.transaction.value,
          quoteResponse.transaction.gas,
          input.gasPrice ?? quoteResponse.transaction.gasPrice,
          resolvedPrivateKey,
          chainId as ChainId,
        );

        // Get token decimals for buy token
        let buyDecimals = 18;
        if (!isNativeToken(input.toToken)) {
          buyDecimals = await wallet.getTokenDecimals(input.toToken, chainId as ChainId);
        }

        const result: SwapResult = {
          success: true,
          txHash,
          sellAmount: bigIntToFloat(BigInt(quoteResponse.sellAmount), sellDecimals).toString(),
          buyAmount: bigIntToFloat(BigInt(quoteResponse.buyAmount), buyDecimals).toString(),
          timestamp: Date.now(),
        };

        await logSwapResult(getDatabase, input, result, chainId as ChainId, account.address);
        return { success: true, data: result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Swap failed';

        // Log error to database
        const database = getDatabase();
        if (database) {
          try {
            const wallet = getWallet();
            const account = wallet.getAccount(ensurePrivateKeyPrefix(privateKey));
            await database.logError(account.address, errorMessage);
          } catch (_error) {
            // Database logging is optional
          }
        }

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
  };
}

/**
 * Helper function to log swap result to database
 */
async function logSwapResult(
  getDatabase: () => SwapDatabaseAdapter | undefined,
  input: SwapRequest,
  result: SwapResult,
  chainId: ChainId,
  walletAddress: string,
): Promise<void> {
  const database = getDatabase();
  if (!database || !result.txHash) return;

  try {
    await database.logSwap({
      fromToken: input.fromToken,
      toToken: input.toToken,
      sellAmount: result.sellAmount!,
      buyAmount: result.buyAmount!,
      txHash: result.txHash,
      chainId,
      timestamp: result.timestamp,
      status: 'confirmed',
    });
  } catch (_error) {
    // Database logging is optional
  }
}
