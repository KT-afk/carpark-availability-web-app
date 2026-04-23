## ADDED Requirements

### Requirement: Condensed result item layout
Each search result item in the dropdown SHALL display only: favourite star, development name, car lot availability indicator with count, calculated cost, and distance.

#### Scenario: Result with all data available
- **WHEN** a search result has car lots, calculated cost, and distance
- **THEN** the item displays as a single compact row: favourite star, development name, green availability dot with car lot count, cost in dollars, and distance in km

#### Scenario: Result with no calculated cost
- **WHEN** a search result has `calculated_cost` as null
- **THEN** the cost is omitted from the row; other elements (star, name, lots, distance) still display

#### Scenario: Result with no distance
- **WHEN** a search result has no distance data (no user location)
- **THEN** the distance is omitted from the row; other elements still display

#### Scenario: Result with zero car lots
- **WHEN** a search result has 0 car lots
- **THEN** the availability indicator shows as red/grey with "0" count

### Requirement: Secondary information removed from list
Search result items SHALL NOT display carpark ID, area label, agency badge, motorcycle lots, heavy vehicle lots, AI confidence label, cost breakdown text, or time-based pricing alerts.

#### Scenario: Information not shown in list
- **WHEN** search results are displayed in the dropdown
- **THEN** carpark_num, area, agency badge (HDB/LTA), motorcycle_lots, heavy_vehicle_lots, ai_confidence, cost_breakdown, and TimeBasedAlert are not rendered

### Requirement: Detail panel retains full information
The CarparkPanel detail view SHALL continue to display all carpark information including lot types, pricing breakdown, and time alerts.

#### Scenario: Full detail on selection
- **WHEN** the user taps a simplified result item
- **THEN** the CarparkPanel opens with all existing detail: address, all lot types, rate table, cost breakdown, confidence indicator, and time-based alerts

### Requirement: SmartRecommendation cards unchanged
The SmartRecommendation cards above the result list SHALL remain in their current format with no visual changes.

#### Scenario: Recommendations still prominent
- **WHEN** search results are displayed
- **THEN** SmartRecommendation cards render above the simplified result list with their existing layout (Best Value, Cheapest, Closest)
