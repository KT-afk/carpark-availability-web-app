## 1. Refactor CarparkMap state

- [x] 1.1 Add `selectedCarpark` and `showPanel` state to `CarparkMap` (lift from `MapController`)
- [x] 1.2 Add `onSelect` callback prop to `MapController` and remove its internal `selectedCarpark` state
- [x] 1.3 Pass `selectedCarpark` down to `MapController` as a prop for marker highlight logic
- [x] 1.4 Remove `<InfoWindow>` and all InfoWindow-related state/effects from `MapController`

## 2. Create CarparkPanel component

- [x] 2.1 Create `frontend/src/components/CarparkPanel.tsx` with props: `carpark`, `onClose`, `duration`, `dayType`
- [x] 2.2 Implement responsive layout: bottom sheet on mobile (`fixed bottom-0 left-0 right-0`), left panel on desktop (`md:fixed md:top-0 md:left-0 md:bottom-0 md:w-80`)
- [x] 2.3 Implement slide-in/out animation: `translate-y-full` → `translate-y-0` on mobile, `-translate-x-full` → `translate-x-0` on desktop
- [x] 2.4 Implement panel header: agency badge (green HDB / blue LTA), carpark name, ID + area + distance, favourite star button
- [x] 2.5 Implement address section with progressive loading (show spinner → replace with geocoded address + postal code)
- [x] 2.6 Implement availability section: car / motorcycle / heavy vehicle lot counts as pills
- [x] 2.7 Implement pricing section: weekday/saturday/sunday rates + calculated cost if available; hide section entirely if `pricing === null`
- [x] 2.8 Add close button (visible on both mobile and desktop) that calls `onClose`
- [x] 2.9 Add drag handle indicator (mobile only, decorative)

## 3. Wire CarparkPanel into CarparkMap

- [x] 3.1 Render `<CarparkPanel>` in `CarparkMap` as a sibling to `<Map>`, passing `selectedCarpark`, `onClose`, `duration`, `dayType`
- [x] 3.2 Add `duration` and `dayType` props to `CarparkMap` and `CarparkMapProps`, passed from `App.tsx`
- [x] 3.3 Close panel when map is clicked (reuse existing `onMapClick` → set `showPanel = false`)
