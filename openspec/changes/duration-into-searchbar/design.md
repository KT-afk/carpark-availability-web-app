## Context

The DurationSelector is a standalone component positioned at the bottom of the screen. Duration and dayType state live in App.tsx and are passed to both SearchBar (for API calls) and DurationSelector (for display/control). The search dropdown already contains RadiusSelector and SmartRecommendations — duration controls will join them as another filter section.

## Goals / Non-Goals

**Goals:**
- Move duration/dayType controls into the search dropdown so they're adjacent to the results they affect
- Add a subtle subtitle on the search bar showing active duration/dayType when dropdown is closed
- Remove DurationSelector.tsx and all related wiring (collapseTick, positioning wrapper)

**Non-Goals:**
- Changing how duration/dayType state is managed (stays in App)
- Changing the RadiusSelector or SmartRecommendations layout
- Changing the search API or backend behaviour

## Decisions

### 1. Duration controls placement: between results header and radius selector

The dropdown currently renders: header → radius selector → recommendations → results. Duration controls will go between the header and radius selector, making the order: header → duration/dayType controls → radius selector → recommendations → results.

**Why above radius:** Duration affects cost calculations (the primary value prop). Radius affects which carparks appear. Duration is more frequently changed, so it goes first.

### 2. Duration controls rendered inline in SearchBar, not extracted

The duration buttons and day type toggle will be rendered directly in SearchBar's dropdown JSX. No new component — the markup is ~30 lines and only used in one place.

**Why:** SearchBar already renders RadiusSelector inline. Extracting to a component adds indirection for no reuse benefit. The existing DurationSelector's FullSelector sub-component logic (button arrays, custom input) can be copied inline.

### 3. Subtitle as a second line inside the search bar container

When the dropdown is closed and a search term exists, show `{duration} · {dayType}` as small grey text below the input. When the dropdown is open, hide it (the full controls are visible).

**Why conditional on search term:** Before searching, there's nothing to apply duration to. Showing "2hrs · Weekday" on an empty search bar is confusing.

### 4. SearchBar receives onChange callbacks for duration/dayType

SearchBar already receives `duration` for display. Add `onDurationChange` and `onDayTypeChange` callback props (same pattern as `setRadius`). No new state in SearchBar — it calls the parent callbacks directly.

### 5. Delete DurationSelector.tsx entirely

Remove the component file, its import in App, the positioning wrapper div, and the `durationCollapseTick` state. The `duration` and `dayType` state stays in App.

## Risks / Trade-offs

**Dropdown gets taller** → Acceptable. The dropdown already scrolls (`max-h-96 overflow-y-auto`). Duration controls add ~60px. The RadiusSelector is already there, so users expect filter controls in the dropdown.

**No duration control visible when dropdown is closed** → Mitigated by the subtitle showing active settings. Users can tap the search bar to access controls.

**Custom duration input in dropdown** → The number input works fine inline. No special handling needed.
