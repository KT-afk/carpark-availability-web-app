## Why

The frontend duplicates distance sorting logic that the backend already owns — for "near me" searches, the backend sorts by distance and populates a `distance` field before returning results, yet the frontend re-sorts and re-calculates distances again as a "safeguard". This splits responsibility for a single concern across two layers and creates dead code (`calculateDistanceKm`) that only exists to support the redundant sort.

## What Changes

- Remove the frontend distance re-sort block in `App.tsx` (~10 lines) that re-sorts results for "near me" searches
- Remove the `calculateDistanceKm()` utility function in `App.tsx` (~18 lines) that is only used by the removed sort block
- Frontend trusts the backend's `distance` field and sort order as the single source of truth

## Capabilities

### New Capabilities

<!-- None — this is a cleanup, no new capabilities -->

### Modified Capabilities

<!-- No spec-level requirement changes — sorting behaviour from the user's perspective is unchanged -->

## Impact

- `frontend/src/App.tsx`: Remove `calculateDistanceKm()` function and the "near me" re-sort block (~28 lines total removed)
- No API changes, no backend changes, no visible behaviour change for the user
- Distance values shown in the UI will continue to come from the backend `distance` field (already present)
