package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"
	"tokendata/cron"
	"tokendata/database"
	tokenRepository "tokendata/database/repositories/token"
	"tokendata/env"
	"tokendata/lib/dex/grpc"
	"tokendata/lib/dex/httpserver"
)

func init() {
	env.LoadEnv(".env")
}

func main() {
	database.InitDatabase()
	go cron.StartCron()
	defer database.DisconnectFromDB()

	tokenRepository.SaveNecessaryTokens()

	go grpc.StartServer()
	go httpserver.Start(env.PORT.GetEnvAsNumber(), env.HTTP_PORT.GetEnvAsNumber())
	go func() {
		err := tokenRepository.StartWatchingAllPools()
		if err != nil {
			log.Printf("Error starting watching all pools: %+v", err)
		}
	}()

	go cron.StartClankerPoller(5 * time.Second)
	go cron.StartBankrListener(5 * time.Second)

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh
}
