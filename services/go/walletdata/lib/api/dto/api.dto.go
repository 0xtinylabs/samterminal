package api_dto

type WalletERC20Token struct {
	TokenAddress  string `json:"TokenAddress"`
	TokenName     string `json:"TokenName"`
	TokenQuantity string `json:"TokenQuantity"`
	TokenDivisor  string `json:"TokenDivisor"`
	TokenPriceUSD string `json:"TokenPriceUSD"`
}

type WalletERC20TokensResponse struct {
	Status  string             `json:"status"`
	Message string             `json:"message"`
	Result  []WalletERC20Token `json:"result"`
}

type ChainId string

const (
	ChainIdEthereum ChainId = "1"
	ChainIdBase     ChainId = "8453"
)

func WalletERC20TokensToTokenAddressList(tokensData []WalletERC20Token) []string {
	var tokenAddressList = []string{}
	for _, token := range tokensData {
		tokenAddressList = append(tokenAddressList, token.TokenAddress)
	}
	return tokenAddressList
}
