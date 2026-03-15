## ADDED Requirements

### Requirement: Nearby markers cluster at low zoom levels
The map SHALL group nearby carpark markers into cluster badges when the map zoom level is low enough that individual markers would overlap. Clustering SHALL use `MarkerClusterer` from `@vis.gl/react-google-maps`.

#### Scenario: Markers cluster at low zoom
- **WHEN** map zoom level is below threshold (approximately zoom 14)
- **THEN** nearby markers SHALL be replaced by a single cluster badge showing count

#### Scenario: Markers expand at high zoom
- **WHEN** user zooms in past the threshold
- **THEN** cluster SHALL split into individual carpark markers

### Requirement: Cluster badge colour reflects best availability in group
The cluster badge SHALL use the same colour scheme as individual markers, reflecting the best availability of any carpark in the cluster.

#### Scenario: Cluster contains at least one available carpark
- **WHEN** any carpark in the cluster has car_lots > 10
- **THEN** cluster badge SHALL be green

#### Scenario: Cluster contains low availability
- **WHEN** no carpark has >10 lots but at least one has 1–10 lots
- **THEN** cluster badge SHALL be orange

#### Scenario: All carparks in cluster are full
- **WHEN** all carparks in the cluster have car_lots === 0
- **THEN** cluster badge SHALL be red

### Requirement: Selected carpark marker never clusters
The currently selected carpark marker SHALL always render as an individual marker regardless of zoom level, so the user does not lose sight of their selection.

#### Scenario: Selected marker stays visible when zoomed out
- **WHEN** a carpark is selected and user zooms out
- **THEN** selected carpark marker SHALL remain visible as an individual marker
- **AND** SHALL NOT be absorbed into a cluster
