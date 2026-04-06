## Why

Favourites are currently buried inside the search bar interaction — users must tap and clear the search input to access them. There is no persistent entry point, no way to remove favourites from the favourites list, and with many favourites saved the list blocks recent searches and the AI-powered DurationSelector. Favourites are a core accessibility feature for returning users and deserve a dedicated, always-accessible panel.

## What Changes

- Add a ⭐ button in the search bar header (alongside the existing map pin and search icons) as a persistent entry point to favourites
- Add a new `FavouritesPanel` component — a bottom sheet that slides up from the bottom on all screen sizes (never a left sidebar)
- FavouritesPanel shows favourites list (with inline remove ✕ per row) and recent searches
- Tapping a favourite closes FavouritesPanel, triggers a search, and opens CarparkPanel with the result
- Opening FavouritesPanel closes CarparkPanel (one panel at a time)
- DurationSelector is hidden while FavouritesPanel is open
- Remove FavoritesAndRecent from the search bar empty-state dropdown (replaced by the dedicated panel)

## Capabilities

### New Capabilities
- `favourites-panel`: Dedicated bottom sheet panel for accessing, navigating to, and removing saved favourites and recent searches

### Modified Capabilities

## Impact

- `frontend/src/components/SearchBar.tsx` — add ⭐ button, new `onFavouritesClick` prop, remove FavoritesAndRecent empty-state rendering
- `frontend/src/components/FavouritesPanel.tsx` — new component
- `frontend/src/App.tsx` — new `showFavouritesPanel` boolean state, panel open/close logic, hide DurationSelector when panel open
- `frontend/src/services/localStorage.ts` — no changes needed
- `frontend/src/components/FavoritesAndRecent.tsx` — no longer used from SearchBar (may be reused inside FavouritesPanel or deleted)
