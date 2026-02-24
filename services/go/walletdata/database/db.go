package database

import (
	"context"
	"log"
	"sync"
	"time"
	db "walletdata/generated/prisma"
)

var Client *db.PrismaClient

var once sync.Once

func CreateClient() {
	Client = db.NewClient()
}

func ConnectToDB() bool {
	var result = false
	once.Do(func() {
		const maxAttempts = 10
		for attempt := 1; attempt <= maxAttempts; attempt++ {
			if err := Client.Prisma.Connect(); err != nil {
				log.Printf("Database connect error (attempt %d/%d): %v", attempt, maxAttempts, err)
				time.Sleep(time.Duration(attempt) * time.Second)
				continue
			}
			ctx := context.Background()
			_, _ = Client.Wallet.FindMany().Take(0).Exec(ctx)
			log.Println("Connected to Database")
			result = true
			break
		}
		if !result {
			log.Fatal("Could not connect to Database after retries")
		}
	})
	return result
}

func DisconnectFromDB() {
	if Client == nil || Client.Prisma == nil {
		return
	}
	if err := Client.Prisma.Disconnect(); err != nil {
		log.Printf("Database disconnect error: %v", err)
		return
	}
	log.Println("Disconnected from Database")
}

func InitDatabase() {
	CreateClient()
	ConnectToDB()
}
