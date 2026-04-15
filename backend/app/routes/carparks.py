from flask import Blueprint, jsonify, request, current_app

from app.services.carpark_service import fetch_carpark_by_id, get_carparks

carparks_bp = Blueprint('carparks', __name__)

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
    - radius: Radius in metres for place name searches (default 1000)
    """
    search_term = request.args.get('search', '')
    duration = request.args.get('duration', type=float)
    day_type = request.args.get('day_type', 'weekday')
    user_lat = request.args.get('lat', type=float)
    user_lng = request.args.get('lng', type=float)
    radius_m = request.args.get('radius', default=1000, type=int)

    # Special handling for "near me" — treat as empty search with distance sort
    carparks, search_centre = get_carparks(
        search_term, user_lat, user_lng,
        radius_m=radius_m
    )

    # If duration provided, calculate costs using AI (top 10 only)
    if duration and duration > 0:
        try:
            from app.services.ai_rate_calculator import calculate_costs
            carparks = calculate_costs(
                carparks,
                duration_hours=duration,
                day_type=day_type,
                max_calculate=10
            )
        except Exception as e:
            current_app.logger.error(f"AI calculation error: {e}")
            for cp in carparks:
                if 'calculated_cost' not in cp:
                    cp['calculated_cost'] = None
                    cp['cost_breakdown'] = 'AI service unavailable'

    response = {
        'carparks': carparks,
        'search_centre': search_centre,
    }

    return jsonify(response), 200


@carparks_bp.route("/carparks/<carpark_num>", methods=["GET"])
def get_single_carpark(carpark_num):
    """
    Fetch a single carpark by ID with live availability, pricing, and AI cost calculation.

    Query params:
    - duration: Parking duration in hours (default 2)
    - day_type: weekday/saturday/sunday (default "weekday")
    """
    duration = request.args.get('duration', default=2, type=float)
    day_type = request.args.get('day_type', default='weekday', type=str)

    carpark = fetch_carpark_by_id(carpark_num)
    if not carpark:
        return jsonify({'error': 'Carpark not found'}), 404

    if duration and duration > 0:
        try:
            from app.services.ai_rate_calculator import calculate_costs
            results = calculate_costs(
                [carpark],
                duration_hours=duration,
                day_type=day_type,
                max_calculate=1
            )
            carpark = results[0]
        except Exception as e:
            current_app.logger.error(f"AI calculation error: {e}")
            carpark['calculated_cost'] = None
            carpark['cost_breakdown'] = 'Calculation error'

    return jsonify({'carpark': carpark}), 200
