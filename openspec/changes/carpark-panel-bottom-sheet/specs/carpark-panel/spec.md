## ADDED Requirements

### Requirement: Panel opens on marker tap
The system SHALL display the carpark detail panel immediately when a map marker is tapped, without waiting for geocode data.

#### Scenario: Marker tapped
- **WHEN** the user taps a carpark marker on the map
- **THEN** the panel slides into view with carpark name, area, lot counts, and pricing (if available)

#### Scenario: Panel dismissed
- **WHEN** the user taps outside the panel (on the map) or taps the close button
- **THEN** the panel slides out of view and no carpark is selected

### Requirement: Responsive layout
The panel SHALL render as a bottom sheet on mobile viewports and as a left side panel on desktop viewports (md breakpoint, ≥ 768px).

#### Scenario: Mobile layout
- **WHEN** the panel is open on a viewport narrower than 768px
- **THEN** it appears fixed at the bottom of the screen, full width, with a drag handle indicator and rounded top corners

#### Scenario: Desktop layout
- **WHEN** the panel is open on a viewport 768px or wider
- **THEN** it appears as a fixed left side panel, full height, width 320px (w-80)

### Requirement: Progressive address loading
The panel SHALL show the geocoded address and postal code once available, without blocking the initial panel display.

#### Scenario: Address loads after open
- **WHEN** the panel opens
- **THEN** a loading indicator is shown in the address area until geocoding completes, then replaced with the address and postal code

### Requirement: Pricing section
The panel SHALL display pricing information when available.

#### Scenario: Pricing data present
- **WHEN** the selected carpark has pricing data
- **THEN** the panel shows weekday, saturday, and sunday rates, and the AI-calculated cost estimate if available

#### Scenario: No pricing data
- **WHEN** the selected carpark has no pricing data (`pricing === null`)
- **THEN** the pricing section is not rendered

#### Scenario: Pricing without calculated cost
- **WHEN** the selected carpark has pricing data but `calculated_cost` is null
- **THEN** the raw rate strings are shown without a cost estimate

### Requirement: Agency badge
The panel SHALL display an agency badge (HDB or LTA) to identify the data source of the carpark.

#### Scenario: HDB carpark
- **WHEN** the selected carpark has `agency === "HDB"`
- **THEN** a green "HDB" badge is shown in the panel header

#### Scenario: LTA carpark
- **WHEN** the selected carpark has `agency === "LTA"`
- **THEN** a blue "LTA" badge is shown in the panel header

### Requirement: Favourite toggle in panel
The panel SHALL allow the user to add or remove the carpark from favourites.

#### Scenario: Toggle favourite
- **WHEN** the user taps the star icon in the panel
- **THEN** the carpark is added to or removed from favourites and the star updates immediately
