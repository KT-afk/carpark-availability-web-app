## ADDED Requirements

### Requirement: Malformed external location data must not crash search
The search service SHALL safely handle malformed or non-numeric location payloads from upstream carpark sources without failing the entire request.

#### Scenario: Invalid location string from upstream
- **WHEN** a carpark record contains an empty, malformed, or non-numeric location value
- **THEN** the record is skipped and search continues for remaining valid records

#### Scenario: Mixed valid and invalid upstream records
- **WHEN** a search request includes both valid and invalid transformed carpark entries
- **THEN** the service returns results built from valid entries and records invalid-entry diagnostics in logs

### Requirement: Geocode failures must not masquerade as true empty search results
The search service SHALL explicitly distinguish geocoding failure from legitimate “no carparks found in radius.”

#### Scenario: Geocode provider failure
- **WHEN** a non-empty place-name query cannot produce a search centre due to provider error/unavailability
- **THEN** the response includes an explicit failure signal or fallback result behavior instead of silently returning an ordinary empty result

#### Scenario: Valid centre with no carparks in radius
- **WHEN** geocoding succeeds and no carparks are within the requested radius
- **THEN** the service returns an empty result set with the resolved search centre metadata
