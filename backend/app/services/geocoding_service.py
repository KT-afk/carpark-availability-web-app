"""
Server-side geocoding service.
Converts place names and addresses to WGS84 coordinates using Google Geocoding API.
"""

import requests
from typing import Optional, Tuple
from flask import current_app
from app.logging_utils import log_info

# Simple in-process cache for geocoding results
_geocode_cache: dict = {}


def geocode_place(term: str) -> Optional[Tuple[float, float]]:
    """
    Geocode a place name or address to (lat, lng).
    Appends ", Singapore" to bias results to Singapore.

    Returns (lat, lng) tuple or None if geocoding fails.
    """
    cache_key = term.lower().strip()
    if cache_key in _geocode_cache:
        return _geocode_cache[cache_key]

    api_key = current_app.config.get('GOOGLE_MAPS_API_KEY')
    if not api_key:
        current_app.logger.warning("⚠️ GOOGLE_MAPS_API_KEY not configured — geocoding unavailable")
        return None

    query = f"{term.strip()}, Singapore"
    url = "https://maps.googleapis.com/maps/api/geocode/json"

    try:
        response = requests.get(url, params={"address": query, "key": api_key}, timeout=5)
        data = response.json()

        if data.get("status") == "OK" and data.get("results"):
            location = data["results"][0]["geometry"]["location"]
            result = (location["lat"], location["lng"])
            _geocode_cache[cache_key] = result
            log_info(f"📍 Geocoded '{term}' → {result}")
            return result

        current_app.logger.warning(f"⚠️ Geocoding failed for '{term}': {data.get('status')}")
        return None

    except Exception as e:
        current_app.logger.error(f"❌ Geocoding error for '{term}': {e}")
        return None
