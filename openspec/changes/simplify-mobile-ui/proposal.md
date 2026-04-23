# Simplify Mobile UI

## Problem
The app shows too much information density on mobile, which hurts first impressions. The DurationSelector takes ~120px permanently, and search result items are cluttered with secondary data that competes with the SmartRecommendations cards — the app's headline feature.

## Goal
Make the app feel polished for a LinkedIn audience who will spend ~30 seconds exploring. Smart recommendations should be the obvious star. Controls should get out of the way.

## Scope

### 1. Collapsible DurationSelector (mobile only)
- **Compact bar** (default): `🕐 2 hrs · Weekday ▾` — single row, ~40px
- Tap to expand upward, showing the full selector (all duration buttons + custom input + day type toggle)
- Tap again or tap map to collapse
- **Desktop stays expanded** as-is — no changes
- No "AI-powered" indicator on compact bar

### 2. Simplified Search Result Items
- Each row shows: **favourite star · name · availability dot + count · cost · distance**
- Remove from list items: carpark ID, area label, agency badge (HDB/LTA), bike/heavy vehicle lots, AI confidence label, time-based alert
- All removed info remains in the CarparkPanel detail view (no data loss)
- SmartRecommendation cards stay unchanged — they benefit from the visual contrast

### Out of scope
- Radius option reduction
- First-use prompt/onboarding
- Desktop DurationSelector changes
- SmartRecommendation card redesign
