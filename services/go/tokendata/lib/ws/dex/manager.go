package wsDex

import (
	"context"
	"log"
	"strings"
	"sync"

	"tokendata/env"
)

type PoolResolver func(ctx context.Context, tokenAddr string) (poolAddr string, abiJSON string, err error)

type Manager struct {
	mu       sync.Mutex
	wssURL   string
	resolver PoolResolver
	onSwap   SwapHandler
	watchers map[string]func() // tokenAddr(lowercased) -> stop()
}

type PoolType string

const (
	PoolTypeUniV3     PoolType = "uniswap-v3"
	PoolTypeUniV4     PoolType = "uniswap-v4"
	PoolTypeUniV4Base PoolType = "uniswap-v4-base"
	PoolTypeUniV3Base PoolType = "uniswap-v3-base"
)

type StartOptions struct {
	TokenAddr string
	PoolType  PoolType
	PoolAddr  string
	ABIJSON   string // optional (required for some PoolType like v4 if ABI unknown)
}

var (
	managerOnce sync.Once
	manager     *Manager
)

func GetManager() *Manager {
	managerOnce.Do(func() {
		manager = &Manager{
			wssURL:   env.RpcSocketURL.GetEnv(),
			watchers: make(map[string]func()),
		}
	})
	return manager
}

func (m *Manager) SetWSSURL(wssURL string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.wssURL = wssURL
}

func (m *Manager) SetPoolResolver(resolver PoolResolver) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.resolver = resolver
}

func (m *Manager) SetOnSwapHandler(handler SwapHandler) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.onSwap = handler
}

func (m *Manager) StopWatching(tokenAddr string) {
	key := strings.ToLower(tokenAddr)
	m.mu.Lock()
	stop, exists := m.watchers[key]
	if exists {
		delete(m.watchers, key)
	}
	m.mu.Unlock()
	if exists && stop != nil {
		stop()
	}
}

// StartWatchingForPoolWithHandler starts a watcher for a specific token+pool using a custom handler
func (m *Manager) StartWatchingForPoolWithHandler(ctx context.Context, tokenAddr string, pairAddress string, isV4 bool, poolAddr string, handler SwapHandler) error {
	key := strings.ToLower(tokenAddr)

	m.mu.Lock()
	defer m.mu.Unlock()

	wss := m.wssURL
	if m.watchers[key] != nil {
		return nil
	}

	if wss == "" || poolAddr == "" {
		log.Println("\n\nwsDex manager: missing WSS or PoolAddr for", key)
		return nil
	}

	stop, err := WatchSwapGenericWithABI(ctx, wss, poolAddr, isV4, tokenAddr, pairAddress, handler, func(e error) { log.Println("wsDex other watcher error:", e) })
	if err == nil && stop != nil {
		m.watchers[key] = stop
	}
	return err
}
