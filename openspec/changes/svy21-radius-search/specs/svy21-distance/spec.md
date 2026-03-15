## ADDED Requirements

### Requirement: SVY21 coordinates stored in static HDB data
The system SHALL store pre-computed SVY21 northing and easting values alongside WGS84 lat/lng in `hdb_carpark_info.json`. The data generation script SHALL compute these values using the Singapore Land Authority SVY21 projection formula.

#### Scenario: HDB JSON contains SVY21 fields
- **WHEN** `hdb_carpark_info.json` is loaded
- **THEN** each record SHALL contain `northing` (float, metres) and `easting` (float, metres) fields

#### Scenario: SVY21 values are accurate
- **WHEN** a known WGS84 coordinate is converted (e.g. lat=1.3521, lng=103.8198)
- **THEN** the resulting northing/easting SHALL match published SLA reference values within 1 metre

### Requirement: LTA carparks converted to SVY21 on cache entry
The system SHALL convert LTA carpark WGS84 coordinates to SVY21 once when they enter the 5-minute cache, not on every request.

#### Scenario: LTA carpark has SVY21 fields after fetch
- **WHEN** `fetch_all_carparks()` returns and results are cached
- **THEN** each LTA carpark record SHALL contain `northing` and `easting` fields

### Requirement: Distance calculated using SVY21 Pythagorean formula
The system SHALL replace the Haversine formula with Pythagorean distance on SVY21 coordinates. Distance SHALL be returned in kilometres.

#### Scenario: Distance calculation uses flat-plane math
- **WHEN** `calculate_distance(n1, e1, n2, e2)` is called with two SVY21 coordinate pairs
- **THEN** it SHALL return `sqrt((n2-n1)² + (e2-e1)²) / 1000`

#### Scenario: Distance result within acceptable tolerance of Haversine
- **WHEN** distance is calculated between two points within Singapore
- **THEN** result SHALL be within 0.1% of the equivalent Haversine result
