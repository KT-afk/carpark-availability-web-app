# Duration Strip and Cost Fix

## Problem
Two issues with the current state:

1. **Duration controls are inside the search dropdown**, which creates state conflicts: changing duration requires the dropdown to be open, but the dropdown fights with the carpark panel for screen space. Opening the dropdown to change duration can cause the selected carpark to reappear, and the dropdown itself reappears unexpectedly after selecting a carpark.

2. **Cost calculation shows stale/swapped values** in the CarparkPanel. Changing from 2hrs to 3hrs shows the 2hr breakdown under the 3hr label, and vice versa. The backend cache keys are correct — the issue is in the frontend (likely service worker caching API responses or the panel not re-fetching properly when duration changes).

## Goal
- Move duration controls to a persistent strip below the search bar (outside the dropdown) so changing duration never conflicts with dropdown/panel state
- Fix the cost cache bug so the panel always shows the correct cost for the selected duration

## Scope

### 1. Duration strip below search bar
- Move duration quick-select buttons, custom input, and day type toggle OUT of the dropdown
- Render them as a compact strip below the search input, visible whenever a search term exists
- Remove the subtitle (the strip itself shows the active settings)
- Changing duration triggers a background search re-run without affecting dropdown or panel visibility

### 2. Fix cost calculation in CarparkPanel
- Investigate and fix why the panel shows stale/swapped costs when duration changes
- Check service worker caching of `/carparks/<id>` API responses
- Ensure the on-demand cost fetch uses the correct current duration and doesn't serve stale results

### Out of scope
- Dropdown behaviour when panel is open (option C — already works correctly)
- SmartRecommendation card changes
- Backend AI calculator changes (cache keys are correct)
