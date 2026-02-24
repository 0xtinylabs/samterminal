package api

import (
	"context"
	"encoding/json"
	"log"
	"math"
	"strconv"
	"walletdata/env"
	api_dto "walletdata/lib/api/dto"
	token_client "walletdata/lib/grpc/client/token"
	"walletdata/proto/common"

	"github.com/go-resty/resty/v2"
)

var apiKey string

func init() {
	env.LoadEnv("./.env")
	apiKey = env.ES_API_KEY.GetEnv()
}

var apiUrl = "https://api.etherscan.io/v2/api"

type Options struct {
	chainid string
	module  string
	action  string
	address string
	page    string
	offset  string
	apikey  string
}

func GetWalletERC20Tokens(walletAddress string) ([]api_dto.WalletERC20Token, error) {
	client := resty.New()

	var response = []api_dto.WalletERC20Token{}

	var options Options = Options{
		chainid: string(api_dto.ChainIdBase),
		module:  "account",
		action:  "addresstokenbalance",
		address: walletAddress,
		page:    "0",
		offset:  "10000",
		apikey:  apiKey,
	}
	resp, err := client.R().
		SetQueryParams(map[string]string{
			"action":  options.action,
			"address": options.address,
			"page":    options.page,
			"offset":  options.offset,
			"apikey":  options.apikey,
			"chainid": options.chainid,
			"module":  options.module,
		}).
		Get(apiUrl)
	if err != nil || resp.StatusCode() != 200 {
		return response, err
	}
	var responseData api_dto.WalletERC20TokensResponse
	err = json.Unmarshal(resp.Body(), &responseData)
	if err != nil {
		return response, err
	}
	response = append(response, responseData.Result...)
	return response, nil
}

func Erc20TokensToWalletTokens(erc20Tokens []api_dto.WalletERC20Token) []common.WalletToken {

	walletTokens := []common.WalletToken{}
	for _, erc20Token := range erc20Tokens {
		tokenPrice, err := strconv.ParseFloat(erc20Token.TokenPriceUSD, 64)
		if err != nil {
			continue
		}
		tokenQuantity, err := strconv.ParseFloat(erc20Token.TokenQuantity, 64)
		if err != nil {
			continue
		}
		tokenDollarValue := tokenPrice * tokenQuantity
		walletTokens = append(walletTokens, common.WalletToken{
			TokenAddress:          erc20Token.TokenAddress,
			TokenName:             erc20Token.TokenName,
			TokenPrice:            erc20Token.TokenPriceUSD,
			TokenDollarValue:      strconv.FormatFloat(tokenDollarValue, 'f', -1, 64),
			TokenBalance:          erc20Token.TokenQuantity,
			TokenBalanceFormatted: erc20Token.TokenQuantity,
		})
	}
	return walletTokens
}

func GetWalletTokensFromEtherscan(walletAddress string) ([]common.WalletToken, error) {
	response, err := GetWalletERC20Tokens(walletAddress)
	if err != nil {
		return []common.WalletToken{}, err
	}
	return Erc20TokensToWalletTokens(response), nil
}

func GetWalletERC20TokenAddressList(walletAddress string) ([]string, error) {
	response, err := GetWalletERC20Tokens(walletAddress)
	if err != nil {
		return []string{}, err
	}

	var tokenAddressList = []string{}
	for _, token := range response {
		tokenAddressList = append(tokenAddressList, token.TokenAddress)
	}
	return tokenAddressList, nil
}

func GetTotalDollarValueForAPI(tokensData []common.WalletToken) (string, error) {
	totalDollarValue := 0.0
	for _, token := range tokensData {
		tokenDollarValue, err := strconv.ParseFloat(token.TokenDollarValue, 64)
		if err != nil {
			return "0", err
		}
		totalDollarValue += tokenDollarValue
	}
	return strconv.FormatFloat(totalDollarValue, 'f', -1, 64), nil
}

func GetTotalDollarValue(tokensData []api_dto.WalletERC20Token) (string, error) {
	totalDollarValue := 0.0
	prices := make(map[string]float64)
	for _, token := range tokensData {
		price, err := strconv.ParseFloat(token.TokenPriceUSD, 64)
		if err != nil {
			prices[token.TokenAddress] = 0.0
			continue
		}
		prices[token.TokenAddress] = price
	}
	tokensForPrice := []string{}
	for tokenAddress, price := range prices {
		log.Println("tokenAddress", tokenAddress, "price", price)
		if price == 0 {
			tokensForPrice = append(tokensForPrice, tokenAddress)
		}
	}

	tokensResponse, _ := token_client.GetTokens(context.Background(), tokensForPrice)
	log.Println("tokensResponse", tokensResponse)
	for _, token := range tokensResponse.Tokens {
		price, err := strconv.ParseFloat(token.Price, 64)
		if err != nil {
			log.Println("error", err)
			continue
		}
		prices[token.Address] = price
	}

	for _, token := range tokensData {
		tokenQuantity, err := strconv.ParseFloat(token.TokenQuantity, 64)
		if err != nil {
			log.Println("error", err)
			return "0", err
		}
		tokenDivisor, err := strconv.ParseInt(token.TokenDivisor, 10, 64)
		if err != nil {
			log.Println("error", err)
			return "0", err
		}
		tokenQuantity = tokenQuantity / math.Pow10(int(tokenDivisor))
		price := prices[token.TokenAddress]

		totalDollarValue += price * tokenQuantity
	}
	return strconv.FormatFloat(totalDollarValue, 'f', -1, 64), nil
}
