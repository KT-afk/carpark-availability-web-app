## Context

The backend (`carpark_service.py` + `carparks.py` route) is the authoritative owner of distance sorting:
- For "near me" searches: `sort_by_distance=True` → results returned pre-sorted, each with a `distance` field
- For specific searches with location: `distance` field added but sort order preserved by relevance

The frontend (`App.tsx`) added a duplicate sort block (lines 222–234) as a "safeguard", re-sorting "near me" results and recalculating distances via `calculateDistanceKm()`. This function is the only caller of the Haversine formula on the frontend — the backend already has its own copy.

## Goals / Non-Goals

**Goals:**
- Remove the frontend sort block and `calculateDistanceKm()` entirely
- Backend `distance` field is the single source of truth for display and ordering
- No visible behaviour change for the user

**Non-Goals:**
- Fixing the geocoded address fallback path (postal code → no results → geocode → re-fetch) — that path does not sort at all currently, which is a separate issue
- Changing how the backend calculates or exposes distance

## Decisions

**Decision: Delete, don't refactor**

The sort block and `calculateDistanceKm()` have no other callers. The correct action is deletion, not extraction to a utility. Adding a utility would preserve the dual-responsibility problem.

**Decision: Trust backend `distance` field unconditionally**

The backend populates `distance` on every carpark when lat/lng are provided. For "near me" searches the results arrive pre-sorted. The frontend does not need to verify or re-sort this.

## Risks / Trade-offs

- **[Risk] Backend returns unsorted results for "near me"** → Mitigation: backend sort is tested manually; the route explicitly sets `sort_by_distance=is_near_me`. If this ever regressed, the symptom would be visible immediately.
- **[Risk] `distance` field absent on some results** → Mitigation: the backend adds `distance` to all results when lat/lng are present. Display code that reads `cp.distance` already handles undefined gracefully in the UI.
