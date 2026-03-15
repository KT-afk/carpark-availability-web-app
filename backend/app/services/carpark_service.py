from flask import current_app
import requests
from app import cache  # Import cache from __init__.py
from app.services.pricing_service import pricing_service
from app.services.hdb_service import get_hdb_carparks
from app.services.search_service import smart_filter_carparks, detect_search_intent
from app.services.geocoding_service import geocode_place
from app.logging_utils import log_info
from app.utils.svy21 import wgs84_to_svy21, svy21_distance_km


def calculate_distance(n1: float, e1: float, n2: float, e2: float) -> float:
    """Calculate distance in km between two SVY21 points (northing, easting)."""
    return svy21_distance_km(n1, e1, n2, e2)


@cache.memoize(timeout=300)  # Cache for 5 minutes
def fetch_all_carparks():
    """Fetch carparks from LTA API"""
    api_url = current_app.config['GOV_API_URL']
    timeout = current_app.config.get('REQUEST_TIMEOUT', 10)
    try:
        headers = {"AccountKey": current_app.config['GOV_API_KEY']}
        response = requests.get(api_url, timeout=timeout, headers=headers)
        data = response.json()
        return data["value"]
    except requests.RequestException as e:
        raise Exception(f"Failed to fetch carpark data: {str(e)}")

def fetch_all_hdb_carparks():
    """Fetch carparks from HDB API"""
    try:
        return get_hdb_carparks()
    except Exception as e:
        current_app.logger.error(f"Failed to fetch HDB carpark data: {str(e)}")
        return []
    
def transform_carpark(cp):
    """Transform single carpark to frontend format with pricing info."""
    
    # Handle both LTA format (Location as string) and HDB format (Location as dict)
    if isinstance(cp["Location"], str):
        location_str = cp["Location"].strip()
        if not location_str:
            # Skip carparks with empty location
            current_app.logger.warning(f"⚠️ Skipping carpark {cp.get('CarParkID', 'unknown')} with empty location")
            return None
        latitude, longitude = location_str.split()
    else:
        latitude = cp["Location"]["Latitude"]
        longitude = cp["Location"]["Longitude"]
    
    carpark_id = cp["CarParkID"]
    development = cp["Development"]
    
    # Get pricing info
    pricing_info = pricing_service.get_pricing_info(carpark_id, development)
    has_specific_pricing = pricing_service.has_pricing(carpark_id, development)
    
    # Extract address if available (HDB carparks have detailed address info)
    address = cp.get("Address", development)  # Fallback to development name
    
    lat_f = float(latitude)
    lng_f = float(longitude)

    # Use pre-computed SVY21 if available (HDB), otherwise convert now (LTA)
    if "northing" in cp and "easting" in cp:
        northing = cp["northing"]
        easting = cp["easting"]
    else:
        northing, easting = wgs84_to_svy21(lat_f, lng_f)

    return {
        "carpark_num": carpark_id,
        "area": cp["Area"],
        "development": development,
        "address": address,
        "latitude": lat_f,
        "longitude": lng_f,
        "northing": northing,
        "easting": easting,
        "car_lots": cp.get("CarLots", 0),
        "motorcycle_lots": cp.get("MotorcycleLots", 0),
        "heavy_vehicle_lots": cp.get("HeavyVehicleLots", 0),
        "has_pricing": pricing_info is not None,
        "has_specific_pricing": has_specific_pricing,
        "pricing": pricing_info,
        "agency": cp.get("Agency", "LTA")  # Track data source
    }

def filter_by_radius(carparks: list, centre_n: float, centre_e: float, radius_m: float) -> list:
    """Filter transformed carparks to those within radius_m metres of centre (SVY21)."""
    return [
        cp for cp in carparks
        if svy21_distance_km(centre_n, centre_e, cp['northing'], cp['easting']) * 1000 <= radius_m
    ]


def filter_carparks(all_carparks, search_term):
    """Filter carparks by number."""
    search_term = search_term.lower()
    if not search_term:
        return all_carparks
        
    return [
        cp for cp in all_carparks
        if search_term in cp["CarParkID"].lower() or search_term in cp["Area"].lower() or search_term in cp["Development"].lower()
    ]

def consolidate_carparks(carparks):
    """
    Consolidate carparks by ID, summing up available lots by type.
    Preserves input order (important for ranked search results).
    """
    consolidated = {}
    order = []  # Track first appearance order
    
    for cp in carparks:
        carpark_id = cp["CarParkID"]
        if carpark_id not in consolidated:
            consolidated[carpark_id] = {
                "CarParkID": cp["CarParkID"],
                "Area": cp["Area"],
                "Development": cp["Development"],
                "Location": cp["Location"],
                "CarLots": 0,
                "HeavyVehicleLots": 0,
                "MotorcycleLots": 0,
                "Agency": cp.get("Agency", "LTA")
            }
            order.append(carpark_id)  # Remember first appearance order
        
        existing = consolidated[carpark_id]
        
        # Handle LTA format (has LotType field)
        if "LotType" in cp:
            if cp["LotType"] == "C":
                existing["CarLots"] += int(cp.get("AvailableLots", 0))
            elif cp["LotType"] == "H":
                existing["HeavyVehicleLots"] += int(cp.get("AvailableLots", 0))
            elif cp["LotType"] == "M":
                existing["MotorcycleLots"] += int(cp.get("AvailableLots", 0))
        # Handle HDB format (already has aggregated lots)
        else:
            existing["CarLots"] = int(cp.get("AvailableLots", 0))
    
    # Return in original order
    return [consolidated[carpark_id] for carpark_id in order]
                

def get_carparks(search_term=None, user_lat=None, user_lng=None, sort_by_distance=False, radius_m=1000):
    """
    Get carparks from both LTA and HDB sources, merged and filtered.
    Uses smart search with aliases and intelligent ranking.

    Args:
        search_term: Search query (optional)
        user_lat: User latitude for distance-based sorting (optional)
        user_lng: User longitude for distance-based sorting (optional)
        sort_by_distance: Sort results by distance (used for near me)
        radius_m: Radius in metres for place name searches (default 1000m)

    Returns:
        (carparks, search_type, search_centre) tuple:
          - carparks: list of carpark dicts
          - search_type: 'radius' | 'text'
          - search_centre: (lat, lng) centre used for radius search, or None
    """
    max_results = current_app.config['MAX_CARPARKS_RETURN']
    search_type = 'text'
    search_centre = None  # (lat, lng) — set when radius search runs

    # 1. Fetch from BOTH sources
    log_info("🔍 Fetching carparks from LTA and HDB APIs...")

    lta_carparks = []
    hdb_carparks = []

    try:
        lta_carparks = fetch_all_carparks()
        log_info(f"✅ LTA: {len(lta_carparks)} carparks")
    except Exception as e:
        current_app.logger.error(f"❌ LTA fetch failed: {e}")

    try:
        hdb_carparks = fetch_all_hdb_carparks()
        log_info(f"✅ HDB: {len(hdb_carparks)} carparks")
    except Exception as e:
        current_app.logger.error(f"❌ HDB fetch failed: {e}")

    # 2. Merge both lists
    if not search_term or not search_term.strip() or search_term.lower().strip() == 'near me':
        all_carparks = []
        lta_idx, hdb_idx = 0, 0
        while lta_idx < len(lta_carparks) or hdb_idx < len(hdb_carparks):
            if lta_idx < len(lta_carparks):
                all_carparks.append(lta_carparks[lta_idx])
                lta_idx += 1
            for _ in range(2):
                if hdb_idx < len(hdb_carparks):
                    all_carparks.append(hdb_carparks[hdb_idx])
                    hdb_idx += 1
        log_info(f"📊 Interleaved {len(all_carparks)} carparks (LTA+HDB mixed)")
    else:
        all_carparks = lta_carparks + hdb_carparks
        log_info(f"📊 Total: {len(all_carparks)} carparks combined (natural order)")

    # 3. Smart filter with aliases and ranking
    filtered = smart_filter_carparks(all_carparks, search_term or "")

    if search_term and filtered:
        log_info(f"🔝 Top 3 before consolidation: {[cp['Development'] for cp in filtered[:3]]}")

    # 4. Consolidate (sum up lots by carpark ID)
    consolidated_carparks = consolidate_carparks(filtered)

    if search_term and consolidated_carparks:
        log_info(f"🔝 Top 3 after consolidation: {[cp['Development'] for cp in consolidated_carparks[:3]]}")

    # 5. Transform carparks
    transformed = [transform_carpark(cp) for cp in consolidated_carparks]
    transformed = [cp for cp in transformed if cp is not None]

    # 6. Radius search for place name queries
    term = (search_term or '').strip()
    is_near_me = term.lower() == 'near me'
    if term and not is_near_me and detect_search_intent(term) == 'place':
        geocoded = geocode_place(term)
        if geocoded:
            centre_lat, centre_lng = geocoded
            centre_n, centre_e = wgs84_to_svy21(centre_lat, centre_lng)
            # Add distances relative to geocoded centre
            for cp in transformed:
                cp['distance'] = calculate_distance(centre_n, centre_e, cp['northing'], cp['easting'])
            # Filter to radius
            in_radius = filter_by_radius(transformed, centre_n, centre_e, radius_m)
            if in_radius:
                # Sort by distance within radius
                in_radius.sort(key=lambda x: x.get('distance', float('inf')))
                transformed = in_radius
                search_type = 'radius'
                search_centre = {'lat': centre_lat, 'lng': centre_lng}
                log_info(f"📍 Radius search: {len(transformed)} carparks within {radius_m}m of '{term}'")

    # 7. If user location provided (and not already set by radius search), add distance
    if user_lat is not None and user_lng is not None:
        user_n, user_e = wgs84_to_svy21(user_lat, user_lng)
        for cp in transformed:
            if 'distance' not in cp:
                cp['distance'] = calculate_distance(user_n, user_e, cp['northing'], cp['easting'])

        if sort_by_distance:
            transformed.sort(key=lambda x: x.get('distance', float('inf')))
            log_info(f"📍 Distance-sorted {len(transformed)} carparks from user location")
            if transformed:
                closest = transformed[0]
                log_info(f"📍 Closest: {closest['development']} ({closest['distance']:.2f}km)")

    # 8. Limit results
    result = transformed[:max_results]
    log_info(f"📦 Returning {len(result)} carparks (search_type={search_type})")

    return result, search_type, search_centre
