## Why

The current caching layer uses Flask-Caching's `SimpleCache` (in-process memory) and ad-hoc module-level dicts. All cached data — including expensive Claude AI cost calculations (~$0.003/call) and Google Maps geocoding results (billed per call) — is lost on every app restart or deploy, forcing unnecessary recomputation and external API spend. Switching to Redis provides a shared, persistent cache that survives restarts and is ready for multi-instance deployments.

## What Changes

- Replace `SimpleCache` with `RedisCache` as the Flask-Caching backend for LTA and HDB availability data
- Replace the module-level `_geocode_cache` dict in `geocoding_service.py` with Redis (no TTL — coordinates don't change)
- Replace the instance-level `self._cache` dict in `AIRateCalculator` with Redis (24h TTL — rates change infrequently)
- Add graceful fallback to `SimpleCache` when `REDIS_URL` is not set (local dev without Docker)
- Add try/catch on Redis operations so a Redis outage degrades gracefully rather than crashing requests
- Add `redis` package to `requirements.txt`
- Add `REDIS_URL` to config and env example

## Capabilities

### New Capabilities

- `redis-availability-cache`: LTA and HDB carpark availability data is cached in Redis with existing TTLs (5min and 2min respectively), surviving app restarts
- `redis-geocoding-cache`: Geocoded search terms are persisted in Redis with no expiry, preventing repeat Google Maps API billing for the same search
- `redis-ai-cost-cache`: Claude AI parking cost calculations are cached in Redis with a 24h TTL, preventing duplicate API calls across restarts

### Modified Capabilities

<!-- No existing spec-level requirements are changing -->

## Impact

- `backend/requirements.txt`: Add `redis` package
- `backend/app/config.py`: Add `REDIS_URL` config var
- `backend/app/__init__.py`: Swap `SimpleCache` → `RedisCache` with fallback logic
- `backend/app/services/geocoding_service.py`: Replace `_geocode_cache` dict with Redis client
- `backend/app/services/ai_rate_calculator.py`: Replace `self._cache` dict with Redis client
- `backend/.env.example`: Document `REDIS_URL`
- Railway: Redis plugin must be added to the project
