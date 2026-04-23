## Context

The previous change (`duration-into-searchbar`) moved duration controls into the search dropdown. This created state conflicts: changing duration requires the dropdown open, but the dropdown visibility fights with panel visibility and selectedCarpark state. Duration controls need to be always-accessible without touching dropdown state.

The cost bug shows "Estimated cost for 3h" with "2.0 hours" breakdown. The backend returns correct cache keys per duration, so the issue is frontend-side — either the service worker caching API responses, or the CarparkPanel effect not properly invalidating when duration changes.

## Goals / Non-Goals

**Goals:**
- Duration strip always visible below search bar when a search term exists — no dropdown interaction needed
- CarparkPanel shows correct cost for the current duration after every change

**Non-Goals:**
- Changing dropdown behaviour (option C already works — dropdown and panel coexist)
- Changing backend caching logic

## Decisions

### 1. Duration strip position: between search input and dropdown

The duration controls render as a sibling element below the search input, inside the same fixed container. They are NOT inside the dropdown — clicking them doesn't trigger input focus or dropdown visibility changes.

**Layout:**
```
┌──────────────────────────────────────────┐
│ near me                      📍 🔍 ★     │  ← input
├──────────────────────────────────────────┤
│ [30m][1hr][2hrs][3hrs]...  Weekday ▾     │  ← strip (outside dropdown)
└──────────────────────────────────────────┘
│ 100 results                          ✕   │  ← dropdown (when open)
│ ...                                      │
```

**Why outside dropdown:** Eliminates the state conflict. Duration changes never touch `isDropdownVisible`. The strip and dropdown are independent.

### 2. Strip visibility: whenever search term is non-empty

The strip shows when `value.trim() !== ""` — same condition as the previous subtitle. When there's no search, there's nothing to apply duration to, so the strip is hidden.

### 3. Cost fix: bypass service worker cache for on-demand fetches

The service worker (vite-plugin-pwa) may be caching `/carparks/<id>` responses. Add a cache-busting query parameter (`_t=timestamp`) to the on-demand fetch in CarparkPanel to ensure fresh responses. Also verify the effect dependency array includes `duration` and `dayType` so it re-fetches on changes.

### 4. Remove duration controls from dropdown

The dropdown reverts to: header → radius selector → recommendations → results. Duration controls are no longer in the dropdown.

## Risks / Trade-offs

**Strip takes vertical space** → ~40px, acceptable. It replaces the subtitle which was ~20px. The strip is compact (small buttons, single row).

**Service worker cache bust adds a query param** → Minor. Only affects the single-carpark endpoint, not the search endpoint. The search endpoint already gets different params per request.
