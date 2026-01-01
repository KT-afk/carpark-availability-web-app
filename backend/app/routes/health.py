from flask import Blueprint, request

health_bp = Blueprint('health', __name__)

@health_bp.route("/health", methods=["GET"])
def health():
    return { "status": "ok" }