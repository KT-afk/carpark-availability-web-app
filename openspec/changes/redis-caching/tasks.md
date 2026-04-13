## 1. Prerequisites

- [ ] 1.1 Add `redis==5.2.1` to `backend/requirements.txt`
- [ ] 1.2 Add `REDIS_URL` to `backend/app/config.py` via `os.getenv('REDIS_URL')`
- [ ] 1.3 Add `REDIS_URL=redis://localhost:6379` to `backend/.env` (local dev)
- [ ] 1.4 Add `REDIS_URL` to `backend/env.example` with a comment
- [ ] 1.5 Start local Redis: `docker run -d -p 6379:6379 --name redis redis:alpine`

## 2. Milestone 1 — Flask-Caching → RedisCache

- [ ] 2.1 Update `cache.init_app()` in `backend/app/__init__.py` to use `RedisCache` when `REDIS_URL` is set, fallback to `SimpleCache` when not
- [ ] 2.2 Verify: start app, search for a carpark, run `redis-cli KEYS *` and confirm Flask-Caching keys appear
- [ ] 2.3 Verify: restart app, confirm LTA/HDB data is still served without hitting the external API (check logs)

## 3. Milestone 2 — Geocoding dict → Redis

- [ ] 3.1 Add a Redis client initialisation at module level in `geocoding_service.py` (use `redis.from_url(REDIS_URL)` if set, else `None`)
- [ ] 3.2 Replace `_geocode_cache` dict reads with `redis.get(f"geocode:{key}")` + `json.loads`
- [ ] 3.3 Replace `_geocode_cache` dict writes with `redis.set(f"geocode:{key}", json.dumps(result))` (no TTL)
- [ ] 3.4 Wrap Redis calls in try/except `redis.RedisError`, falling back to dict behaviour or skipping cache on error
- [ ] 3.5 Verify: search "orchard", run `redis-cli GET geocode:orchard`, confirm coordinates returned
- [ ] 3.6 Verify: search "orchard" again, confirm no Google Maps API call in logs

## 4. Milestone 3 — AI cost cache → Redis

- [ ] 4.1 Add Redis client initialisation in `AIRateCalculator.__init__()` (use `REDIS_URL` if set, else `None`)
- [ ] 4.2 Replace `self._cache` dict read with `redis.get(cache_key)` + `json.loads`
- [ ] 4.3 Replace `self._cache` dict write with `redis.setex(cache_key, 86400, json.dumps(result))` — store result WITHOUT the `[cached]` marker
- [ ] 4.4 Append `[cached]` to `ai_explanation` only on retrieval, not before storage
- [ ] 4.5 Wrap Redis calls in try/except `redis.RedisError`, falling back to calling Claude on error
- [ ] 4.6 Verify: query a carpark with a duration, run `redis-cli GET <hash>`, confirm JSON result stored
- [ ] 4.7 Verify: restart app, query same carpark + duration, confirm `[cached]` appears in response and no Claude call in logs

## 5. Railway Setup

- [ ] 5.1 Add Redis plugin to the Railway project (Dashboard → New → Database → Redis)
- [ ] 5.2 Confirm Railway auto-injects `REDIS_URL` into the backend service environment
- [ ] 5.3 Deploy and confirm all three cache layers are working in production logs
