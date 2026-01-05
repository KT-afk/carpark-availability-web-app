from flask import current_app
import requests
from app import cache  # Import cache from __init__.py


@cache.memoize(timeout=300)  # Cache for 5 minutes
def fetch_all_carparks():
    api_url = current_app.config['GOV_API_URL']
    timeout = current_app.config.get('REQUEST_TIMEOUT', 10)
    try:
        headers = {"AccountKey": current_app.config['GOV_API_KEY']}
        response = requests.get(api_url, timeout=timeout, headers=headers)
        data = response.json()
        return data["value"]
    except requests.RequestException as e:
        raise Exception(f"Failed to fetch carpark data: {str(e)}")
    
def transform_carpark(cp):
    """Transform single carpark to frontend format."""
    return {
        "carpark_num": cp["CarParkID"],
        "area": cp["Area"],
        "development": cp["Development"],
        "car_lots": cp["CarLots"],
        "motorcycle_lots": cp["MotorcycleLots"],
        "heavy_vehicle_lots": cp["HeavyVehicleLots"]
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
    consolidated = {}
    for cp in carparks:
        carpark_id = cp["CarParkID"]
        if carpark_id not in consolidated:
            consolidated[carpark_id] = {
                "CarParkID": cp["CarParkID"],
                "Area": cp["Area"],
                "Development": cp["Development"],
                "CarLots": 0,
                "HeavyVehicleLots": 0,
                "MotorcycleLots": 0
            }
        existing = consolidated[carpark_id]
        if cp["LotType"] == "C":
            existing["CarLots"] += int(cp["AvailableLots"])
        elif cp["LotType"] == "H":
            existing["HeavyVehicleLots"] += int(cp["AvailableLots"])
        elif cp["LotType"] == "M":
            existing["MotorcycleLots"] += int(cp["AvailableLots"])
            
    return list(consolidated.values())
                

def get_carparks(search_term=None):
    max_results = current_app.config['MAX_CARPARKS_RETURN']
    
    # 1. Fetch from API
    all_carparks = fetch_all_carparks()
    
    # 2. Filter
    filtered = filter_carparks(all_carparks, search_term)
    
    consolidated_carparks = consolidate_carparks(filtered)
    # 3. Transform and limit
    transformed = [transform_carpark(cp) for cp in consolidated_carparks[:max_results]]
    
    return transformed

