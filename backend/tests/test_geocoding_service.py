import unittest
from unittest.mock import Mock, patch

from flask import Flask

from app import cache
from app.services.geocoding_service import reverse_geocode_coords


class ReverseGeocodeCacheTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config["GOOGLE_MAPS_API_KEY"] = "test-key"
        cache.init_app(
            self.app,
            config={"CACHE_TYPE": "SimpleCache", "CACHE_DEFAULT_TIMEOUT": 300},
        )
        self.ctx = self.app.app_context()
        self.ctx.push()
        cache.clear()

    def tearDown(self):
        cache.clear()
        self.ctx.pop()

    @patch("app.services.geocoding_service.requests.get")
    def test_cache_hit_for_same_coordinates(self, mock_get):
        mock_resp = Mock()
        mock_resp.json.return_value = {
            "status": "OK",
            "results": [
                {
                    "formatted_address": "A",
                    "address_components": [
                        {"types": ["postal_code"], "long_name": "123456"}
                    ],
                }
            ],
        }
        mock_get.return_value = mock_resp

        first = reverse_geocode_coords(1.3, 103.8)
        second = reverse_geocode_coords(1.3, 103.8)

        self.assertEqual(first, second)
        self.assertEqual(mock_get.call_count, 1)

    @patch("app.services.geocoding_service.requests.get")
    def test_cache_isolated_for_distinct_coordinates(self, mock_get):
        mock_resp = Mock()
        mock_resp.json.return_value = {
            "status": "OK",
            "results": [
                {
                    "formatted_address": "B",
                    "address_components": [
                        {"types": ["postal_code"], "long_name": "654321"}
                    ],
                }
            ],
        }
        mock_get.return_value = mock_resp

        reverse_geocode_coords(1.3, 103.8)
        reverse_geocode_coords(1.31, 103.8)

        self.assertEqual(mock_get.call_count, 2)

    def test_schema_stable_when_api_key_missing(self):
        self.app.config["GOOGLE_MAPS_API_KEY"] = ""
        cache.clear()

        result = reverse_geocode_coords(1.3, 103.8)

        self.assertEqual(result, {"address": None, "postalCode": None})


if __name__ == "__main__":
    unittest.main()
