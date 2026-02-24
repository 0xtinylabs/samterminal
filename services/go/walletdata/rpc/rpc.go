package rpc

import (
	"context"
	"errors"
	"fmt"
	"log"
	"math/big"
	"sync"
	"time"
	"walletdata/env"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/ethclient"
	gethrpc "github.com/ethereum/go-ethereum/rpc"
)

type TransactionDirection string

const (
	DirectionIncoming TransactionDirection = "incoming"
	DirectionOutgoing TransactionDirection = "outgoing"
	DirectionSelf     TransactionDirection = "self"
)

type WalletTransaction struct {
	Hash         common.Hash
	Direction    TransactionDirection
	Counterparty *common.Address
	ValueWei     *big.Int
	Raw          PendingTransactionPayload
}

// Alchemy Pending Payload Structure
type PendingTransactionPayload struct {
	Hash                 common.Hash     `json:"hash"`
	From                 common.Address  `json:"from"`
	To                   *common.Address `json:"to"`
	Value                *hexutil.Big    `json:"value"`
	Nonce                hexutil.Uint64  `json:"nonce"`
	Gas                  hexutil.Uint64  `json:"gas"`
	GasPrice             *hexutil.Big    `json:"gasPrice"`
	MaxFeePerGas         *hexutil.Big    `json:"maxFeePerGas"`
	MaxPriorityFeePerGas *hexutil.Big    `json:"maxPriorityFeePerGas"`
	Input                hexutil.Bytes   `json:"input"`
}

type WalletSubscription struct {
	Events <-chan WalletTransaction
	Errors <-chan error
	Stop   func()
}

var client *ethclient.Client
var socketClient *gethrpc.Client

func init() {
	env.LoadEnv("./.env")

	var err error
	client, _, err = getEthClient()
	if err != nil {
		log.Fatalf("Failed to create eth client: %v", err)
	}
	socketClient, _, err = getRpcClient()
	if err != nil {
		log.Fatalf("Failed to create rpc client: %v", err)
	}
}

func getEthClient() (*ethclient.Client, context.Context, error) {
	if client != nil {
		return client, context.Background(), nil
	}
	ctx := context.Background()
	rpcURL := env.RPC_URL.GetEnv()
	if rpcURL == "" {
		return nil, ctx, errors.New("RPC_URL is not set")
	}
	c, err := ethclient.DialContext(ctx, rpcURL)
	if err != nil {
		return nil, ctx, err
	}
	client = c
	return client, ctx, nil
}

func getRpcClient() (*gethrpc.Client, context.Context, error) {

	ctx := context.Background()
	if socketClient != nil {
		return socketClient, ctx, nil
	}
	rpcURL := env.RPC_WS_URL.GetEnv()
	if rpcURL == "" {
		return nil, ctx, errors.New("RPC_WS_URL is not set")
	}
	socketClient, err := gethrpc.DialContext(ctx, rpcURL)
	if err != nil {
		return nil, ctx, err
	}
	return socketClient, ctx, nil
}

func WatchWalletForUpdates(walletAddress string, onEvent func(event WalletTransaction)) error {
	_, err := SubscribeWalletTransactions(context.Background(), walletAddress, onEvent)
	return err
}

func SubscribeWalletTransactions(ctx context.Context, walletAddress string, onEvent func(event WalletTransaction)) (*WalletSubscription, error) {

	if !common.IsHexAddress(walletAddress) {
		return nil, fmt.Errorf("invalid wallet address %s", walletAddress)
	}

	wallet := common.HexToAddress(walletAddress)

	client, rpcCtx, err := getRpcClient()
	if err != nil {
		return nil, fmt.Errorf("connect to rpc: %w", err)
	}

	rawStream := make(chan PendingTransactionPayload)

	// addresses {to, from	}[]

	sub, err := client.Subscribe(rpcCtx, "eth", rawStream, "alchemy_minedTransactions", map[string]any{

		"addresses": []map[string]string{
			{
				"to": wallet.Hex(),
			},
			{
				"from": wallet.Hex(),
			},
		},
		"hashesOnly": false,
	})

	if err != nil {
		return nil, fmt.Errorf("subscribe pending transactions: %w", err)
	}

	events := make(chan WalletTransaction)
	errorsCh := make(chan error, 1)

	var stopOnce sync.Once

	stopFn := func() {
		stopOnce.Do(func() {
			sub.Unsubscribe()
			close(events)
			close(errorsCh)
		})
	}

	go func() {
		defer stopFn()

		for {
			select {
			case <-ctx.Done():
				return

			case <-rpcCtx.Done():
				if err := rpcCtx.Err(); err != nil && !errors.Is(err, context.Canceled) {
					select {
					case errorsCh <- err:
					default:
					}
				}
				return

			case err := <-sub.Err():
				if err != nil {
					select {
					case errorsCh <- err:
					default:
					}
				}
				return

			case payload, ok := <-rawStream:
				if !ok {
					return
				}

				tx := buildWalletTransaction(payload, wallet, onEvent)

				select {
				case events <- tx:
				case <-ctx.Done():
					return
				case <-rpcCtx.Done():
					return
				}
			}
		}
	}()

	return &WalletSubscription{
		Events: events,
		Errors: errorsCh,
		Stop:   stopFn,
	}, nil
}

func buildWalletTransaction(payload PendingTransactionPayload, wallet common.Address, onEvent func(event WalletTransaction)) WalletTransaction {
	value := big.NewInt(0)

	if payload.Value != nil {
		value = new(big.Int).Set(payload.Value.ToInt())
	}

	event := WalletTransaction{
		Hash:      payload.Hash,
		ValueWei:  value,
		Raw:       payload,
		Direction: DirectionIncoming,
	}

	isFromMe := payload.From == wallet
	isToMe := payload.To != nil && *payload.To == wallet

	if isFromMe && isToMe {
		event.Direction = DirectionSelf
		cp := wallet
		event.Counterparty = &cp
	} else if isFromMe {
		event.Direction = DirectionOutgoing
		if payload.To != nil {
			cp := *payload.To
			event.Counterparty = &cp
		}
	} else if isToMe {
		event.Direction = DirectionIncoming
		cp := payload.From
		event.Counterparty = &cp
	}

	if onEvent != nil {
		onEvent(event)
	}

	// var tokenAddress hexutil.Bytes
	// // panic: runtime error: slice bounds out of range [:42] with capacity 0
	// if len(payload.Input) > 42 {
	// 	tokenAddress = payload.Input[0:42]
	// }

	return event
}

func GetNativeBalance(walletAddress string) (string, error) {
	if !common.IsHexAddress(walletAddress) {
		return "0", fmt.Errorf("invalid address")
	}
	account := common.HexToAddress(walletAddress)

	client, ctx, err := getEthClient()
	if err != nil {
		return "0", err
	}

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	balance, err := client.BalanceAt(ctx, account, nil)
	if err != nil {
		return "0", err
	}
	return balance.String(), nil
}
