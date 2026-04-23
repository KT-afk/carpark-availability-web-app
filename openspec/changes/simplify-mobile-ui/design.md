## Context

The app is a full-screen map-based carpark finder for Singapore. On mobile, the DurationSelector permanently occupies ~120px at the bottom, and each search result item in the dropdown shows 6+ pieces of information (name, ID, area, multiple lot types, AI cost box, time alerts). The SmartRecommendations cards — the app's differentiating feature — get visually buried under this density.

**Current component structure:**
- `DurationSelector.tsx` — stateless, receives `duration`, `onChange`, `dayType`, `onDayTypeChange` props from App
- `SearchBar.tsx` — renders the dropdown with result items inline (no separate ResultItem component)
- `App.tsx` — owns all state, positions DurationSelector with `absolute bottom-8`

## Goals / Non-Goals

**Goals:**
- Reclaim ~80px of mobile screen space by collapsing DurationSelector to a compact bar
- Make SmartRecommendation cards the visual focal point of search results
- Keep all information accessible (detail panel, expanded state) — just reduce what's shown by default

**Non-Goals:**
- Changing desktop layout (DurationSelector stays expanded)
- Redesigning SmartRecommendation cards
- Extracting a separate ResultItem component (keep changes minimal — inline simplification)
- Changing any search/API behaviour

## Decisions

### 1. Collapse mechanism: internal state in DurationSelector

Add an `isExpanded` boolean state inside DurationSelector. The component manages its own expand/collapse toggle. On mobile (detected via `md:` Tailwind breakpoint or a simple width check), it renders the compact bar by default. On desktop, it always renders expanded — the toggle state is ignored.

**Why internal state:** The expand/collapse is purely a UI concern — App doesn't need to know. No new props needed beyond what already exists. App already passes `duration` and `dayType` which the compact bar displays.

**Alternative considered:** Lifting `isExpanded` to App and adding a prop. Rejected — App already has too much state, and nothing else needs to know if the selector is expanded.

### 2. Collapse trigger: tap compact bar to expand, tap map or compact bar header to collapse

- Tap the compact bar → expand upward
- Tap the chevron/header area when expanded → collapse
- Tap the map (existing `onMapClick` in App) → collapse via a new `onCollapse` callback prop

**Why onCollapse prop:** Map clicks already dismiss dropdowns and panels via App. Adding one more callback keeps the pattern consistent without DurationSelector needing to listen for external click events.

### 3. Mobile detection: Tailwind responsive classes, not JS

Use `md:hidden` / `hidden md:block` to show compact bar on mobile and full selector on desktop. No `window.innerWidth` checks or resize listeners needed.

**Why:** Matches the pattern used throughout the app (CarparkPanel, FavoritesPanel both use `md:` breakpoints). Zero JS overhead.

### 4. Search result simplification: modify inline JSX, no new component

Simplify the `<li>` block inside SearchBar's results map. Each item becomes a single row:

```
★  Blk 123A Punggol Dr    🟢 123   $2.40   450m
```

**Elements kept:** favourite star, development name, car lot availability (dot + count), calculated cost (plain text, no gradient box), distance.

**Elements removed:** carpark_num, area, agency badge, motorcycle lots, heavy vehicle lots, AI confidence label, cost_breakdown text, TimeBasedAlert component, "Available Lots" total header, gradient cost box.

**Why no separate component:** The result item is only rendered in one place. Extracting to a component adds a file and indirection for no reuse benefit. The simplified version is ~15 lines of JSX — clean enough inline.

## Risks / Trade-offs

**Loss of lot type detail in results list** → Mitigated: all lot types still shown in CarparkPanel when user taps a result. Most users only care about car lots.

**Users may not discover the expand action on mobile** → Mitigated: the chevron (▾) on the compact bar is a standard affordance. The bar text ("2 hrs · Weekday") makes it clear these are changeable values.

**TimeBasedAlert hidden from list** → Trade-off accepted. The alert is useful but noisy in a list of 10+ items. It remains visible in CarparkPanel. Could revisit later if users miss it.
