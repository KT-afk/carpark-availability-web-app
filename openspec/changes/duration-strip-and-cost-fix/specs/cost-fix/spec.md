## ADDED Requirements

### Requirement: CarparkPanel shows correct cost for current duration
The CarparkPanel SHALL display the cost calculated for the currently selected duration and day type, re-fetching when either changes.

#### Scenario: Cost updates when duration changes
- **WHEN** the user changes duration while a carpark panel is open
- **THEN** the panel shows a loading state and fetches the cost for the new duration, displaying the correct result

#### Scenario: Cost updates when day type changes
- **WHEN** the user changes day type while a carpark panel is open
- **THEN** the panel re-fetches and displays the cost for the new day type

#### Scenario: Fresh data bypasses service worker cache
- **WHEN** the panel fetches cost on-demand via `/carparks/<id>`
- **THEN** the request bypasses the service worker cache to ensure fresh data
