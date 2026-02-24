package token_client

import (
	"context"
	"log"

	"walletdata/env"
	proto "walletdata/proto/token"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

var grpcClient proto.ScannerTokenClient
var grpcConn *grpc.ClientConn

func init() {
	env.LoadEnv("./.env")
	conn, err := grpc.NewClient(env.TOKEN_GRPC_URL.GetEnv(), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Println("error creating grpc client", err)
		return
	}
	grpcConn = conn
	grpcClient = proto.NewScannerTokenClient(conn)
}

func Close() {
	if grpcConn != nil {
		grpcConn.Close()
	}
}

func GetToken(ctx context.Context, tokenAddress string) (*proto.GetTokenResponse, error) {
	log.Println("getting token", tokenAddress)
	return grpcClient.GetToken(ctx, &proto.GetTokenRequest{TokenAddress: tokenAddress})
}

func GetTokens(ctx context.Context, tokenAddresses []string) (*proto.GetTokensResponse, error) {
	return grpcClient.GetTokens(ctx, &proto.GetTokensRequest{TokenAddresses: tokenAddresses})
}

func AddToken(ctx context.Context, request *proto.AddTokenRequest) (*proto.AddTokenResponse, error) {
	return grpcClient.AddToken(ctx, &proto.AddTokenRequest{TokenAddress: request.TokenAddress})
}

func AddBlacklist(ctx context.Context, request *proto.AddBlacklistRequest) (*proto.AddBlacklistResponse, error) {
	log.Println("adding blacklist", request.TokenAddresses)
	return grpcClient.AddBlacklist(ctx, request)
}
