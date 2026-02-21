"""
Pricing service for managing carpark rate data.
"""
import json
import logging
import os
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class PricingService:
    """Load and manage carpark pricing data."""
    
    def __init__(self):
        self.pricing_data: Dict[str, Dict] = {}
        self._load_pricing_data()
    
    def _load_pricing_data(self):
        """Load JSON pricing data into memory."""
        json_path = os.path.join(os.path.dirname(__file__), '../data/carpark_rates.json')
        
        try:
            with open(json_path, 'r') as f:
                data = json.load(f)
                for carpark in data['carparks']:
                    carpark_id = self._normalize_carpark_id(carpark['carpark_id'])
                    self.pricing_data[carpark_id] = {
                        'name': carpark['name'],
                        'weekday_rate': carpark.get('weekday_rate', ''),
                        'weekday_rate_after_hours': carpark.get('weekday_rate_after_hours', ''),
                        'saturday_rate': carpark.get('saturday_rate', ''),
                        'sunday_rate': carpark.get('sunday_rate', ''),
                        'note': carpark.get('note', '')
                    }
        except FileNotFoundError:
            logger.error("Pricing data file not found: %s", json_path)
        except json.JSONDecodeError as e:
            logger.error("Failed to parse pricing data file: %s", e)
    
    def _normalize_carpark_id(self, carpark_id: str) -> str:
        """
        Normalize carpark identifiers for fuzzy matching.
        Example: "313@Somerset" -> "313somerset"
        """
        return carpark_id.lower().replace('@', '').replace(' ', '').replace('_', '').strip()
    
    def get_pricing_info(self, carpark_id: str, development_name: str = '') -> Optional[Dict]:
        """
        Get pricing info for a carpark using ID or name matching.
        Automatically detects HDB carparks and applies HDB rates.
        Falls back to default rates if no match found.
        """
        # Check if this is an HDB carpark
        if self._is_hdb_carpark(carpark_id, development_name):
            return self.pricing_data.get('hdb')
        
        # Try exact ID match first
        normalized_id = self._normalize_carpark_id(carpark_id)
        if normalized_id in self.pricing_data:
            return self.pricing_data[normalized_id]
        
        # Try development name match
        if development_name:
            normalized_name = self._normalize_carpark_id(development_name)
            if normalized_name in self.pricing_data:
                return self.pricing_data[normalized_name]
            
            # Try partial match
            for key, value in self.pricing_data.items():
                if normalized_name in key or key in normalized_name:
                    return value
        
        # Return default pricing
        return self.pricing_data.get('default')
    
    def _is_hdb_carpark(self, carpark_id: str, development_name: str = '') -> bool:
        """
        Detect if a carpark is an HDB carpark based on naming patterns.
        HDB carparks typically have:
        - "BLK" or "BLOCK" in development name
        - No specific mall/building name
        - Simple alphanumeric IDs
        """
        dev_upper = development_name.upper() if development_name else ''
        
        # Common HDB patterns
        hdb_indicators = [
            'BLK ',
            'BLOCK ',
            'HDB ',
            'BLK.',
            'BLOCK.',
        ]
        
        # Check if development name starts with HDB indicators
        for indicator in hdb_indicators:
            if dev_upper.startswith(indicator):
                return True
        
        # Check if it contains block number pattern (e.g., "BLK 123")
        if 'BLK ' in dev_upper or 'BLOCK ' in dev_upper:
            return True
        
        return False
    
    def has_pricing(self, carpark_id: str, development_name: str = '') -> bool:
        """Check if pricing data exists for carpark (excluding default)."""
        # HDB carparks have specific pricing
        if self._is_hdb_carpark(carpark_id, development_name):
            return True
        
        pricing = self.get_pricing_info(carpark_id, development_name)
        return pricing is not None and pricing.get('name') != 'Standard Carpark'

# Singleton instance
pricing_service = PricingService()
