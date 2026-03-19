import type { QueryClient } from '@tanstack/react-query'

const CACHE_KEY = 'sbf_queryCache'
const CACHE_VERSION = 1
const MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

interface CacheEntry {
  queryKey: readonly unknown[]
  data: unknown
  dataUpdatedAt: number
}

interface PersistedCache {
  version: number
  timestamp: number
  entries: CacheEntry[]
}

/**
 * Restore previously persisted booking queries into the QueryClient cache.
 * Call this BEFORE React renders so queries start with data immediately.
 */
export function hydrateFromStorage(queryClient: QueryClient): void {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return
    const cache: PersistedCache = JSON.parse(raw)
    if (cache.version !== CACHE_VERSION) return
    if (Date.now() - cache.timestamp > MAX_AGE_MS) {
      localStorage.removeItem(CACHE_KEY)
      return
    }
    for (const { queryKey, data, dataUpdatedAt } of cache.entries) {
      queryClient.setQueryData(queryKey, data, { updatedAt: dataUpdatedAt })
    }
  } catch {
    // Corrupt data — discard silently
    localStorage.removeItem(CACHE_KEY)
  }
}

/**
 * Subscribe to query cache changes and persist successful booking queries
 * to localStorage. Debounced to avoid thrashing on rapid updates.
 */
export function subscribePersist(queryClient: QueryClient): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null

  function persist() {
    const cache = queryClient.getQueryCache().findAll({ queryKey: ['bookings'] })
    const entries: CacheEntry[] = cache
      .filter(q => q.state.status === 'success' && q.state.data != null)
      .map(q => ({
        queryKey: q.queryKey,
        data: q.state.data,
        dataUpdatedAt: q.state.dataUpdatedAt,
      }))

    if (entries.length === 0) return

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        version: CACHE_VERSION,
        timestamp: Date.now(),
        entries,
      } satisfies PersistedCache))
    } catch {
      // Quota exceeded — not critical, ignore
    }
  }

  const unsubscribe = queryClient.getQueryCache().subscribe(event => {
    if (event.type === 'updated' && event.action.type === 'success') {
      // Check if this is a bookings query
      const key = event.query.queryKey
      if (Array.isArray(key) && key[0] === 'bookings') {
        if (timer) clearTimeout(timer)
        timer = setTimeout(persist, 1000)
      }
    }
  })

  return () => {
    unsubscribe()
    if (timer) clearTimeout(timer)
  }
}
