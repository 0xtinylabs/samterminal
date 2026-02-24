package cron

import (
	"log"
	db_dto "tokendata/database/dto"
	tokenRepository "tokendata/database/repositories/token"
	"tokendata/lib/apis"

	cron "github.com/jasonlvhit/gocron"
)

func RemoveFalseTokensCron() {
	tokenRepository.RemoveFalseTokens()
}

func RemoveUnsecureTokensCron() {

	tokenAddresses, _ := tokenRepository.GetAllTokensAddresses()

	unsecureTokens := apis.GetUnsecureTokens(tokenAddresses)
	for _, tokenAddress := range unsecureTokens {
		bypass := true
		tokenRepository.RemoveFromTokenList(db_dto.TokenAddress(tokenAddress), &bypass)
	}
}

func UpdateZeroPricedTokens() {
	tokenRepository.UpdateZeroPricedTokens()
}

func RemoveUnReasonedTokens() {
	tokenRepository.RemoveUnReasonedTokens()
}

func StartCron() {

	t := cron.Every(10).Minutes().Do(
		UpdateZeroPricedTokens,
	)
	u := cron.Every(1).Hours().Do(
		RemoveUnReasonedTokens,
	)
	removeUnusedTokens := cron.Every(30).Minutes().Do(
		tokenRepository.RemoveUnusedTokens,
	)
	if t != nil || u != nil || removeUnusedTokens != nil {
		log.Printf("Error starting cron")
	}
	RemoveUnReasonedTokens()
	UpdateZeroPricedTokens()
	tokenRepository.RemoveUnusedTokens()
	<-cron.Start()
}

func AddNotAddedPairAddresses() {
	addPairAddresses := cron.Every(1).Hours().Do(
		tokenRepository.AddNotAddedPairAddresses,
	)
	if addPairAddresses == nil {
		log.Printf("Error starting add not added pair addresses cron")
	}
	tokenRepository.AddNotAddedPairAddresses()
}
