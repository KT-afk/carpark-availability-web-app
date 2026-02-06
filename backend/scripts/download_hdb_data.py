#!/usr/bin/env python3
"""
Download HDB carpark information and convert SVY21 to WGS84 coordinates.
"""

import requests
import json
import time
from pyproj import Transformer

# SVY21 to WGS84 transformer
transformer = Transformer.from_crs("EPSG:3414", "EPSG:4326", always_xy=True)

def svy21_to_wgs84(x, y):
    """Convert SVY21 (Singapore) coordinates to WGS84 (lat/lng)"""
    try:
        lng, lat = transformer.transform(float(x), float(y))
        return lat, lng
    except:
        return None, None

def download_hdb_data():
    """Download HDB carpark information from data.gov.sg"""
    
    base_url = "https://data.gov.sg/api/action/datastore_search"
    resource_id = "d_23f946fa557947f93a8043bbef41dd09"
    api_key = "v2:100c0e51083bcdc63c5029596166d96b5e72519b0dfbf3546080f4758872b1fd:5ctQIb0rsUHLVr8xAeSOvtfU60FerKGI"
    
    all_records = []
    offset = 0
    limit = 100  # Fetch 100 at a time to avoid rate limits
    
    print("📥 Downloading HDB carpark data...")
    
    while True:
        url = f"{base_url}?resource_id={resource_id}&limit={limit}&offset={offset}"
        headers = {"X-Api-Key": api_key}
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            if not data.get('success'):
                print(f"❌ API error: {data}")
                break
            
            records = data['result']['records']
            if not records:
                break
                
            all_records.extend(records)
            print(f"  Downloaded {len(all_records)} carparks...")
            
            offset += limit
            time.sleep(0.5)  # Rate limit protection
            
        except Exception as e:
            print(f"❌ Error: {e}")
            break
    
    print(f"✅ Downloaded {len(all_records)} total carparks")
    return all_records

def process_carpark_data(records):
    """Process and convert carpark data"""
    
    processed = []
    skipped = 0
    
    print("🔄 Converting SVY21 to WGS84 coordinates...")
    
    for record in records:
        try:
            x = record.get('x_coord', '')
            y = record.get('y_coord', '')
            
            if not x or not y:
                skipped += 1
                continue
            
            lat, lng = svy21_to_wgs84(x, y)
            
            if lat is None or lng is None:
                skipped += 1
                continue
            
            processed.append({
                'car_park_no': record.get('car_park_no', ''),
                'address': record.get('address', ''),
                'lat': round(lat, 6),
                'lng': round(lng, 6),
                'car_park_type': record.get('car_park_type', ''),
                'type_of_parking_system': record.get('type_of_parking_system', ''),
                'short_term_parking': record.get('short_term_parking', ''),
                'free_parking': record.get('free_parking', ''),
                'night_parking': record.get('night_parking', ''),
                'car_park_decks': record.get('car_park_decks', 0),
                'gantry_height': record.get('gantry_height', 0),
                'car_park_basement': record.get('car_park_basement', 'N')
            })
            
        except Exception as e:
            skipped += 1
            continue
    
    print(f"✅ Processed {len(processed)} carparks (skipped {skipped})")
    return processed

def save_to_json(data, output_path):
    """Save processed data to JSON"""
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Saved to {output_path}")

def main():
    """Main function"""
    
    # Download
    records = download_hdb_data()
    
    if not records:
        print("❌ No data downloaded")
        return
    
    # Process
    processed = process_carpark_data(records)
    
    if not processed:
        print("❌ No data processed")
        return
    
    # Save
    output_path = '../app/data/hdb_carpark_info.json'
    save_to_json(processed, output_path)
    
    # Show sample
    print("\n📊 Sample carpark:")
    print(json.dumps(processed[0], indent=2))
    
    print(f"\n🎉 Done! {len(processed)} HDB carparks ready to use")

if __name__ == '__main__':
    main()
