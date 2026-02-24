package dex

import (
	"encoding/json"
	"errors"
	"strconv"
	db_dto "tokendata/database/dto"
	"tokendata/env"
	dto "tokendata/lib/dex/dto"

	"strings"

	"github.com/go-resty/resty/v2"
)

var apiKey string

func init() {
	env.LoadEnv(".env")
	apiKey = env.CG_API_KEY.GetEnv()
}

var apiUrl = "https://pro-api.coingecko.com/api/v3/onchain/"

var endpoints = dto.Endpoints{
	TokenData: "networks/base/tokens/",
	PoolData:  "networks/base/pools/",
}

func getUrl(endpoint string) string {
	return apiUrl + endpoint
}

func fetchTokenData(tokenAddress db_dto.TokenAddress, includeTopPools bool) (*dto.TokenDataResponse, error) {
	client := resty.New()
	request := client.R().
		SetHeader("x-cg-pro-api-key", apiKey)
	if includeTopPools {
		request = request.SetQueryParam("include", "top_pools")
	}
	resp, err := request.Get(getUrl(endpoints.TokenData) + "/" + string(tokenAddress))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode() != 200 {
		return nil, errors.New("unexpected status code")
	}

	var responseData dto.TokenDataResponse
	if err := json.Unmarshal(resp.Body(), &responseData); err != nil {
		return nil, err
	}
	return &responseData, nil
}

func fetchPoolData(poolAddress string) (*dto.PoolDataResponse, error) {
	client := resty.New()
	request := client.R().
		SetHeader("x-cg-pro-api-key", apiKey)
	resp, err := request.Get(getUrl(endpoints.PoolData) + poolAddress)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode() != 200 {
		return nil, errors.New("unexpected status code")
	}

	var responseData dto.PoolDataResponse
	if err := json.Unmarshal(resp.Body(), &responseData); err != nil {
		return nil, err
	}
	return &responseData, nil
}

func tokenDataFromResponse(response *dto.TokenDataResponse) *dto.TokenData {
	tokenData := &dto.TokenData{}
	if response == nil {
		return tokenData
	}

	tokenData.ImageURL = response.Data.Attributes.ImageURL
	tokenData.Name = response.Data.Attributes.Name
	tokenData.Symbol = response.Data.Attributes.Symbol

	if price, err := strconv.ParseFloat(response.Data.Attributes.Price, 64); err == nil {
		tokenData.Price = price
	}
	if volume, err := strconv.ParseFloat(response.Data.Attributes.Volume24H.USD, 64); err == nil {
		tokenData.Volume24H = volume
	}

	supplyValue, err := strconv.ParseFloat(response.Data.Attributes.Supply, 64)
	if err == nil {
		tokenData.Supply = int64(supplyValue)
	} else {
		supplyValue = 0
	}

	fdv, fdvErr := strconv.ParseFloat(response.Data.Attributes.FDVUSD, 64)
	marketCap, marketCapErr := strconv.ParseFloat(response.Data.Attributes.MarketCapUSD, 64)
	if fdvErr == nil && marketCapErr == nil && fdv != 0 && supplyValue != 0 {
		tokenData.CirculatedSupply = int64((marketCap / fdv) * supplyValue)
	}

	return tokenData
}

func tokenDataToString(tokenData *dto.TokenData) dto.TokenDataAsString {
	if tokenData == nil {
		return dto.TokenDataAsString{}
	}

	return dto.TokenDataAsString{
		Price:            strconv.FormatFloat(tokenData.Price, 'f', -1, 64),
		Volume24H:        strconv.FormatFloat(tokenData.Volume24H, 'f', -1, 64),
		Supply:           strconv.FormatInt(tokenData.Supply, 10),
		CirculatedSupply: strconv.FormatInt(tokenData.CirculatedSupply, 10),
		ImageURL:         tokenData.ImageURL,
		Name:             tokenData.Name,
		Symbol:           tokenData.Symbol,
	}
}

func GetPoolData(poolAddress string) dto.PoolInfo {
	poolInfo := dto.PoolInfo{}
	responseData, err := fetchPoolData(poolAddress)
	if err != nil {
		return poolInfo
	}
	poolType := responseData.Data.Relationships.DEX.Data.ID

	poolInfo.IsV4 = poolType == "uniswap-v4" || poolType == "uniswap-v4-base"
	poolInfo.Address = poolAddress
	poolInfo.PairAddress = responseData.Data.Relationships.QuoteToken.Data.ID
	pairParts := strings.Split(poolInfo.PairAddress, "_")
	if len(pairParts) > 1 {
		poolInfo.PairAddress = pairParts[1]
	}
	return poolInfo
}

func GetTokenData(tokenAddress db_dto.TokenAddress) *dto.TokenData {
	responseData, err := fetchTokenData(tokenAddress, false)
	if err != nil {
		return tokenDataFromResponse(nil)
	}
	return tokenDataFromResponse(responseData)
}

func GetTokenDataAsString(tokenAddress db_dto.TokenAddress) dto.TokenDataAsString {
	tokenData := GetTokenData(tokenAddress)
	if tokenData == nil {
		return dto.TokenDataAsString{}
	}
	return tokenDataToString(tokenData)
}

func extractBestPool(raw *dto.TokenDataResponse) dto.PoolInfo {
	if raw == nil {
		return dto.PoolInfo{}
	}

	inc := map[string]struct {
		Address      string
		DexID        string
		Reserve      string
		PairAddress  string
		Vol24        string
		Vol24H       string
		ReserveInUSD string
	}{}

	for _, p := range raw.Included {
		pairParts := strings.Split(p.Relationships.QuoteToken.Data.ID, "_")
		pairAddress := ""
		if len(pairParts) > 1 {
			pairAddress = pairParts[1]
		}
		inc[p.ID] = struct{ Address, DexID, Reserve, PairAddress, Vol24, Vol24H, ReserveInUSD string }{
			Address:      p.Attributes.Address,
			DexID:        p.Relationships.Dex.Data.ID,
			Reserve:      p.Attributes.ReserveInUSD,
			Vol24:        p.Attributes.VolumeUSD.H24,
			Vol24H:       p.Attributes.VolumeUSD.H24,
			ReserveInUSD: p.Attributes.ReserveInUSD,
			PairAddress:  pairAddress,
		}
	}

	type candidate struct {
		id, dexID, addr, pairAddr string
		score                     float64
		vol24H                    string
	}
	var vBest candidate
	var isV4 = false

	for _, ref := range raw.Data.Relationships.TopPools.Data {
		p, ok := inc[ref.ID]
		if !ok || p.Address == "" {
			continue
		}
		score := 0.0
		if p.Reserve != "" {
			if v, err := strconv.ParseFloat(p.Reserve, 64); err == nil {
				score = v
			}
		}
		if score == 0.0 && p.Vol24 != "" {
			if v, err := strconv.ParseFloat(p.Vol24, 64); err == nil {
				score = v
			}
		}

		c := candidate{id: ref.ID, dexID: p.DexID, addr: p.Address, pairAddr: p.PairAddress, score: score, vol24H: p.Vol24}
		if c.score > vBest.score {
			isV4 = p.DexID == "uniswap-v4" || p.DexID == "uniswap-v4-base"
			vBest = c
		}
	}

	return dto.PoolInfo{Address: vBest.addr, PairAddress: vBest.pairAddr, Volume24H: raw.Data.Attributes.Volume24H.USD, IsV4: isV4}
}

func GetBestPool(tokenAddress db_dto.TokenAddress) dto.PoolInfo {
	raw, err := fetchTokenData(tokenAddress, true)
	if err != nil {
		return dto.PoolInfo{}
	}
	return extractBestPool(raw)
}

func GetTokenDataAndBestPool(tokenAddress db_dto.TokenAddress) (dto.TokenDataAsString, dto.PoolInfo) {
	raw, err := fetchTokenData(tokenAddress, true)
	if err != nil {
		return dto.TokenDataAsString{}, dto.PoolInfo{}
	}

	tokenData := tokenDataToString(tokenDataFromResponse(raw))
	bestPool := extractBestPool(raw)
	return tokenData, bestPool
}

func MapDexPoolTypeToDB(poolType string) string {
	switch strings.ToLower(poolType) {
	case "uniswap-v3", "uniswap-v3-base":
		return "UNISWAP_V3"
	case "uniswap-v4", "uniswap-v4-base":
		return "UNISWAP_V4"
	default:
		return "UNISWAP_V3"
	}
}

func MapDBPoolTypeToDex(poolType string) string {
	switch strings.ToLower(poolType) {
	case "UNISWAP_V3":
		return "uniswap-v3"
	case "UNISWAP_V4":
		return "uniswap-v4"
	default:
		return "uniswap-v3"
	}
}
