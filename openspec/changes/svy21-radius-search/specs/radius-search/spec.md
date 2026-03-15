## ADDED Requirements

### Requirement: Intent detection classifies search terms
The system SHALL classify each search term as either a place name or a carpark ID before choosing a search path.

#### Scenario: Carpark ID detected
- **WHEN** search term matches pattern `^[A-Z]{1,3}\d+[A-Z]?$` (e.g. BTP0012, HE22)
- **THEN** system SHALL use text search path, not radius search

#### Scenario: Alias term treated as place name
- **WHEN** search term exists in the alias file (e.g. "ion", "vivo")
- **THEN** system SHALL use radius search path

#### Scenario: Multi-word term treated as place name
- **WHEN** search term contains a space (e.g. "Choa Chu Kang", "10 Bayfront Ave")
- **THEN** system SHALL use radius search path

### Requirement: Place name search geocodes to centre point
The system SHALL geocode place name search terms to a WGS84 centre point using the Google Geocoding API, appending ", Singapore" to the query.

#### Scenario: Known place name geocodes successfully
- **WHEN** user searches "Orchard"
- **THEN** system SHALL geocode to coordinates near Orchard Road centre
- **AND** use that point as the radius search centre

#### Scenario: Geocoding failure falls back to text search
- **WHEN** geocoding returns no results or fails
- **THEN** system SHALL fall back to text match search

### Requirement: Radius filter returns carparks within configurable distance
The system SHALL filter carparks to only those within `radius_metres` of the centre point using SVY21 Pythagorean distance. Default radius SHALL be 1000 metres.

#### Scenario: Only carparks within radius returned
- **WHEN** radius search runs with centre point and radius 1000m
- **THEN** response SHALL only include carparks where SVY21 distance <= 1000m
- **AND** results SHALL be sorted by distance ascending

#### Scenario: No results within radius
- **WHEN** no carparks exist within the specified radius
- **THEN** system SHALL return an empty array

### Requirement: Radius is user-adjustable
The frontend SHALL display a radius selector when a radius search is active. Options SHALL be 500m, 1km, 1.5km, 2km. Default SHALL be 1km.

#### Scenario: Radius selector appears during place name search
- **WHEN** search results are from a radius search
- **THEN** UI SHALL show "Showing X carparks within [radius ▾] of [place]"

#### Scenario: Changing radius re-triggers search
- **WHEN** user selects a different radius value
- **THEN** system SHALL re-fetch carparks with the new radius
- **AND** map markers SHALL update accordingly

#### Scenario: Radius selector hidden during carpark ID search
- **WHEN** search term is a carpark ID
- **THEN** radius selector SHALL NOT be visible
