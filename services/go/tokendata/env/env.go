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
	RpcSocketURL    EnvKey = "RPC_SOCKET_URL"
	CG_API_KEY      EnvKey = "CG_API_KEY"
	MORALIS_API_KEY EnvKey = "MORALIS_API_KEY"
	DATABASE_URL    EnvKey = "DATABASE_URL"
	PORT            EnvKey = "PORT"
	HTTP_PORT       EnvKey = "HTTP_PORT"
	HTTPS_CERT_FILE EnvKey = "HTTPS_CERT_FILE"
	HTTPS_KEY_FILE  EnvKey = "HTTPS_KEY_FILE"
)

// mapPrefixedEnvVars maps root .env prefixed variables to standard names
func mapPrefixedEnvVars() {
	// Map TOKENDATA_ prefixed variables to standard names
	prefixMappings := map[string]string{
		"TOKENDATA_PORT":         "PORT",
		"TOKENDATA_HTTP_PORT":    "HTTP_PORT",
		"TOKENDATA_DATABASE_URL": "DATABASE_URL",
		"RPC_WS_URL_BASE":        "RPC_SOCKET_URL",
		"COINGECKO_API_KEY":      "CG_API_KEY",
	}

	for prefixed, standard := range prefixMappings {
		if val := os.Getenv(prefixed); val != "" && os.Getenv(standard) == "" {
			os.Setenv(standard, val)
		}
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
