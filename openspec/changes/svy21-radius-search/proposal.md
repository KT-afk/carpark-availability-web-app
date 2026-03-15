## Why

Current text search misses carparks that are geographically near a location but don't have the place name in their development field — searching "Orchard" only returns carparks with "orchard" in the name, not all carparks physically in the Orchard area. Radius-based search fixes this by finding carparks within a configurable distance from a geocoded centre point.

## What Changes

- Replace Haversine formula with SVY21 projection + Pythagorean distance — simpler, native metres, appropriate for Singapore's scale
- Pre-compute SVY21 coordinates (northing/easting) into `hdb_carpark_info.json` offline so no runtime conversion is needed for static data
- Add intent detection to distinguish place name searches from carpark ID searches
- Add radius-based filtering for place name and address searches (default 1km, user-adjustable)
- Add marker clustering on the map to handle dense results in small areas
- Contextual radius control in search results UI — only visible during radius searches

## Capabilities

### New Capabilities
- `svy21-distance`: SVY21 coordinate system support — pre-computed northing/easting in static data, runtime conversion for live LTA data, Pythagorean distance calculation replacing Haversine
- `radius-search`: Radius-based carpark filtering — intent detection, geocoded centre point, configurable radius, linear scan filter using SVY21 distances
- `marker-clustering`: Map marker clustering — collapse dense markers at low zoom levels, cluster badge colour reflects best availability in group

### Modified Capabilities

## Impact

- `backend/app/services/carpark_service.py` — replace `calculate_distance()` with SVY21 Pythagorean version
- `backend/app/data/hdb_carpark_info.json` — add `northing` and `easting` fields to every record
- `backend/scripts/` — extend HDB data generation script to compute SVY21 coordinates
- `backend/app/routes/carparks.py` — add intent detection, radius filter path
- `frontend/src/components/CarparkMap.tsx` — add `MarkerClusterer`
- `frontend/src/components/SearchBar.tsx` or results area — add radius selector UI
- New dependency: SVY21 conversion formula (pure Python, no library needed)
