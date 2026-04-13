## Context

The backend currently has four caching mechanisms, all backed by in-process memory:

1. **Flask-Caching `SimpleCache`** — used via `@cache.memoize()` on `fetch_all_carparks()` (5min TTL) and `fetch_hdb_availability()` (2min TTL)
2. **Module-level dict** `_geocode_cache` in `geocoding_service.py` — no TTL, grows unbounded
3. **Instance-level dict** `self._cache` in `AIRateCalculator` — no TTL, dies with the object
4. **Module-level dict** `_hdb_info_cache` — loaded from a static JSON file at startup, intentionally permanent (unchanged by this work)

All of (1), (2), (3) are wiped on every app restart or deploy. This is especially costly for (3): Claude AI calculations cost ~$0.003 each and are recalculated fresh after every deploy.

## Goals / Non-Goals

**Goals:**
- LTA and HDB availability caches survive app restarts
- Geocoding results persist across restarts (no re-billing Google Maps)
- AI cost calculations persist for 24h across restarts
- Local dev works without Redis (fallback to SimpleCache)
- Redis outage degrades gracefully — no crashes

**Non-Goals:**
- Caching the static HDB info (`_hdb_info_cache`) — already perfect as a startup file load
- Cache invalidation endpoints — TTL expiry is sufficient for this use case
- Horizontal scaling / multi-instance — not needed now, Redis makes it possible later

## Decisions

### Decision 1: RedisCache via Flask-Caching for `@memoize` caches

**Chosen:** Swap `CACHE_TYPE` from `SimpleCache` to `RedisCache` in `__init__.py`.

Flask-Caching supports `RedisCache` natively — the `@cache.memoize()` decorators on `fetch_all_carparks()` and `fetch_hdb_availability()` require zero changes. Only the init config changes.

**Alternative considered:** Manually implement Redis calls in each service function. Rejected — unnecessary complexity when Flask-Caching already abstracts this.

---

### Decision 2: Raw `redis-py` for geocoding and AI caches

**Chosen:** Use `redis.from_url()` directly in `geocoding_service.py` and `ai_rate_calculator.py`.

These two caches are hand-rolled dicts, not going through Flask-Caching. Migrating them to Flask-Caching's `cache.set()`/`cache.get()` would work but would mix concerns — the AI cache key is an MD5 hash already managed by `_get_cache_key()`, and geocoding has no TTL. Using `redis-py` directly is explicit and inspectable via `redis-cli`.

**Serialization:** Values are JSON-encoded strings (`json.dumps`/`json.loads`). Avoids pickle, keeps values human-readable in Redis.

---

### Decision 3: Fallback to SimpleCache when `REDIS_URL` is absent

**Chosen:** In `__init__.py`, check `REDIS_URL` at startup:
- Present → `RedisCache`
- Absent → `SimpleCache`

For geocoding and AI cache: check `REDIS_URL` at module/class init. If absent, fall back to the existing dict-based approach.

This means local dev without Docker just works. Railway injects `REDIS_URL` automatically when the Redis plugin is added.

---

### Decision 4: 24h TTL for AI cost cache

**Chosen:** `redis.setex(key, 86400, value)` (24 hours).

Carpark rates on data.gov.sg and in the JSON file change at most weekly. 24h is conservative enough to avoid staleness while providing meaningful persistence across the multiple deploys that happen in a day.

**Geocoding:** No TTL (`redis.set(key, value)` with no expiry). Coordinates are permanent.

---

### Decision 5: try/except on Redis operations

**Chosen:** Wrap all `redis.get()` / `redis.set()` calls in try/except `redis.RedisError`. On failure, treat as a cache miss and proceed with the live computation.

This means a Redis outage causes a performance degradation (every request hits external APIs) but not an error response to the user.

## Risks / Trade-offs

- **Redis outage degrades to uncached** → Mitigated by try/except fallback; Railway Redis has high uptime
- **Pickle serialization for Flask-Caching keys** → Flask-Caching uses pickle by default for `memoize`; this is fine for availability data dicts but means Redis keys are not human-readable. Acceptable trade-off for zero-change decorator migration.
- **AI cache serves stale rates for up to 24h** → Acceptable; carpark rates change infrequently. No manual bust mechanism needed for this use case.
- **Unbounded geocoding keys** → Memory footprint is negligible (~32 bytes/entry); not a real risk at this scale.

## Migration Plan

1. Add Redis plugin to Railway project (one click in dashboard)
2. Deploy updated code — Railway injects `REDIS_URL` automatically
3. On first deploy: caches are cold (expected), warm up within first few requests
4. No rollback complexity — removing `REDIS_URL` env var reverts to SimpleCache behaviour
