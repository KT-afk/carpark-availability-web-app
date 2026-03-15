"""
SVY21 coordinate utilities for Singapore.

SVY21 (EPSG:3414) is Singapore's local projected coordinate system.
Coordinates are in metres (northing, easting) on a flat plane.
At Singapore's scale, distances between SVY21 points can use plain
Pythagorean math with negligible error (<0.02% over 50km).
"""

from math import radians, sin, cos, tan, sqrt


# WGS84 ellipsoid
_a = 6378137.0                  # semi-major axis (m)
_f = 1 / 298.257223563          # flattening
_e2 = 2 * _f - _f * _f         # eccentricity squared
_e2m = _e2 / (1 - _e2)         # second eccentricity squared

# SVY21 / EPSG:3414 Transverse Mercator parameters
_lat0 = radians(1 + 22 / 60 + 2.9983 / 3600)   # 1°22'02.9983"N
_lon0 = radians(103 + 50 / 60)                   # 103°50'00"E
_k0 = 1.0
_E0 = 28001.642   # false easting (m)
_N0 = 38744.572   # false northing (m)


def _meridional_arc(lat: float) -> float:
    """Compute meridional arc M from equator to given latitude (radians)."""
    return _a * (
        (1 - _e2 / 4 - 3 * _e2 ** 2 / 64 - 5 * _e2 ** 3 / 256) * lat
        - (3 * _e2 / 8 + 3 * _e2 ** 2 / 32 + 45 * _e2 ** 3 / 1024) * sin(2 * lat)
        + (15 * _e2 ** 2 / 256 + 45 * _e2 ** 3 / 1024) * sin(4 * lat)
        - (35 * _e2 ** 3 / 3072) * sin(6 * lat)
    )


_M0 = _meridional_arc(_lat0)


def wgs84_to_svy21(lat_deg: float, lng_deg: float) -> tuple:
    """
    Convert WGS84 (lat, lng) in decimal degrees to SVY21 (northing, easting) in metres.

    Returns:
        (northing, easting) tuple, both in metres
    """
    lat = radians(lat_deg)
    lon = radians(lng_deg)

    N = _a / sqrt(1 - _e2 * sin(lat) ** 2)
    T = tan(lat) ** 2
    C = _e2m * cos(lat) ** 2
    A = cos(lat) * (lon - _lon0)
    M = _meridional_arc(lat)

    easting = _E0 + _k0 * N * (
        A
        + (1 - T + C) * A ** 3 / 6
        + (5 - 18 * T + T ** 2 + 72 * C - 58 * _e2m) * A ** 5 / 120
    )

    northing = _N0 + _k0 * (
        M - _M0
        + N * tan(lat) * (
            A ** 2 / 2
            + (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24
            + (61 - 58 * T + T ** 2 + 600 * C - 330 * _e2m) * A ** 6 / 720
        )
    )

    return round(northing, 3), round(easting, 3)


def svy21_distance_km(n1: float, e1: float, n2: float, e2: float) -> float:
    """
    Calculate distance in km between two SVY21 points using Pythagorean formula.
    Valid for Singapore-scale distances (~50km max).
    """
    return sqrt((n2 - n1) ** 2 + (e2 - e1) ** 2) / 1000
