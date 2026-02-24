package apis

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-resty/resty/v2"
)

const (
	clankerBaseURL = "https://www.clanker.world/api"
	clankerChainID = 8453
)

var clankerClient = resty.New().
	SetTimeout(10 * time.Second).
	SetRetryCount(2).
	SetRetryWaitTime(1 * time.Second).
	SetRetryMaxWaitTime(3 * time.Second)

type ClankerTokenResponse struct {
	Data []ClankerToken `json:"data"`
}

type ClankerToken struct {
	ContractAddress string      `json:"contract_address"`
	Name            string      `json:"name"`
	Symbol          string      `json:"symbol"`
	ImageURL        string      `json:"img_url"`
	PoolAddress     string      `json:"pool_address"`
	Pair            string      `json:"pair"`
	ChainID         int         `json:"chain_id"`
	DeployedAt      string      `json:"deployed_at"`
	MarketCap       json.Number `json:"market_cap,omitempty"`
	Type            string      `json:"type"`
}

func GetLatestClankerTokens(limit int) ([]ClankerToken, error) {
	u := fmt.Sprintf("%s/tokens?sort=desc&sortBy=deployed-at&includeMarket=true&chainId=%d&limit=%d", clankerBaseURL, clankerChainID, limit)

	resp, err := clankerClient.R().Get(u)
	if err != nil {
		return nil, fmt.Errorf("clanker request failed: %w", err)
	}
	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("clanker unexpected status: %d", resp.StatusCode())
	}

	var result ClankerTokenResponse
	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		return nil, fmt.Errorf("clanker parse error: %w", err)
	}
	return result.Data, nil
}
