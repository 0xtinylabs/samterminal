package cron

import (
	"log"
	"strings"
	"time"
	db_dto "tokendata/database/dto"
	tokenRepository "tokendata/database/repositories/token"
	db "tokendata/generated/prisma"
	"tokendata/lib/apis"
)

func StartClankerPoller(interval time.Duration) {
	log.Printf("Starting Clanker poller with %s interval", interval)

	dedup := newTokenDedup(10 * time.Minute)
	cleanupTicker := time.NewTicker(10 * time.Minute)
	defer cleanupTicker.Stop()

	pollTicker := time.NewTicker(interval)
	defer pollTicker.Stop()

	pollClanker(dedup)

	for {
		select {
		case <-pollTicker.C:
			pollClanker(dedup)
		case <-cleanupTicker.C:
			dedup.cleanup()
		}
	}
}

func pollClanker(dedup *tokenDedup) {
	tokens, err := apis.GetLatestClankerTokens(20)
	if err != nil {
		log.Printf("Clanker poll error: %v", err)
		return
	}

	// Filter new tokens (not in dedup cache, not in DB)
	type newToken struct {
		addr  string
		token apis.ClankerToken
	}
	var newTokens []newToken

	for _, t := range tokens {
		addr := strings.ToLower(strings.TrimSpace(t.ContractAddress))
		if addr == "" {
			continue
		}
		if dedup.has(addr) {
			continue
		}
		existing, _ := tokenRepository.GetToken(db_dto.TokenAddress(addr))
		if existing != nil {
			dedup.add(addr)
			continue
		}
		newTokens = append(newTokens, newToken{addr: addr, token: t})
	}

	if len(newTokens) == 0 {
		return
	}

	// Batch fetch from DexScreener for price/volume/pool data (chunked)
	addresses := make([]string, len(newTokens))
	for i, nt := range newTokens {
		addresses[i] = nt.addr
	}
	dexData := batchFetchDexScreener(addresses)

	// Collect unique pair addresses for a single SaveTokenPrice call per pair
	pairsSaved := make(map[string]bool)

	newCount := 0
	for _, nt := range newTokens {
		reason := "clanker"
		name := nt.token.Name
		symbol := nt.token.Symbol
		imgURL := nt.token.ImageURL
		poolAddress := nt.token.PoolAddress
		pair := nt.token.Pair

		price := "0"
		volume := "0"
		supply := "0"
		circulatedSupply := "0"
		poolType := db.DexPoolTypeUniswapV3

		if strings.Contains(nt.token.Type, "v4") {
			poolType = db.DexPoolTypeUniswapV4
		}

		pairAddress := ""
		if dexData != nil {
			if ds, ok := dexData[nt.addr]; ok {
				if ds.TokenData.Price != "" && ds.TokenData.Price != "0" {
					price = ds.TokenData.Price
				}
				if ds.TokenData.Volume24H != "" && ds.TokenData.Volume24H != "0" {
					volume = ds.TokenData.Volume24H
				}
				if imgURL == "" && ds.TokenData.ImageURL != "" {
					imgURL = ds.TokenData.ImageURL
				}
				if ds.Pool.PairAddress != "" {
					pairAddress = ds.Pool.PairAddress
				}
				if ds.Pool.IsV4 {
					poolType = db.DexPoolTypeUniswapV4
				}
			}
		}

		if pairAddress == "" && strings.EqualFold(pair, "WETH") {
			pairAddress = "0x4200000000000000000000000000000000000006"
		}

		token := tokenRepository.GetOrCreateToken(
			db_dto.TokenAddress(nt.addr),
			&name, &supply, &circulatedSupply, &symbol, &imgURL,
			&price, &volume, &poolType, &poolAddress, &pairAddress,
			&reason, &price, false,
		)
		if token == nil {
			log.Printf("Clanker: failed to create token %s (%s)", symbol, nt.addr)
			dedup.add(nt.addr)
			continue
		}

		// Save pair price once per unique pair address
		if pairAddress != "" && !pairsSaved[pairAddress] {
			pairsSaved[pairAddress] = true
			go tokenRepository.SaveTokenPrice(db_dto.TokenAddress(pairAddress))
		}

		err := tokenRepository.StartWatchingForPool(token)
		if err != nil {
			log.Printf("Clanker: failed to watch pool for %s: %v", symbol, err)
		}

		dedup.add(nt.addr)
		newCount++
		log.Printf("Clanker: new token %s (%s) price=%s at %s", symbol, nt.addr, price, nt.token.DeployedAt)
	}

	if newCount > 0 {
		log.Printf("Clanker poll: added %d new tokens", newCount)
	}
}
