package astroruntime

import (
	"sync"
	"time"
)

const (
	ssrCacheTTL     = 60 * time.Second
	ssrCacheMaxSize = 500
)

// cachedResponse holds a rendered SSR response for reuse across requests.
type cachedResponse struct {
	status  int
	headers [][2]string
	body    string
	at      time.Time
}

// ssrCache caches GET responses by URL path+query. Only 2xx responses are stored.
// TTL is 60 s; entries are evicted lazily on the next read of that key.
// When the total entry count reaches ssrCacheMaxSize the entire cache is cleared
// to prevent unbounded growth — acceptable because all entries will be re-populated
// on the next request (the cost is one cold render per URL, not a sustained miss storm).
//
// PERF: QuickJS has no JIT — React SSR costs ~3.5 s/page on a typical machine (vs
// ~50 ms in V8). This cache is the primary mitigation: first request pays the full
// render cost; subsequent requests return in <10 ms without touching QJS at all.
//
// TODO: replace the all-clear eviction with a simple LRU or add singleflight to
// collapse concurrent cold-start requests for the same URL.
var (
	ssrCacheMu sync.RWMutex
	ssrCache   = make(map[string]*cachedResponse)
)

func cacheGet(key string) *cachedResponse {
	ssrCacheMu.RLock()
	e := ssrCache[key]
	ssrCacheMu.RUnlock()
	if e == nil {
		return nil
	}
	if time.Since(e.at) > ssrCacheTTL {
		ssrCacheMu.Lock()
		delete(ssrCache, key)
		ssrCacheMu.Unlock()
		return nil
	}
	return e
}

func cachePut(key string, e *cachedResponse) {
	ssrCacheMu.Lock()
	if len(ssrCache) >= ssrCacheMaxSize {
		ssrCache = make(map[string]*cachedResponse)
	}
	ssrCache[key] = e
	ssrCacheMu.Unlock()
}
