from flask import current_app
import requests
from app import cache

@cache.memoize(timeout=86400)  # Cache for 24 hours since rates don't change often
def fetch_all_rates():
    """Fetch all parking rates from Singapore government API."""
    try:
        response = requests.get(
            current_app.config['RATES_API_URL'],
            timeout=current_app.config['REQUEST_TIMEOUT']
        )
        response.raise_for_status()
        data = response.json()

        # Create a lookup dictionary by carpark number
        rates_dict = {}
        if 'result' in data and 'records' in data['result']:
            for record in data['result']['records']:
                carpark_num = record.get('car_park_no', '')
                if carpark_num:
                    rates_dict[carpark_num] = {
                        'weekdays_rate': record.get('weekdays_rate_1', ''),
                        'saturday_rate': record.get('saturday_rate', ''),
                        'sunday_rate': record.get('sunday_publicholiday_rate', '')
                    }

        return rates_dict
    except Exception as e:
        current_app.logger.error(f"Error fetching rates: {e}")
        return {}

def get_rate_for_carpark(carpark):
    """Get rate information for a specific carpark."""
    rates_dict = fetch_all_rates()
    carpark_num = carpark.get('CarParkID', '')

    if carpark_num in rates_dict:
        rate_info = rates_dict[carpark_num]
        return {
            'has_rate_info': True,
            'weekdays_rate': rate_info['weekdays_rate'],
            'saturday_rate': rate_info['saturday_rate'],
            'sunday_rate': rate_info['sunday_rate']
        }
    else:
        return {
            'has_rate_info': False,
            'weekdays_rate': None,
            'saturday_rate': None,
            'sunday_rate': None
        }
