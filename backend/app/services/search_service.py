"""
Smart Search Service - Handles mall aliases, fuzzy matching, and intelligent ranking
"""

import json
import os
from typing import List, Dict, Tuple
from flask import current_app

# Cache for search aliases
_search_aliases = None
_popular_locations = None

def load_search_config():
    """Load search aliases and popular locations from JSON"""
    global _search_aliases, _popular_locations
    
    if _search_aliases is not None:
        return _search_aliases, _popular_locations
    
    try:
        json_path = os.path.join(
            os.path.dirname(__file__),
            '../data/search_aliases.json'
        )
        
        with open(json_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        _search_aliases = config.get('mall_aliases', {})
        _popular_locations = set(config.get('popular_locations', []))
        
        current_app.logger.info(f"✅ Loaded {len(_search_aliases)} search aliases")
        return _search_aliases, _popular_locations
        
    except Exception as e:
        current_app.logger.error(f"❌ Failed to load search config: {e}")
        return {}, set()

def expand_search_term(search_term: str) -> List[str]:
    """
    Expand search term with aliases.
    Example: "ion" -> ["ion", "ION Orchard", "ION ORCHARD"]
    """
    aliases, _ = load_search_config()
    
    search_lower = search_term.lower().strip()
    
    # Start with original term
    expanded = [search_term]
    
    # Add aliases if found
    if search_lower in aliases:
        expanded.extend(aliases[search_lower])
    
    return expanded

def match_score(carpark: Dict, search_terms: List[str]) -> Tuple[int, int]:
    """
    Calculate match score for a carpark.
    Returns (priority, score) tuple for sorting.
    
    Priority levels:
    0 = Exact match on alias (e.g. "ion" -> "ION Orchard") - HIGHEST
    1 = Exact match on popular location name
    2 = Development starts with search term (popular location)
    3 = Contains search term in popular location
    4 = Exact match on development name
    5 = Development starts with search term
    6 = Contains search term in development name
    7 = Match in area name
    8 = Match in carpark ID (lowest)
    """
    
    aliases, popular_locations = load_search_config()
    
    carpark_id = carpark.get("CarParkID", "").lower()
    area = carpark.get("Area", "").lower()
    development = carpark.get("Development", "").lower()
    
    # Check if this is a popular location
    is_popular = any(
        loc.lower() in development 
        for loc in popular_locations
    )
    
    best_priority = 999
    best_score = 0
    
    # Track if this is an alias expansion match
    original_term = search_terms[0] if search_terms else ""
    alias_matches = search_terms[1:] if len(search_terms) > 1 else []
    
    for term in search_terms:
        term_lower = term.lower()
        is_alias = term in alias_matches
        
        # PRIORITY 0: Exact alias match (e.g., user typed "ion", this is "ION Orchard")
        if is_alias and term_lower == development:
            priority = 0
            score = 10000
        # PRIORITY 1: Exact match on development name (popular location)
        elif term_lower == development and is_popular:
            priority = 1
            score = 5000
        # PRIORITY 2: Development starts with alias term (popular)
        elif is_alias and development.startswith(term_lower) and is_popular:
            priority = 2
            score = 4000
        # PRIORITY 3: Alias term contained in popular location
        elif is_alias and term_lower in development and is_popular:
            priority = 3
            score = 3000
        # PRIORITY 4: Exact match on development name (non-popular)
        elif term_lower == development:
            priority = 4
            score = 2000
        # PRIORITY 5: Development starts with term (non-popular)
        elif development.startswith(term_lower):
            priority = 5
            score = 1500
        # PRIORITY 6: Word boundary match (e.g. "ion" matches "ION Orchard" but not "ZION")
        elif f" {term_lower} " in f" {development} " or development.startswith(term_lower + " "):
            priority = 3 if is_popular else 6
            score = 1200
        # PRIORITY 7: Contains term in development (lower priority to avoid false matches like "zion")
        elif term_lower in development:
            # Heavy penalty if it's just a substring in the middle of a word
            if len(term_lower) <= 3:  # Short terms like "ion" get lower score for substring matches
                priority = 7
                score = 300
            else:
                priority = 6
                score = 1000
        # PRIORITY 7: Match in area
        elif term_lower in area:
            priority = 7
            score = 500
        # PRIORITY 8: Match in carpark ID
        elif term_lower in carpark_id:
            priority = 8
            score = 300
        else:
            continue
        
        # Keep the best match
        if priority < best_priority or (priority == best_priority and score > best_score):
            best_priority = priority
            best_score = score
    
    # Boost score for popular locations (but preserve priority ordering)
    if is_popular and best_score > 0:
        best_score += 100
    
    # No match found
    if best_priority == 999:
        return (999, 0)
    
    return (best_priority, best_score)

def smart_filter_carparks(all_carparks: List[Dict], search_term: str) -> List[Dict]:
    """
    Filter and rank carparks using smart search with aliases and ranking.
    """
    
    if not search_term or not search_term.strip():
        return all_carparks
    
    # Expand search term with aliases
    search_terms = expand_search_term(search_term)
    current_app.logger.info(f"🔍 Expanded '{search_term}' to: {search_terms}")
    
    # Score all carparks
    scored_carparks = []
    for cp in all_carparks:
        priority, score = match_score(cp, search_terms)
        if score > 0:  # Only include matches
            scored_carparks.append((priority, score, cp))
    
    # Sort by priority (lower is better), then by score (higher is better)
    scored_carparks.sort(key=lambda x: (x[0], -x[1]))
    
    # Extract just the carparks
    filtered = [cp for _, _, cp in scored_carparks]
    
    current_app.logger.info(
        f"✅ Smart filter: {len(filtered)} matches for '{search_term}' "
        f"(top match: {filtered[0]['Development'] if filtered else 'none'})"
    )
    
    return filtered
