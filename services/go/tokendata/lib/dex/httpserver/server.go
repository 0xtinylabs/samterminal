package httpserver

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"tokendata/env"
	proto "tokendata/proto/token"

	grpc_lib "google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func withCORS(h http.HandlerFunc) http.HandlerFunc {
	allowedOrigins := strings.Split(os.Getenv("ALLOWED_ORIGINS"), ",")
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		allowed := false
		for _, o := range allowedOrigins {
			if strings.TrimSpace(o) == origin && origin != "" {
				allowed = true
				break
			}
		}
		if allowed {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "86400")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		h(w, r)
	}
}

func Start(grpcPort int64, httpPort int64) {
	addr := fmt.Sprintf("127.0.0.1:%d", grpcPort)
	conn, err := grpc_lib.Dial(addr, grpc_lib.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Printf("grpc connection creation error: %v", err)
		return
	}
	client := proto.NewScannerTokenClient(conn)

	http.HandleFunc("/tokens", withCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		ctx := context.Background()
		res, err := client.GetTokens(ctx, &proto.GetTokensRequest{})
		if err != nil {
			log.Printf("Error getting tokens: %+v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(res)
	}))

	srvAddr := fmt.Sprintf(":%d", httpPort)
	cert := env.HTTPS_CERT_FILE.GetEnv()
	key := env.HTTPS_KEY_FILE.GetEnv()
	if cert != "" && key != "" {
		log.Printf("HTTPS endpoint started: %s (GET /tokens)", srvAddr)
		if err := http.ListenAndServeTLS(srvAddr, cert, key, nil); err != nil {
			log.Printf("HTTPS server error: %v", err)
		}
		return
	}
	log.Printf("HTTP endpoint started: %s (GET /tokens)", srvAddr)
	if err := http.ListenAndServe(srvAddr, nil); err != nil {
		log.Printf("HTTP server error: %v", err)
	}
}
