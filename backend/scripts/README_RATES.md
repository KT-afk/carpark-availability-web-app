# Carpark Rates Management

## Quick Start

### 1. View carparks needing updates

```bash
cd backend/scripts
python update_carpark_rates.py
```

This shows all 43 carparks marked with "TODO" that need rate updates.

### 2. Update a carpark's rates

```bash
python update_carpark_rates.py <carpark_id> "<weekday_rate>" "<saturday_rate>" "<sunday_rate>" ["<after_hours_rate>"]
```

**Example:**
```bash
python update_carpark_rates.py suntec_city "$2.00 per hour" "$3.00 per hour" "$3.00 per hour"
```

**With after-hours rate:**
```bash
python update_carpark_rates.py paragon "$3.00 per hour" "$4.00 per hour" "$4.00 per hour" "$2.00 per hour after 6pm"
```

### 3. Switch to the expanded rates file

Once you've added rates for at least 10-15 carparks, activate the new file:

```bash
cd backend/app/data
mv carpark_rates.json carpark_rates_old.json
mv carpark_rates_expanded.json carpark_rates.json
```

Then restart your backend server.

---

## Where to Find Carpark Rates

### Method 1: Official Websites (Most Accurate)
Visit the mall/building website and look for "Parking Rates" or "Visitor Information":

- **Example**: https://www.capitaland.com/sg/malls/ionorchard/en/visitors.html

### Method 2: OneMotoring.com.sg (Crowdsourced)
- Go to https://onemotoring.lta.gov.sg/content/onemotoring/home/driving/parking.html
- Search for the carpark
- Rates may be outdated but it's a good starting point

### Method 3: Call the Carpark
- Most malls have parking hotlines
- Quick way to verify current rates

---

## Priority List (Recommended Order)

Start with areas you personally visit often, then expand to popular destinations:

### Tier 1: Your Regular Spots (Priority)
Update carparks YOU use weekly - this makes the app immediately useful to you.

### Tier 2: Major Shopping Malls (15-20 carparks)
- Orchard: Paragon, Ngee Ann City, Wisma Atria
- Marina: Suntec City, Marina Bay Sands, Millenia Walk
- East: Tampines Mall, nex, Bedok Mall
- West: JEM, Westgate, Jurong Point
- North: Causeway Point, Northpoint City

### Tier 3: Tourist Attractions (10 carparks)
- Sentosa, Resorts World Sentosa
- Gardens by the Bay
- Singapore Zoo
- East Coast Park
- Jewel Changi Airport

### Tier 4: Neighborhood Malls (Remaining)
- Update as needed based on user feedback

---

## Rate Format Guidelines

**Keep formats consistent with AI parsing:**

✅ **Good formats:**
- `"$2.00 per hour"`
- `"$1.50 per hour for first 3 hours, $3.00 per hour after"`
- `"$2.14 per half hour"`
- `"Free for first 2 hours, then $1.50 per hour"`

❌ **Avoid:**
- `"2$/hr"` (non-standard symbols)
- `"Varies"` (not calculable)
- `"Call for rates"` (useless for AI)

If rates are complex, just describe them clearly - the AI will figure it out!

---

## Example: Adding Your First 5 Carparks

Let's say you frequent these areas. Here's how to add them:

```bash
# 1. Suntec City (where you work)
python update_carpark_rates.py suntec_city \
  "$2.00 per hour on weekdays before 6pm, $1.00 per hour after" \
  "$2.00 per hour" \
  "$2.00 per hour"

# 2. Tampines Mall (near home)
python update_carpark_rates.py tampines_mall \
  "$1.50 per hour" \
  "$2.00 per hour" \
  "$2.00 per hour"

# 3. Jewel Changi (weekend trips)
python update_carpark_rates.py jewel_changi \
  "$4.00 per hour for first 2 hours, $6.00 per hour after" \
  "$4.00 per hour for first 2 hours, $6.00 per hour after" \
  "$4.00 per hour for first 2 hours, $6.00 per hour after"

# 4. Marina Bay Sands (dinner outings)
python update_carpark_rates.py marina_bay_sands \
  "$4.00 per hour" \
  "$5.00 per hour" \
  "$5.00 per hour"

# 5. East Coast Park (weekend beach)
python update_carpark_rates.py east_coast_park \
  "$1.20 per hour" \
  "$1.20 per hour" \
  "$1.20 per hour"
```

After adding these 5, test your app - you should see accurate prices for these locations!

---

## Testing Your Updates

After updating rates:

1. **Restart backend:**
   ```bash
   cd backend
   python run.py
   ```

2. **Test API:**
   ```bash
   curl "http://localhost:5001/carparks?search=suntec&duration=2&day_type=weekday"
   ```

3. **Check frontend:**
   - Open http://localhost:5173
   - Search for the carpark you updated
   - Verify the calculated cost looks correct

---

## Tips

- **Start small**: Update 5-10 carparks you know well first
- **Verify sources**: Always check official websites for accuracy
- **Test often**: Run the app after every 3-5 updates
- **Set reminders**: Update rates quarterly (parking fees change!)
- **Track progress**: 
  - 10 carparks = Basic coverage
  - 20 carparks = Good coverage
  - 30+ carparks = Excellent coverage

---

## Fallback Behavior

Carparks without specific rates will use the "default" rate:
- Weekday: $1.20/hour
- Weekend: $1.50/hour

The frontend shows: *"Estimated rate - actual may vary"* (you should add this message!)
