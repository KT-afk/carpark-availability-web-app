from flask import current_app
import requests
from app import cache  # Import cache from __init__.py


@cache.memoize(timeout=3600)  # Cache for 1hr
def fetch_all_carpark_rates():
    api_url = current_app.config['RATES_API_URL']
    timeout = current_app.config.get('REQUEST_TIMEOUT', 10)
    try:
        response = requests.get(api_url, timeout=timeout)
        data = response.json()
        return data["result"]["records"]
    except requests.RequestException as e:
        raise Exception(f"Failed to fetch carpark rates data: {str(e)}")

def parse_rate(rate_string):
    if not rate_string or rate_string.strip().lower() == "free":
        return "Free"
    
    return rate_string
def match_rate_to_carpark(carpark_name, all_rates):
    carpark = carpark_name.lower()

    for rate in all_rates:
        if rate["carpark"].lower() == carpark:
            return rate
        
    for rate in all_rates:
        if carpark in rate["carpark"] or rate["carpark"].lower() in carpark:
            return rate
        
    return None

def get_rate_for_carpark(carpark):
    all_rates = fetch_all_carpark_rates()
    matched_rate = match_rate_to_carpark(carpark.get("development", ""), all_rates)

    if matched_rate:
        return {
            'weekdays_rate': parse_rate(matched_rate.get('weekdays_rate_1')),
            'saturday_rate': parse_rate(matched_rate.get('saturday_rate')),
            'sunday_rate': parse_rate(matched_rate.get('sunday_publicholiday_rate')),
            'has_rate_info': True
        }
    return {
        'weekdays_rate': None,
        'saturday_rate': None,
        'sunday_rate': None,
        'has_rate_info': False
    }