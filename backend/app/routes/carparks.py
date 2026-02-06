from flask import Blueprint, jsonify, request

from app.services.carpark_service import fetch_all_carparks, get_carparks

carparks_bp = Blueprint('carparks', __name__)

@carparks_bp.route("/carparks", methods=["GET"])
def search():
    """
    Search carparks with optional AI cost optimization.
    
    Query params:
    - search: Search term for carpark filtering
    - duration: Parking duration in hours (triggers AI calculation)
    - day_type: weekday/saturday/sunday (default: weekday)
    """
    search_term = request.args.get('search', '')
    duration = request.args.get('duration', type=float)
    day_type = request.args.get('day_type', 'weekday')
    
    # Special handling for "near me" search - return all carparks
    # Frontend will sort by distance
    if search_term.lower().strip() == 'near me':
        search_term = ''
    
    # Get basic carpark data
    carparks = get_carparks(search_term)
    
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

    