## 1. Move duration controls to persistent strip

- [x] 1.1 Move duration buttons, custom input, and day type toggle from inside the dropdown to a strip below the search input — rendered outside the dropdown div, visible when search term is non-empty
- [x] 1.2 Remove the subtitle (replaced by the strip)

## 2. Fix cost calculation in CarparkPanel

- [x] 2.1 Add cache-busting query parameter (`_t=timestamp`) to `fetchCarparkById` to bypass service worker cache
- [x] 2.2 Verify CarparkPanel cost effect has `duration` and `dayType` in dependency array and re-fetches correctly

## 3. Verify

- [x] 3.1 Build passes
- [x] 3.2 Test: change duration with panel open — cost updates correctly, dropdown stays closed
