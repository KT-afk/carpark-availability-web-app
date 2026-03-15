## Why

The Google Maps `<InfoWindow>` component has an unavoidable gap at the top injected by Google, cannot be fully styled, and shows limited data. Replacing it with a custom panel — a bottom sheet on mobile, a left side panel on desktop — gives full design control, a better mobile UX, and space to surface pricing and availability data that users need to decide whether to go to a carpark.

## What Changes

- Remove the Google Maps `<InfoWindow>` from `CarparkMap.tsx` entirely
- Create a new `CarparkPanel` component that renders as:
  - **Mobile**: fixed bottom sheet that slides up when a marker is tapped
  - **Desktop (md+)**: fixed left side panel that slides in from the left
- Panel shows immediately on marker tap with available data; address loads progressively via geocoding
- Panel sections:
  - Header: agency badge (HDB/LTA), carpark name, ID, area, distance, favorite button
  - Address: geocoded address + postal code (loads async after tap)
  - Availability: car / motorcycle / heavy vehicle lot counts
  - Pricing: weekday/saturday/sunday rates + AI-calculated cost estimate (hidden if no pricing data)
- Lift `selectedCarpark` state from `MapController` up to `CarparkMap` so the panel can be rendered as a sibling to `<Map>`

## Capabilities

### New Capabilities

- `carpark-panel`: Custom carpark detail panel replacing Google InfoWindow, responsive across mobile and desktop

### Modified Capabilities

<!-- No existing spec-level requirements are changing -->

## Impact

- `frontend/src/components/CarparkMap.tsx`: Remove InfoWindow, lift selectedCarpark state, render CarparkPanel outside Map
- `frontend/src/components/CarparkPanel.tsx`: New component (create)
- No backend changes, no API changes, no new dependencies
