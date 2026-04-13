## ADDED Requirements

### Requirement: LTA and HDB availability data is cached in Redis
The system SHALL use Redis as the backing store for Flask-Caching when `REDIS_URL` is configured. LTA carpark availability SHALL be cached with a 5-minute TTL and HDB carpark availability SHALL be cached with a 2-minute TTL. When `REDIS_URL` is not set, the system SHALL fall back to `SimpleCache`.

#### Scenario: Cache survives app restart
- **WHEN** the app restarts after LTA or HDB data has been fetched
- **THEN** the cached availability data is still available in Redis without re-fetching from the external API

#### Scenario: Fallback to SimpleCache locally
- **WHEN** `REDIS_URL` is not set in the environment
- **THEN** the system SHALL use `SimpleCache` and behave identically to the previous implementation

#### Scenario: Redis outage degrades gracefully
- **WHEN** Redis is unavailable during a cache read or write
- **THEN** the system SHALL catch the error and proceed with a live API fetch, returning valid data without raising an exception to the caller
