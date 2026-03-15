## Context

The backend currently uses the Haversine formula to calculate distances between WGS84 coordinates. All carpark data from data.gov.sg arrives in WGS84 (lat/lng ~1.3, ~103.8). Search is purely text-based — matching against development name and area fields. This means carparks physically near a location but without the place name in their name are invisible to the user.

Singapore spans ~50km × 30km. At this scale, earth curvature error using flat-plane math is ~1 metre per 5km — negligible for a carpark finder use case.

## Goals / Non-Goals

**Goals:**
- Replace Haversine with SVY21 + Pythagorean distance (simpler, native metres)
- Pre-compute SVY21 coordinates into the static HDB JSON so no runtime conversion is needed
- Add radius-based filtering for place name and address searches
- Add intent detection to route searches down the right path
- Add map marker clustering for dense result sets
- Add a contextual radius selector in the UI

**Non-Goals:**
- SQLite or spatial database — not needed at 2,000 carparks; linear scan is <1ms
- SpatiaLite extension — deployment complexity not justified
- Changing the "near me" or carpark ID search flows
- Cron job for JSON regeneration — future work

## Decisions

### D1: Pre-compute SVY21 in the JSON file, not at runtime

**Decision:** Run SVY21 conversion offline as part of the data generation script. Store `northing` and `easting` alongside `lat`/`lng` in `hdb_carpark_info.json`.

**Why:** Static HDB carpark locations never change. Computing once offline and storing in the file means zero conversion overhead at request time. The module-level `_hdb_info_cache` loads it once at startup and it stays in memory.

**Alternative considered:** Convert at startup when loading the JSON. Rejected — adds ~2000 conversions every cold start for no benefit since the data doesn't change.

**LTA carparks:** These are fetched live from the API and cached for 5 minutes. SVY21 conversion happens once when they enter the cache, not per request.

---

### D2: Linear scan for radius filter, no spatial index

**Decision:** Filter carparks by iterating all records in memory and checking `sqrt((n2-n1)² + (e2-e1)²) <= radius_metres`.

**Why:** 2,000 carparks, Python dict iteration, <1ms. The complexity of a spatial index (grid, R-tree, SQLite) is not justified. The crossover point where a spatial index matters is ~50,000+ records or high concurrent load — neither applies here.

**Alternative considered:** Grid index dividing Singapore into 500m cells. Rejected — premature optimisation for this dataset size.

---

### D3: Intent detection heuristic

**Decision:** Classify search term as "place name" vs "carpark ID" using:
```
is_place = (
    term in alias_file OR
    ' ' in term OR
    not re.match(r'^[A-Z]{1,3}\d+[A-Z]?$', term.upper())
)
```

**Why:** Carpark IDs follow a consistent pattern (e.g. BTP0012, HE22, ACB). Everything else is treated as a place name. Alias file is already loaded in memory.

**Alternative considered:** Always geocode first. Rejected — adds latency and Geocoding API cost on every search, including carpark ID lookups.

---

### D4: Radius search augments text search, doesn't replace it

**Decision:** For place name searches, run radius search as the primary path. Text search remains for carpark IDs. "Near me" is unchanged.

**Why:** A user searching "Orchard" wants carparks near Orchard, not just ones named "Orchard". But a user searching "BTP0012" wants that specific carpark, not carparks near wherever BTP0012 happens to be.

---

### D5: Default radius 1km, user-adjustable

**Decision:** Default 1km. Control rendered contextually in search results: `"Showing X carparks within [1km ▾] of Orchard"`. Options: 500m, 1km, 1.5km, 2km.

**Why:** 1km covers a typical destination area without being too broad. Contextual placement means the control only appears when relevant — not a permanent UI fixture.

---

### D6: Cluster colour = best availability in group

**Decision:** Cluster badge colour mirrors the carpark marker colour scheme: green if any carpark in the cluster has >10 lots, orange if any has 1–10, red if all are full.

**Why:** Tells the user at a glance whether it's worth zooming into a cluster. A red cluster = don't bother; a green cluster = worth exploring.

## Risks / Trade-offs

- **Geocoding latency** → All place name searches now hit Google Geocoding API. Mitigated by the existing geocoding cache in `geocoding.ts` (frontend). Backend geocoding would need its own cache if moved server-side.
- **Intent detection false positives** → A place like "TP" (Toa Payoh shorthand) could be misclassified as a carpark ID. Mitigated by alias file — add "tp" → "Toa Payoh" as an alias.
- **SVY21 conversion accuracy** → The conversion formula uses published constants from Singapore Land Authority. No library dependency — pure Python math. Risk of formula transcription error; validate against known coordinate pairs.
- **Radius too small returns no results** → If geocoding returns a point that's slightly off, the radius might miss nearby carparks. Mitigated by showing "No carparks found within Xkm — try increasing the radius."

## Migration Plan

1. Regenerate `hdb_carpark_info.json` with SVY21 fields using updated script
2. Deploy backend with new `calculate_distance()` — no API changes, fully backwards compatible
3. Deploy frontend with clustering and radius UI
4. No rollback complexity — distance calculation change is transparent to API consumers
