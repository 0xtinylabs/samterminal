package wsDex

import (
	"context"
	"errors"
	"log"
	"math"
	"math/big"
	"strings"
	websocket "tokendata/lib/ws"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
)

var uniswapV3PoolABI = `[

{
	"inputs": [],
	"name": "token0",
	"outputs": [{ "internalType": "address", "name": "", "type": "address" }],
	"stateMutability": "view",
	"type": "function"
},
{
	"inputs": [],
	"name": "token1",
	"outputs": [{ "internalType": "address", "name": "", "type": "address" }],
	"stateMutability": "view",
	"type": "function"
},
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true,  "internalType": "address", "name": "sender",        "type": "address"},
      {"indexed": true,  "internalType": "address", "name": "recipient",     "type": "address"},
      {"indexed": false, "internalType": "int256",  "name": "amount0",       "type": "int256"},
      {"indexed": false, "internalType": "int256",  "name": "amount1",       "type": "int256"},
      {"indexed": false, "internalType": "uint160", "name": "sqrtPriceX96",  "type": "uint160"},
      {"indexed": false, "internalType": "uint128", "name": "liquidity",     "type": "uint128"},
      {"indexed": false, "internalType": "int24",   "name": "tick",          "type": "int24"}
    ],
    "name": "Swap",
    "type": "event"
  }
]`

var uniswapV4PoolABI = `[


{
	"inputs": [],
	"name": "token0",
	"outputs": [{ "internalType": "address", "name": "", "type": "address" }],
	"stateMutability": "view",
	"type": "function"
},
{
	"inputs": [],
	"name": "token1",
	"outputs": [{ "internalType": "address", "name": "", "type": "address" }],
	"stateMutability": "view",
	"type": "function"
},
{
	"inputs": [
        { "indexed": true, "internalType": "bytes32", "name": "id", "type": "bytes32" },
		{ "internalType": "address", "name": "currency0", "type": "address" },
		{ "internalType": "address", "name": "currency1", "type": "address" }
	],
	"name": "Initialize",
	"outputs": [],
	"stateMutability": "nonpayable",
	"type": "function"
},
 {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "id", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "sender", "type": "address" },
      { "indexed": false, "internalType": "int128", "name": "amount0", "type": "int128" },
      { "indexed": false, "internalType": "int128", "name": "amount1", "type": "int128" },
      { "indexed": false, "internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160" },
      { "indexed": false, "internalType": "uint128", "name": "liquidity", "type": "uint128" },
      { "indexed": false, "internalType": "int24", "name": "tick", "type": "int24" },
	  {"indexed": false, "internalType": "uint24", "name": "fee", "type": "uint24" }
    ],
    "name": "Swap",
    "type": "event"
  }
]`

const erc20MetaABI = `[
  {"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"}
]`

type initializeEvent struct {
	Currency0 *common.Address
	Currency1 *common.Address
}

type swapEvent struct {
	Amount0      *big.Int
	Amount1      *big.Int
	SqrtPriceX96 *big.Int
	Liquidity    *big.Int
	Tick         *big.Int
	Fee          *big.Int
}

type SwapHandler func(vLog types.Log, sqrtPriceX96 *big.Int, price *big.Float, pair string, reverse bool, tokenAmount string, tokenDecimals int)

const UniswapV4PoolManager = "0x498581ff718922c3f8e6a244956af099b2652b2b"

var (
	ErrABIRequired      = errors.New("abi json required for generic watcher")
	ErrSwapEventMissing = errors.New("swap event missing in abi")
)

var client *ethclient.Client

func init() {
	client = websocket.GetEthClient()
}

func readPoolTokens(isV4 bool, poolAddr common.Address) (token0 string, token1 string, err error) {
	abiJSON := uniswapV3PoolABI
	if isV4 {
		abiJSON = uniswapV4PoolABI
	}
	abiParsed, err := abi.JSON(strings.NewReader(abiJSON))
	if err != nil {
		log.Println("wsDex: could not parse abi:", err)
		return "", "", err
	}

	if isV4 {
		data := abiParsed.Events["Initialize"]

		head, _ := client.HeaderByNumber(context.Background(), nil)
		toBlock := new(big.Int).Set(head.Number)
		fromBlock := new(big.Int).Sub(toBlock, big.NewInt(5))
		q := ethereum.FilterQuery{
			FromBlock: fromBlock,
			ToBlock:   toBlock,
			Addresses: []common.Address{common.HexToAddress(UniswapV4PoolManager)},
			Topics:    [][]common.Hash{{data.ID}},
		}
		logs, err := client.FilterLogs(context.Background(), q)
		if err != nil {
			log.Println("wsDex: could not filter logs:", err)
			return "", "", nil
		}
		log.Printf("wsDex: logs: %+v", logs)
		if len(logs) == 0 {
			return "", "", errors.New("no logs found")
		}
		last := logs[len(logs)-1]
		log.Printf("wsDex: last: %+v", last)
		var ev initializeEvent
		if err := abiParsed.UnpackIntoInterface(&ev, "Initialize", last.Data); err != nil {
			log.Println("wsDex: could not unpack initialize:", err)
			return "", "", err
		}
		log.Printf("wsDex: ev: %+v", ev)
		token0 = ev.Currency0.Hex()
		token1 = ev.Currency1.Hex()
		return token0, token1, nil
	}

	data, err := abiParsed.Pack("token1")
	if err != nil {
		log.Println("wsDex: could not pack token1:", err)
		return "", "", err
	}
	res, err := client.CallContract(context.Background(), ethereum.CallMsg{To: &poolAddr, Data: data}, nil)
	if err != nil {
		log.Println("wsDex: could not call contract token1:", err)
		return "", "", err
	}
	var token1Address common.Address
	err = abiParsed.UnpackIntoInterface(&token1Address, "token1", res)
	if err != nil {
		return "", "", err
	}
	token1 = token1Address.Hex()
	data, err = abiParsed.Pack("token0")
	if err != nil {
		log.Println("wsDex: could not pack token0:", err)
		return "", "", err
	}
	res, err = client.CallContract(context.Background(), ethereum.CallMsg{To: &poolAddr, Data: data}, nil)
	if err != nil {
		log.Println("wsDex: could not call contract token0:", err)
		return "", "", err
	}
	var token0Address common.Address
	err = abiParsed.UnpackIntoInterface(&token0Address, "token0", res)
	if err != nil {
		log.Println("wsDex: could not unpack token0:", err)
		return "", "", err
	}
	token0 = token0Address.Hex()
	return token0, token1, nil
}

func WatchSwapGenericWithABI(ctx context.Context, wssURL string, poolAddr string, isV4 bool, tokenAddr, pairAddress string, onSwap SwapHandler, onError func(error)) (stop func(), err error) {

	pAddr := common.HexToAddress(poolAddr)

	var useABI string
	if isV4 {
		useABI = uniswapV4PoolABI
	} else {
		useABI = uniswapV3PoolABI
	}
	abiParsed, err := abi.JSON(strings.NewReader(useABI))
	if err != nil {
		log.Println("wsDex: could not parse abi:", err)
		return nil, err
	}
	event := abiParsed.Events["Swap"]

	var poolAddress = pAddr.Hex()
	if isV4 {
		poolAddress = UniswapV4PoolManager
	}

	eventTopic := event.ID
	query := ethereumFilterQuery([]common.Address{common.HexToAddress(poolAddress)}, [][]common.Hash{{eventTopic}})
	if isV4 {
		query.Topics = append(query.Topics, []common.Hash{common.HexToHash(poolAddr)})
	}
	logsCh := make(chan types.Log)
	sub, err := client.SubscribeFilterLogs(ctx, query, logsCh)
	if err != nil {
		log.Printf("Error subscribing to filter logs: %+v", err)
		return nil, err
	}

	ctxInner, cancel := context.WithCancel(ctx)

	var token0, token1 string
	if pairAddress != "" {
		token0 = pairAddress
		token1 = tokenAddr
	} else {
		token0, token1, err = readPoolTokens(isV4, pAddr)
		if err != nil {
			log.Println("wsDex: could not read pool tokens:", err)
			cancel()
			return nil, err
		}
	}

	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("wsDex goroutine panic: %v", r)
			}
		}()

		for {
			select {
			case <-ctxInner.Done():
				return
			case err := <-sub.Err():
				log.Printf("wsDex Swap subscription error: %+v", err)
				if onError != nil {
					log.Printf("wsDex Swap subscription error: %+v", err)
					onError(err)
				} else {
					log.Println("wsDex Swap subscription error:", err)
				}
				return
			case vLog := <-logsCh:

				var ev swapEvent
				if err := abiParsed.UnpackIntoInterface(&ev, "Swap", vLog.Data); err != nil {
					if onError != nil {
						log.Printf("wsDex Swap unpack error: %+v", err)
						onError(err)
					} else {
						log.Println("wsDex Swap unpack error:", err)
					}
					continue
				}

				token0Decimals, err := GetTokenDecimals(ctx, wssURL, token0)
				if err != nil {
					log.Println("wsDex: could not get token decimals:", err)
				}
				token1Decimals, err := GetTokenDecimals(ctx, wssURL, token1)
				if err != nil {
					log.Println("wsDex: could not get token decimals:", err)
				}
				tokenAmount := ev.Amount0
				tokenDecimals := token0Decimals
				isSell := ev.Amount0.Sign() == -1
				price := sqrtPriceX96ToPriceWithDecimals(ev.SqrtPriceX96, token0Decimals, token1Decimals, isSell)
				if onSwap != nil {
					var pair = token1

					if strings.EqualFold(pair, tokenAddr) {
						pair = token0
						tokenAmount = ev.Amount1
						tokenDecimals = token1Decimals
					}

					onSwap(vLog, ev.SqrtPriceX96, price, pair, ev.Tick.Sign() != -1, tokenAmount.String(), tokenDecimals)
				}
			}
		}
	}()

	return func() {
		cancel()
		sub.Unsubscribe()
	}, nil
}

func sqrtPriceX96ToPriceWithDecimals(sqrtPriceX96 *big.Int, decimals0, decimals1 int, isSell bool) *big.Float {
	if sqrtPriceX96 == nil {
		return big.NewFloat(0)
	}
	prec := uint(256)

	bf := new(big.Float).SetPrec(prec).SetInt(sqrtPriceX96)
	bfSquared := new(big.Float).SetPrec(prec).Mul(bf, bf)
	den := new(big.Float).SetPrec(prec).SetInt(new(big.Int).Lsh(big.NewInt(1), 192))
	base := new(big.Float).SetPrec(prec).Quo(bfSquared, den)

	if isSell {
		base = base.Quo(base, big.NewFloat(math.Pow10(decimals0-decimals1)))
	} else {
		base = base.Mul(base, big.NewFloat(math.Pow10(decimals1-decimals0)))
	}

	return base
}

func ethereumFilterQuery(addrs []common.Address, topics [][]common.Hash) ethereum.FilterQuery {
	return ethereum.FilterQuery{
		Addresses: addrs,
		Topics:    topics,
	}
}

func GetTokenDecimals(ctx context.Context, rpcURL, tokenAddr string) (int, error) {

	if !common.IsHexAddress(tokenAddr) {
		return 18, errors.New("invalid token address")
	}
	decimals, err := readERC20Decimals(ctx, client, common.HexToAddress(tokenAddr))
	if err != nil {
		return 18, err
	}

	return decimals, nil
}

func readERC20Decimals(ctx context.Context, client *ethclient.Client, token common.Address) (int, error) {
	ercABI, err := abi.JSON(strings.NewReader(erc20MetaABI))
	if err != nil {
		return 0, err
	}
	data, err := ercABI.Pack("decimals")
	if err != nil {
		return 0, err
	}
	res, err := client.CallContract(ctx, ethereum.CallMsg{To: &token, Data: data}, nil)
	if err != nil {
		return 0, err
	}
	out, err := ercABI.Unpack("decimals", res)
	if err != nil || len(out) == 0 {
		return 0, err
	}
	return int(out[0].(uint8)), nil
}
