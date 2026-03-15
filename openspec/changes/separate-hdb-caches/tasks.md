## 1. Cache `fetch_hdb_availability()` independently

- [x] 1.1 Add `from app import cache` import to `hdb_service.py`
- [x] 1.2 Add `@cache.memoize(timeout=120)` decorator to `fetch_hdb_availability()`

## 2. Remove outer cache from `fetch_all_hdb_carparks()`

- [x] 2.1 Remove `@cache.memoize(timeout=300)` decorator from `fetch_all_hdb_carparks()` in `carpark_service.py`

## 3. Update startup warm-up

- [x] 3.1 In `__init__.py`, replace `fetch_all_hdb_carparks` import with `fetch_hdb_availability` in the warm-up block
- [x] 3.2 Call `fetch_hdb_availability()` instead of `fetch_all_hdb_carparks()` during warm-up
