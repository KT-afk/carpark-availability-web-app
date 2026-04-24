import unittest
from unittest.mock import patch

from flask import Flask

from app.services.carpark_service import get_carparks, transform_carpark


class CarparkServiceResilienceTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config["MAX_CARPARKS_RETURN"] = 50
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_transform_carpark_skips_malformed_location_string(self):
        cp = {
            "CarParkID": "A1",
            "Area": "A",
            "Development": "Dev",
            "Location": "bad-location",
            "AvailableLots": 10,
        }
        self.assertIsNone(transform_carpark(cp))

    @patch("app.services.carpark_service.fetch_all_hdb_carparks", return_value=[])
    @patch("app.services.carpark_service.fetch_all_carparks")
    @patch("app.services.carpark_service.geocode_place", return_value=None)
    def test_get_carparks_returns_explicit_error_on_geocode_failure(
        self, _mock_geocode, mock_fetch_lta, _mock_hdb
    ):
        mock_fetch_lta.return_value = [
            {
                "CarParkID": "A1",
                "Area": "A",
                "Development": "Dev",
                "Location": "1.300000 103.800000",
                "LotType": "C",
                "AvailableLots": 10,
            }
        ]

        carparks, search_centre, search_error = get_carparks("punggol", radius_m=2000)
        self.assertEqual(carparks, [])
        self.assertIsNone(search_centre)
        self.assertEqual(search_error, "geocode_unavailable")

    @patch("app.services.carpark_service.fetch_all_hdb_carparks", return_value=[])
    @patch("app.services.carpark_service.fetch_all_carparks")
    @patch("app.services.carpark_service.geocode_place", return_value=(1.400000, 103.900000))
    def test_get_carparks_returns_empty_with_centre_when_radius_has_no_results(
        self, _mock_geocode, mock_fetch_lta, _mock_hdb
    ):
        mock_fetch_lta.return_value = [
            {
                "CarParkID": "A1",
                "Area": "A",
                "Development": "Dev",
                "Location": "1.300000 103.800000",
                "LotType": "C",
                "AvailableLots": 10,
            }
        ]

        carparks, search_centre, search_error = get_carparks("tampines", radius_m=100)
        self.assertEqual(carparks, [])
        self.assertEqual(search_centre, {"lat": 1.4, "lng": 103.9})
        self.assertIsNone(search_error)


if __name__ == "__main__":
    unittest.main()
