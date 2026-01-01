from flask import current_app
import requests


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
        "lot_type": cp["LotType"],
        "lots_available": cp["AvailableLots"],
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
    
def get_carparks(search_term=None):
    max_results = current_app.config['MAX_CARPARKS_RETURN']
    
    # 1. Fetch from API
    all_carparks = fetch_all_carparks()
    
    # 2. Filter
    filtered = filter_carparks(all_carparks, search_term)
    
    # 3. Transform and limit
    transformed = [transform_carpark(cp) for cp in filtered[:max_results]]
    
    return transformed

