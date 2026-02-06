#!/usr/bin/env python3
"""
Helper script to update carpark rates in the JSON file.
Usage: python update_carpark_rates.py
"""

import json
import sys
from pathlib import Path

# Path to the carpark rates file
RATES_FILE = Path(__file__).parent.parent / "app" / "data" / "carpark_rates_expanded.json"

def load_rates():
    """Load carpark rates from JSON file."""
    with open(RATES_FILE, 'r') as f:
        return json.load(f)

def save_rates(data):
    """Save carpark rates to JSON file."""
    with open(RATES_FILE, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"✅ Saved to {RATES_FILE}")

def list_missing_rates():
    """List all carparks with TODO rates."""
    data = load_rates()
    missing = []
    
    for carpark in data['carparks']:
        if 'TODO' in carpark.get('weekday_rate', ''):
            missing.append({
                'id': carpark['carpark_id'],
                'name': carpark['name'],
                'note': carpark.get('note', '')
            })
    
    return missing

def update_carpark_rate(carpark_id, weekday, saturday, sunday, after_hours=""):
    """Update rates for a specific carpark."""
    data = load_rates()
    
    for carpark in data['carparks']:
        if carpark['carpark_id'] == carpark_id:
            carpark['weekday_rate'] = weekday
            carpark['saturday_rate'] = saturday
            carpark['sunday_rate'] = sunday
            if after_hours:
                carpark['weekday_rate_after_hours'] = after_hours
            
            # Remove TODO from note
            if 'NEEDS RATE UPDATE' in carpark.get('note', ''):
                carpark['note'] = carpark['note'].replace(' - NEEDS RATE UPDATE', '')
            
            save_rates(data)
            print(f"✅ Updated {carpark['name']}")
            return True
    
    print(f"❌ Carpark '{carpark_id}' not found")
    return False

def interactive_update():
    """Interactive mode to update rates."""
    missing = list_missing_rates()
    
    if not missing:
        print("🎉 All carpark rates are up to date!")
        return
    
    print(f"\n📋 Found {len(missing)} carparks needing rate updates:\n")
    
    for i, carpark in enumerate(missing, 1):
        print(f"{i}. {carpark['name']} ({carpark['id']})")
        print(f"   {carpark['note']}\n")
    
    print("\n" + "="*60)
    print("To update a carpark, use:")
    print("  python update_carpark_rates.py <carpark_id> \"<weekday>\" \"<saturday>\" \"<sunday>\" [\"<after_hours>\"]")
    print("\nExample:")
    print('  python update_carpark_rates.py suntec_city "$2.00 per hour" "$3.00 per hour" "$3.00 per hour"')
    print("\nOr run this script and follow the prompts.")
    print("="*60 + "\n")

def main():
    if len(sys.argv) == 1:
        # No arguments - show interactive menu
        interactive_update()
    elif len(sys.argv) >= 5:
        # Update mode: carpark_id weekday saturday sunday [after_hours]
        carpark_id = sys.argv[1]
        weekday = sys.argv[2]
        saturday = sys.argv[3]
        sunday = sys.argv[4]
        after_hours = sys.argv[5] if len(sys.argv) > 5 else ""
        
        update_carpark_rate(carpark_id, weekday, saturday, sunday, after_hours)
    else:
        print("Usage:")
        print("  python update_carpark_rates.py                              # List missing rates")
        print('  python update_carpark_rates.py <id> "<weekday>" "<sat>" "<sun>" ["<after>"]')

if __name__ == "__main__":
    main()
