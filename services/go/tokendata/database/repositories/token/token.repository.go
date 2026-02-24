package tokenRepository

import (
	"context"
	"errors"
	"log"
	"math"
	"math/big"
	"slices"
	"strconv"
	"strings"
	"sync"
	"time"
	"tokendata/database"
	dto "tokendata/database/dto"
	"tokendata/database/repositories/blacklist"
	db "tokendata/generated/prisma"
	"tokendata/lib/apis"
	"tokendata/lib/dex"
	dex_dto "tokendata/lib/dex/dto"
	wsDexManager "tokendata/lib/ws/dex"
	proto "tokendata/proto/token"

	"github.com/ethereum/go-ethereum/core/types"
)

func getDB() *db.PrismaClient {
	var client = database.Client
	if client == nil {
		database.CreateClient()
		client = database.Client
	}
	return client
}

func getCtx() (context.Context, context.CancelFunc) {
	ctx, cancel := context.WithCancel(context.Background())
	return ctx, cancel
}

var tokenUpdateLocks sync.Map

func getTokenUpdateLock(tokenAddress dto.TokenAddress) *sync.Mutex {
	key := strings.ToLower(string(tokenAddress))
	lock, _ := tokenUpdateLocks.LoadOrStore(key, &sync.Mutex{})
	return lock.(*sync.Mutex)
}

func getTokenDataAsStringWithFallback(tokenAddress dto.TokenAddress) dex_dto.TokenDataAsString {
	data, err := apis.GetDexscreenerTokenDataAsString(string(tokenAddress))
	if err == nil {
		return data
	}
	log.Printf("Dexscreener token data failed, falling back to Coingecko: token=%s err=%v", tokenAddress, err)
	return dex.GetTokenDataAsString(tokenAddress)
}

func getTokenDataAndBestPoolWithFallback(tokenAddress dto.TokenAddress) (dex_dto.TokenDataAsString, dex_dto.PoolInfo) {
	data, pool, err := apis.GetDexscreenerTokenDataAndBestPool(string(tokenAddress))
	if err == nil {
		return data, pool
	}
	log.Printf("Dexscreener token+pool failed, falling back to Coingecko: token=%s err=%v", tokenAddress, err)
	return dex.GetTokenDataAndBestPool(tokenAddress)
}

func RemoveFalseTokens() {
	var ctx, cancel = getCtx()
	var tx = getDB()
	defer cancel()

	_, err := tx.Token.FindMany(
		db.Token.PoolAddress.Equals(""),
		db.Token.Address.Not("0x4200000000000000000000000000000000000006"),
	).Delete().Exec(ctx)

	if err != nil {
		log.Printf("Error removing tokens with empty pool address: %+v", err)
		return
	}

	// pair address is empty
	_, err = tx.Token.FindMany(
		db.Token.PairAddress.Equals(""),
	).Delete().Exec(ctx)
	if err != nil {
		log.Printf("Error removing tokens with empty pair address: %+v", err)
	}
}

func RemoveUnusedTokens() {
	var ctx, cancel = getCtx()
	var tx = getDB()
	defer cancel()
	var tokens []db.TokenModel
	tokens, _ = tx.Token.FindMany(db.Token.LastUsedAt.Lt(time.Now().Add(-time.Minute * 30))).Exec(ctx)

	for _, token := range tokens {
		if token.AlwaysKeep {
			continue
		}
		reason, _ := token.Reason()
		switch reason {
		case "wallet_token", "token_price", "clanker", "bankr":
			removeToken(dto.TokenAddress(token.Address))
			go wsDexManager.GetManager().StopWatching(strings.ToLower(token.Address))
		}
	}
}

func AddNotAddedPairAddresses() {
	var ctx, cancel = getCtx()
	var tx = getDB()
	defer cancel()
	allPairAddresses, _ := tx.Token.FindMany(db.Token.PairAddress.Not("")).Exec(ctx)
	for _, pairAddress := range allPairAddresses {
		pairAddress, _ := pairAddress.PairAddress()
		if pairAddress == "" {
			continue
		}
		token, _ := tx.Token.FindUnique(db.Token.Address.Equals(strings.ToLower(pairAddress))).Exec(ctx)
		if token == nil {
			AddToTokenList(dto.TokenAddress(pairAddress), nil, nil, nil, nil, nil, nil, nil, nil)
		}
	}
}

func GetString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func GetOrCreateToken(tokenAddress dto.TokenAddress, name *string, supply *string, circulatedSupply *string, symbol *string, imageURL *string, price *string, volume24H *string, poolType *db.DexPoolType, poolAddress *string, pairAddress *string, reason *string, initialPrice *string, alwaysKeep bool) *db.TokenModel {
	var ctx, cancel = getCtx()
	var tx = getDB()
	defer cancel()
	var tokenTx = tx.Token.FindUnique(db.Token.Address.Equals(strings.ToLower((string(tokenAddress)))))
	token, err := tokenTx.Exec(ctx)
	if poolType == nil {
		p := db.DexPoolTypeUniswapV3
		poolType = &p
	}
	if price == nil {
		if initialPrice == nil {
			zero := "0"
			price = &zero
		} else {
			price = initialPrice
		}
	}
	if errors.Is(err, db.ErrNotFound) {
		err := createToken(tokenAddress, GetString(name), GetString(supply), GetString(circulatedSupply), GetString(symbol), GetString(imageURL), GetString(price), GetString(volume24H), *poolType, GetString(poolAddress), GetString(pairAddress), GetString(reason), alwaysKeep)
		if err != nil {
			return nil
		}
		token = getToken(tokenAddress)
		if token == nil {
			return nil
		}
		return token
	}
	return token
}

func getToken(tokenAddress dto.TokenAddress) *db.TokenModel {
	var ctx, cancel = getCtx()
	var tx = getDB()
	defer cancel()
	var tokenTx = tx.Token.FindUnique(db.Token.Address.Equals(strings.ToLower((string(tokenAddress)))))
	token, err := tokenTx.Exec(ctx)
	if err != nil {
		return nil
	}
	if errors.Is(err, db.ErrNotFound) {
		return nil
	}
	return token
}

func UpdateZeroPricedTokens() {
	var ctx, cancel = getCtx()
	var tx = getDB()
	defer cancel()
	var tokens []db.TokenModel
	tokens, _ = tx.Token.FindMany(db.Token.Price.Equals("0")).Exec(ctx)
	log.Printf("Found %d zero priced tokens", len(tokens))
	for _, token := range tokens {
		SaveTokenPrice(dto.TokenAddress(token.Address))
	}
}

func RemoveUnReasonedTokens() {
	var ctx, cancel = getCtx()
	var tx = getDB()
	defer cancel()
	var tokens []db.TokenModel
	tokens, _ = tx.Token.FindMany(db.Token.Reason.Equals("")).Exec(ctx)
	log.Printf("Found %d unreasoned tokens", len(tokens))
}

func GetAllTokensAddresses() ([]string, error) {
	var ctx, cancel = getCtx()
	var tx = getDB()
	defer cancel()
	var tokens []db.TokenModel
	tokens, _ = tx.Token.FindMany().Exec(ctx)
	var tokenAddresses []string
	for _, token := range tokens {
		tokenAddresses = append(tokenAddresses, token.Address)
	}
	return tokenAddresses, nil
}

func GetAllTokens(tokenAddresses []string, excludeUnsecureTokens *bool) ([]db.TokenModel, error) {
	var ctx, cancel = getCtx()
	var tx = getDB()
	defer cancel()
	var tokenAddressesLower = make([]string, len(tokenAddresses))
	for i, tokenAddress := range tokenAddresses {
		tokenAddressesLower[i] = strings.ToLower(tokenAddress)
	}
	if excludeUnsecureTokens == nil || *excludeUnsecureTokens {
		unsecureTokens, _ := blacklist.GetUnsecureTokensBlacklistAddresses()
		for i, tokenAddress := range tokenAddressesLower {
			if slices.Contains(unsecureTokens, tokenAddress) {
				tokenAddressesLower = slices.Delete(tokenAddressesLower, i, 1)
			}
		}
	}
	var tokens []db.TokenModel
	if len(tokenAddressesLower) == 0 {
		tokens, _ = tx.Token.FindMany().Exec(ctx)
	} else {
		tokens, _ = tx.Token.FindMany(
			db.Token.Address.In(tokenAddressesLower),
		).Exec(ctx)
	}

	if len(tokenAddressesLower) > 0 {
		for _, token := range tokens {
			go func(token db.TokenModel) {
				AddToTokenList(dto.TokenAddress(token.Address), nil, nil, nil, nil, nil, nil, nil, nil)
			}(token)
		}
	}

	return tokens, nil
}

func GetToken(tokenAddress dto.TokenAddress) (*db.TokenModel, error) {
	var ctx, cancel = getCtx()
	var tx = getDB()
	defer cancel()
	var token, err = tx.Token.FindUnique(
		db.Token.Address.Equals(strings.ToLower(string(tokenAddress))),
	).Exec(ctx)
	if err != nil {
		return nil, err
	}
	return token, nil
}

func SaveNecessaryTokens() {
	SaveNativePrice()
	SaveCurrencyPrice()
}

func SaveCurrencyPrice() {
	tokenAddr := dto.TokenAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")
	tokenData := getTokenDataAsStringWithFallback(tokenAddr)
	token := getToken(tokenAddr)
	if token != nil {
		if !token.IsFixedPrice {
			UpdateTokenPrice(tokenAddr, tokenData.Price)
		}
	} else {
		poolType := db.DexPoolTypeUniswapV3
		pairAddress := ""
		reason := "Native Price"
		price := "1"
		token := GetOrCreateToken(tokenAddr, &tokenData.Name, &tokenData.Supply, &tokenData.CirculatedSupply, &tokenData.Symbol, &tokenData.ImageURL, &price, &tokenData.Volume24H, &poolType, nil, &pairAddress, &reason, nil, true)
		if token == nil {
			log.Printf("Error creating token: %+v", token)
		}
	}
}

func SaveNativePrice() {
	tokenAddr := dto.TokenAddress("0x4200000000000000000000000000000000000006")
	tokenData := getTokenDataAsStringWithFallback(tokenAddr)
	token := getToken(tokenAddr)
	if token != nil {
		if !token.IsFixedPrice {
			UpdateTokenPrice(tokenAddr, tokenData.Price)
		}
	} else {
		poolType := db.DexPoolTypeUniswapV3
		poolAddress := ""
		pairAddress := ""
		reason := "Native Price"
		token := GetOrCreateToken(tokenAddr, &tokenData.Name, &tokenData.Supply, &tokenData.CirculatedSupply, &tokenData.Symbol, &tokenData.ImageURL, &tokenData.Price, &tokenData.Volume24H, &poolType, &poolAddress, &pairAddress, &reason, nil, true)
		if token == nil {
			log.Printf("Error creating token: %+v", token)
		}
	}
}

func SaveTokenPrice(tokenAddress dto.TokenAddress) {
	lock := getTokenUpdateLock(tokenAddress)
	lock.Lock()
	defer lock.Unlock()

	token := getToken(tokenAddress)
	if token == nil || token.IsFixedPrice {
		return
	}

	if time.Since(token.LastUpdatedAt) <= time.Minute {
		return
	}

	log.Printf("Updating price for token: %+v", tokenAddress)
	tokenData := getTokenDataAsStringWithFallback(tokenAddress)

	UpdateTokenPrice(tokenAddress, tokenData.Price)

}

func createToken(tokenAddress dto.TokenAddress, name string, supply string, circulatedSupply string, symbol string, imageURL string, price string, volume24H string, poolType db.DexPoolType, poolAddress string, pairAddress string, reason string, alwaysKeep bool) error {
	ctx, cancel := getCtx()
	defer cancel()
	var tx = getDB()

	isTokenSecure := apis.GetIsTokenSecure(string(tokenAddress))
	if !isTokenSecure {
		err := blacklist.AddTokenToBlacklist(string(tokenAddress))
		if err != nil {
			log.Printf("Error adding token to blacklist: %+v", err)
		}
	}

	_, err := tx.Token.CreateOne(
		db.Token.Address.Set(strings.ToLower(string(tokenAddress))),
		db.Token.Volume24H.Set(volume24H),
		db.Token.Price.Set(string(price)),
		db.Token.Supply.Set(string(supply)),
		db.Token.ImageURL.Set(imageURL),
		db.Token.Name.Set(name),
		db.Token.Symbol.Set(symbol),
		db.Token.UsingEnds.Set(1),
		db.Token.PoolType.Set(poolType),
		db.Token.PoolAddress.Set(poolAddress),
		db.Token.PairAddress.Set(pairAddress),
		db.Token.PoolABI.Set(""),
		db.Token.WatchEnabled.Set(true),
		db.Token.CirculatedSupply.Set(string(circulatedSupply)),
		db.Token.Reason.Set(reason),
		db.Token.AlwaysKeep.Set(alwaysKeep),
	).Exec(ctx)
	if err != nil {
		return err
	}
	return nil
}

func StartWatchingAllPools() error {
	log.Println("Starting watching all pools")
	var tokens, err = GetAllTokens(nil, nil)
	if err != nil {
		return err
	}
	for _, token := range tokens {
		if token.IsFixedPrice {
			continue
		}
		err := StartWatchingForPool(&token)
		if err != nil {
			log.Printf("StartWatchingAllPools: error for token %s: %v", token.Address, err)
			continue
		}
	}
	return nil
}

func StartWatchingForPool(token *db.TokenModel) error {
	if token == nil {
		return errors.New("token not found")
	}
	var poolAddress, _ = token.PoolAddress()
	h := func(vLog types.Log, sqrtPriceX96 *big.Int, price *big.Float, pair string, reverse bool, tokenAmount string, tokenDecimals int) {
		if price == nil {
			return
		}

		SaveTokenPrice(dto.TokenAddress(pair))
		pairPrice := getToken(dto.TokenAddress(pair))
		if pairPrice == nil {
			log.Printf("Pair price not found for pair: %+v", pair)
			return
		}
		pairPriceFloat, err := strconv.ParseFloat(pairPrice.Price, 64)
		if err != nil {
			log.Printf("Error parsing weth price: %+v", err)
			return
		}

		if reverse {
			price = price.Quo(big.NewFloat(1), price)
			price = price.Mul(price, big.NewFloat(pairPriceFloat))
		} else {
			price = price.Mul(price, big.NewFloat(pairPriceFloat))
		}
		if token.IsFixedPrice {
			return
		}
		UpdateTokenPrice(dto.TokenAddress(token.Address), price.Text('f', -1))
		tokenAmountFloat, err := strconv.ParseFloat(tokenAmount, 64)
		if err != nil {
			log.Printf("Error parsing token amount: %+v", err)
			return
		}
		volumeForSwap := price.Mul(price, big.NewFloat(tokenAmountFloat))
		volumeForSwapFloat, _ := volumeForSwap.Float64()
		volumeForSwapFloat = math.Abs(volumeForSwapFloat)

		volumeForSwapFloat = volumeForSwapFloat / math.Pow10(tokenDecimals)

		updateCalculatedVolume24H(dto.TokenAddress(token.Address), volumeForSwapFloat)
	}

	isV4 := token.PoolType == db.DexPoolTypeUniswapV4

	pairAddress, _ := token.PairAddress()

	err := wsDexManager.GetManager().StartWatchingForPoolWithHandler(context.Background(), strings.ToLower(token.Address), strings.ToLower(pairAddress), isV4, poolAddress, h)
	if err != nil {
		return err
	}
	return nil
}

func AddToTokenList(tokenAddress dto.TokenAddress, name *string, circulatedSupply *string, symbol *string, image *string, poolAddress *string, pairAddress *string, reason *string, initialPrice *string) *dto.ResponseType {

	var response = &dto.ResponseType{}
	var token = getToken(tokenAddress)
	if reason == nil || *reason == "" {
		response.Success = false
		response.Message = "Reason is required"
		response.AddingType = proto.TokenAddingType_ADD_ERROR.Enum()
		return response
	}
	if token != nil {
		incrementUsingend(tokenAddress)
		response.Success = true
		response.Message = "Token already in list. Increment using ends"
		response.AddingType = proto.TokenAddingType_DUPLICATE.Enum()
	} else {
		tokenData, best := dex.GetTokenDataAndBestPool(tokenAddress)

		tokenName := name
		if tokenName == nil {
			tokenName = &tokenData.Name

		}
		if *tokenName == "" {
			response.Success = false
			response.Message = "Token name is required"
			response.AddingType = proto.TokenAddingType_ADD_ERROR.Enum()
			return response
		}
		tokenPoolAddress := poolAddress
		if tokenPoolAddress == nil {
			tokenPoolAddress = &best.Address
		}

		if *tokenPoolAddress == "" {
			response.Success = false
			response.Message = "Pool address is required"
			response.AddingType = proto.TokenAddingType_ADD_ERROR.Enum()
			return response
		}
		tokenSymbol := symbol
		if tokenSymbol == nil {
			tokenSymbol = &tokenData.Symbol
		}
		tokenImage := image
		if tokenImage == nil {
			tokenImage = &tokenData.ImageURL
		}
		if tokenImage == nil || *tokenImage == "" {
			imageURL := apis.GetTokenImageURL(string(tokenAddress))
			tokenImage = &imageURL
		}

		tokenCirculatedSupply := circulatedSupply
		if tokenCirculatedSupply == nil {
			tokenCirculatedSupply = &tokenData.CirculatedSupply
		}

		tokenPairAddress := pairAddress
		if tokenPairAddress == nil {

			tokenPairAddress = &best.PairAddress

		}
		if tokenPairAddress != nil && *tokenPairAddress != "" {
			go SaveTokenPrice(dto.TokenAddress(*tokenPairAddress))
		}

		var poolType = db.DexPoolTypeUniswapV3

		if best.Address == "" {
			best = dex.GetPoolData(*tokenPoolAddress)
		}
		if best.IsV4 {
			poolType = db.DexPoolTypeUniswapV4
		}
		price := initialPrice
		if initialPrice == nil {
			initialPrice = &tokenData.Price
		}
		token := GetOrCreateToken(tokenAddress, tokenName, &tokenData.Supply, tokenCirculatedSupply, tokenSymbol, tokenImage, price, &tokenData.Volume24H, &poolType, tokenPoolAddress, tokenPairAddress, reason, initialPrice, false)
		if token == nil {
			response.Success = false
			response.Message = "Could not add token to list"
			response.AddingType = proto.TokenAddingType_ADD_ERROR.Enum()
			return response
		}
		err := StartWatchingForPool(token)
		if err != nil {
			log.Printf("Error starting watching for pool: %+v", err)
			response.Success = false
			response.Message = "Could not add token to list"
			response.AddingType = proto.TokenAddingType_ADD_ERROR.Enum()
		} else {
			response.Success = true
			response.Message = "Added token to list"
			response.AddingType = proto.TokenAddingType_FIRST_TIME.Enum()
		}

	}
	return response
}

func RemoveFromTokenList(tokenAddress dto.TokenAddress, bypass *bool) *dto.ResponseType {

	var response = &dto.ResponseType{}

	var token = getToken(tokenAddress)

	if token == nil {
		response.Success = false
		response.Message = "Token could not remove because not exist"
		response.RemovingType = proto.TokenRemovingType_REMOVE_ERROR.Enum()
	} else {
		if token.UsingEnds <= 1 || (bypass != nil && *bypass) {
			removeToken(tokenAddress)
			response.Success = true
			response.Message = "Removed token"
			response.RemovingType = proto.TokenRemovingType_ALL_CLEAR.Enum()
			go wsDexManager.GetManager().StopWatching(strings.ToLower(string(tokenAddress)))
		} else {
			decrementUsingend(tokenAddress)
			response.Success = true
			response.Message = "Token using end decremented"
			response.RemovingType = proto.TokenRemovingType_STILL_CALCULATES.Enum()
		}
	}

	return response
}

func UpdateTokenPrice(tokenAddress dto.TokenAddress, price string) {
	ctx, cancel := getCtx()
	defer cancel()
	var tx = getDB()

	var tokenTx = tx.Token.FindUnique(db.Token.Address.Equals(strings.ToLower((string(tokenAddress)))))
	var _, err = tokenTx.Update(db.Token.Price.Set(price)).Exec(ctx)
	if err != nil {
		log.Printf("Error updating token price: %+v", err)
	}
	_, err = tokenTx.Update(db.Token.LastUpdatedAt.Set(time.Now())).Exec(ctx)
	if err != nil {
		log.Printf("Error updating token price: %+v", err)
	}
}

func updateCalculatedVolume24H(tokenAddress dto.TokenAddress, volume float64) {
	ctx, cancel := getCtx()
	defer cancel()
	var tx = getDB()
	var tokenTx = tx.Token.FindUnique(db.Token.Address.Equals(strings.ToLower((string(tokenAddress)))))
	_, err := tokenTx.Update(db.Token.CalculatedVolume24H.Increment(volume)).Exec(ctx)
	if err != nil {
		log.Printf("Error updating calculated volume 24h: %+v", err)
	}
	_, err = tokenTx.Update(db.Token.LastUpdatedAt.Set(time.Now())).Exec(ctx)
	if err != nil {
		log.Printf("Error updating last updated at: %+v", err)
	}
}

func UpdateLastUsedAt(tokenAddress dto.TokenAddress) {
	ctx, cancel := getCtx()
	defer cancel()
	var tx = getDB()
	var tokenTx = tx.Token.FindUnique(db.Token.Address.Equals(strings.ToLower((string(tokenAddress)))))
	_, err := tokenTx.Update(db.Token.LastUsedAt.Set(time.Now())).Exec(ctx)
	if err != nil {
		return
	}
}

func removeToken(tokenAddress dto.TokenAddress) {
	ctx, cancel := getCtx()
	defer cancel()
	var tx = getDB()
	var tokenTx = tx.Token.FindUnique(db.Token.Address.Equals(strings.ToLower((string(tokenAddress)))))
	_, err := tokenTx.Delete().Exec(ctx)
	if err != nil {
		log.Printf("Error deleting token: %+v", err)
	}
}

func incrementUsingend(tokenAddress dto.TokenAddress) {
	ctx, cancel := getCtx()
	defer cancel()
	var tx = getDB()
	var tokenTx = tx.Token.FindUnique(db.Token.Address.Equals(strings.ToLower((string(tokenAddress)))))
	_, _ = tokenTx.Update(db.Token.UsingEnds.Increment(1)).Exec(ctx)

}

func decrementUsingend(tokenAddress dto.TokenAddress) {
	ctx, cancel := getCtx()
	defer cancel()
	var tx = getDB()
	var tokenTx = tx.Token.FindUnique(db.Token.Address.Equals(strings.ToLower((string(tokenAddress)))))
	_, _ = tokenTx.Update(db.Token.UsingEnds.Decrement(1)).Exec(ctx)

}
