import { Injectable } from '@nestjs/common';
import { SwapRepository } from '@/database/repositories/swap.repository';
import {
  ApproveRequest,
  ApproveResponse,
  GetFeeRequest,
  GetFeeResponse,
  SwapRequest,
  SwapResponse,
} from '@/proto-generated/swap';
import { OnchainService } from '@/swap/onchain/onchain.service';
import { WalletOwnerRepository } from '@/database/repositories/wallet-owner.repository';
import { PERMIT, WALLET } from '@/swap/onchain/utils';
import { CONFIG } from '@/config/config';
import { SwapErrorRepository } from '@/database/repositories/swap-error.repository';

const SENSITIVE_KEYS = [
  'privateKey',
  'walletPrivateKey',
  'private_key',
  'wallet_private_key',
  'secret',
  'password',
  'mnemonic',
  'seed',
];

function sanitizeError(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeError);
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeError(value);
      }
    }
    return sanitized;
  }

  return obj;
}

@Injectable()
export class SwapService {
  constructor(
    private swapRepository: SwapRepository,
    private swapErrorRepository: SwapErrorRepository,
    private walletOwnerRepository: WalletOwnerRepository,
    private onChainService: OnchainService,
  ) {}

  async swap(request: SwapRequest): Promise<SwapResponse> {
    const privateKey = request.privateKey || CONFIG.wallet.privateKey;
    if (!privateKey) {
      return { success: false, error: { message: 'Private key required. Set WALLET_PRIVATE_KEY env or provide in request.' } };
    }
    const wallet = WALLET.CLIENT.walletClient(privateKey);
    const ownerID = await this.walletOwnerRepository.getWalletOwnerID(
      wallet.address,
    );
    const swapResponse = await this.onChainService.swap({ ...request, privateKey });
    if (swapResponse.success) {
      await this.swapRepository.createSwap(ownerID, {
        buyAmount: swapResponse.buyAmount ?? '0',
        sellAmount: swapResponse.sellAmount ?? '0',
        fromTokenAddress: request.fromTokenAddress,
        toTokenAddress: request.toTokenAddress,
        toWalletAddress: wallet.address,
        transactionHash: swapResponse.tx ?? '',
        application: request.app,
        environment: request.environment,
      });
    } else {
      const sanitizedError = sanitizeError(swapResponse.error ?? swapResponse);
      await this.swapErrorRepository.createSwapError(ownerID, {
        message: JSON.stringify(sanitizedError) ?? '',
      });
    }
    return swapResponse;
  }

  async approve(request: ApproveRequest): Promise<ApproveResponse> {
    try {
      const privateKey = request.walletPrivateKey || CONFIG.wallet.privateKey;
      if (!privateKey) {
        return { success: false };
      }
      const wallet = WALLET.CLIENT.walletClient(privateKey);
      await PERMIT.allowance(request.tokenAddress, wallet, async () => {});

      return { success: true };
    } catch {
      return { success: false };
    }
  }

  async getFee(request: GetFeeRequest): Promise<GetFeeResponse> {
    const result = await this.onChainService.getFee(request);
    return result;
  }
}
