## ADDED Requirements

### Requirement: Geocoded search terms are persisted in Redis
The system SHALL store geocoding results (search term → lat/lng) in Redis with no expiry when `REDIS_URL` is configured. The same search term SHALL NOT trigger a Google Maps API call if a result already exists in Redis. When `REDIS_URL` is not set, the system SHALL fall back to the existing module-level dict.

#### Scenario: Cache hit prevents Google API call
- **WHEN** a search term has been geocoded previously and the result exists in Redis
- **THEN** the system SHALL return the cached coordinates without calling the Google Maps API

#### Scenario: New search term is stored
- **WHEN** a search term is geocoded successfully for the first time
- **THEN** the result SHALL be written to Redis with no expiry so subsequent calls are served from cache

#### Scenario: Redis outage falls through to API
- **WHEN** Redis is unavailable during a geocoding cache lookup
- **THEN** the system SHALL catch the error, call the Google Maps API, and return the result without storing it
