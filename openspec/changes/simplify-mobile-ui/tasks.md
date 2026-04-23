## 1. Collapsible DurationSelector

- [x] 1.1 Add `isExpanded` state and compact bar rendering to DurationSelector — show compact bar (`md:hidden`) with current duration + day type + chevron, full selector (`hidden md:block`) on desktop, toggle on tap
- [x] 1.2 Add expand-upward layout — when expanded on mobile, render full controls above the compact bar with animation (translate-y transition)
- [x] 1.3 Add `onCollapse` callback prop and wire it to App's `onMapClick` handler so map taps collapse the expanded selector
- [x] 1.4 Verify desktop is unchanged — full selector always visible, no compact bar rendered

## 2. Simplified Search Results

- [x] 2.1 Replace the result item JSX in SearchBar with condensed single-row layout — star, name, car lot dot + count, cost (plain text), distance
- [x] 2.2 Remove carpark_num, area, agency badge, motorcycle/heavy lot pills, AI confidence label, cost_breakdown, gradient cost box, and TimeBasedAlert from result items
- [x] 2.3 Verify CarparkPanel still shows all detail (no changes needed — just confirm nothing was accidentally coupled)

## 3. Integration & Polish

- [x] 3.1 Test mobile flow end-to-end: search → see recommendations + simplified results → tap result → see full detail in panel → change duration via compact bar
- [x] 3.2 Test desktop flow: confirm DurationSelector and search results render identically to current behaviour on desktop
