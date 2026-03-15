## Context

Currently `MapController` (inside `<Map>`) owns `selectedCarpark` state and renders a Google Maps `<InfoWindow>` as a child. The InfoWindow is constrained by Google's default styling — it injects an unavoidable top gap and cannot be overridden with Tailwind.

The new panel must live **outside** `<Map>` so it can be freely styled. This requires lifting `selectedCarpark` state one level up to `CarparkMap`, which wraps both `<Map>` and the new `<CarparkPanel>`.

## Goals / Non-Goals

**Goals:**
- Full visual control over the carpark detail panel
- Responsive: bottom sheet on mobile, left side panel on desktop (`md:` breakpoint)
- Show immediately on marker tap; address loads progressively
- Display agency badge, availability, pricing/cost, distance, favorites

**Non-Goals:**
- Drag-to-dismiss gesture on the bottom sheet (nice-to-have, out of scope)
- Routing or navigation actions from the panel
- Changing how geocoding works

## Decisions

**Decision: Lift selectedCarpark to CarparkMap, not App**

`App.tsx` already manages search state, location, duration, dayType. Adding carpark selection there would make it a further grab-bag of unrelated concerns. `CarparkMap` is the right owner — it manages everything map-related, and the panel is a map-level concern.

`MapController` emits an `onSelect(carpark)` callback up to `CarparkMap`. `CarparkMap` holds `selectedCarpark` state and passes it to both `MapController` (for marker highlight) and `CarparkPanel`.

**Decision: CarparkPanel is a new standalone component**

Not inlined into CarparkMap. The panel has its own geocode effect, favorite toggle, and rendering logic — keeping it separate keeps CarparkMap readable.

**Decision: Responsive via Tailwind breakpoint, not JS**

```
mobile:   fixed bottom-0 left-0 right-0
          translate-y-full (hidden) → translate-y-0 (visible)
          rounded-t-2xl, drag handle visible

desktop:  fixed top-0 left-0 bottom-0 w-80
          -translate-x-full (hidden) → translate-x-0 (visible)
          no drag handle, full height
```

Single component, CSS handles the layout difference. No `useWindowSize` needed.

**Decision: Show panel immediately, address loads async**

On tap: panel slides up with carpark name, area, lots, pricing. Geocoded address appears once resolved (same pattern as current InfoWindow). Avoids perceived latency on tap.

**Decision: Pricing section hidden when no pricing data**

If `carpark.pricing === null`, the pricing section is not rendered. If `calculated_cost` is null but `pricing` exists, show the raw rate strings without a cost estimate.

## Risks / Trade-offs

- **[Risk] selectedCarpark state now in CarparkMap, not MapController** → MapController receives it as a prop for marker highlight. This is a clean separation but requires updating the MapController interface.
- **[Risk] Panel overlaps map content on mobile** → Acceptable — this is standard bottom sheet UX. The map remains interactive behind the panel.
- **[Risk] Panel width on desktop (w-80) may feel narrow for long carpark names** → Mitigated by text truncation with `truncate` class on the name.
