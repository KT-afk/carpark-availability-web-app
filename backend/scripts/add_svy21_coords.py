#!/usr/bin/env python3
"""
One-time script to add SVY21 (northing, easting) fields to hdb_carpark_info.json.
Run from the backend/ directory:
    python3 scripts/add_svy21_coords.py
"""

import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from app.utils.svy21 import wgs84_to_svy21

DATA_PATH = os.path.join(os.path.dirname(__file__), '../app/data/hdb_carpark_info.json')


def main():
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        carparks = json.load(f)

    print(f'Processing {len(carparks)} carparks...')

    for cp in carparks:
        lat = cp.get('lat')
        lng = cp.get('lng')
        if lat is not None and lng is not None:
            northing, easting = wgs84_to_svy21(lat, lng)
            cp['northing'] = northing
            cp['easting'] = easting

    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(carparks, f, indent=2, ensure_ascii=False)

    print(f'Done. Sample record:')
    print(json.dumps(carparks[0], indent=2))


if __name__ == '__main__':
    main()
