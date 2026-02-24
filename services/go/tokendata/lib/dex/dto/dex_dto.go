package dex_dto

type Endpoints struct {
	TokenData string
	PoolData  string
}

type TokenData struct {
	Price            float64
	Volume24H        float64
	Supply           int64
	CirculatedSupply int64
	ImageURL         string
	Name             string
	Symbol           string
}

type TokenDataAsString struct {
	Price            string
	Volume24H        string
	Supply           string
	CirculatedSupply string
	ImageURL         string
	Name             string
	Symbol           string
}

type TokenDataResponse struct {
	Data struct {
		Attributes struct {
			Price     string `json:"price_usd"`
			Volume24H struct {
				USD string `json:"h24"`
			} `json:"volume_usd"`
			Supply       string `json:"normalized_total_supply"`
			ImageURL     string `json:"image_url"`
			FDVUSD       string `json:"fdv_usd"`
			MarketCapUSD string `json:"market_cap_usd"`
			Name         string `json:"name"`
			Symbol       string `json:"symbol"`
		} `json:"attributes"`
		Relationships struct {
			TopPools struct {
				Data []struct {
					ID   string `json:"id"`
					Type string `json:"type"`
				} `json:"data"`
			} `json:"top_pools"`
		} `json:"relationships"`
	} `json:"data"`
	Included []struct {
		ID         string `json:"id"`
		Type       string `json:"type"`
		Attributes struct {
			Address      string `json:"address"`
			ReserveInUSD string `json:"reserve_in_usd"`
			VolumeUSD    struct {
				H24 string `json:"h24"`
			} `json:"volume_usd"`
		} `json:"attributes"`
		Relationships struct {
			Dex struct {
				Data struct {
					ID string `json:"id"`
				} `json:"data"`
			} `json:"dex"`
			QuoteToken struct {
				Data struct {
					ID string `json:"id"`
				} `json:"data"`
			} `json:"quote_token"`
		} `json:"relationships"`
	} `json:"included"`
}

type PoolDataResponse struct {
	Data struct {
		Relationships struct {
			QuoteToken struct {
				Data struct {
					ID string `json:"id"`
				} `json:"data"`
			} `json:"quote_token"`
			DEX struct {
				Data struct {
					ID string `json:"id"`
				} `json:"data"`
			} `json:"dex"`
		} `json:"relationships"`
	} `json:"data"`
}

type PoolInfo struct {
	Address     string
	PairAddress string
	Volume24H   string
	IsV4        bool
}
