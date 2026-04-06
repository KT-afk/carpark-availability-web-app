## ADDED Requirements

### Requirement: Persistent favourites entry point
The search bar SHALL display a star (⭐) button at all times, regardless of search state, providing a persistent entry point to the FavouritesPanel.

#### Scenario: Star button always visible
- **WHEN** the user views the app in any state (empty search, active search, carpark selected)
- **THEN** the star button SHALL be visible in the search bar icon area

#### Scenario: Star button opens FavouritesPanel
- **WHEN** the user taps the star button
- **THEN** FavouritesPanel SHALL slide up from the bottom

#### Scenario: Opening FavouritesPanel closes CarparkPanel
- **WHEN** the user taps the star button while CarparkPanel is open
- **THEN** CarparkPanel SHALL close and FavouritesPanel SHALL open

### Requirement: FavouritesPanel bottom sheet
The system SHALL display a bottom sheet panel on all screen sizes (mobile and desktop) containing the user's saved favourites and recent searches.

#### Scenario: Panel slides up on open
- **WHEN** FavouritesPanel is opened
- **THEN** it SHALL animate up from the bottom of the screen with a drag handle visible

#### Scenario: Panel dismissed by X button
- **WHEN** the user taps the X button in FavouritesPanel
- **THEN** FavouritesPanel SHALL close

#### Scenario: Panel dismissed by tapping map
- **WHEN** FavouritesPanel is open and the user taps the map
- **THEN** FavouritesPanel SHALL close

#### Scenario: DurationSelector hidden while panel open
- **WHEN** FavouritesPanel is open
- **THEN** the DurationSelector (AI rate picker) SHALL NOT be visible

#### Scenario: DurationSelector restored on close
- **WHEN** FavouritesPanel is closed
- **THEN** the DurationSelector SHALL be visible again

### Requirement: Navigate to a favourite
The system SHALL allow users to navigate to a saved favourite carpark from FavouritesPanel.

#### Scenario: Tapping a favourite opens its carpark panel
- **WHEN** the user taps a favourite row in FavouritesPanel
- **THEN** FavouritesPanel SHALL close, a search SHALL be triggered for that carpark, and CarparkPanel SHALL open with fresh availability data

### Requirement: Remove a favourite from FavouritesPanel
The system SHALL allow users to remove a saved favourite directly from FavouritesPanel without navigating away.

#### Scenario: Remove button present on each row
- **WHEN** FavouritesPanel is open and favourites exist
- **THEN** each favourite row SHALL display a remove (✕) button

#### Scenario: Tapping remove deletes the favourite
- **WHEN** the user taps the ✕ button on a favourite row
- **THEN** that favourite SHALL be removed from localStorage and the row SHALL disappear from the list immediately

#### Scenario: Empty state when no favourites
- **WHEN** FavouritesPanel is open and no favourites are saved
- **THEN** the panel SHALL display an empty state message

### Requirement: Recent searches in FavouritesPanel
The system SHALL display recent searches inside FavouritesPanel below the favourites list.

#### Scenario: Recent searches visible
- **WHEN** FavouritesPanel is open and recent searches exist
- **THEN** recent searches SHALL be listed below the favourites section

#### Scenario: Tapping a recent search triggers search
- **WHEN** the user taps a recent search entry
- **THEN** FavouritesPanel SHALL close and the search term SHALL be populated in the search bar

### Requirement: Remove FavoritesAndRecent from search empty-state
The system SHALL NOT show the FavoritesAndRecent dropdown when the search bar is empty and focused.

#### Scenario: Empty search bar no longer shows favourites dropdown
- **WHEN** the user taps the search bar and it is empty
- **THEN** no favourites or recent searches dropdown SHALL appear (access is via the star button instead)
