## 1. Add duration controls to SearchBar dropdown

- [x] 1.1 Add `onDurationChange` and `onDayTypeChange` callback props to SearchBar interface
- [x] 1.2 Add duration quick-select buttons, custom input, and day type toggle in the dropdown between the results header and RadiusSelector
- [x] 1.3 Wire buttons to call `onDurationChange` / `onDayTypeChange` callbacks

## 2. Add search bar subtitle

- [x] 2.1 Add subtitle below the search input showing `{duration} · {dayType}` — visible only when dropdown is closed and search term is non-empty

## 3. Remove DurationSelector

- [x] 3.1 Delete DurationSelector.tsx
- [x] 3.2 Remove DurationSelector import, positioning wrapper, and `durationCollapseTick` state from App.tsx
- [x] 3.3 Pass `onDurationChange` and `onDayTypeChange` callbacks from App to SearchBar

## 4. Verify

- [x] 4.1 Build passes, no unused imports or dead code
- [x] 4.2 Test: changing duration in dropdown updates search results and costs
