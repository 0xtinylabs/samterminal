package grpc

import (
	"fmt"
	"log"
	"net"
	"walletdata/env"
	"walletdata/lib/grpc/server"
	proto "walletdata/proto/wallet"

	"google.golang.org/grpc"
)

var grpcServer *grpc.Server

func StartServer() {
	lis, err := net.Listen("tcp", fmt.Sprintf("0.0.0.0:%d", env.PORT.GetEnvAsNumber()))
	if err != nil {
		log.Fatal("Could not start the grpc server")
	} else {
		log.Printf("Server started at: %d", env.PORT.GetEnvAsNumber())
	}
	var opts []grpc.ServerOption
	grpcServer = grpc.NewServer(opts...)
	proto.RegisterScannerWalletServer(grpcServer, server.NewWalletServer())
	err = grpcServer.Serve(lis)
	if err != nil {
		log.Printf("Could not start the grpc server: %+v", err)
	}
}
