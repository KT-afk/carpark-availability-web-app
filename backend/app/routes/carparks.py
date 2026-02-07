from flask import Blueprint, jsonify, request
import math

from app.services.carpark_service import fetch_all_carparks, get_carparks

carparks_bp = Blueprint('carparks', __name__)

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

@carparks_bp.route("/carparks", methods=["GET"])
def search():
    """
    Search carparks with optional AI cost optimization.
    
    Query params:
    - search: Search term for carpark filtering
    - duration: Parking duration in hours (triggers AI calculation)
    - day_type: weekday/saturday/sunday (default: weekday)
    - lat: User latitude (for distance sorting)
    - lng: User longitude (for distance sorting)
    """
    search_term = request.args.get('search', '')
    duration = request.args.get('duration', type=float)
    day_type = request.args.get('day_type', 'weekday')
    user_lat = request.args.get('lat', type=float)
    user_lng = request.args.get('lng', type=float)
    
    # Special handling for "near me" search - treat as empty search with location
    if search_term.lower().strip() == 'near me':
        search_term = ''
    
    # Get carparks (distance-sorted if location provided and no search term)
    carparks = get_carparks(search_term, user_lat, user_lng)
    
    # If user location provided but NOT already sorted (i.e., specific search with location)
    # Add distances but preserve search ranking
    if user_lat is not None and user_lng is not None and search_term and search_term.strip() != '':
        for cp in carparks:
            if 'distance' not in cp:
                cp['distance'] = calculate_distance(
                    user_lat, user_lng,
                    cp['latitude'], cp['longitude']
                )
    
    # If duration provided, calculate costs using AI
    # Only calculate for top 10 to optimize performance
    if duration and duration > 0:
        try:
            from app.services.ai_rate_calculator import get_ai_rate_calculator
            calculator = get_ai_rate_calculator()
            carparks = calculator.calculate_costs(
                carparks, 
                duration_hours=duration,
                day_type=day_type,
                max_calculate=10  # Increased from 5 to 10 for better coverage
            )
        except Exception as e:
            # Log error but return carparks without cost calculation
            print(f"AI calculation error: {e}")
            # Add error flag to response
            for cp in carparks:
                if 'calculated_cost' not in cp:
                    cp['calculated_cost'] = None
                    cp['cost_breakdown'] = 'AI service unavailable'
    
    return jsonify(carparks), 200

    