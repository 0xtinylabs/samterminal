import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  type SwapRequest,
  type GetFeeRequest,
  type ApproveRequest,
  GetFeeResponse,
  SWAP_SERVICE_NAME,
  SwapResponse,
  ApproveResponse,
} from '@/proto-generated/swap';
import { SwapService } from '@/swap/swap.service';
import { ApiKeyGuard } from '@/guards/api-key.guard';

@UseGuards(ApiKeyGuard)
@Controller(SWAP_SERVICE_NAME)
export class SwapController {
  constructor(private swapService: SwapService) {}

  // add api key guard

  @GrpcMethod(SWAP_SERVICE_NAME, 'swap')
  async swap(request: SwapRequest): Promise<SwapResponse> {
    const response = await this.swapService.swap(request);
    return response;
  }

  @GrpcMethod(SWAP_SERVICE_NAME, 'getFee')
  async getFee(request: GetFeeRequest): Promise<GetFeeResponse> {
    const response = await this.swapService.getFee(request);
    return response;
  }

  @GrpcMethod(SWAP_SERVICE_NAME, 'approve')
  async approve(request: ApproveRequest): Promise<ApproveResponse> {
    const response = await this.swapService.approve(request);
    return response;
  }
}
