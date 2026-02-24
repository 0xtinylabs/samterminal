package api

import (
	"encoding/json"
	"log"
	"slices"
	"strconv"
	"strings"
	"walletdata/env"
	"walletdata/proto/common"

	"github.com/go-resty/resty/v2"
)

type WalletTokensResponse struct {
	Result []struct {
		Balance          string  `json:"balance"`
		BalanceFormatted string  `json:"balance_formatted"`
		TokenAddress     string  `json:"token_address"`
		TokenName        string  `json:"name"`
		TokenSymbol      string  `json:"symbol"`
		TokenDecimals    int     `json:"decimals"`
		Price            float64 `json:"usd_price"`
		DollarValue      float64 `json:"usd_value"`
		Image            string  `json:"logo"`
	} `json:"result"`
}

type TokenStatusResponse struct {
	SecureTokenAddresses   []string             `json:"secureTokenAddresses"`
	InsecureTokenAddresses []string             `json:"insecureTokenAddresses"`
	SecureTokens           []common.WalletToken `json:"secureTokens"`
}

func init() {
	env.LoadEnv("./.env")
	apiKey = env.MORALIS_API_KEY.GetEnv()
}

func GetWalletTokens(walletAddress string, excludeSpam bool) (*[]common.WalletToken, error) {
	response := []common.WalletToken{}
	url := "https://deep-index.moralis.io/api/v2.2/wallets/" + walletAddress + "/tokens"

	client := resty.New()
	var walletTokens WalletTokensResponse
	resp, err := client.R().
		SetHeader("X-API-Key", apiKey).
		SetQueryParam("exclude_spam", strconv.FormatBool(excludeSpam)).
		SetQueryParam("limit", "100").
		SetQueryParam("chain", "base").
		Get(url)

	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(resp.Body(), &walletTokens)
	for _, token := range walletTokens.Result {
		response = append(response, common.WalletToken{
			TokenAddress:          token.TokenAddress,
			TokenName:             token.TokenName,
			TokenSymbol:           token.TokenSymbol,
			TokenBalance:          token.Balance,
			TokenBalanceFormatted: token.BalanceFormatted,
			TokenPrice:            strconv.FormatFloat(token.Price, 'f', -1, 64),
			TokenDollarValue:      strconv.FormatFloat(token.DollarValue, 'f', -1, 64),
			TokenImage:            token.Image,
		})
	}
	if err != nil {
		return nil, err
	}

	return &response, nil
}

func GetWalletSecureTokenAddresses(walletAddress string) ([]string, []common.WalletToken, error) {
	response := []string{}
	secureTokens, err := GetWalletTokens(walletAddress, true)
	if err != nil {
		return nil, nil, err
	}
	for _, token := range *secureTokens {
		response = append(response, token.TokenAddress)
	}
	return response, *secureTokens, nil
}

func GetWalletAllTokenAddresses(walletAddress string) ([]string, []common.WalletToken, error) {
	response := []string{}
	secureTokens, err := GetWalletTokens(walletAddress, false)
	if err != nil {
		return nil, nil, err
	}
	for _, token := range *secureTokens {
		response = append(response, token.TokenAddress)
	}
	return response, *secureTokens, nil
}

func GetTokenStatus(walletAddress string) (*TokenStatusResponse, error) {
	response := TokenStatusResponse{
		SecureTokenAddresses:   []string{},
		InsecureTokenAddresses: []string{},
		SecureTokens:           []common.WalletToken{},
	}
	secureTokenAddresses, secureTokens, err := GetWalletSecureTokenAddresses(walletAddress)
	log.Println("secureTokens", secureTokenAddresses)
	if err != nil {
		return nil, err
	}
	allTokenAddresses, _, err := GetWalletAllTokenAddresses(walletAddress)
	if err != nil {
		log.Println("error getting all tokens", err)
		return nil, err
	}
	insecureTokens := []string{}
	for _, token := range allTokenAddresses {
		if !slices.Contains(secureTokenAddresses, strings.ToLower(token)) {
			insecureTokens = append(insecureTokens, strings.ToLower(token))
		}
	}
	log.Println("insecureTokens", insecureTokens)
	response.InsecureTokenAddresses = insecureTokens
	response.SecureTokenAddresses = secureTokenAddresses
	response.SecureTokens = secureTokens
	return &response, nil
}
