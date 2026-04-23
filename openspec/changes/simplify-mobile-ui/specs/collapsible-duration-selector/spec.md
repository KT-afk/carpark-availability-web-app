## ADDED Requirements

### Requirement: Mobile compact bar display
On mobile viewports (below `md` breakpoint), the DurationSelector SHALL render as a single-row compact bar showing the current duration and day type with a chevron indicator.

#### Scenario: Default mobile state
- **WHEN** the app loads on a mobile viewport
- **THEN** the DurationSelector renders as a compact bar displaying the current duration (e.g., "2 hrs") and day type (e.g., "Weekday") with a downward chevron, occupying approximately 40px height

#### Scenario: Custom duration display
- **WHEN** the user has set a custom duration of 1.5 hours
- **THEN** the compact bar displays "1.5 hrs"

#### Scenario: Non-default day type display
- **WHEN** the user has selected "Saturday" as the day type
- **THEN** the compact bar displays the selected day type (e.g., "2 hrs · Saturday")

### Requirement: Expand upward on tap
Tapping the compact bar SHALL expand the full DurationSelector upward, revealing all duration buttons, custom input, and day type toggles.

#### Scenario: Tap to expand
- **WHEN** the user taps the compact bar on mobile
- **THEN** the full duration selector expands upward from the bar position, showing all quick duration buttons, custom input, and day type toggle

### Requirement: Collapse on interaction
The expanded selector SHALL collapse back to the compact bar when the user taps the compact bar header or taps the map.

#### Scenario: Tap header to collapse
- **WHEN** the expanded selector is showing and the user taps the header/chevron area
- **THEN** the selector collapses back to the compact bar

#### Scenario: Map tap collapses selector
- **WHEN** the expanded selector is showing and the user taps the map
- **THEN** the selector collapses back to the compact bar

### Requirement: Desktop remains expanded
On desktop viewports (at or above `md` breakpoint), the DurationSelector SHALL always render in its current expanded form with no collapse behaviour.

#### Scenario: Desktop always expanded
- **WHEN** the app is viewed on a desktop viewport
- **THEN** the DurationSelector renders fully expanded with all controls visible, identical to current behaviour
