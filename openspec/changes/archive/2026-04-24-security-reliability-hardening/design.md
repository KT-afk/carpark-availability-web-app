## Context

The application currently mixes runtime configuration with repository-tracked values in a few places and has backend paths where upstream data or geocoding failures can produce unsafe outcomes (exceptions or misleading empty results). The change spans frontend config conventions, backend script credential loading, search behavior, and reverse-geocode caching behavior.

## Goals / Non-Goals

**Goals:**
- Eliminate repository-tracked secrets and define immediate remediation when leakage is discovered.
- Make carpark search resilient to malformed upstream location data.
- Ensure geocoding failures are surfaced/fallback-handled instead of being interpreted as normal empty search results.
- Ensure reverse-geocode caching is keyed by coordinates so results are correct per `(lat,lng)`.
- Keep behavior changes minimal and backward-compatible for frontend consumers.

**Non-Goals:**
- Reworking all caching strategy across the backend.
- Redesigning search ranking/radius logic beyond failure handling and correctness.
- Adding new user-visible geocoding features beyond reliable response behavior.

## Decisions

1. **Move secret material to runtime env sources only**
   - Remove hardcoded API keys from tracked files and scripts.
   - Keep placeholder/example values non-sensitive only.
   - Rationale: immediate risk reduction and repeatable deployment practice.
   - Alternative considered: keep keys in tracked `.env.production` with restrictions. Rejected because exposure risk remains and history leakage persists.

2. **Add defensive parsing for external location payloads**
   - Treat malformed or non-numeric location payloads as invalid records and skip with structured logging.
   - Rationale: external API data quality is not guaranteed; service must not crash on single bad record.
   - Alternative considered: fail entire request on first malformed row. Rejected as too brittle.

3. **Explicit geocode-failure path in search service**
   - Distinguish “no carparks in radius” from “unable to establish search centre.”
   - Return an explicit fallback/error behavior that callers can interpret correctly.
   - Rationale: avoids false “no results” UX and improves operational debugging.
   - Alternative considered: silently return empty list as today. Rejected due to misleading semantics.

4. **Cache reverse geocoding in a pure service function keyed by `(lat,lng)`**
   - Move memoization away from route handler into a helper that accepts coordinate inputs directly.
   - Rationale: deterministic keying and easier testability.
   - Alternative considered: keep route-level memoization. Rejected due to ambiguous cache key behavior and coupling with request context.

## Risks / Trade-offs

- **[Secret rotation coordination]** → Rotation may require frontend/backend deploy updates in multiple environments. **Mitigation:** define a short runbook and rotate before merge/deploy.
- **[Behavior change in search failure handling]** → Clients may rely on current empty-result behavior. **Mitigation:** keep response schema stable and add explicit metadata/error signal rather than breaking contracts.
- **[Cache key granularity]** → High-cardinality coordinates can increase cache entries. **Mitigation:** retain TTL and consider coordinate rounding if cache growth is observed.
- **[Skipping malformed rows]** → Data completeness may reduce slightly. **Mitigation:** log count and IDs of skipped records for monitoring.
