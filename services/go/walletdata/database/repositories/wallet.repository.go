package repository

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"
	"walletdata/database"
	"walletdata/database/dto"
	db "walletdata/generated/prisma"
	"walletdata/lib/api"
	token_client "walletdata/lib/grpc/client/token"
	"walletdata/proto/common"
	proto "walletdata/proto/token"
	wallet_proto "walletdata/proto/wallet"
	"walletdata/rpc"
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
	return context.WithCancel(context.Background())
}

func GetWalletWithAPI(walletAddress string) (*common.Wallet, error) {
	walletTokens, err := api.GetWalletTokens(walletAddress, true)
	if err != nil {
		return nil, err
	}
	tokenAddressList := []string{}
	for _, token := range *walletTokens {
		tokenAddressList = append(tokenAddressList, token.TokenAddress)
	}
	totalDollarValue := 0.0
	for _, token := range *walletTokens {
		tokenDollarValue, err := strconv.ParseFloat(token.TokenDollarValue, 64)
		if err != nil {
			return nil, err
		}
		totalDollarValue += tokenDollarValue
	}
	return &common.Wallet{
		WalletAddress:          walletAddress,
		TokenAddresses:         tokenAddressList,
		TotalDollarValue:       strconv.FormatFloat(totalDollarValue, 'f', -1, 64),
		NativeBalance:          "0",
		NativeBalanceFormatted: "0",
	}, nil
}

func GetWallet(walletAddress string, dataType wallet_proto.DataType, tokenAddresses []string) (*common.Wallet, error) {
	ctx, cancel := getCtx()
	defer cancel()
	tx := getDB()
	wallet, err := tx.Wallet.FindUnique(
		db.Wallet.Address.Equals(strings.ToLower(walletAddress)),
	).Exec(ctx)
	if err != nil {
		return nil, err
	}
	return &common.Wallet{
		WalletAddress:          wallet.Address,
		TotalDollarValue:       wallet.Erc20DollarValue,
		NativeBalance:          wallet.NativeBalance,
		NativeBalanceFormatted: wallet.NativeBalance,
		TokenAddresses:         wallet.Tokens,
	}, nil
}

func GetOrCreateWallet(walletAddress string, tokenAddresses []string) (*common.Wallet, error) {
	wallet, err := GetWallet(walletAddress, wallet_proto.DataType_API, tokenAddresses)
	if err != nil {
		AddWallet(walletAddress, tokenAddresses)
		wallet, err = GetWallet(walletAddress, wallet_proto.DataType_API, tokenAddresses)
		if err != nil {
			return nil, err
		}
	}
	return wallet, nil
}

func WalletExists(walletAddress string) bool {
	ctx, cancel := getCtx()
	defer cancel()
	tx := getDB()
	wallet, err := tx.Wallet.FindUnique(
		db.Wallet.Address.Equals(walletAddress),
	).Exec(ctx)
	if err != nil {
		return false
	}
	return wallet != nil
}

func StartWalletWatcherForAllWallets() {
	ctx, cancel := getCtx()
	defer cancel()
	tx := getDB()
	wallets, err := tx.Wallet.FindMany().Exec(ctx)
	if err != nil {
		log.Println("Error getting wallets:", err)
		return
	}
	for _, wallet := range wallets {
		walletAddress := wallet.Address
		err := StartWalletWatcher(walletAddress)
		if err != nil {
			log.Println("Error starting wallet watcher for", walletAddress, ":", err)
			continue
		}
	}
}

func StartWalletWatcher(walletAddress string) error {
	err := rpc.WatchWalletForUpdates(walletAddress, func(event rpc.WalletTransaction) {
		err := UpdateWallet(walletAddress)
		if err != nil {
			log.Println("Error updating wallet:", err)
		}
	})
	if err != nil {
		return err
	}
	return nil
}

func AddWallet(walletAddress string, tokenAddresses []string) error {
	ctx, cancel := getCtx()
	defer cancel()
	tx := getDB()

	log.Println("adding wallet", walletAddress)
	exists := WalletExists(walletAddress)
	if exists {
		return nil
	}
	err := StartWalletWatcher(walletAddress)
	if err != nil {
		return err
	}

	wallet, err := tx.Wallet.CreateOne(
		db.Wallet.Address.Set(walletAddress),
		db.Wallet.Tokens.Set(tokenAddresses),
	).Exec(ctx)
	if err != nil {
		return err
	}
	if wallet == nil {
		return fmt.Errorf("wallet not created")
	}

	return nil
}

func GetWalletCumulativeData(walletAddress string, tokens []common.WalletToken) (dto.WalletCumulativeData, error) {
	response := dto.WalletCumulativeData{
		TotalDollarValue: "0",
		NativeBalance:    "0",
		TokenAddressList: []string{},
	}
	tokenAddressList := []string{}
	for _, token := range tokens {
		tokenAddressList = append(tokenAddressList, token.TokenAddress)
	}
	for _, tokenAddress := range tokenAddressList {
		_, err := token_client.AddToken(context.Background(), &proto.AddTokenRequest{TokenAddress: tokenAddress})
		if err != nil {
			log.Println("Error adding token:", err)
			continue
		}
	}
	totalDollarValue, err := api.GetTotalDollarValueForAPI(tokens)
	if err != nil {
		totalDollarValue = "0"
	}
	nativeBalance, err := rpc.GetNativeBalance(walletAddress)
	if err != nil {
		nativeBalance = "0"
	}
	response.TotalDollarValue = totalDollarValue
	response.NativeBalance = nativeBalance
	response.TokenAddressList = tokenAddressList
	return response, nil
}

func UpdateWalletDollarValue(walletAddress string, dollarValue string) error {
	ctx, cancel := getCtx()
	defer cancel()
	tx := getDB()
	walletTx := tx.Wallet.FindUnique(
		db.Wallet.Address.Equals(walletAddress),
	)
	_, err := walletTx.Update(
		db.Wallet.Erc20DollarValue.Set(dollarValue),
	).Exec(ctx)
	if err != nil {
		return err
	}
	return nil
}

func UpdateWallet(walletAddress string) error {
	ctx, cancel := getCtx()
	defer cancel()
	tx := getDB()
	tokenStatus, err := api.GetTokenStatus(walletAddress)
	if err != nil {
		return err
	}
	if len(tokenStatus.InsecureTokenAddresses) > 0 {
		_, err = token_client.AddBlacklist(context.Background(), &proto.AddBlacklistRequest{TokenAddresses: tokenStatus.InsecureTokenAddresses})
		if err != nil {
			log.Println("error adding blacklist", err)
		}
	}

	walletTx := tx.Wallet.FindUnique(
		db.Wallet.Address.Equals(walletAddress),
	)
	walletCumulativeData, err := GetWalletCumulativeData(walletAddress, tokenStatus.SecureTokens)
	if err != nil {
		return err
	}

	_, err = walletTx.Update(
		db.Wallet.Erc20DollarValue.Set(walletCumulativeData.TotalDollarValue),
		db.Wallet.NativeBalance.Set(walletCumulativeData.NativeBalance),
		db.Wallet.Tokens.Set(tokenStatus.SecureTokenAddresses),
	).Exec(ctx)
	return err
}
