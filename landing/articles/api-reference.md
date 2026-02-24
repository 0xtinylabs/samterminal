# SAM Terminal API Documentation

**Version:** 1.0.0
**Last Updated:** January 26, 2026
**Protocol:** gRPC over HTTP/2

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Authentication](#authentication)
4. [Service Endpoints](#service-endpoints)
   - [Scanner Service (Main)](#scanner-service-main)
   - [Swap Service](#swap-service)
   - [Notification Service](#notification-service)
   - [Transaction Service](#transaction-service)
5. [Common Types](#common-types)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Code Examples](#code-examples)
9. [SDKs & Client Libraries](#sdks--client-libraries)
10. [Changelog](#changelog)

---

## Overview

SamTerminal API is a **gRPC-based microservices architecture** designed for Web3 operations including token tracking, wallet management, swap execution, and notifications.

### Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT APPLICATIONS                             │
│                                                                              │
│     Web App          Mobile App          CLI              Third-Party        │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ gRPC / HTTP
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SAMTERMINAL API GATEWAY                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                        │
│  │ Scanner │  │    Swap     │  │Notification │                        │
│  │   :50060    │  │   :50059    │  │   :50056    │                        │
│  │    gRPC     │  │    gRPC     │  │    gRPC     │                        │
│  └─────────────┘  └─────────────┘  └─────────────┘                        │
│                                                                              │
│  ┌─────────────┐                                                            │
│  │Transactions │                                                            │
│  │   :50054    │                                                            │
│  │    gRPC     │                                                            │
│  └─────────────┘                                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Service Summary

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| **Scanner** | 50060 | gRPC | Token & wallet data operations |
| **Swap** | 50059 | gRPC | DEX swap execution |
| **Notification** | 50056 | gRPC | Telegram/Farcaster notifications |
| **Transactions** | 50054 | gRPC | Transaction logging |

### Base URLs

```
# Development
grpc://localhost:50060  # Scanner
grpc://localhost:50059  # Swap
grpc://localhost:50056  # Notification
grpc://localhost:50054  # Transactions

# Production (self-hosted)
# Deploy using docker compose and configure your own host
# grpc://your-host:50060  # Scanner
# grpc://your-host:50059  # Swap
```

---

## Quick Start

### 1. Install gRPC Client

```bash
# Node.js
npm install @grpc/grpc-js @grpc/proto-loader
```

### 2. Generate Client from Proto

```bash
# Generate TypeScript client
npx grpc_tools_node_protoc \
  --js_out=import_style=commonjs,binary:./generated \
  --grpc_out=grpc_js:./generated \
  --plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin` \
  -I ./proto \
  ./proto/*.proto
```

### 3. Make Your First Request

```typescript
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

// Load proto
const packageDefinition = protoLoader.loadSync('./proto/index.proto');
const proto = grpc.loadPackageDefinition(packageDefinition) as any;

// Create client
const client = new proto.scanner.Scanner(
  'localhost:50060',
  grpc.credentials.createInsecure()
);

// Call method
client.getToken(
  { tokenAddress: '0x...', addIfNotExist: true },
  (error: Error | null, response: any) => {
    if (error) {
      console.error('Error:', error);
      return;
    }
    console.log('Token:', response.token);
  }
);
```

---

## Authentication

### API Key Authentication

Some services (notably **Swap Service**) require API key authentication via gRPC metadata.

#### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Client includes API key in gRPC metadata                    │
│                                                                  │
│     metadata: {                                                  │
│       'apiKey': 'your-api-key-here'                             │
│     }                                                            │
│                                                                  │
│  2. Server validates API key via ApiKeyGuard                    │
│                                                                  │
│  3. If valid → Request proceeds                                 │
│     If invalid → UNAUTHENTICATED error returned                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### TypeScript Example

```typescript
import * as grpc from '@grpc/grpc-js';

// Create metadata with API key
const metadata = new grpc.Metadata();
metadata.add('apiKey', process.env.SAMTERMINAL_API_KEY!);

// Make authenticated request
swapClient.swap(
  {
    fromTokenAddress: '0x...',
    toTokenAddress: '0x...',
    amount: 100,
    chain: Chain.BASE,
    privateKey: '0x...',
  },
  metadata,
  (error, response) => {
    // Handle response
  }
);
```

#### cURL Example (via grpcurl)

```bash
grpcurl \
  -plaintext \
  -d '{"fromTokenAddress": "0x...", "toTokenAddress": "0x...", "amount": 100}' \
  -H 'apiKey: your-api-key' \
  localhost:50059 \
  swap.SwapService/swap
```

### Services Requiring Authentication

| Service | Authentication Required | Method |
|---------|------------------------|--------|
| Scanner | No | - |
| Swap | **Yes** | API Key in metadata |
| Notification | No | - |
| Transactions | No | - |

---

## Service Endpoints

---

## Scanner Service (Main)

**Package:** `scanner`
**Service:** `Scanner`
**Port:** 50060
**Proto File:** `proto/index.proto`

### Token Operations

#### GetToken

Retrieves information about a specific token.

```protobuf
rpc getToken(GetTokenRequest) returns (GetTokenResponse)
```

**Request**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tokenAddress` | string | Yes | Token contract address |
| `addIfNotExist` | bool | Yes | Auto-add token if not found |

**Response**

| Field | Type | Description |
|-------|------|-------------|
| `token` | Token | Token information object |

**Token Object**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Token name |
| `symbol` | string | Token symbol |
| `price` | string | Current price (USD) |
| `volume` | string | 24h trading volume |
| `calculatedVolume` | string | Calculated volume |
| `imageUrl` | string | Token logo URL |
| `address` | string | Contract address |
| `poolAddress` | string | Primary pool address |
| `supply` | string | Total supply |
| `circulatedSupply` | string | Circulating supply |
| `pairAddress` | string | Trading pair address |
| `reason` | string | Additional metadata |

**Example Request**

```typescript
// TypeScript
const response = await client.getToken({
  tokenAddress: '0x4200000000000000000000000000000000000006', // WETH on Base
  addIfNotExist: true,
});

console.log(response.token);
// {
//   name: 'Wrapped Ether',
//   symbol: 'WETH',
//   price: '3245.67',
//   volume: '12500000',
//   address: '0x4200000000000000000000000000000000000006',
//   ...
// }
```

```bash
# grpcurl
grpcurl -plaintext \
  -d '{"tokenAddress": "0x4200000000000000000000000000000000000006", "addIfNotExist": true}' \
  localhost:50060 \
  scanner.Scanner/getToken
```

---

#### GetTokens

Retrieves multiple tokens in batch.

```protobuf
rpc getTokens(GetTokensRequest) returns (GetTokensResponse)
```

**Request**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tokenAddresses` | string[] | Yes | Array of token addresses |

**Response**

| Field | Type | Description |
|-------|------|-------------|
| `tokens` | Token[] | Array of token objects |

**Example Request**

```typescript
const response = await client.getTokens({
  tokenAddresses: [
    '0x4200000000000000000000000000000000000006', // WETH
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  ],
});

console.log(`Found ${response.tokens.length} tokens`);
```

---

#### GetTokenPrice

Retrieves current price and volume for a token.

```protobuf
rpc getTokenPrice(GetTokenPriceRequest) returns (GetTokenPriceResponse)
```

**Request**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tokenAddress` | string | Yes | Token address |
| `reason` | string | No | Reason for price check |

**Response**

| Field | Type | Description |
|-------|------|-------------|
| `success` | bool | Operation success |
| `price` | string | Current token price |
| `volume` | string | Trading volume |

**Example Request**

```typescript
const response = await client.getTokenPrice({
  tokenAddress: '0x4200000000000000000000000000000000000006',
  reason: 'portfolio-update',
});

if (response.success) {
  console.log(`Price: $${response.price}`);
  console.log(`Volume: $${response.volume}`);
}
```

---

#### AddToken

Adds a new token to the tracking system.

```protobuf
rpc addToken(AddTokenRequest) returns (AddTokenResponse)
```

**Request**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tokenAddress` | string | Yes | Token contract address |
| `name` | string | No | Token name |
| `symbol` | string | No | Token symbol |
| `image` | string | No | Token logo URL |
| `poolAddress` | string | No | Primary pool address |
| `circulatedSupply` | string | No | Circulating supply |
| `pairAddress` | string | No | Trading pair address |
| `reason` | string | No | Reason for adding |
| `initialPrice` | string | No | Initial price |

**Response**

| Field | Type | Description |
|-------|------|-------------|
| `success` | bool | Operation success |
| `type` | TokenAddingType | Result type |
| `Message` | string | Status message |

**TokenAddingType Enum**

| Value | Description |
|-------|-------------|
| `DUPLICATE` | Token already exists |
| `FIRST_TIME` | Token added successfully |
| `ADD_ERROR` | Error adding token |

**Example Request**

```typescript
const response = await client.addToken({
  tokenAddress: '0x...',
  name: 'My Token',
  symbol: 'MTK',
  reason: 'user-request',
});

switch (response.type) {
  case TokenAddingType.FIRST_TIME:
    console.log('Token added successfully');
    break;
  case TokenAddingType.DUPLICATE:
    console.log('Token already exists');
    break;
  case TokenAddingType.ADD_ERROR:
    console.error('Failed to add token:', response.Message);
    break;
}
```

---

#### RemoveToken

Removes a token from the tracking system.

```protobuf
rpc removeToken(RemoveTokenRequest) returns (RemoveTokenResponse)
```

**Request**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tokenAddress` | string | Yes | Token to remove |
| `bypassEnds` | bool | No | Bypass removal restrictions |

**Response**

| Field | Type | Description |
|-------|------|-------------|
| `success` | bool | Operation success |
| `type` | TokenRemovingType | Result type |
| `Message` | string | Status message |

**TokenRemovingType Enum**

| Value | Description |
|-------|-------------|
| `STILL_CALCULATES` | Token still has pending calculations |
| `ALL_CLEAR` | Token removed successfully |
| `REMOVE_ERROR` | Error removing token |

---

### Wallet Operations

#### AddWallet

Registers a new wallet for monitoring.

```protobuf
rpc addWallet(AddWalletRequest) returns (AddWalletResponse)
```

**Request**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `walletAddress` | string | Yes | Wallet address |

**Response**

| Field | Type | Description |
|-------|------|-------------|
| `success` | bool | Registration success |

---

#### GetWallet

Retrieves wallet balance information.

```protobuf
rpc getWallet(GetWalletRequest) returns (GetWalletResponse)
```

**Request**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `walletAddress` | string | Yes | Wallet address |
| `chain` | CHAIN | Yes | BASE (default) |
| `type` | DataType | Yes | API or SCANNER |
| `tokenAddresses` | string[] | Yes | Filter by tokens (empty for all) |

**Response**

| Field | Type | Description |
|-------|------|-------------|
| `walletData` | Wallet | Wallet information |

**Wallet Object**

| Field | Type | Description |
|-------|------|-------------|
| `walletAddress` | string | Wallet address |
| `totalDollarValue` | string | Total portfolio value (USD) |
| `nativeBalance` | string | Native token balance (wei) |
| `nativeBalanceFormatted` | string | Native balance (formatted) |
| `tokenAddresses` | string[] | Held token addresses |

**Example Request**

```typescript
const response = await client.getWallet({
  walletAddress: '0x1234...',
  chain: Chain.BASE,
  type: DataType.API,
  tokenAddresses: [], // All tokens
});

console.log(`Total Value: $${response.walletData.totalDollarValue}`);
console.log(`ETH Balance: ${response.walletData.nativeBalanceFormatted}`);
```

---

#### GetWalletTokens

Retrieves all tokens held by a wallet.

```protobuf
rpc getWalletTokens(GetWalletTokensRequest) returns (GetWalletTokensResponse)
```

**Request**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `walletAddress` | string | Yes | Wallet address |
| `chain` | CHAIN | Yes | BASE (default) |
| `type` | DataType | Yes | API or SCANNER |
| `tokenAddresses` | string[] | Yes | Filter by tokens |
| `filterLowUSD` | bool | Yes | Filter dust amounts |

**Response**

| Field | Type | Description |
|-------|------|-------------|
| `tokens` | WalletToken[] | Array of wallet tokens |
| `numberOfTokens` | int32 | Total token count |

**WalletToken Object**

| Field | Type | Description |
|-------|------|-------------|
| `tokenAddress` | string | Token contract address |
| `tokenBalance` | string | Raw balance |
| `tokenBalanceFormatted` | string | Formatted balance |
| `tokenPrice` | string | Current price (USD) |
| `tokenDollarValue` | string | Holdings value (USD) |
| `tokenImage` | string | Token logo URL |
| `tokenName` | string | Token name |
| `tokenSymbol` | string | Token symbol |
| `tokenVolume` | string | 24h volume |
| `tokenSupply` | string | Total supply |
| `tokenPairAddress` | string | Trading pair address |

**Example Request**

```typescript
const response = await client.getWalletTokens({
  walletAddress: '0x1234...',
  chain: Chain.BASE,
  type: DataType.API,
  tokenAddresses: [],
  filterLowUSD: true, // Hide dust
});

for (const token of response.tokens) {
  console.log(`${token.tokenSymbol}: ${token.tokenBalanceFormatted} ($${token.tokenDollarValue})`);
}
```

---

#### GetWalletDetails

Retrieves comprehensive wallet information with all token details.

```protobuf
rpc getWalletDetails(GetWalletDetailsRequest) returns (GetWalletDetailsResponse)
```

**Request**

Same as `GetWalletTokensRequest`.

**Response**

| Field | Type | Description |
|-------|------|-------------|
| `tokens` | WalletToken[] | Array of wallet tokens |
| `numberOfTokens` | int32 | Total token count |
| `walletData` | Wallet | Full wallet data |

---

## Swap Service

**Package:** `swap`
**Service:** `SwapService`
**Port:** 50059
**Proto File:** `proto/swap.proto`
**Authentication:** Required (API Key)

### Swap

Executes a token swap transaction.

```protobuf
rpc swap(SwapRequest) returns (SwapResponse)
```

**Request**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fromTokenAddress` | string | Yes | Source token address |
| `toTokenAddress` | string | Yes | Destination token address |
| `amount` | double | Yes | Amount to swap |
| `chain` | CHAIN | Yes | BASE (default) |
| `privateKey` | string | Yes | Wallet private key |
| `feeResource` | FeeResource | No | COMPANY or SELF |
| `environment` | string | No | Environment identifier |
| `app` | string | No | App identifier |
| `slippage` | int64 | No | Slippage tolerance (bps) |

**Response**

| Field | Type | Description |
|-------|------|-------------|
| `tx` | string | Transaction hex (if not executed) |
| `txId` | string | Transaction hash (if executed) |
| `error` | Struct | Error details (if failed) |
| `success` | bool | Operation success |
| `sellAmount` | string | Amount sold |
| `buyAmount` | string | Amount received |
| `companyFee` | string | Fee charged |

**FeeResource Enum**

| Value | Description |
|-------|-------------|
| `COMPANY` | Company bears the fee |
| `SELF` | User bears the fee |

**Example Request**

```typescript
import * as grpc from '@grpc/grpc-js';

// Create authenticated metadata
const metadata = new grpc.Metadata();
metadata.add('apiKey', process.env.SAMTERMINAL_API_KEY!);

const response = await swapClient.swap(
  {
    fromTokenAddress: '0x4200000000000000000000000000000000000006', // WETH
    toTokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',   // USDC
    amount: 0.1,
    chain: Chain.BASE,
    privateKey: process.env.WALLET_PRIVATE_KEY!,
    slippage: 100, // 1%
    feeResource: FeeResource.SELF,
  },
  metadata
);

if (response.success) {
  console.log(`Swap executed: ${response.txId}`);
  console.log(`Sold: ${response.sellAmount}`);
  console.log(`Received: ${response.buyAmount}`);
} else {
  console.error('Swap failed:', response.error);
}
```

```bash
# grpcurl
grpcurl -plaintext \
  -H 'apiKey: your-api-key' \
  -d '{
    "fromTokenAddress": "0x4200000000000000000000000000000000000006",
    "toTokenAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "amount": 0.1,
    "chain": 0,
    "privateKey": "0x...",
    "slippage": 100
  }' \
  localhost:50059 \
  swap.SwapService/swap
```

---

### GetFee

Retrieves fee information for a wallet.

```protobuf
rpc getFee(GetFeeRequest) returns (GetFeeResponse)
```

**Request**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | string | Yes | Wallet address |
| `value` | string | No | Amount |

**Response**

| Field | Type | Description |
|-------|------|-------------|
| `success` | bool | Fee retrieval success |

---

### Approve

Approves token spending for swap contract.

```protobuf
rpc approve(ApproveRequest) returns (ApproveResponse)
```

**Request**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `walletPrivateKey` | string | Yes | Private key |
| `tokenAddress` | string | Yes | Token to approve |

**Response**

| Field | Type | Description |
|-------|------|-------------|
| `success` | bool | Approval success |

**Example Request**

```typescript
const metadata = new grpc.Metadata();
metadata.add('apiKey', process.env.SAMTERMINAL_API_KEY!);

const response = await swapClient.approve(
  {
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY!,
    tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  },
  metadata
);

if (response.success) {
  console.log('Token approved for swapping');
}
```

---

## Notification Service

**Package:** `notification`
**Service:** `NotificationService`
**Port:** 50056
**Proto File:** `proto/notification.proto`

### Send

Sends a notification to a user via Telegram or Farcaster.

```protobuf
rpc send(SendNotificationRequest) returns (SendNotificationResponse)
```

**Request**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | Message content |
| `type` | NotificationType | Yes | TELEGRAM or FARCASTER |
| `botName` | TelegramBotTypes | Yes | MAIN or USER |
| `extras` | NotificationExtrasType | No | Buttons and metadata |
| `to` | string | Yes | Recipient ID |
| `bypass` | bool | No | Bypass rate limits |

**NotificationType Enum**

| Value | Description |
|-------|-------------|
| `TELEGRAM` | Send via Telegram |
| `FARCASTER` | Send via Farcaster |

**TelegramBotTypes Enum**

| Value | Description |
|-------|-------------|
| `MAIN` | Main bot instance |
| `USER` | User-specific bot |

**NotificationExtrasType Object**

| Field | Type | Description |
|-------|------|-------------|
| `buttons` | NotificationButton[] | Interactive buttons |

**NotificationButton Object**

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Button text |
| `data` | string | Callback data or URL |
| `type` | NotificationButtonType | LINK or FUNCTION |

**Example Request**

```typescript
const response = await notificationClient.send({
  message: 'Your swap has been executed successfully!',
  type: NotificationType.TELEGRAM,
  botName: TelegramBotTypes.MAIN,
  to: '123456789', // Telegram chat ID
  extras: {
    buttons: [
      {
        label: 'View Transaction',
        data: 'https://basescan.org/tx/0x...',
        type: NotificationButtonType.LINK,
      },
      {
        label: 'Swap Again',
        data: 'swap_action',
        type: NotificationButtonType.FUNCTION,
      },
    ],
  },
});

if (response.success) {
  console.log('Notification sent');
}
```

---

### GetUserBotUrl

Retrieves bot connection URLs for a user.

```protobuf
rpc getUserBotUrl(GetUserBotURLRequest) returns (GetUserBotURLResponse)
```

**Request**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | Yes | User ID |

**Response**

| Field | Type | Description |
|-------|------|-------------|
| `urls` | UserBotData[] | Bot connection data |

**UserBotData Object**

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Connection code |
| `url` | string | Bot connection URL |
| `type` | NotificationType | TELEGRAM or FARCASTER |

**Example Request**

```typescript
const response = await notificationClient.getUserBotUrl({
  userId: 'user-123',
});

for (const bot of response.urls) {
  console.log(`${bot.type}: ${bot.url}`);
  // TELEGRAM: https://t.me/SamTerminalBot?start=abc123
}
```

---

### GetUserBotStates

Retrieves the state of all bot integrations for a user.

```protobuf
rpc getUserBotStates(GetUserBotStatesRequest) returns (GetUserBotStatesResponse)
```

**Request**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | Yes | User ID |

**Response**

| Field | Type | Description |
|-------|------|-------------|
| `success` | bool | Operation success |
| `botStates` | BotState[] | Bot states |

**BotState Object**

| Field | Type | Description |
|-------|------|-------------|
| `type` | NotificationType | Bot type |
| `isActive` | bool | Is bot active |

---

### ToggleBotState

Enables or disables a bot integration for a user.

```protobuf
rpc toggleBotState(ToggleBotStateRequest) returns (ToggleBotStateResponse)
```

**Request**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | Yes | User ID |
| `type` | NotificationType | Yes | Bot to toggle |

**Response**

| Field | Type | Description |
|-------|------|-------------|
| `success` | bool | Operation success |
| `botStates` | BotState[] | Updated states |

---

## Transaction Service

**Package:** `transactions`
**Service:** `TransactionService`
**Port:** 50054
**Proto File:** `proto/transactions.proto`

### LogTransaction

Records a blockchain transaction with metadata.

```protobuf
rpc logTransaction(LogTransactionRequest) returns (LogTransactionResponse)
```

**Request**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `txHash` | string | Yes | Transaction hash |
| `connectionKey` | string | Yes | Connection identifier |
| `connectionValue` | string | Yes | Connection value |
| `transactionStatus` | TransactionStatus | Yes | Status |
| `transactionParams` | Struct | No | Input parameters |
| `transactionResultParams` | Struct | No | Output results |
| `errorMessage` | string | No | Error details |

**TransactionStatus Enum**

| Value | Description |
|-------|-------------|
| `SUCCESS` | Transaction successful |
| `FAIL` | Transaction failed |
| `WAITING` | Transaction pending |

**Response**

| Field | Type | Description |
|-------|------|-------------|
| `saved` | bool | Log saved successfully |

**Example Request**

```typescript
const response = await transactionClient.logTransaction({
  txHash: '0x123...',
  connectionKey: 'userId',
  connectionValue: 'user-123',
  transactionStatus: TransactionStatus.SUCCESS,
  transactionParams: {
    fromToken: '0x...',
    toToken: '0x...',
    amount: '1000000',
  },
  transactionResultParams: {
    actualReceived: '998000',
    gasUsed: '150000',
  },
});

console.log(`Transaction logged: ${response.saved}`);
```

---

### UpdateLoggedTransactionStatus

Updates the status of a previously logged transaction.

```protobuf
rpc updateLoggedTransactionStatus(UpdateLoggedTransactionStatusRequest) returns (UpdateLoggedTransactionStatusResponse)
```

**Request**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `txHash` | string | Yes | Transaction hash |
| `transactionStatus` | TransactionStatus | Yes | New status |
| `errorMessage` | string | No | Error message |

**Response**

| Field | Type | Description |
|-------|------|-------------|
| `saved` | bool | Update saved |

---

## Common Types

### CHAIN Enum

Used across all services for chain specification.

| Value | Int | Description |
|-------|-----|-------------|
| `BASE` | 0 | Base L2 (default) |
| `ETHEREUM` | 1 | Ethereum Mainnet |
| `ARBITRUM` | 2 | Arbitrum One |
| `POLYGON` | 3 | Polygon PoS |
| `OPTIMISM` | 4 | Optimism |
| `BSC` | 5 | BNB Smart Chain |

### DataType Enum

Used for specifying data source.

| Value | Int | Description |
|-------|-----|-------------|
| `API` | 0 | External API data |
| `SCANNER` | 1 | Scanner-collected data |

### Google Protobuf Types

Some endpoints use Google's well-known types:

```protobuf
import "google/protobuf/struct.proto";

// google.protobuf.Struct - Dynamic JSON-like object
// Used for flexible request/response fields
```

---

## Error Handling

### gRPC Status Codes

| Code | Name | Description |
|------|------|-------------|
| 0 | OK | Success |
| 1 | CANCELLED | Operation cancelled |
| 2 | UNKNOWN | Unknown error |
| 3 | INVALID_ARGUMENT | Invalid request parameters |
| 5 | NOT_FOUND | Resource not found |
| 7 | PERMISSION_DENIED | Insufficient permissions |
| 13 | INTERNAL | Internal server error |
| 14 | UNAVAILABLE | Service unavailable |
| 16 | UNAUTHENTICATED | Missing/invalid authentication |

### Error Response Format

**gRPC Error Example**

```typescript
try {
  const response = await client.swap(request, metadata);
} catch (error) {
  if (error.code === grpc.status.UNAUTHENTICATED) {
    console.error('Invalid API key');
  } else if (error.code === grpc.status.INVALID_ARGUMENT) {
    console.error('Invalid request:', error.details);
  } else {
    console.error('Error:', error.message);
  }
}
```

**Swap Service Error Object**

```typescript
// SwapResponse.error structure
{
  "code": "INSUFFICIENT_BALANCE",
  "message": "Insufficient token balance for swap",
  "details": {
    "required": "1000000000000000000",
    "available": "500000000000000000"
  }
}
```

### Application Error Codes

| Code | Service | Description |
|------|---------|-------------|
| `INSUFFICIENT_BALANCE` | Swap | Not enough tokens |
| `SLIPPAGE_EXCEEDED` | Swap | Price moved too much |
| `TOKEN_NOT_FOUND` | Scanner | Token not in database |
| `WALLET_NOT_FOUND` | Scanner | Wallet not registered |

---

## Rate Limiting

### Default Limits

| Service | Limit | Window | Notes |
|---------|-------|--------|-------|
| Scanner | 100 req | 1 min | Per IP |
| Swap | 20 req | 1 min | Per API key |
| Notification | 60 req | 1 min | Per user |
| Transactions | 100 req | 1 min | Per connection |

### Rate Limit Errors

**gRPC**

```typescript
// Error code: RESOURCE_EXHAUSTED (8)
{
  code: 8,
  details: 'Rate limit exceeded. Retry after 60 seconds.'
}
```

**REST**

```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "retryAfter": 60
}
```

### Bypass Rate Limits

Some endpoints support bypass for internal services:

```typescript
// Notification service
await notificationClient.send({
  message: 'Important alert',
  to: '123456789',
  type: NotificationType.TELEGRAM,
  botName: TelegramBotTypes.MAIN,
  bypass: true, // Bypass rate limit
});
```

---

## Code Examples

### Complete TypeScript Client

```typescript
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

// Configuration
const PROTO_PATH = path.join(__dirname, '../proto');
const API_KEY = process.env.SAMTERMINAL_API_KEY!;

// Load protos
const loadProto = (filename: string) => {
  const packageDefinition = protoLoader.loadSync(
    path.join(PROTO_PATH, filename),
    {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    }
  );
  return grpc.loadPackageDefinition(packageDefinition);
};

// Create clients
const scannerProto = loadProto('index.proto') as any;
const swapProto = loadProto('swap.proto') as any;
const notificationProto = loadProto('notification.proto') as any;

class SamTerminalClient {
  private scanner: any;
  private swap: any;
  private notification: any;
  private metadata: grpc.Metadata;

  constructor(config: { apiKey: string; host?: string }) {
    const host = config.host || 'localhost';
    const credentials = grpc.credentials.createInsecure();

    this.scanner = new scannerProto.scanner.Scanner(
      `${host}:50060`,
      credentials
    );

    this.swap = new swapProto.swap.SwapService(
      `${host}:50059`,
      credentials
    );

    this.notification = new notificationProto.notification.NotificationService(
      `${host}:50056`,
      credentials
    );

    this.metadata = new grpc.Metadata();
    this.metadata.add('apiKey', config.apiKey);
  }

  // Token methods
  async getToken(tokenAddress: string, addIfNotExist = true) {
    return new Promise((resolve, reject) => {
      this.scanner.getToken(
        { tokenAddress, addIfNotExist },
        (error: Error | null, response: any) => {
          if (error) reject(error);
          else resolve(response);
        }
      );
    });
  }

  async getTokenPrice(tokenAddress: string) {
    return new Promise((resolve, reject) => {
      this.scanner.getTokenPrice(
        { tokenAddress },
        (error: Error | null, response: any) => {
          if (error) reject(error);
          else resolve(response);
        }
      );
    });
  }

  // Wallet methods
  async getWalletDetails(
    walletAddress: string,
    chain: 'BASE' = 'BASE'
  ) {
    return new Promise((resolve, reject) => {
      this.scanner.getWalletDetails(
        {
          walletAddress,
          chain: chain === 'BASE' ? 0 : 1,
          type: 0, // API
          tokenAddresses: [],
          filterLowUSD: true,
        },
        (error: Error | null, response: any) => {
          if (error) reject(error);
          else resolve(response);
        }
      );
    });
  }

  // Swap methods
  async swap(params: {
    fromToken: string;
    toToken: string;
    amount: number;
    privateKey: string;
    slippage?: number;
  }) {
    return new Promise((resolve, reject) => {
      this.swap.swap(
        {
          fromTokenAddress: params.fromToken,
          toTokenAddress: params.toToken,
          amount: params.amount,
          chain: 0, // BASE
          privateKey: params.privateKey,
          slippage: params.slippage || 100,
        },
        this.metadata,
        (error: Error | null, response: any) => {
          if (error) reject(error);
          else resolve(response);
        }
      );
    });
  }

  // Notification methods
  async sendTelegramNotification(chatId: string, message: string) {
    return new Promise((resolve, reject) => {
      this.notification.send(
        {
          message,
          type: 0, // TELEGRAM
          botName: 0, // MAIN
          to: chatId,
        },
        (error: Error | null, response: any) => {
          if (error) reject(error);
          else resolve(response);
        }
      );
    });
  }
}

// Usage
async function main() {
  const client = new SamTerminalClient({ apiKey: API_KEY });

  // Get token info
  const token = await client.getToken(
    '0x4200000000000000000000000000000000000006'
  );
  console.log('Token:', token);

  // Get wallet portfolio
  const wallet = await client.getWalletDetails('0x...');
  console.log('Wallet:', wallet);

  // Execute swap
  const swapResult = await client.swap({
    fromToken: '0x4200000000000000000000000000000000000006',
    toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    amount: 0.1,
    privateKey: process.env.WALLET_PRIVATE_KEY!,
  });
  console.log('Swap:', swapResult);
}

main().catch(console.error);
```

### cURL Examples (via grpcurl)

```bash
#!/bin/bash

# Install grpcurl
# brew install grpcurl (macOS)
# go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest (Go)

HOST="localhost"

# Get token
grpcurl -plaintext \
  -d '{"tokenAddress": "0x4200000000000000000000000000000000000006", "addIfNotExist": true}' \
  ${HOST}:50060 \
  scanner.Scanner/getToken

# Get wallet tokens
grpcurl -plaintext \
  -d '{
    "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "chain": 0,
    "type": 0,
    "tokenAddresses": [],
    "filterLowUSD": true
  }' \
  ${HOST}:50060 \
  scanner.Scanner/getWalletTokens

# Execute swap (authenticated)
grpcurl -plaintext \
  -H "apiKey: your-api-key" \
  -d '{
    "fromTokenAddress": "0x4200000000000000000000000000000000000006",
    "toTokenAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "amount": 0.1,
    "chain": 0,
    "privateKey": "0x...",
    "slippage": 100
  }' \
  ${HOST}:50059 \
  swap.SwapService/swap

# Send notification
grpcurl -plaintext \
  -d '{
    "message": "Hello from SamTerminal!",
    "type": 0,
    "botName": 0,
    "to": "123456789"
  }' \
  ${HOST}:50056 \
  notification.NotificationService/send

# List available services
grpcurl -plaintext ${HOST}:50060 list

# Describe service
grpcurl -plaintext ${HOST}:50060 describe scanner.Scanner
```

### Python Client Example

```python
import grpc
from concurrent import futures

# Generate Python stubs first:
# python -m grpc_tools.protoc -I./proto --python_out=./generated --grpc_python_out=./generated ./proto/*.proto

import index_pb2
import index_pb2_grpc
import swap_pb2
import swap_pb2_grpc

class SamTerminalClient:
    def __init__(self, api_key: str, host: str = "localhost"):
        self.api_key = api_key

        # Create channels
        self.scanner_channel = grpc.insecure_channel(f"{host}:50060")
        self.swap_channel = grpc.insecure_channel(f"{host}:50059")

        # Create stubs
        self.scanner = index_pb2_grpc.ScannerStub(self.scanner_channel)
        self.swap = swap_pb2_grpc.SwapServiceStub(self.swap_channel)

    def get_token(self, token_address: str, add_if_not_exist: bool = True):
        request = index_pb2.GetTokenRequest(
            tokenAddress=token_address,
            addIfNotExist=add_if_not_exist
        )
        return self.scanner.getToken(request)

    def execute_swap(self, from_token: str, to_token: str, amount: float, private_key: str):
        metadata = [("apiKey", self.api_key)]
        request = swap_pb2.SwapRequest(
            fromTokenAddress=from_token,
            toTokenAddress=to_token,
            amount=amount,
            chain=swap_pb2.CHAIN.BASE,
            privateKey=private_key,
            slippage=100
        )
        return self.swap.swap(request, metadata=metadata)

# Usage
if __name__ == "__main__":
    client = SamTerminalClient(api_key="your-api-key")

    # Get token
    token = client.get_token("0x4200000000000000000000000000000000000006")
    print(f"Token: {token.token.name} ({token.token.symbol})")
    print(f"Price: ${token.token.price}")
```

---

## SDKs & Client Libraries

### Official SDKs

| Language | Package | Status |
|----------|---------|--------|
| TypeScript | `@samterminal/grpc-client` | Planned |
| Python | `samterminal-client` | Planned |
| Go | `github.com/samterminal/go-client` | Planned |

### Proto File Generation

Generate clients from proto files:

```bash
# TypeScript
npx grpc_tools_node_protoc \
  --js_out=import_style=commonjs,binary:./generated \
  --grpc_out=grpc_js:./generated \
  --plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin` \
  -I ./proto \
  ./proto/*.proto

# Python
python -m grpc_tools.protoc \
  -I./proto \
  --python_out=./generated \
  --grpc_python_out=./generated \
  ./proto/*.proto

# Go
protoc \
  --go_out=./generated \
  --go-grpc_out=./generated \
  -I ./proto \
  ./proto/*.proto
```

### Proto Files Location

```
proto/
├── common/
│   └── common.proto       # Shared types (CHAIN, Token, Wallet, WalletToken)
├── token/
│   ├── messages.proto     # Token request/response messages
│   └── token.proto        # ScannerToken service
├── wallet/
│   ├── messages.proto     # Wallet request/response messages
│   └── wallet.proto       # ScannerWallet service
├── index.proto            # Main Scanner service
├── swap.proto             # Swap service
├── notification.proto     # Notification service
└── transactions.proto     # Transaction service
```

---

**Initial Release**

- Scanner Service (9 endpoints)
  - Token CRUD operations
  - Wallet data retrieval
- Swap Service (3 endpoints)
  - Token swap execution
  - Approval management
- Notification Service (4 endpoints)
  - Telegram notifications
  - Bot management
- Transaction Service (2 endpoints)
  - Transaction logging
  - Status updates


---

*This documentation is maintained as part of the SAM Terminal project.*
