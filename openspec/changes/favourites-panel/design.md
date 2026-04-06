## Context

The app currently surfaces favourites only when the search bar is empty and focused, via the `FavoritesAndRecent` component. There is no persistent entry point. With many favourites, the list overflows and blocks recent searches and the `DurationSelector`. There is also no way to remove a favourite from within the favourites list itself.

`CarparkPanel` already implements a bottom sheet pattern (mobile: `fixed bottom-0`, slides up via `translate-y-full → translate-y-0`, `max-h-[75vh]`; desktop: left sidebar). `FavouritesPanel` will reuse the mobile bottom sheet CSS but will never adopt the desktop left sidebar variant, to avoid conflicting with `CarparkPanel` on desktop.

## Goals / Non-Goals

**Goals:**
- Persistent ⭐ button in the search bar always accessible
- Dedicated bottom sheet panel for favourites + recent searches on all screen sizes
- Inline remove per favourite row
- Single-panel-at-a-time rule: opening FavouritesPanel closes CarparkPanel and vice versa
- Hide DurationSelector while FavouritesPanel is open

**Non-Goals:**
- Reordering favourites (drag and drop)
- Showing live availability data inside FavouritesPanel
- Syncing favourites across devices
- Swipe-to-delete gesture (too complex for current scope)

## Decisions

**D1: Bottom sheet on all screen sizes (never left sidebar)**
CarparkPanel uses a left sidebar on desktop. If FavouritesPanel did the same, both panels would fight for the same left edge. Making FavouritesPanel always a bottom sheet avoids the conflict entirely. On desktop, a bottom sheet at `max-h-[50vh]` is visually reasonable and consistent.

Alternatives considered:
- Right sidebar — introduces a new layout zone, inconsistent with existing patterns
- Modal overlay — covers the map entirely, heavier feel than necessary

**D2: One panel at a time**
Opening FavouritesPanel sets `showFavouritesPanel = true` and clears `selectedCarpark` (closing CarparkPanel). Tapping a favourite closes FavouritesPanel then triggers the existing search-and-select flow. This keeps state simple — no need to track "which panel is on top".

Alternatives considered:
- Stacking panels with z-index — complex, confusing UX

**D3: Reuse existing search-and-select flow for navigating to a favourite**
When a favourite is tapped, `onChange(fav.development)` fires, which triggers the existing API search → auto-select via `pendingFavoriteSelect`. This avoids duplicating carpark-loading logic.

Trade-off: the round trip adds latency. Acceptable because fresh availability data is desirable anyway.

**D4: FavoritesAndRecent removed from SearchBar empty-state**
The panel replaces the empty-state dropdown entirely. `FavoritesAndRecent.tsx` can be reused inside `FavouritesPanel` or its logic inlined. Either way the empty-state trigger in `SearchBar` is removed.

**D5: DurationSelector hidden when FavouritesPanel is open**
One conditional in `App.tsx`: `{!showFavouritesPanel && <DurationSelector ... />}`. Simple, no layout shift complexity.

## Risks / Trade-offs

- [Search round trip fragility] If API returns no results for `fav.development`, the carpark silently never opens → Mitigation: existing `pendingFavoriteSelect` mechanism already handles this; a future improvement could navigate directly via coordinates
- [FavouritesPanel covers map on mobile] User loses map context while browsing favourites → Acceptable trade-off; consistent with how CarparkPanel behaves
- [FavoritesAndRecent.tsx becomes orphaned] If reused inside FavouritesPanel it stays; if not, it should be deleted to avoid dead code → Decide at implementation time
