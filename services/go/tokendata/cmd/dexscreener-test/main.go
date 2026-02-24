package main

import (
	"flag"
	"log"
	"os"
	"tokendata/lib/apis"
)

func main() {
	token := flag.String("token", "", "Token contract address (0x...)")
	flag.Parse()

	if *token == "" {
		log.Printf("usage: %s -token 0x...", os.Args[0])
		os.Exit(2)
	}

	data, err := apis.GetDexscreenerTokenDataAsString(*token)
	if err != nil {
		log.Printf("error: %v", err)
		os.Exit(1)
	}

	log.Printf("token=%s name=%s symbol=%s price=%s volume24h=%s", *token, data.Name, data.Symbol, data.Price, data.Volume24H)
}


