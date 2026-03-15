## Why

The current architecture caches the merged result of static HDB carpark info (coordinates, address, type — never changes) and live availability data (lot counts — changes every ~1-2 min) under a single 5-minute Flask-Cache TTL. This conflates two concerns with completely different lifetimes, making it impossible to tune availability freshness independently and causing unnecessary re-merging of static data on every cache expiry.

## What Changes

- Remove `@cache.memoize(timeout=300)` from `fetch_all_hdb_carparks()` in `carpark_service.py`
- Add `@cache.memoize(timeout=120)` to `fetch_hdb_availability()` in `hdb_service.py` — only live availability is cached with a TTL
- Static HDB info (`_hdb_info_cache`) continues to live in a module-level cache forever (no change to `load_hdb_carpark_info()`)
- Update `__init__.py` warm-up to pre-populate `fetch_hdb_availability()` cache directly instead of `fetch_all_hdb_carparks()`
- The merge in `get_hdb_carparks()` runs on every request but is cheap (in-memory dict lookups over ~2000 entries)

## Capabilities

### New Capabilities

- `hdb-availability-caching`: Live HDB carpark availability is cached independently from static HDB info, with a 2-minute TTL

### Modified Capabilities

<!-- No existing spec-level requirements are changing -->

## Impact

- `backend/app/services/hdb_service.py`: Add `cache` import, add `@cache.memoize(timeout=120)` decorator to `fetch_hdb_availability()`
- `backend/app/services/carpark_service.py`: Remove `@cache.memoize(timeout=300)` from `fetch_all_hdb_carparks()`
- `backend/app/__init__.py`: Update warm-up to call `fetch_hdb_availability()` instead of `fetch_all_hdb_carparks()`
- No API changes, no frontend changes, no dependency changes
