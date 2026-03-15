## REMOVED Requirements

### Requirement: Frontend distance re-sort for near-me searches
**Reason**: The backend is the authoritative owner of distance sorting. The frontend sort was a redundant safeguard duplicating logic already handled server-side.
**Migration**: The backend returns results pre-sorted by distance for "near me" searches with a populated `distance` field. No migration needed — behaviour is identical from the user's perspective.
