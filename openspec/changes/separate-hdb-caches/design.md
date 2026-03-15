## Context

The backend serves carpark availability by merging two HDB data sources:
- **Static info** (`hdb_carpark_info.json`): coordinates, address, carpark type — loaded once at startup, never changes between deploys
- **Live availability** (data.gov.sg via SGData SDK): lot counts — updated every ~1-2 min at source

Currently, `fetch_all_hdb_carparks()` in `carpark_service.py` wraps the entire merge in a single `@cache.memoize(timeout=300)`. This means the cache unit is a ~2000-entry merged list that combines both static and live data under the same 5-minute TTL.

## Goals / Non-Goals

**Goals:**
- Cache static HDB info independently (forever, module-level — no change needed)
- Cache live HDB availability independently at a 2-minute TTL
- Allow availability freshness to be tuned without touching static data concerns
- Remove the outer cache on `fetch_all_hdb_carparks()` — the merge runs per-request but is in-memory and cheap

**Non-Goals:**
- Changing the LTA DataMall caching strategy
- Introducing background refresh or stale-while-revalidate
- Changing the data.gov.sg API call mechanism or SGData SDK usage

## Decisions

**Decision: Cache `fetch_hdb_availability()` directly, not the merged output**

The merge (`get_hdb_carparks()`) takes ~2000 dict lookups against in-memory data. This is negligible per-request cost. Caching the merged output couples two concerns with different lifetimes. Caching only the live data at the source of truth is cleaner and correctly separates responsibilities.

Alternatives considered:
- Keep outer cache, reduce timeout to 2 min → availability freshness improves but the static/live coupling remains
- Cache both independently and also cache the merge → unnecessary complexity for no gain

**Decision: Use `@cache.memoize(timeout=120)` on `fetch_hdb_availability()`**

Flask-Cache is already the caching mechanism in use. Applying the same decorator to `fetch_hdb_availability()` is consistent with the existing pattern. The function takes no arguments so memoization is straightforward.

**Decision: Update warm-up in `__init__.py` to call `fetch_hdb_availability()` directly**

The existing warm-up calls `fetch_all_hdb_carparks()` to pre-populate the cache. After removing the outer cache, the warm-up should call `fetch_hdb_availability()` directly to pre-populate the availability cache. This keeps the warm-up semantically correct.

## Risks / Trade-offs

- **Merge runs per-request** → At ~2000 dict lookups in memory this is negligible, but worth monitoring if carpark count grows significantly. Mitigation: none needed at current scale.
- **2-min TTL means more frequent cache misses** → Cold-miss latency for one user every 2 min instead of every 5 min. Mitigation: warm-up at startup covers the first hit; subsequent misses are infrequent.
- **`fetch_all_hdb_carparks()` has no outer cache** → If called directly elsewhere it will run the merge uncached. Mitigation: `fetch_all_hdb_carparks()` remains the only entry point via `get_carparks()`; no other callers exist.
