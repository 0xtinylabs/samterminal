package server

import (
	"context"
	"log"
	"strconv"
	dto "tokendata/database/dto"
	"tokendata/database/repositories/blacklist"
	tokenRepository "tokendata/database/repositories/token"
	protoCommon "tokendata/proto/common"
	proto "tokendata/proto/token"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type DexServerImpl struct {
	proto.UnimplementedScannerTokenServer
}

func NewDexServer() *DexServerImpl {
	return &DexServerImpl{}
}

func (s *DexServerImpl) AddToken(ctx context.Context, req *proto.AddTokenRequest) (*proto.AddTokenResponse, error) {
	var response = &proto.AddTokenResponse{}
	process := tokenRepository.AddToTokenList(dto.TokenAddress(req.GetTokenAddress()), req.Name, req.CirculatedSupply, req.Symbol, req.Image, req.PoolAddress, req.PairAddress, req.Reason, req.InitialPrice)
	response.Success = process.Success
	response.Type = *process.AddingType
	response.Message = process.Message
	return response, nil
}

func (s *DexServerImpl) RemoveToken(ctx context.Context, req *proto.RemoveTokenRequest) (*proto.RemoveTokenResponse, error) {
	var response = &proto.RemoveTokenResponse{}
	process := tokenRepository.RemoveFromTokenList(dto.TokenAddress(req.GetTokenAddress()), req.BypassEnds)
	response.Success = true
	response.Type = *process.RemovingType
	response.Message = process.Message
	return response, nil
}

func (s *DexServerImpl) GetTokenPrice(ctx context.Context, req *proto.GetTokenPriceRequest) (*proto.GetTokenPriceResponse, error) {
	var response = &proto.GetTokenPriceResponse{}

	if req == nil || req.GetTokenAddress() == "" {
		response.Success = false
		return response, status.Error(codes.InvalidArgument, "tokenAddress is required")
	}

	token, err := tokenRepository.GetToken(dto.TokenAddress(req.GetTokenAddress()))

	if err != nil {
		reason := "token_price"
		if req.Reason != nil && *req.Reason != "" {
			reason = *req.Reason
		}
		tokenRepository.AddToTokenList(dto.TokenAddress(req.GetTokenAddress()), nil, nil, nil, nil, nil, nil, &reason, nil)
		token, err = tokenRepository.GetToken(dto.TokenAddress(req.GetTokenAddress()))
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error getting token: %v", err)
		}
	}
	if token == nil {
		response.Success = false
		response.Price = "0"
		response.Volume = "0"
		return response, status.Error(codes.NotFound, "token not found")
	}

	price, err := parseFloatOrZero(token.Price)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "invalid token price: %v", err)
	}
	volume24H, err := parseFloatOrZero(token.Volume24H)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "invalid token volume24h: %v", err)
	}

	response.Success = true
	response.Price = strconv.FormatFloat(price, 'f', -1, 64)
	response.Volume = strconv.FormatFloat(volume24H, 'f', -1, 64)
	return response, nil
}

func parseFloatOrZero(v string) (float64, error) {
	if v == "" {
		return 0, nil
	}
	return strconv.ParseFloat(v, 64)
}

func (s *DexServerImpl) GetToken(ctx context.Context, req *proto.GetTokenRequest) (*proto.GetTokenResponse, error) {
	var response = &proto.GetTokenResponse{}

	if req.TokenAddress == "" {
		return nil, status.Error(codes.InvalidArgument, "tokenAddress is required")
	}

	if req.AddIfNotExist {
		reason := "wallet_token"
		tokenRepository.AddToTokenList(dto.TokenAddress(req.GetTokenAddress()), nil, nil, nil, nil, nil, nil, &reason, nil)
	}
	token, err := tokenRepository.GetToken(dto.TokenAddress(req.TokenAddress))
	tokenRepository.UpdateLastUsedAt(dto.TokenAddress(req.TokenAddress))
	if err != nil {
		return nil, err
	}
	poolAddress, _ := token.PoolAddress()
	reason, _ := token.Reason()
	pairAddress, _ := token.PairAddress()
	response.Token = &protoCommon.Token{
		Name:             token.Name,
		Symbol:           token.Symbol,
		Price:            token.Price,
		Volume:           token.Volume24H,
		ImageUrl:         token.ImageURL,
		Address:          token.Address,
		CalculatedVolume: strconv.FormatFloat(token.CalculatedVolume24H, 'f', -1, 64),
		PoolAddress:      string(poolAddress),
		Supply:           token.Supply,
		CirculatedSupply: token.CirculatedSupply,
		Reason:           reason,
		PairAddress:      string(pairAddress),
	}
	return response, nil
}

func (s *DexServerImpl) GetTokens(ctx context.Context, req *proto.GetTokensRequest) (*proto.GetTokensResponse, error) {
	var response = &proto.GetTokensResponse{}

	tokens, err := tokenRepository.GetAllTokens(req.TokenAddresses, nil)
	if err != nil {
		return nil, err
	}
	for _, token := range tokens {
		poolAddress, _ := token.PoolAddress()
		reason, _ := token.Reason()
		pairAddress, _ := token.PairAddress()
		response.Tokens = append(response.Tokens, &protoCommon.Token{
			Name:             token.Name,
			Symbol:           token.Symbol,
			Price:            token.Price,
			Volume:           token.Volume24H,
			ImageUrl:         token.ImageURL,
			Address:          token.Address,
			CalculatedVolume: strconv.FormatFloat(token.CalculatedVolume24H, 'f', -1, 64),
			PoolAddress:      string(poolAddress),
			PairAddress:      string(pairAddress),
			Supply:           token.Supply,
			CirculatedSupply: token.CirculatedSupply,
			Reason:           reason,
		})
	}
	return response, nil
}

func (s *DexServerImpl) AddBlacklist(ctx context.Context, req *proto.AddBlacklistRequest) (*proto.AddBlacklistResponse, error) {

	log.Printf("Adding tokens to blacklist: %+v", req.TokenAddresses)
	var response = &proto.AddBlacklistResponse{}
	err := blacklist.AddToBlacklist(req.TokenAddresses)
	if err != nil {
		response.Success = false
		return response, err
	}
	response.Success = true
	return response, nil
}
