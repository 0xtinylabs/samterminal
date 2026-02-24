package factory

import (
	"context"
	"log"
	"strings"
	"sync"
	"time"
	websocket "tokendata/lib/ws"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
)

const (
	bankrFactoryAddress = "0x660eaaedebc968f8f3694354fa8ec0b4c5ba8d12"

	// Create(address indexed pairToken, address token, address locker, address token2)
	bankrCreateEventABI = `[{
		"anonymous": false,
		"inputs": [
			{"indexed": true,  "internalType": "address", "name": "pairToken", "type": "address"},
			{"indexed": false, "internalType": "address", "name": "token",     "type": "address"},
			{"indexed": false, "internalType": "address", "name": "locker",    "type": "address"},
			{"indexed": false, "internalType": "address", "name": "token2",    "type": "address"}
		],
		"name": "Create",
		"type": "event"
	}]`

	erc20NameSymbolABI = `[
		{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
		{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}
	]`
)

// Parsed ABIs — cached at init, never re-parsed.
var (
	parsedCreateABI    abi.ABI
	parsedERC20ABI     abi.ABI
	createEventID      common.Hash
)

type BankrCreateEvent struct {
	TokenAddress string
	PairAddress  string
}

type createEventData struct {
	Token  common.Address
	Locker common.Address
	Token2 common.Address
}

// ERC20Meta holds name and symbol for a token.
type ERC20Meta struct {
	Name   string
	Symbol string
}

var client *ethclient.Client

func init() {
	client = websocket.GetEthClient()

	var err error
	parsedCreateABI, err = abi.JSON(strings.NewReader(bankrCreateEventABI))
	if err != nil {
		log.Fatalf("factory: failed to parse Create ABI: %v", err)
	}
	createEventID = parsedCreateABI.Events["Create"].ID

	parsedERC20ABI, err = abi.JSON(strings.NewReader(erc20NameSymbolABI))
	if err != nil {
		log.Fatalf("factory: failed to parse ERC20 ABI: %v", err)
	}
}

// SubscribeBankrFactory subscribes to Create events from the Bankr factory contract
// and sends decoded events to the provided channel. It automatically reconnects
// on subscription errors with exponential backoff.
func SubscribeBankrFactory(ctx context.Context, ch chan<- BankrCreateEvent) {
	go func() {
		backoff := 2 * time.Second
		maxBackoff := 60 * time.Second

		for {
			err := subscribeBankrOnce(ctx, ch)
			if ctx.Err() != nil {
				return // context cancelled, shut down
			}
			if err != nil {
				log.Printf("Bankr factory subscription error: %v — reconnecting in %s", err, backoff)
			} else {
				log.Printf("Bankr factory subscription closed — reconnecting in %s", backoff)
			}

			select {
			case <-ctx.Done():
				return
			case <-time.After(backoff):
			}

			backoff *= 2
			if backoff > maxBackoff {
				backoff = maxBackoff
			}
		}
	}()
}

func subscribeBankrOnce(ctx context.Context, ch chan<- BankrCreateEvent) error {
	factory := common.HexToAddress(bankrFactoryAddress)
	query := ethereum.FilterQuery{
		Addresses: []common.Address{factory},
		Topics:    [][]common.Hash{{createEventID}},
	}

	logsCh := make(chan types.Log)
	sub, err := client.SubscribeFilterLogs(ctx, query, logsCh)
	if err != nil {
		return err
	}
	defer sub.Unsubscribe()

	for {
		select {
		case <-ctx.Done():
			return nil
		case err := <-sub.Err():
			return err
		case vLog := <-logsCh:
			var ev createEventData
			if err := parsedCreateABI.UnpackIntoInterface(&ev, "Create", vLog.Data); err != nil {
				log.Printf("Bankr factory: unpack error: %v", err)
				continue
			}
			pairAddr := common.HexToAddress(vLog.Topics[1].Hex()).Hex()

			ch <- BankrCreateEvent{
				TokenAddress: strings.ToLower(ev.Token.Hex()),
				PairAddress:  strings.ToLower(pairAddr),
			}
		}
	}
}

// BatchReadERC20Meta reads name() and symbol() for multiple tokens concurrently.
func BatchReadERC20Meta(ctx context.Context, addresses []string) map[string]ERC20Meta {
	results := make(map[string]ERC20Meta, len(addresses))
	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, addr := range addresses {
		wg.Add(1)
		go func(a string) {
			defer wg.Done()
			name := readERC20String(ctx, a, "name")
			symbol := readERC20String(ctx, a, "symbol")
			mu.Lock()
			results[a] = ERC20Meta{Name: name, Symbol: symbol}
			mu.Unlock()
		}(addr)
	}

	wg.Wait()
	return results
}

func readERC20String(ctx context.Context, tokenAddr string, method string) string {
	data, err := parsedERC20ABI.Pack(method)
	if err != nil {
		return ""
	}
	addr := common.HexToAddress(tokenAddr)
	res, err := client.CallContract(ctx, ethereum.CallMsg{To: &addr, Data: data}, nil)
	if err != nil {
		return ""
	}
	out, err := parsedERC20ABI.Unpack(method, res)
	if err != nil || len(out) == 0 {
		return ""
	}
	s, ok := out[0].(string)
	if !ok {
		return ""
	}
	return s
}
