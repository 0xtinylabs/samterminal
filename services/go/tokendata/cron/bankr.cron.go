package cron

import (
	"context"
	"log"
	"strings"
	"sync"
	"time"
	db_dto "tokendata/database/dto"
	tokenRepository "tokendata/database/repositories/token"
	db "tokendata/generated/prisma"
	"tokendata/lib/ws/factory"
)

// StartBankrListener subscribes to Bankr factory Create events via WebSocket,
// buffers new tokens for batchInterval, then batch-processes them
// (DexScreener metadata + DB insert + pool watching).
func StartBankrListener(batchInterval time.Duration) {
	log.Printf("Starting Bankr factory listener with %s batch interval", batchInterval)

	dedup := newTokenDedup(10 * time.Minute)
	eventCh := make(chan factory.BankrCreateEvent, 100)

	ctx := context.Background()
	factory.SubscribeBankrFactory(ctx, eventCh)

	var mu sync.Mutex
	var pending []factory.BankrCreateEvent

	// Collect events from WSS
	go func() {
		for ev := range eventCh {
			if dedup.has(ev.TokenAddress) {
				continue
			}
			existing, _ := tokenRepository.GetToken(db_dto.TokenAddress(ev.TokenAddress))
			if existing != nil {
				dedup.add(ev.TokenAddress)
				continue
			}
			mu.Lock()
			pending = append(pending, ev)
			mu.Unlock()
		}
	}()

	batchTicker := time.NewTicker(batchInterval)
	defer batchTicker.Stop()

	cleanupTicker := time.NewTicker(10 * time.Minute)
	defer cleanupTicker.Stop()

	for {
		select {
		case <-batchTicker.C:
			mu.Lock()
			batch := pending
			pending = nil
			mu.Unlock()
			if len(batch) > 0 {
				processBankrBatch(ctx, batch, dedup)
			}
		case <-cleanupTicker.C:
			dedup.cleanup()
		}
	}
}

func processBankrBatch(ctx context.Context, events []factory.BankrCreateEvent, dedup *tokenDedup) {
	// Deduplicate within batch
	type pendingToken struct {
		addr string
		pair string
	}
	seen := make(map[string]bool)
	var tokens []pendingToken
	for _, ev := range events {
		if seen[ev.TokenAddress] {
			continue
		}
		seen[ev.TokenAddress] = true
		tokens = append(tokens, pendingToken{addr: ev.TokenAddress, pair: ev.PairAddress})
	}

	// Parallel RPC: batch read name+symbol for all tokens concurrently
	addresses := make([]string, len(tokens))
	for i, t := range tokens {
		addresses[i] = t.addr
	}
	metaMap := factory.BatchReadERC20Meta(ctx, addresses)

	// Batch DexScreener fetch (chunked)
	dexData := batchFetchDexScreener(addresses)

	// Deduplicate SaveTokenPrice calls per pair
	pairsSaved := make(map[string]bool)

	newCount := 0
	for _, t := range tokens {
		meta := metaMap[t.addr]
		name := meta.Name
		symbol := meta.Symbol
		if name == "" {
			name = "Unknown"
		}
		if symbol == "" {
			symbol = "UNKNOWN"
		}

		reason := "bankr"
		price := "0"
		volume := "0"
		supply := "0"
		circulatedSupply := "0"
		imgURL := ""
		poolAddress := ""
		pairAddress := t.pair
		poolType := db.DexPoolTypeUniswapV4

		if dexData != nil {
			if ds, ok := dexData[t.addr]; ok {
				if ds.TokenData.Price != "" && ds.TokenData.Price != "0" {
					price = ds.TokenData.Price
				}
				if ds.TokenData.Volume24H != "" && ds.TokenData.Volume24H != "0" {
					volume = ds.TokenData.Volume24H
				}
				if ds.TokenData.ImageURL != "" {
					imgURL = ds.TokenData.ImageURL
				}
				if ds.TokenData.Name != "" {
					name = ds.TokenData.Name
				}
				if ds.TokenData.Symbol != "" {
					symbol = ds.TokenData.Symbol
				}
				if ds.Pool.Address != "" {
					poolAddress = ds.Pool.Address
				}
				if ds.Pool.PairAddress != "" {
					pairAddress = ds.Pool.PairAddress
				}
			}
		}

		if pairAddress == "" {
			pairAddress = "0x4200000000000000000000000000000000000006"
		}

		token := tokenRepository.GetOrCreateToken(
			db_dto.TokenAddress(t.addr),
			&name, &supply, &circulatedSupply, &symbol, &imgURL,
			&price, &volume, &poolType, &poolAddress, &pairAddress,
			&reason, &price, false,
		)
		if token == nil {
			log.Printf("Bankr: failed to create token %s (%s)", symbol, t.addr)
			dedup.add(t.addr)
			continue
		}

		if pairAddress != "" && !pairsSaved[pairAddress] {
			pairsSaved[pairAddress] = true
			go tokenRepository.SaveTokenPrice(db_dto.TokenAddress(strings.ToLower(pairAddress)))
		}

		if poolAddress != "" {
			err := tokenRepository.StartWatchingForPool(token)
			if err != nil {
				log.Printf("Bankr: failed to watch pool for %s: %v", symbol, err)
			}
		}

		dedup.add(t.addr)
		newCount++
		log.Printf("Bankr: new token %s (%s) price=%s pair=%s", symbol, t.addr, price, pairAddress)
	}

	if newCount > 0 {
		log.Printf("Bankr batch: added %d new tokens", newCount)
	}
}
