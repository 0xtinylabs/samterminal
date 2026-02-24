package server

import (
	"context"
	"log"
	"strings"
	repository "walletdata/database/repositories"
	"walletdata/proto/common"
	proto "walletdata/proto/wallet"
)

type Server struct {
	proto.UnimplementedScannerWalletServer
}

func NewWalletServer() *Server {
	return &Server{}
}

func (s *Server) AddWallet(ctx context.Context, req *proto.AddWalletRequest) (*proto.AddWalletResponse, error) {
	err := repository.AddWallet(strings.ToLower(req.WalletAddress), []string{})
	if err != nil {
		return nil, err
	}
	return &proto.AddWalletResponse{Success: true}, nil
}

func (s *Server) GetWallet(ctx context.Context, req *proto.GetWalletRequest) (*proto.GetWalletResponse, error) {
	var wallet *common.Wallet
	var err error

	wallet, err = repository.GetOrCreateWallet(strings.ToLower(req.WalletAddress), req.TokenAddresses)
	if err != nil {
		return nil, err
	}
	return &proto.GetWalletResponse{WalletData: wallet}, nil
}

func (s *Server) GetWalletTokens(ctx context.Context, req *proto.GetWalletTokensRequest) (*proto.GetWalletTokensResponse, error) {
	walletTokens := []string{}
	response := &proto.GetWalletTokensResponse{}
	wallet, err := repository.GetOrCreateWallet(strings.ToLower(req.WalletAddress), req.TokenAddresses)
	if err != nil {
		return nil, err
	}
	walletTokens = wallet.TokenAddresses
	for _, token := range walletTokens {
		response.Tokens = append(response.Tokens, &common.WalletToken{TokenAddress: token})
	}
	response.NumberOfTokens = int32(len(walletTokens))

	return response, nil
}

func (s *Server) UpdateWalletPortfolio(ctx context.Context, req *proto.UpdateWalletPortfolioRequest) (*proto.UpdateWalletPortfolioResponse, error) {
	err := repository.UpdateWalletDollarValue(strings.ToLower(req.WalletAddress), req.TotalDollarValue)
	if err != nil {
		log.Println("error updating wallet portfolio", err)
		return nil, err
	}
	return &proto.UpdateWalletPortfolioResponse{Success: true}, nil
}
