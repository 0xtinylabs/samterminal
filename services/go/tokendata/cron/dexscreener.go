package cron

import (
	"log"
	"tokendata/lib/apis"
)

const dexscreenerBatchSize = 20

// batchFetchDexScreener fetches DexScreener data for addresses in chunks
// of dexscreenerBatchSize to avoid URL length limits, then merges all results.
func batchFetchDexScreener(addresses []string) map[string]apis.DexscreenerBatchResult {
	if len(addresses) == 0 {
		return nil
	}

	merged := make(map[string]apis.DexscreenerBatchResult, len(addresses))

	for i := 0; i < len(addresses); i += dexscreenerBatchSize {
		end := i + dexscreenerBatchSize
		if end > len(addresses) {
			end = len(addresses)
		}
		chunk := addresses[i:end]

		data, err := apis.GetDexscreenerBatchTokenData(chunk)
		if err != nil {
			log.Printf("DexScreener batch chunk error (offset %d): %v", i, err)
			continue
		}
		for k, v := range data {
			merged[k] = v
		}
	}

	if len(merged) == 0 {
		return nil
	}
	return merged
}
