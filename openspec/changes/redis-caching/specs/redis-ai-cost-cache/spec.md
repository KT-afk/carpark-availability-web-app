## ADDED Requirements

### Requirement: Claude AI cost calculations are cached in Redis with a 24h TTL
The system SHALL store Claude AI parking cost calculation results in Redis with a 24-hour TTL when `REDIS_URL` is configured. The cache key SHALL be an MD5 hash of `carpark_num|rate_string|duration|day_type`. A cached result SHALL NOT trigger a Claude API call. When `REDIS_URL` is not set, the system SHALL fall back to the existing instance-level dict.

#### Scenario: Cache hit prevents Claude API call
- **WHEN** a cost calculation for the same carpark, rate, duration, and day type has been computed within the last 24 hours
- **THEN** the system SHALL return the cached result and the response SHALL include `[cached]` in `ai_explanation`

#### Scenario: Cache miss triggers Claude and stores result
- **WHEN** no cached result exists in Redis for the given cache key
- **THEN** the system SHALL call the Claude API, compute the cost, and store the result in Redis with a 24h TTL

#### Scenario: Cached value does not include [cached] marker before storage
- **WHEN** a result is stored in Redis
- **THEN** the stored value SHALL NOT contain the `[cached]` marker — it SHALL only be appended on retrieval

#### Scenario: Redis outage falls through to Claude
- **WHEN** Redis is unavailable during a cache lookup
- **THEN** the system SHALL catch the error and call the Claude API as if no cache existed
