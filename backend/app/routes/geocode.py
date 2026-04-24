from flask import Blueprint, jsonify, request
from app.services.geocoding_service import reverse_geocode_coords

geocode_bp = Blueprint('geocode', __name__)


@geocode_bp.route("/geocode/reverse", methods=["GET"])
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

    result = reverse_geocode_coords(lat, lng)
    return jsonify(result), 200
