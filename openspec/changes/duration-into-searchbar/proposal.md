# Duration Into Searchbar

## Problem
The DurationSelector sits at the bottom of the screen, disconnected from the search results it affects. Users have to scroll between the duration control and search results to compare costs. On mobile, the compact bar we built adds UI complexity without solving the core issue: duration and results should live together.

## Goal
Move duration and day type controls into the search dropdown, right next to the results they affect. Remove the standalone DurationSelector component entirely. Show a subtle subtitle on the search bar when the dropdown is closed as a reminder of active settings.

## Scope

### 1. Duration controls inside dropdown
- Add duration quick-select buttons (30min, 1hr, 2hrs, ...) and day type toggle (Weekday/Saturday/Sunday) inside the search dropdown, between the results header and the radius selector
- Custom duration input included
- Changing duration/dayType immediately re-runs the search (existing behaviour)

### 2. Search bar subtitle
- When the dropdown is closed, show current duration and day type below the search input as a subtle grey label (e.g., "2hrs · Weekday")
- When the dropdown is open, hide the subtitle (the full controls are visible)

### 3. Remove DurationSelector component
- Delete DurationSelector.tsx
- Remove all DurationSelector references from App.tsx (component, collapseTick state, positioning wrapper)
- Duration and dayType state remain in App — just the UI moves

### Out of scope
- Changing the radius selector layout
- Changing SmartRecommendation cards
- Changing the CarparkPanel detail view
