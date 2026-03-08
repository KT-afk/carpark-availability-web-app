#!/usr/bin/env python3
"""
Download carpark rates from data.gov.sg and merge with existing manual rates.
Manual entries take priority over downloaded data for matching carparks.
"""

import requests
import json
import re
import time
import os

def normalize_id(name):
    """Normalize a carpark name into a consistent ID for matching."""
    s = name.lower().strip()
    s = re.sub(r'[^a-z0-9\s]', '', s)
    s = re.sub(r'\s+', '_', s)
    return s

def download_rates():
    """Download carpark rates from data.gov.sg"""
    base_url = "https://data.gov.sg/api/action/datastore_search"
    resource_id = "d_9f6056bdb6b1dfba57f063593e4f34ae"

    all_records = []
    offset = 0
    limit = 100

    print("Downloading carpark rates from data.gov.sg...")

    while True:
        url = f"{base_url}?resource_id={resource_id}&limit={limit}&offset={offset}"

        try:
            response = requests.get(url)

            if response.status_code == 429:
                print("  Rate limited, waiting 5s...")
                time.sleep(5)
                continue

            response.raise_for_status()
            data = response.json()

            if not data.get('success'):
                print(f"API error: {data}")
                break

            records = data['result']['records']
            if not records:
                break

            all_records.extend(records)
            print(f"  Downloaded {len(all_records)} records...")

            offset += limit
            time.sleep(2)

        except Exception as e:
            print(f"Error: {e}")
            break

    print(f"Downloaded {len(all_records)} total records")
    return all_records

def convert_record(record):
    """Convert a data.gov.sg record to our carpark_rates.json format."""
    name = record.get('carpark', '').strip()
    if not name:
        return None

    return {
        'carpark_id': normalize_id(name),
        'name': name,
        'weekday_rate': record.get('weekdays_rate_1', '').strip(),
        'weekday_rate_after_hours': record.get('weekdays_rate_2', '').strip(),
        'saturday_rate': record.get('saturday_rate', '').strip(),
        'sunday_rate': record.get('sunday_publicholiday_rate', '').strip(),
        'note': record.get('category', '').strip()
    }

def load_manual_rates(path):
    """Load existing manual carpark rates."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get('carparks', [])
    except FileNotFoundError:
        return []

def merge_rates(downloaded, manual):
    """Merge downloaded and manual rates. Manual entries take priority."""
    # Index manual entries by carpark_id
    manual_by_id = {entry['carpark_id']: entry for entry in manual}

    # Also index by normalized name for fuzzy matching
    manual_by_name = {}
    for entry in manual:
        key = normalize_id(entry.get('name', ''))
        if key:
            manual_by_name[key] = entry

    merged = {}

    # Add all downloaded entries first
    for record in downloaded:
        converted = convert_record(record)
        if converted:
            cid = converted['carpark_id']
            # Skip if we already have this (dedup within downloaded data)
            if cid not in merged:
                merged[cid] = converted

    # Overlay manual entries (they take priority)
    for entry in manual:
        cid = entry['carpark_id']
        merged[cid] = entry

    result = sorted(merged.values(), key=lambda x: x['name'].lower())
    return result

def main():
    # Resolve paths relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, '..', 'app', 'data', 'carpark_rates.json')

    # Download from data.gov.sg
    records = download_rates()
    if not records:
        print("No data downloaded")
        return

    # Load existing manual rates
    manual = load_manual_rates(output_path)
    print(f"Loaded {len(manual)} existing manual entries")

    # Merge
    merged = merge_rates(records, manual)
    print(f"Merged result: {len(merged)} carparks")

    # Save
    output = {'carparks': merged}
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"Saved to {output_path}")

    # Stats
    manual_ids = {e['carpark_id'] for e in manual}
    from_gov = sum(1 for e in merged if e['carpark_id'] not in manual_ids)
    print(f"\n  From data.gov.sg: {from_gov}")
    print(f"  From manual data: {len(manual_ids)}")
    print(f"  Total: {len(merged)}")

if __name__ == '__main__':
    main()
