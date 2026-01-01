from flask import Blueprint, jsonify, request

from app.services.carpark_service import fetch_all_carparks, get_carparks
carparks_bp = Blueprint('carparks', __name__)

@carparks_bp.route("/carparks", methods=["GET"])
def search():
    carpark_number = request.args.get('carpark_number', '')
    if not carpark_number:
        carpark =  fetch_all_carparks()
    else: 
        carpark = get_carparks(carpark_number)
    return jsonify({"carparks": carpark})
    