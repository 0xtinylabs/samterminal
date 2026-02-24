package apis

import (
	"encoding/json"
	"log"
	"time"
	"tokendata/env"

	"github.com/go-resty/resty/v2"
)

var apiKey string

func init() {
	env.LoadEnv("./.env")
	apiKey = env.MORALIS_API_KEY.GetEnv()
}

type TokenSecurityResult struct {
	Address          string `json:"address"`
	Score            int    `json:"score"`
	Reason           string `json:"reason"`
	PossibleSpam     bool   `json:"possible_spam"`
	VerifiedContract bool   `json:"verified_contract"`
}

type TokenImageURLResult []struct {
	Logo string `json:"logo"`
}

func GetTokenImageURL(tokenAddress string) string {
	url := "https://deep-index.moralis.io/api/v2.2/erc20/metadata"
	client := resty.New()
	resp, err := client.R().
		SetHeader("X-API-Key", apiKey).
		SetQueryParam("addresses", tokenAddress).
		SetQueryParam("chain", "base").
		Get(url)
	if err != nil {
		return ""
	}
	var tokenImageURLResult TokenImageURLResult
	err = json.Unmarshal(resp.Body(), &tokenImageURLResult)
	if err != nil {
		log.Println("error unmarshalling tokenImageURLResult", err)
		return ""
	}
	if len(tokenImageURLResult) == 0 {
		return ""
	}
	tokenImageURL := tokenImageURLResult[0].Logo
	if tokenImageURL == "" {
		return ""
	}
	return tokenImageURL

}

func GetTokenSecurityResult(tokenAddress string) *TokenSecurityResult {

	url := "https://deep-index.moralis.io/api/v2.2/erc20/metadata"

	client := resty.New()
	resp, err := client.R().
		SetHeader("X-API-Key", apiKey).
		SetQueryParam("addresses", tokenAddress).
		SetQueryParam("chain", "base").
		Get(url)
	if err != nil {
		return nil
	}

	var tokenSecurityResult TokenSecurityResult
	err = json.Unmarshal(resp.Body(), &tokenSecurityResult)
	if err != nil {
		return nil
	}
	return &tokenSecurityResult

}

func GetIsTokenSecure(tokenAddress string) bool {
	tokenSecurityResult := GetTokenSecurityResult(tokenAddress)
	if tokenSecurityResult == nil {
		return true
	}
	return !tokenSecurityResult.PossibleSpam
}

func GetUnsecureTokens(tokenAddresses []string) []string {
	unsecureTokens := []string{}
	for _, tokenAddress := range tokenAddresses {
		if !GetIsTokenSecure(tokenAddress) {
			time.Sleep(100 * time.Millisecond)
			unsecureTokens = append(unsecureTokens, tokenAddress)
		}
	}
	return unsecureTokens
}
