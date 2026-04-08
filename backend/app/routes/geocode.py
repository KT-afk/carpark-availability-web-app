from flask import Blueprint, jsonify, request, current_app
import requests
from app import cache

geocode_bp = Blueprint('geocode', __name__)


@geocode_bp.route("/geocode/reverse", methods=["GET"])
@cache.memoize(timeout=604800)
def reverse_geocode():
    """
    Reverse geocode coordinates to address + postal code.

    Query params:
    - lat: Latitude
    - lng: Longitude
    """
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)

    if lat is None or lng is None:
        return jsonify({'error': 'lat and lng are required'}), 400

    api_key = current_app.config.get('GOOGLE_MAPS_API_KEY')
    if not api_key:
        return jsonify({'address': None, 'postalCode': None}), 200

    try:
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        response = requests.get(url, params={
            "latlng": f"{lat},{lng}",
            "key": api_key,
        }, timeout=5)
        data = response.json()

        if data.get("status") == "OK" and data.get("results"):
            address = data["results"][0].get("formatted_address")
            postal_code = None

            for result in data["results"]:
                for component in result.get("address_components", []):
                    if "postal_code" in component.get("types", []):
                        postal_code = component["long_name"]
                        break
                if postal_code:
                    break

            return jsonify({'address': address, 'postalCode': postal_code}), 200

        return jsonify({'address': None, 'postalCode': None}), 200

    except Exception as e:
        current_app.logger.error(f"Reverse geocoding error: {e}")
        return jsonify({'address': None, 'postalCode': None}), 200
