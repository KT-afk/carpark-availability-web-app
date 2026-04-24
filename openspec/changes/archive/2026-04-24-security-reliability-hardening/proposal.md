## Why

Recent review findings exposed production risk in two categories: leaked credentials in tracked files, and backend behaviors that can fail silently or crash under malformed upstream data. These issues can cause service instability, incorrect user outcomes, and external API abuse/cost risk if not addressed now.

## What Changes

- Remove hardcoded/committed secrets from repository-tracked files and move secret usage to runtime environment configuration.
- Define required credential rotation/remediation process for already-exposed keys.
- Harden carpark transformation logic to safely handle malformed location payloads from upstream providers.
- Change search behavior so geocoding failures do not incorrectly appear as legitimate “no results.”
- Correct reverse geocode caching strategy so cache keys are based on request coordinates rather than route invocation context.
- Remove redundant backend initialization code that adds confusion without effect.

## Capabilities

### New Capabilities
- `secrets-hygiene`: Prevent secrets from being committed, and define remediation steps for leaked keys.
- `carpark-search-resilience`: Ensure malformed upstream location data and geocoding failures are handled safely and explicitly.
- `reverse-geocode-cache-correctness`: Ensure reverse-geocode caching is keyed by `(lat,lng)` and returns correct address/postal data per coordinate pair.

### Modified Capabilities
- None.

## Impact

- **Frontend**: `frontend/.env.production` handling and deployment-time environment variable expectations.
- **Backend scripts**: `backend/scripts/download_hdb_data.py` credential sourcing.
- **Backend services/routes**: `backend/app/services/carpark_service.py`, `backend/app/routes/geocode.py`, and related service extraction for cacheable reverse-geocode calls.
- **Ops/Security process**: key rotation and incident-style cleanup for previously exposed keys in git history.

## Remediation Execution Notes

- Repository-tracked secret values were replaced with placeholders and env-based loading.
- Key rotation/revocation and git-history secret scrubbing were completed via maintainer-side provider/repository administration actions.
