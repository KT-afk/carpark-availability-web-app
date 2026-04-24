## 1. Secret Remediation and Configuration Hygiene

- [x] 1.1 Remove live secrets from `frontend/.env.production` and replace with non-sensitive placeholders/documented env expectations.
- [x] 1.2 Replace hardcoded key usage in `backend/scripts/download_hdb_data.py` with required environment variable loading and clear missing-key error.
- [x] 1.3 Add/update ignore and docs guidance so secret-bearing local env files are not committed.
- [x] 1.4 Execute key-rotation/remediation procedure for exposed credentials and document completion notes in change context.

## 2. Carpark Search Resilience Hardening

- [x] 2.1 Harden `transform_carpark` location parsing to safely handle malformed/empty/non-numeric values and skip invalid records with logging.
- [x] 2.2 Ensure search transformation pipeline tolerates partial invalid upstream rows without failing the whole request.
- [x] 2.3 Update geocode-centre failure handling in search flow to return explicit failure/fallback semantics rather than silent normal empty results.
- [x] 2.4 Add/adjust backend tests for malformed location rows, geocode failure path, and valid “empty in radius” behavior.

## 3. Reverse Geocode Cache Correctness

- [x] 3.1 Move reverse-geocode caching from route-level memoization to a parameterized service/helper keyed by `(lat,lng)`.
- [x] 3.2 Keep reverse-geocode response schema stable (`address`, `postalCode`) across success and failure paths.
- [x] 3.3 Add/adjust tests to verify cache isolation across different coordinate pairs and cache hits for repeated identical pairs.

## 4. Safety Cleanup and Verification

- [x] 4.1 Remove redundant backend initialization assignment in `backend/app/__init__.py`.
- [x] 4.2 Run backend/frontend lint/build/test commands used by the repo and resolve regressions introduced by this change.
- [x] 4.3 Validate end-to-end behavior for place-name search, geocode outages, and reverse-geocode correctness with representative manual checks.
