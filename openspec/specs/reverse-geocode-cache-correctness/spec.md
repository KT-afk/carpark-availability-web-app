## ADDED Requirements

### Requirement: Reverse geocode cache must be keyed by coordinates
Reverse geocoding caching SHALL key entries using request coordinates so each `(lat,lng)` pair maps to its own cached result.

#### Scenario: Distinct coordinate requests
- **WHEN** reverse geocode is requested for two different coordinate pairs
- **THEN** each request resolves and caches independently, and one pair does not reuse the other pair’s cached payload

#### Scenario: Repeated coordinate request
- **WHEN** reverse geocode is requested repeatedly for the same coordinate pair within TTL
- **THEN** subsequent responses are served from cache with the same address/postal payload

### Requirement: Reverse geocode endpoint must remain schema-stable on failures
The reverse geocode API SHALL preserve response shape even when upstream geocoding fails or API keys are absent.

#### Scenario: Upstream geocoding error
- **WHEN** the geocoding provider errors or times out
- **THEN** the API returns a successful response with `address` and `postalCode` fields set to null
