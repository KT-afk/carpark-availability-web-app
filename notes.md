# Research Notes: Carpark Finder Project

## Mobile Development Options (Given Limited Mobile Experience)

### Option 1: Progressive Web App (PWA)
**Difficulty**: Easy (you already know React!)
- **Pros**:
  - Use existing React codebase
  - Add manifest.json and service worker
  - Works on both iOS and Android
  - No app store approval needed
  - Can install to home screen
  - Access to geolocation, camera, etc.
- **Cons**:
  - Limited iOS features compared to native
  - No push notifications on iOS (unless iOS 16.4+)
  - Can't access all native features
- **Recommendation**: **Best starting point** - minimal new learning required

### Option 2: React Native with Expo
**Difficulty**: Medium (React knowledge transfers)
- **Pros**:
  - Similar to React (JSX, components, hooks)
  - Expo makes setup easy
  - True native app experience
  - Access to all device features
  - Can publish to app stores
- **Cons**:
  - Need to learn React Native specific components (View, Text instead of div, span)
  - Different navigation paradigm
  - Requires rewriting existing code
  - Testing on physical device recommended
- **Recommendation**: **Good medium-term option** if PWA limitations become an issue

### Option 3: Native (Swift/Kotlin)
**Difficulty**: Hard (completely new languages)
- **Not recommended** given your goals and timeline

## LTA DataMall API - Carpark Rates

### Available Data Sources ✓ RESEARCHED
1. **LTA DataMall Carpark Availability API** (✓ already using)
   - Real-time availability for HDB, LTA, URA carparks
   - Updated every minute
   - FREE to use

2. **Carpark Rates Dataset** (Static, not real-time)
   - Source: [data.gov.sg LTA Carpark Rates](https://data.gov.sg/datasets/d_9f6056bdb6b1dfba57f063593e4f34ae/view)
   - Last updated: November 2018 (⚠️ OUTDATED)
   - Contains rates for major shopping malls, attractions, hotels
   - **Limitation**: Static dataset, not a real-time API

3. **HDB Carpark Information**
   - Source: [data.gov.sg HDB Carpark Info](https://data.gov.sg/datasets/d_23f946fa557947f93a8043bbef41dd09/view)
   - Standard rates: $12/day (non-Central), $20/day (Central Areas)
   - Includes parking system types, operating hours

4. **URA API**
   - Source: [URA API Reference](https://www.ura.gov.sg/maps/api/)
   - Returns season carpark details and rates in JSON
   - Requires AccessKey and daily Token authentication

**Key Finding**: Pricing data exists but is mostly STATIC (not real-time like availability)

## Existing Competitor Solutions ✓ RESEARCHED

### Major Apps in Singapore Market

1. **Parking.sg** (Official Government App)
   - Developer: GovTech Singapore
   - Purpose: Digital parking coupon payment
   - Features:
     - Pay for parking via app (replaces paper coupons)
     - Remote session extension
     - Auto-refund for unused time
     - Expiry notifications
   - Coverage: All non-gantry HDB & URA carparks
   - **Does NOT show availability** - only payment

2. **Parking Singapore** (Android)
   - Real-time availability from URA, HDB, LTA
   - Tap carparks to see availability
   - Android Auto support
   - **Gap**: No iOS version

3. **Parking Singapura** (iOS)
   - Real-time availability from URA, HDB, LTA
   - **UNIQUE**: Only app with CarPlay support
   - iOS exclusive
   - **Gap**: No Android version

4. **Car Parking Lot in Singapore** (iOS)
   - Interactive map
   - Real-time for Malls, HDB, URA
   - Free app
   - **Gap**: Basic features only

5. **Parking@HDB** (Official HDB App)
   - Find HDB carpark locations
   - Check available lots
   - Season parking purchase/renewal
   - **Gap**: HDB only, no URA/LTA data

6. **SG Carparks Availability** (Web)
   - URL: https://sgcarparks.atpeaz.com/
   - Real-time for Malls, HDB, URA
   - Save favorites
   - **Gap**: Web-only, no mobile app

7. **sgCarMart Car Park Rates SG** ⚠️ MAJOR COMPETITOR
   - iOS + Android apps available
   - **700+ carparks** with rates listed
   - Features:
     - Search by GPS location OR building name ✓
     - Real-time availability (selected carparks only)
     - Weekday/weekend, peak/off-peak rate comparison
     - "Nearby Carpark" function to find cheapest
   - **Strengths**:
     - Availability + Pricing combined ✓
     - Name search (not just number) ✓
     - Established brand (sgCarMart has car buying audience)
   - **Gaps/Weaknesses**:
     - Availability only works for "selected carparks" (not comprehensive)
     - User reviews mention limited lot availability feature
     - No smart recommendations (just shows rates)
     - No time-based cost calculator

### Market Gaps Identified (Updated with sgCarMart)

1. **Limited real-time availability**: sgCarMart has pricing but availability only for "selected carparks"
2. **No smart recommendations**: Apps show data, but don't recommend "best for 2 hours"
3. **No price comparison calculator** across nearby carparks with duration input
4. **No time-based cost optimization**: "Cheapest for 2 hours" vs "Cheapest all-day"
5. **Limited context**: No peak hours, reviews, or user tips
6. **Search limitations**: Most apps search by number/location only, not all support name search

## Potential Unique Features

### Ideas to Explore
1. **Real-time availability + pricing in one view** (if competitors don't do this)
2. **Price comparison** across nearby carparks
3. **Time-based recommendations** (cheapest for 2 hours vs all-day parking)
4. **Favorites/Recent searches** for frequent destinations
5. **Navigation integration** (direct link to Google Maps/Waze)
6. **Peak hours visualization** (when carparks are typically full)
7. **Carpark reviews/notes** (user-generated tips like "Level 3 easiest exit")
8. **EV charging availability** (if data available)
9. **Covered vs open-air** indicator
10. **Season parking availability** (if data available)

## Next Steps Research Tasks
- [ ] Search for existing Singapore carpark apps
- [ ] Check LTA DataMall documentation for rate/pricing APIs
- [ ] Identify 2-3 unique features to focus on
- [ ] Decide on PWA vs React Native
