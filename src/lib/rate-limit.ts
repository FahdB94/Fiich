// Rate limiting simple en mémoire (best effort pour dev)
// Pour prod, préférer un store externe (Upstash/Redis)

type Key = string

const WINDOW_MS = 60_000
const MAX_REQUESTS = 20

const store = new Map<Key, { count: number; windowStart: number }>()

export function rateLimit(key: Key, max = MAX_REQUESTS, windowMs = WINDOW_MS): boolean {
  const now = Date.now()
  const entry = store.get(key)
  if (!entry) {
    store.set(key, { count: 1, windowStart: now })
    return true
  }
  if (now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= max) return false
  entry.count += 1
  return true
}



