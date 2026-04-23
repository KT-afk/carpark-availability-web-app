## ADDED Requirements

### Requirement: Persistent duration strip below search bar
Duration quick-select buttons, custom input, and day type toggle SHALL render as a compact strip below the search input, outside the dropdown, visible whenever a search term exists.

#### Scenario: Strip visible with search term
- **WHEN** the search bar has a non-empty search term
- **THEN** the duration strip is visible below the input showing duration buttons and day type toggle

#### Scenario: Strip hidden when no search term
- **WHEN** the search bar is empty
- **THEN** the duration strip is not displayed

#### Scenario: Changing duration does not affect dropdown visibility
- **WHEN** the user taps a duration button on the strip while the dropdown is closed
- **THEN** the search re-runs in the background and the dropdown remains closed

#### Scenario: Changing duration does not affect panel
- **WHEN** the user taps a duration button while a carpark panel is open
- **THEN** the panel remains open and re-fetches the cost for the new duration

## REMOVED Requirements

### Requirement: Duration controls inside search dropdown
**Reason**: Moved to persistent strip below search bar to eliminate state conflicts between dropdown and panel
**Migration**: Same controls, same callbacks — just rendered outside the dropdown
