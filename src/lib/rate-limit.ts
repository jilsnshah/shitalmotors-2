/**
 * Minimal fixed-window rate limiter, in memory per server instance.
 * Good enough to blunt abuse on a single node; swap for a shared store
 * (e.g. Redis/Upstash) when running multiple instances.
 */
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}
