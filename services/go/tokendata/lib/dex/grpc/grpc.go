package grpc

import (
	"fmt"
	"log"
	"net"
	"tokendata/env"
	"tokendata/lib/dex/grpc/server"
	proto "tokendata/proto/token"

	grpc_lib "google.golang.org/grpc"
)

func StartServer() {
	lis, err := net.Listen("tcp", fmt.Sprintf("0.0.0.0:%d", env.PORT.GetEnvAsNumber()))
	if err != nil {
		log.Fatal("Could not start the grpc server", err)
	} else {
		log.Printf("Server started at: %d", env.PORT.GetEnvAsNumber())
	}
	var opts []grpc_lib.ServerOption
	grpcServer := grpc_lib.NewServer(opts...)
	proto.RegisterScannerTokenServer(grpcServer, server.NewDexServer())
	err = grpcServer.Serve(lis)
	if err != nil {
		log.Printf("Could not start the grpc server: %+v", err)
	}
}
