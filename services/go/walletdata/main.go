package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"walletdata/database"
	repository "walletdata/database/repositories"
	"walletdata/env"
	"walletdata/lib/grpc"
)

func init() {
	env.LoadEnv(".env")
}

func main() {
	database.InitDatabase()
	defer database.DisconnectFromDB()

	repository.StartWalletWatcherForAllWallets()

	go grpc.StartServer()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	log.Println("Shutting down walletdata service...")
}
