from flask import current_app
import requests
from app import cache  # Import cache from __init__.py
from app.services.pricing_service import pricing_service
from app.services.hdb_service import get_hdb_carparks
from app.services.search_service import smart_filter_carparks
from app.logging_utils import log_info


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

@cache.memoize(timeout=300)  # Cache for 5 minutes  
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
    
    return {
        "carpark_num": carpark_id,
        "area": cp["Area"],
        "development": development,
        "address": address,
        "latitude": float(latitude),
        "longitude": float(longitude),
        "car_lots": cp.get("CarLots", 0),
        "motorcycle_lots": cp.get("MotorcycleLots", 0),
        "heavy_vehicle_lots": cp.get("HeavyVehicleLots", 0),
        "has_pricing": pricing_info is not None,
        "has_specific_pricing": has_specific_pricing,
        "pricing": pricing_info,
        "agency": cp.get("Agency", "LTA")  # Track data source
    }

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
                

def get_carparks(search_term=None, user_lat=None, user_lng=None, sort_by_distance=False):
    """
    Get carparks from both LTA and HDB sources, merged and filtered.
    Uses smart search with aliases and intelligent ranking.
    
    Args:
        search_term: Search query (optional)
        user_lat: User latitude for distance-based sorting (optional)
        user_lng: User longitude for distance-based sorting (optional)
    
    Returns:
        List of carparks, optionally sorted by distance if location provided
    """
    from math import radians, sin, cos, sqrt, atan2
    
    def calculate_distance(lat1, lon1, lat2, lon2):
        """Calculate distance using Haversine formula"""
        R = 6371  # Earth radius in km
        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        return R * c
    
    max_results = current_app.config['MAX_CARPARKS_RETURN']
    
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
    # For empty/near me searches, interleave LTA and HDB to ensure both appear in top results
    # For specific searches, keep natural order (search ranking matters)
    if not search_term or not search_term.strip() or search_term.lower().strip() == 'near me':
        # Interleave: alternate between LTA and HDB carparks
        all_carparks = []
        lta_idx, hdb_idx = 0, 0
        while lta_idx < len(lta_carparks) or hdb_idx < len(hdb_carparks):
            # Add 1 LTA
            if lta_idx < len(lta_carparks):
                all_carparks.append(lta_carparks[lta_idx])
                lta_idx += 1
            # Add 2 HDB (since there are many more HDB carparks)
            for _ in range(2):
                if hdb_idx < len(hdb_carparks):
                    all_carparks.append(hdb_carparks[hdb_idx])
                    hdb_idx += 1
        log_info(f"📊 Interleaved {len(all_carparks)} carparks (LTA+HDB mixed)")
    else:
        # Keep natural order for specific searches (relevance matters)
        all_carparks = lta_carparks + hdb_carparks
        log_info(f"📊 Total: {len(all_carparks)} carparks combined (natural order)")
    
    # 3. Smart filter with aliases and ranking
    filtered = smart_filter_carparks(all_carparks, search_term or "")
    
    # Log top 3 before consolidation
    if search_term and filtered:
        log_info(
            f"🔝 Top 3 before consolidation: {[cp['Development'] for cp in filtered[:3]]}"
        )
    
    # 4. Consolidate (sum up lots by carpark ID)
    consolidated_carparks = consolidate_carparks(filtered)
    
    # Log top 3 after consolidation
    if search_term and consolidated_carparks:
        log_info(
            f"🔝 Top 3 after consolidation: {[cp['Development'] for cp in consolidated_carparks[:3]]}"
        )
    
    # 5. Transform carparks
    transformed = [transform_carpark(cp) for cp in consolidated_carparks]
    transformed = [cp for cp in transformed if cp is not None]
    
    # 6. If user location provided, add distance (and optionally sort)
    if user_lat is not None and user_lng is not None:
        # Add distance to all carparks
        for cp in transformed:
            cp['distance'] = calculate_distance(
                user_lat, user_lng,
                cp['latitude'], cp['longitude']
            )
        
        if sort_by_distance:
            # Sort by distance (closest first)
            transformed.sort(key=lambda x: x.get('distance', float('inf')))
            log_info(f"📍 Distance-sorted {len(transformed)} carparks from user location")
            
            # Log closest carpark
            if transformed:
                closest = transformed[0]
                log_info(
                    f"📍 Closest: {closest['development']} ({closest['distance']:.2f}km)"
                )
    
    # 7. Limit results
    result = transformed[:max_results]
    log_info(f"📦 Returning {len(result)} carparks")
    
    return result
