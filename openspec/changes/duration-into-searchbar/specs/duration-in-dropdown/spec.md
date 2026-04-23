## ADDED Requirements

### Requirement: Duration controls in search dropdown
The search dropdown SHALL display duration quick-select buttons, a custom duration input, and a day type toggle between the results header and the radius selector.

#### Scenario: Dropdown shows duration controls
- **WHEN** the search dropdown is open with results
- **THEN** duration buttons (30min, 1hr, 2hrs, 3hrs, 4hrs, 6hrs, 8hrs, 12hrs), a custom input, and day type toggle (Weekday/Saturday/Sunday) are visible above the radius selector

#### Scenario: Changing duration triggers search update
- **WHEN** the user taps a different duration button in the dropdown
- **THEN** search results update with costs recalculated for the new duration

#### Scenario: Changing day type triggers search update
- **WHEN** the user taps a different day type button in the dropdown
- **THEN** search results update with costs recalculated for the new day type

### Requirement: Search bar subtitle shows active settings
When the dropdown is closed and a search term is present, the search bar SHALL display the current duration and day type as a subtle label below the input.

#### Scenario: Subtitle visible when dropdown closed
- **WHEN** the dropdown is closed and the search bar has a search term
- **THEN** a subtitle showing the current duration and day type (e.g., "2hrs · Weekday") appears below the search input in small grey text

#### Scenario: Subtitle hidden when dropdown open
- **WHEN** the dropdown is open
- **THEN** the subtitle is not displayed

#### Scenario: Subtitle hidden when no search term
- **WHEN** the search bar is empty
- **THEN** the subtitle is not displayed

## REMOVED Requirements

### Requirement: Standalone DurationSelector component
**Reason**: Duration controls moved into search dropdown — standalone component no longer needed
**Migration**: Duration/dayType state remains in App.tsx; UI moved to SearchBar dropdown
