"""
HDB Carpark Service - Fetches HDB carpark data from data.gov.sg API
"""

import requests
import json
import os
from typing import List, Dict, Optional
from flask import current_app

# Cache for HDB carpark info (static data)
_hdb_info_cache = None

def load_hdb_carpark_info() -> Dict[str, Dict]:
    """Load static HDB carpark information with coordinates from JSON file"""
    global _hdb_info_cache
    
    if _hdb_info_cache is not None:
        return _hdb_info_cache
    
    try:
        json_path = os.path.join(
            os.path.dirname(__file__),
            '../data/hdb_carpark_info.json'
        )
        
        with open(json_path, 'r', encoding='utf-8') as f:
            carparks = json.load(f)
        
        # Convert to dict keyed by car_park_no for fast lookup
        _hdb_info_cache = {cp['car_park_no']: cp for cp in carparks}
        
        current_app.logger.info(f"✅ Loaded {len(_hdb_info_cache)} HDB carpark info records")
        return _hdb_info_cache
        
    except Exception as e:
        current_app.logger.error(f"❌ Failed to load HDB carpark info: {e}")
        return {}

def fetch_hdb_availability() -> Dict[str, Dict]:
    """Fetch live HDB carpark availability from data.gov.sg"""
    
    try:
        api_key = current_app.config.get('DATA_GOV_API_KEY')
        if not api_key:
            current_app.logger.warning("⚠️ DATA_GOV_API_KEY not configured")
            return {}
        
        url = "https://api.data.gov.sg/v1/transport/carpark-availability"
        headers = {"X-Api-Key": api_key}
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Extract carpark items
        items = data.get('items', [])
        if not items:
            current_app.logger.warning("⚠️ No items in HDB availability response")
            return {}
        
        carpark_data = items[0].get('carpark_data', [])
        
        # Convert to dict keyed by carpark_number
        availability = {}
        for cp in carpark_data:
            carpark_no = cp.get('carpark_number')
            if not carpark_no:
                continue
            
            # Get availability for car lots (type 'C')
            carpark_info = cp.get('carpark_info', [])
            total_lots = 0
            lots_available = 0
            
            for info in carpark_info:
                if info.get('lot_type') == 'C':  # Car lots (not motorcycle/heavy)
                    try:
                        total_lots += int(info.get('total_lots', 0))
                        lots_available += int(info.get('lots_available', 0))
                    except (ValueError, TypeError):
                        continue
            
            availability[carpark_no] = {
                'total_lots': total_lots,
                'lots_available': lots_available,
                'update_datetime': cp.get('update_datetime', '')
            }
        
        current_app.logger.info(f"✅ Fetched availability for {len(availability)} HDB carparks")
        return availability
        
    except Exception as e:
        current_app.logger.error(f"❌ Failed to fetch HDB availability: {e}")
        return {}

def get_hdb_carparks() -> List[Dict]:
    """
    Get complete HDB carpark data by merging static info with live availability.
    Returns data in format compatible with LTA API structure.
    """
    
    # Load static info
    carpark_info = load_hdb_carpark_info()
    if not carpark_info:
        return []
    
    # Fetch live availability
    availability = fetch_hdb_availability()
    
    # Merge both datasets
    result = []
    for car_park_no, info in carpark_info.items():
        avail = availability.get(car_park_no, {})
        
        # Convert to LTA-compatible format
        carpark = {
            'CarParkID': car_park_no,
            'Area': _extract_area_from_address(info['address']),
            'Development': info['address'],
            'Address': info['address'],  # Full address for frontend display
            'Location': {
                'Latitude': info['lat'],
                'Longitude': info['lng']
            },
            'AvailableLots': avail.get('lots_available', 0),
            'LotType': 'C',
            'Agency': 'HDB',
            
            # Additional HDB-specific fields
            'CarParkType': info.get('car_park_type', ''),
            'ParkingSystem': info.get('type_of_parking_system', ''),
            'ShortTermParking': info.get('short_term_parking', ''),
            'FreeParking': info.get('free_parking', 'NO'),
            'NightParking': info.get('night_parking', 'NO'),
            'CarParkDecks': info.get('car_park_decks', 0),
            'GantryHeight': info.get('gantry_height', 0),
            'CarParkBasement': info.get('car_park_basement', 'N')
        }
        
        result.append(carpark)
    
    current_app.logger.info(f"✅ Returning {len(result)} HDB carparks")
    return result

def _extract_area_from_address(address: str) -> str:
    """Extract area/neighborhood name from HDB address"""
    
    # Common HDB address patterns:
    # "BLK 270/271 ALBERT CENTRE BASEMENT CAR PARK"
    # "BLOCK 253 ANG MO KIO STREET 22"
    # "BLK 98A ALJUNIED CRESCENT"
    
    address_upper = address.upper()
    
    # Remove common prefixes
    for prefix in ['BLK ', 'BLOCK ', 'BLKS ', 'BLOCKS ']:
        if address_upper.startswith(prefix):
            address_upper = address_upper[len(prefix):]
    
    # Remove block numbers (digits and slashes at start)
    parts = address_upper.split()
    if parts and parts[0].replace('/', '').replace('-', '').isdigit():
        parts = parts[1:]
    
    # Get first 2-3 meaningful words as area
    area_words = []
    for word in parts:
        if word.isdigit() or word in ['STREET', 'AVENUE', 'ROAD', 'CRESCENT', 'DRIVE', 
                                       'LANE', 'CLOSE', 'PARK', 'CAR', 'MULTI-STOREY', 
                                       'BASEMENT', 'SURFACE']:
            break
        area_words.append(word)
        if len(area_words) >= 3:
            break
    
    return ' '.join(area_words) if area_words else 'HDB'
