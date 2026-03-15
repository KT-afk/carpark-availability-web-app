## 1. SVY21 conversion utility

- [x] 1.1 Implement `wgs84_to_svy21(lat, lng) -> (northing, easting)` in `backend/app/utils/svy21.py` using SLA projection constants
- [x] 1.2 Validate conversion against known SLA reference coordinate pairs (tolerance: <1 metre)

## 2. Pre-compute SVY21 into HDB static data

- [x] 2.1 Update HDB data generation script to call `wgs84_to_svy21` for each carpark and write `northing`/`easting` fields
- [x] 2.2 Regenerate `hdb_carpark_info.json` with SVY21 fields
- [x] 2.3 Verify a sample of records have correct northing/easting values

## 3. Replace Haversine with SVY21 distance

- [x] 3.1 Rewrite `calculate_distance()` in `carpark_service.py` to take `(n1, e1, n2, e2)` and return Pythagorean km
- [x] 3.2 Update LTA carpark fetch to convert WGS84 → SVY21 when building cached records
- [x] 3.3 Update all `calculate_distance()` call sites to pass northing/easting instead of lat/lng
- [x] 3.4 Convert user's WGS84 location to SVY21 once per request before distance calculations

## 4. Intent detection and radius search (backend)

- [x] 4.1 Implement `detect_search_intent(term) -> 'place' | 'id'` heuristic in `search_service.py`
- [x] 4.2 Implement `geocode_place(term) -> (lat, lng) | None` in a new `backend/app/services/geocoding_service.py` — calls Google Geocoding API, appends ", Singapore"
- [x] 4.3 Implement `filter_by_radius(carparks, centre_n, centre_e, radius_m) -> list` in `carpark_service.py`
- [x] 4.4 Update `get_carparks()` to route place name searches through geocode → radius filter path
- [x] 4.5 Update `/carparks` route to accept `radius` query param (default 1000), pass to `get_carparks()`
- [x] 4.6 Return `search_centre` (lat/lng) and `search_type` ('radius' | 'text') in API response for frontend use

## 5. Radius selector UI (frontend)

- [x] 5.1 Add `radius` and `searchType` state to `App.tsx`
- [x] 5.2 Parse new API response shape `{carparks, search_type, search_centre}` in `App.tsx`
- [x] 5.3 Create `RadiusSelector` component — shows "Showing X carparks within [radius ▾] of [place]" with dropdown (500m, 1km, 1.5km, 2km)
- [x] 5.4 Render `RadiusSelector` below search bar only when `searchType === 'radius'`
- [x] 5.5 Changing radius re-triggers search

## 6. Marker clustering (frontend)

- [x] 6.1 Install `@googlemaps/markerclusterer` (not in vis.gl, separate package)
- [x] 6.2 Wrap carpark markers in `MarkerClusterer` in `MapController` (imperative AdvancedMarkerElement instances)
- [x] 6.3 Implement custom cluster renderer — badge colour based on best availability in cluster (green/orange/red)
- [x] 6.4 Exclude selected carpark from clustering — render it as standalone `AdvancedMarker` outside the clusterer
