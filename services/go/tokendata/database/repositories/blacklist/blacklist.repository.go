package blacklist

import (
	"context"
	"log"
	"slices"
	"tokendata/database"
	db "tokendata/generated/prisma"
)

const UnsecureTokensBlacklistName = "Unsecure Tokens"

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

func GetAllBlacklistAddresses() ([]string, error) {
	var ctx, cancel = getCtx()
	var tx = getDB()
	defer cancel()
	var blacklist []db.BlacklistsModel
	blacklist, _ = tx.Blacklists.FindMany().Exec(ctx)
	var blacklistAddresses []string
	for _, blacklist := range blacklist {
		blacklistAddresses = append(blacklistAddresses, blacklist.Addresses...)
	}
	return blacklistAddresses, nil
}

func GetUnsecureTokensBlacklistAddresses() ([]string, error) {
	var ctx, cancel = getCtx()
	var tx = getDB()
	defer cancel()

	blacklist, _ := tx.Blacklists.FindUnique(db.Blacklists.Name.Equals(UnsecureTokensBlacklistName)).Exec(ctx)
	if blacklist == nil {
		return []string{}, nil
	}
	return blacklist.Addresses, nil
}

func AddToBlacklist(addresses []string) error {
	var ctx, cancel = getCtx()
	var tx = getDB()
	defer cancel()
	_, err := tx.Blacklists.UpsertOne(db.Blacklists.Name.Equals(UnsecureTokensBlacklistName)).Create(db.Blacklists.Name.Set(UnsecureTokensBlacklistName), db.Blacklists.Addresses.Set(addresses)).Update(db.Blacklists.Addresses.Push(addresses)).Exec(ctx)

	if err != nil {
		log.Printf("Error adding to blacklist: %+v", err)
		return err
	}
	log.Printf("Tokens added to blacklist: %+v", addresses)
	return nil
}

func IsTokenInBlacklist(tokenAddress string) bool {
	var ctx, cancel = getCtx()
	var tx = getDB()
	defer cancel()
	blacklist, _ := tx.Blacklists.FindUnique(db.Blacklists.Name.Equals(UnsecureTokensBlacklistName)).Exec(ctx)
	if blacklist == nil {
		return false
	}
	return slices.Contains(blacklist.Addresses, tokenAddress)
}

func AddTokenToBlacklist(tokenAddress string) error {
	var ctx, cancel = getCtx()
	var tx = getDB()
	defer cancel()
	_, err := tx.Blacklists.UpsertOne(db.Blacklists.Name.Equals(UnsecureTokensBlacklistName)).Create(db.Blacklists.Name.Set(UnsecureTokensBlacklistName), db.Blacklists.Addresses.Set([]string{tokenAddress})).Update(db.Blacklists.Addresses.Push([]string{tokenAddress})).Exec(ctx)
	return err
}
