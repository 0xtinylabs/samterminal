package env

import (
	"log"
	"os"
	"path/filepath"
	"strconv"

	"github.com/joho/godotenv"
)

type EnvKey string

const (
	RPC_URL         EnvKey = "RPC_URL"
	RPC_WS_URL      EnvKey = "RPC_WS_URL"
	ES_API_KEY      EnvKey = "ES_API_KEY"
	MORALIS_API_KEY EnvKey = "MORALIS_API_KEY"
	PORT            EnvKey = "PORT"
	TOKEN_GRPC_URL  EnvKey = "TOKEN_GRPC_URL"
)

// mapPrefixedEnvVars maps root .env prefixed variables to standard names
func mapPrefixedEnvVars() {
	// Map WALLETDATA_ prefixed variables to standard names
	prefixMappings := map[string]string{
		"WALLETDATA_PORT":         "PORT",
		"WALLETDATA_DATABASE_URL": "DATABASE_URL",
		"RPC_URL_BASE":            "RPC_URL",
		"RPC_WS_URL_BASE":         "RPC_WS_URL",
		"ETHERSCAN_API_KEY":       "ES_API_KEY",
	}

	for prefixed, standard := range prefixMappings {
		if val := os.Getenv(prefixed); val != "" && os.Getenv(standard) == "" {
			os.Setenv(standard, val)
		}
	}

	// Set TOKEN_GRPC_URL from TOKENDATA_PORT if not set
	if os.Getenv("TOKEN_GRPC_URL") == "" {
		host := os.Getenv("MICROSERVICES_HOST")
		if host == "" {
			host = "localhost"
		}
		port := os.Getenv("TOKENDATA_PORT")
		if port == "" {
			port = "50061"
		}
		os.Setenv("TOKEN_GRPC_URL", host+":"+port)
	}
}

func LoadEnv(path string) {
	if os.Getenv("DOCKER") == "true" {
		mapPrefixedEnvVars()
		return
	}

	// Try to load root .env first (single source of truth)
	// Get the executable's directory and navigate to root
	execPath, err := os.Executable()
	if err == nil {
		rootEnv := filepath.Join(filepath.Dir(execPath), "..", "..", "..", "..", ".env")
		if err := godotenv.Load(rootEnv); err == nil {
			log.Println("root .env file loaded")
			mapPrefixedEnvVars()
			return
		}
	}

	// Fallback: try relative path from working directory
	rootEnv := filepath.Join("..", "..", "..", ".env")
	if err := godotenv.Load(rootEnv); err == nil {
		log.Println("root .env file loaded (relative path)")
		mapPrefixedEnvVars()
		return
	}

	// Fallback: try local .env
	if err := godotenv.Load(path); err != nil {
		log.Println("env file not found, will read from environment variables")
	} else {
		log.Println("local env file loaded")
	}
	mapPrefixedEnvVars()
}

func (key EnvKey) GetEnv() string {
	return os.Getenv(string(key))
}

func (key EnvKey) GetEnvAsNumber() int64 {
	val, err := strconv.ParseInt(key.GetEnv(), 10, 64)
	if err != nil {
		log.Fatal(err)
		return 0
	}
	return val
}
