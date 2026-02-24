package websocket

import (
	"context"
	"log"
	"tokendata/env"

	"github.com/ethereum/go-ethereum/ethclient"
)

var etclient *ethclient.Client

func init() {
	var err error
	for attempt := 1; attempt <= 3; attempt++ {
		etclient, err = ethclient.DialContext(context.Background(), env.RpcSocketURL.GetEnv())
		if err == nil {
			return
		}
		log.Printf("ws.go init: attempt %d failed to connect: %v", attempt, err)
	}
	log.Fatalf("ws.go init: failed to connect after 3 attempts: %v", err)
}

func GetEthClient() *ethclient.Client {
	return etclient
}

func Close() {
	if etclient != nil {
		etclient.Close()
	}
}
