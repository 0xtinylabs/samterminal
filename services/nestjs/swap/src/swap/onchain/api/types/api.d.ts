export type ApiSwapQuoteParams = {
  sellToken: string;
  buyToken: string;
  slippageBps: number;
  taker: string;
  sellAmount: string;
  gasPrice: string;
  chainId: number;
} & ApiSwapQuoteBodyMonetize;

export type ApiSwapQuoteBodyMonetize = {
  swapFeeBps?: string;
  swapFeeToken?: string;
  swapFeeRecipient?: string;
};

export type ApiSwapQuoteRequest = {
  fromSwapToken: string;
  toSwapToken: string;
  toWalletAddress: string;
  amount: number;
  slippage: number;
  privateKey: string;
};

export type ApiSwapQuoteTransacion = {
  to: string;
  data: string;
  gas: string;
  gasPrice: string;
  value: string;
};

export type ApiSwapQuoteIssues = {
  allowanceTarget: {
    spender: string;
  };
};

export type ApiSwapQuotePermit = {
  eip712: any;
};

export type ApiSwapQuoteFee = {
  amount: string;
};

export type ApiSwapQuoteFees = {
  integratorFee: ApiSwapQuoteFee;
  gasFee: ApiSwapQuoteFee;
};

export type ApiSwapQuoteResponse = {
  transaction: ApiSwapQuoteTransacion;
  buyAmount: string;
  sellAmount: string;
  allowanceTarget: string;
  issues: ApiSwapQuoteIssues;
  totalNetworkFee: any;
  permit: ApiSwapQuotePermit;
  fees: ApiSwapQuoteFees;
};

export interface SwapQuoteResponse {
  transaction: ApiSwapQuoteTransacion;
  buyAmount: number;
  sellAmount: number;
  allowanceTarget: string;
  eip712: any;
  networkFee: any;
  fee: any;
  user_fee: any;
  type: 'response';
}

export interface SwapErrorResponse {
  error?: any;
  type: 'error';
}

export type AmountRequest = {
  tokenAddress: string;
  walletAddress: string;
  amount: number;
  privateKey: string;
};

export type AmountResponse = {
  isReduced: boolean;
  amount: bigint;
  noBalance: boolean;
};
