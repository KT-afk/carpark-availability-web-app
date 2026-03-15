## ADDED Requirements

### Requirement: Live HDB availability is cached independently
The system SHALL cache the result of `fetch_hdb_availability()` independently from static HDB carpark info, with a 2-minute TTL using Flask-Cache memoize.

#### Scenario: Cache hit within 2 minutes
- **WHEN** `fetch_hdb_availability()` is called within 2 minutes of a previous call
- **THEN** the cached result is returned without making a network call to data.gov.sg

#### Scenario: Cache miss after 2 minutes
- **WHEN** `fetch_hdb_availability()` is called more than 2 minutes after the last call
- **THEN** a fresh request is made to data.gov.sg via the SGData SDK and the result is cached

### Requirement: Static HDB info is not re-cached with live data
The system SHALL NOT cache the merged output of static HDB info and live availability together. The merge SHALL occur at request time using in-memory data.

#### Scenario: Static info is always available in memory
- **WHEN** `get_hdb_carparks()` is called
- **THEN** static HDB info is retrieved from the module-level `_hdb_info_cache` without any network call or TTL-based expiry

#### Scenario: Merge runs per request
- **WHEN** `get_hdb_carparks()` is called
- **THEN** static info and live availability are merged in memory and returned without caching the merged result

### Requirement: Availability cache is pre-warmed at startup
The system SHALL pre-populate the `fetch_hdb_availability()` cache during app startup to avoid cold-start latency on the first user request.

#### Scenario: Warm-up on app start
- **WHEN** the Flask app starts
- **THEN** `fetch_hdb_availability()` is called during `create_app()` to populate the cache before any requests are served
