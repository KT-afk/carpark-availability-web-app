# AI-Powered Carpark Finder

> **Smart parking cost optimization for Singapore** - Find the cheapest carpark for your exact parking duration using AI.

[![Python](https://img.shields.io/badge/Python-3.14-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)](https://www.typescriptlang.org/)
[![AI](https://img.shields.io/badge/AI-Claude%20Haiku-8A2BE2.svg)](https://www.anthropic.com/)

---

## The Problem

Existing carpark apps in Singapore show **rates** OR **availability**, but none calculate the **actual cost** for your specific parking duration. Users waste time manually comparing complex rate structures like "first 2 hrs free, then $3/hr" across multiple carparks.

## The Solution

**AI-powered cost calculator** that:
- Uses **Claude AI** to parse complex rate structures and calculate exact costs
- Shows **real-time availability** from LTA DataMall and HDB APIs
- Sorts carparks by **cheapest option** for your specific duration
- Handles **weekday/Saturday/Sunday** rate variations
- Works as a **Progressive Web App** (installable, offline-capable)

| Feature | This App | Other Apps |
|---------|----------|------------|
| Real-time availability | All carparks (LTA + HDB) | Selected only |
| AI cost calculation | Yes | No |
| Duration-based sorting | Yes | No |
| Favourites | Yes | Some |
| Geocode-first search | Yes | No |
| Radius search with visual overlay | Yes | No |

---

## Features

### AI-Powered Cost Calculation
- **Claude Haiku** parses complex rate structures (e.g. "first X hours free", "per half hour", "weekend rates")
- Shows step-by-step cost breakdown with confidence scoring
- Parallel calculation using ThreadPoolExecutor for fast results
- Results cached in Redis (24h TTL) to reduce API costs

### Location-Aware Search
- **Geocode-first search** — type a place name and the app geocodes it, then searches by radius
- **"Near me" search** — uses GPS to find carparks near your current location
- **Radius selector** — adjust search area (500m / 1km / 1.5km / 2km)
- **Radius circle overlay** — visual blue circle on the map showing the search boundary
- **SVY21 distance calculation** — accurate Singapore-specific projected coordinates

### Interactive Map
- Google Maps with **AdvancedMarker** and **vector maps**
- **Marker clustering** — cluster badge colour reflects best availability in cluster
- **Custom car markers** — colour-coded by availability (green > 10, orange > 0, red = full)
- Pulsing blue dot for user location
- Click carpark marker to open detail panel

### Favourites & Recent Searches
- Star button in search bar to open favourites panel
- **Direct carpark lookup** — tapping a favourite calls `/carparks/<id>` directly (<1s) instead of re-searching (3-4s)
- Map pans to favourite's stored coordinates immediately, before API responds
- Background search populates nearby markers after selection
- Recent searches dropdown when search bar is empty and focused
- All data persisted in localStorage

### Smart Recommendations
- AI-powered carpark suggestions based on availability and pricing
- Time-based pricing alerts for rate changes

### Carpark Detail Panel
- Bottom sheet (mobile) / sidebar (desktop) with slide animation
- Live availability (car, motorcycle, heavy vehicle lots)
- Full pricing table (weekday, Saturday, Sunday rates)
- AI-calculated cost estimate for selected duration
- Reverse geocoded address via backend endpoint
- Favourite toggle

### Duration Selector
- Quick select: 30min, 1hr, 2hrs, 3hrs, 4hrs, 6hrs, 8hrs, 12hrs
- Custom duration input
- Day type toggle: Weekday / Saturday / Sunday

---

## Tech Stack

### Backend
- **Framework:** Flask 3.1 (Python 3.14)
- **AI:** Anthropic Claude Haiku (cost calculation)
- **Caching:** Redis (with SimpleCache fallback)
- **APIs:** LTA DataMall (availability), data.gov.sg via SGData SDK (HDB data), Google Geocoding API
- **Distance:** SVY21 projected coordinates for accurate Singapore distance calculations
- **Deployment:** Render (gunicorn WSGI)

### Frontend
- **Framework:** React 19 + TypeScript 5.9
- **Build:** Vite 7.3
- **Styling:** Tailwind CSS 4.1
- **Maps:** Google Maps (@vis.gl/react-google-maps) with AdvancedMarker
- **Clustering:** @googlemaps/markerclusterer
- **Icons:** Lucide React
- **PWA:** vite-plugin-pwa (Workbox, offline caching)
- **Deployment:** Vercel

### Architecture
```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   React     │─────>│    Flask         │─────>│  LTA DataMall   │
│  Frontend   │      │   Backend        │      │  (Availability) │
│  (Vercel)   │      │   (Render)       │      └─────────────────┘
└─────────────┘      └──────────────────┘      ┌─────────────────┐
                            │                   │  data.gov.sg    │
                     ┌──────┼──────┐            │  (HDB via SDK)  │
                     v      v      v            └─────────────────┘
              ┌──────────┐ ┌─────────┐ ┌──────────────┐
              │Claude API│ │  Redis  │ │ Google Maps  │
              │(Rate Calc)│ │ (Cache) │ │ (Geocoding)  │
              └──────────┘ └─────────┘ └──────────────┘
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/carparks` | GET | Search carparks with AI cost calculation |
| `/carparks/<carpark_num>` | GET | Direct lookup for single carpark |
| `/geocode/reverse` | GET | Reverse geocode coordinates to address |
| `/health` | GET | Health check |

---

## Installation

### Prerequisites
- Python 3.14+
- Node.js 18+
- Anthropic API key ([Get one](https://console.anthropic.com/))
- LTA DataMall API key ([Sign up](https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html))
- Google Maps API key ([Get started](https://developers.google.com/maps))
- Redis (optional, falls back to in-memory cache)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Configure environment variables
cp env.example .env
# Edit .env and add:
# ANTHROPIC_API_KEY=your_key
# GOV_API_KEY=your_lta_key
# GOOGLE_MAPS_API_KEY=your_google_key
# REDIS_URL=redis://localhost:6379 (optional)

python run.py
```

Backend runs on `http://localhost:5001`

### Data Scripts

```bash
cd backend

# Download HDB carpark coordinates (SVY21 -> WGS84 conversion)
python scripts/download_hdb_data.py

# Download carpark rates from data.gov.sg and merge with manual overrides
python scripts/download_carpark_rates.py
```

### Frontend Setup

```bash
cd frontend
npm install

# Configure environment variables
# VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
# VITE_GOOGLE_MAPS_MAP_ID=your_map_id
# VITE_API_URL=http://localhost:5001

npm run dev
```

Frontend runs on `http://localhost:5173`

---

## How the AI Works

Singapore carpark rates come in inconsistent formats:
```
"$2.14 per half hour"
"$1.07 per half hour for the first 3 hours, $2.14 per half hour after"
"$2.00 per hour on weekdays before 6pm, $1.00 per hour after 6pm"
"First 2 hours free, then $3/hr"
```

Claude Haiku parses these with temperature=0 (deterministic math) and returns structured JSON with the calculated cost, breakdown, and confidence level. Results are cached in Redis for 24 hours to minimize API costs.

Calculations run in parallel using ThreadPoolExecutor (up to 5 concurrent API calls), wrapped in Flask app context for thread safety.

---

## License

MIT License

---

## Acknowledgments

- **LTA DataMall** - Real-time carpark availability data
- **Anthropic** - Claude AI API
- **data.gov.sg** - HDB carpark coordinates and rates
- **Google Maps** - Maps, geocoding, and vector tiles
