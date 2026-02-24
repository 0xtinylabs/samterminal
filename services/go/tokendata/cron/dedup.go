package cron

import (
	"sync"
	"time"
)

// tokenDedup is a shared in-memory deduplication cache used by
// both Clanker and Bankr discovery pipelines.
type tokenDedup struct {
	mu     sync.RWMutex
	seen   map[string]time.Time
	maxAge time.Duration
}

func newTokenDedup(maxAge time.Duration) *tokenDedup {
	return &tokenDedup{
		seen:   make(map[string]time.Time),
		maxAge: maxAge,
	}
}

func (d *tokenDedup) has(address string) bool {
	d.mu.RLock()
	defer d.mu.RUnlock()
	_, ok := d.seen[address]
	return ok
}

func (d *tokenDedup) add(address string) {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.seen[address] = time.Now()
}

func (d *tokenDedup) cleanup() {
	d.mu.Lock()
	defer d.mu.Unlock()
	cutoff := time.Now().Add(-d.maxAge)
	for addr, t := range d.seen {
		if t.Before(cutoff) {
			delete(d.seen, addr)
		}
	}
}
