## 1. App State

- [ ] 1.1 Add `showFavouritesPanel` boolean state to `App.tsx`
- [ ] 1.2 Add `handleOpenFavourites` handler — sets `showFavouritesPanel = true` and clears `selectedCarpark` (closes CarparkPanel)
- [ ] 1.3 Add `handleCloseFavourites` handler — sets `showFavouritesPanel = false`
- [ ] 1.4 Pass `onFavouritesClick` and `showFavouritesPanel` props to `SearchBar`
- [ ] 1.5 Pass `show` and `onClose` props to `FavouritesPanel`
- [ ] 1.6 Conditionally render `DurationSelector` only when `!showFavouritesPanel`
- [ ] 1.7 Pass `onDismissDropdown` map click handler to also close FavouritesPanel

## 2. SearchBar Updates

- [ ] 2.1 Add `onFavouritesClick` prop to `SearchBarProps` interface
- [ ] 2.2 Add ⭐ `Star` icon button in the search bar icon area (alongside MapPin and Search)
- [ ] 2.3 Wire the star button `onClick` to `onFavouritesClick`
- [ ] 2.4 Remove the `{showFavoritesPanel && <FavoritesAndRecent>}` empty-state block
- [ ] 2.5 Remove `showFavoritesPanel` derived state and related logic from SearchBar

## 3. FavouritesPanel Component

- [ ] 3.1 Create `frontend/src/components/FavouritesPanel.tsx`
- [ ] 3.2 Implement bottom sheet CSS — `fixed bottom-0 left-0 right-0 z-40`, `rounded-t-3xl`, `max-h-[75vh] overflow-y-auto`, slide animation via `translate-y-full / translate-y-0`
- [ ] 3.3 Add drag handle (same as CarparkPanel)
- [ ] 3.4 Add header row: "My Favourites" title + X close button
- [ ] 3.5 Load favourites from `getFavorites()` into local state on mount and when `show` changes
- [ ] 3.6 Render favourites list — each row shows `development`, `carpark_num · area`, and a ✕ remove button
- [ ] 3.7 Wire ✕ remove button to call `removeFavorite(carpark_num)` and update local state immediately
- [ ] 3.8 Show empty state message when no favourites exist
- [ ] 3.9 Render recent searches section below favourites (reuse `getRecentSearches` + `clearRecentSearches`)
- [ ] 3.10 Wire recent search tap to close panel and call `onRecentSearchClick(term)`
- [ ] 3.11 Add `onFavouriteClick` prop — closes panel and triggers search via existing `pendingFavoriteSelect` flow

## 4. Wire Up in App.tsx

- [ ] 4.1 Render `<FavouritesPanel>` in `App.tsx` alongside `CarparkPanel`
- [ ] 4.2 Pass `show={showFavouritesPanel}`, `onClose={handleCloseFavourites}`, `onFavouriteClick`, `onRecentSearchClick` props
- [ ] 4.3 Ensure map click (`handleDismissDropdown`) also calls `handleCloseFavourites`

## 5. Cleanup

- [ ] 5.1 Confirm `FavoritesAndRecent.tsx` is no longer imported anywhere — delete if unused
- [ ] 5.2 Verify no TypeScript errors across changed files
- [ ] 5.3 Test: open favourites → tap favourite → CarparkPanel opens with correct carpark
- [ ] 5.4 Test: open favourites → remove a favourite → row disappears immediately
- [ ] 5.5 Test: open favourites → DurationSelector not visible → close → DurationSelector returns
- [ ] 5.6 Test: open CarparkPanel → tap star → CarparkPanel closes, FavouritesPanel opens
