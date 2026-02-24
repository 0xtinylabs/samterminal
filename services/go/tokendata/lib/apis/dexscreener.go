package apis

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
	dexdto "tokendata/lib/dex/dto"

	"github.com/go-resty/resty/v2"
)

const (
	dexscreenerBaseURL      = "https://api.dexscreener.com/token-pairs/v1"
	dexscreenerTokensURL    = "https://api.dexscreener.com/tokens/v1"
	dexscreenerChainID      = "base"
)

var dexscreenerClient = resty.New().
	SetTimeout(10 * time.Second).
	SetRetryCount(2).
	SetRetryWaitTime(200 * time.Millisecond).
	SetRetryMaxWaitTime(1 * time.Second)

type dexscreenerPairsDTO []dexscreenerPairDTO

type dexscreenerPairDTO struct {
	DexID       string `json:"dexId"`
	PairAddress string `json:"pairAddress"`
	BaseToken   struct {
		Address string `json:"address"`
		Name    string `json:"name"`
		Symbol  string `json:"symbol"`
	} `json:"baseToken"`
	QuoteToken struct {
		Address string `json:"address"`
		Name    string `json:"name"`
		Symbol  string `json:"symbol"`
	} `json:"quoteToken"`
	PriceUSD string `json:"priceUsd"`
	Volume   struct {
		H24 float64 `json:"h24"`
	} `json:"volume"`
	Liquidity struct {
		USD float64 `json:"usd"`
	} `json:"liquidity"`
}

func fetchDexscreenerPairs(tokenAddress string) (dexscreenerPairsDTO, error) {
	addr := strings.ToLower(strings.TrimSpace(tokenAddress))
	if addr == "" {
		return nil, errors.New("token address is required")
	}

	u := fmt.Sprintf("%s/%s/%s", dexscreenerBaseURL, dexscreenerChainID, addr)
	resp, err := dexscreenerClient.R().Get(u)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode())
	}

	var pairs dexscreenerPairsDTO
	if err := json.Unmarshal(resp.Body(), &pairs); err != nil {
		return nil, err
	}
	return pairs, nil
}

func selectBestPairForBaseToken(pairs dexscreenerPairsDTO, tokenAddress string) *dexscreenerPairDTO {
	addr := strings.ToLower(strings.TrimSpace(tokenAddress))
	if addr == "" || len(pairs) == 0 {
		return nil
	}

	var best *dexscreenerPairDTO
	bestScore := -1.0

	for i := range pairs {
		p := &pairs[i]
		if strings.ToLower(p.BaseToken.Address) != addr {
			continue
		}

		score := p.Liquidity.USD
		if score == 0 {
			score = p.Volume.H24
		}
		if score > bestScore {
			bestScore = score
			best = p
		}
	}

	return best
}

func normalizeNumericString(v string) string {
	s := strings.TrimSpace(v)
	if s == "" {
		return "0"
	}
	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return s
	}
	return strconv.FormatFloat(f, 'f', -1, 64)
}

func tokenDataFromDexscreenerPair(pair *dexscreenerPairDTO) dexdto.TokenDataAsString {
	if pair == nil {
		return dexdto.TokenDataAsString{}
	}
	return dexdto.TokenDataAsString{
		Price:            normalizeNumericString(pair.PriceUSD),
		Volume24H:        strconv.FormatFloat(pair.Volume.H24, 'f', -1, 64),
		Supply:           "0",
		CirculatedSupply: "0",
		ImageURL:         "",
		Name:             pair.BaseToken.Name,
		Symbol:           pair.BaseToken.Symbol,
	}
}

func poolInfoFromDexscreenerPair(pair *dexscreenerPairDTO) dexdto.PoolInfo {
	if pair == nil {
		return dexdto.PoolInfo{}
	}
	return dexdto.PoolInfo{
		Address:     pair.PairAddress,
		PairAddress: pair.QuoteToken.Address,
		Volume24H:   strconv.FormatFloat(pair.Volume.H24, 'f', -1, 64),
		IsV4:        strings.Contains(strings.ToLower(pair.DexID), "v4"),
	}
}

// GetDexscreenerTokenDataAsString fetches token data from Dexscreener and maps it to the same DTO shape used by the Coingecko integration.
func GetDexscreenerTokenDataAsString(tokenAddress string) (dexdto.TokenDataAsString, error) {
	pairs, err := fetchDexscreenerPairs(tokenAddress)
	if err != nil {
		return dexdto.TokenDataAsString{}, err
	}
	best := selectBestPairForBaseToken(pairs, tokenAddress)
	if best == nil {
		return dexdto.TokenDataAsString{}, errors.New("no suitable pair found for token as base token")
	}
	return tokenDataFromDexscreenerPair(best), nil
}

// GetDexscreenerTokenDataAndBestPool fetches token data and best pool info from Dexscreener.
func GetDexscreenerTokenDataAndBestPool(tokenAddress string) (dexdto.TokenDataAsString, dexdto.PoolInfo, error) {
	pairs, err := fetchDexscreenerPairs(tokenAddress)
	if err != nil {
		return dexdto.TokenDataAsString{}, dexdto.PoolInfo{}, err
	}
	best := selectBestPairForBaseToken(pairs, tokenAddress)
	if best == nil {
		return dexdto.TokenDataAsString{}, dexdto.PoolInfo{}, errors.New("no suitable pair found for token as base token")
	}

	pool := poolInfoFromDexscreenerPair(best)
	if pool.Address == "" || pool.PairAddress == "" {
		return dexdto.TokenDataAsString{}, dexdto.PoolInfo{}, errors.New("dexscreener pair missing pool or quote token address")
	}

	return tokenDataFromDexscreenerPair(best), pool, nil
}

// DexscreenerBatchResult holds token data and pool info for a single token from a batch query.
type DexscreenerBatchResult struct {
	Address   string
	TokenData dexdto.TokenDataAsString
	Pool      dexdto.PoolInfo
}

// GetDexscreenerBatchTokenData fetches best-pair data for multiple tokens in a single request
// using the /tokens/v1/base/{addr1},{addr2},... endpoint (returns 1 best pair per token).
func GetDexscreenerBatchTokenData(addresses []string) (map[string]DexscreenerBatchResult, error) {
	if len(addresses) == 0 {
		return nil, nil
	}

	lowered := make([]string, len(addresses))
	for i, a := range addresses {
		lowered[i] = strings.ToLower(strings.TrimSpace(a))
	}

	u := fmt.Sprintf("%s/%s/%s", dexscreenerTokensURL, dexscreenerChainID, strings.Join(lowered, ","))
	resp, err := dexscreenerClient.R().Get(u)
	if err != nil {
		return nil, fmt.Errorf("dexscreener batch request failed: %w", err)
	}
	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("dexscreener batch unexpected status: %d", resp.StatusCode())
	}

	var pairs dexscreenerPairsDTO
	if err := json.Unmarshal(resp.Body(), &pairs); err != nil {
		return nil, fmt.Errorf("dexscreener batch parse error: %w", err)
	}

	results := make(map[string]DexscreenerBatchResult, len(lowered))
	for _, addr := range lowered {
		best := selectBestPairForBaseToken(pairs, addr)
		if best == nil {
			continue
		}
		results[addr] = DexscreenerBatchResult{
			Address:   addr,
			TokenData: tokenDataFromDexscreenerPair(best),
			Pool:      poolInfoFromDexscreenerPair(best),
		}
	}
	return results, nil
}
