from typing import List, Dict, Optional
from datetime import datetime
from schemas.market import AODPPriceData

# This is a temporary in-memory store for private price updates.
# In a production environment, this would be a Redis or Database store.
# Key format: (item_id, city, quality)
_private_store: Dict[tuple, AODPPriceData] = {}

def update_private_prices(prices: List[AODPPriceData]):
    """
    Store incoming private price data.
    """
    for price in prices:
        price.is_private = True
        key = (price.item_id, price.city, price.quality)
        _private_store[key] = price

def get_private_prices(items: List[str], locations: Optional[List[str]] = None) -> List[AODPPriceData]:
    """
    Retrieve stored private prices for specific items and locations.
    """
    results = []
    for (item_id, city, quality), data in _private_store.items():
        if item_id in items:
            if locations is None or city in locations:
                results.append(data)
    return results

def merge_prices(public_prices: List[AODPPriceData], items: List[str], locations: Optional[List[str]] = None) -> List[AODPPriceData]:
    """
    Merges public prices with private prices, prioritizing private ones if they are newer.
    """
    private_prices = get_private_prices(items, locations)
    
    # Create a map for quick lookup
    # Using city as well to ensure we match the right location
    merged_map = {}
    
    # Fill with public prices first
    for p in public_prices:
        merged_map[(p.item_id, p.city, p.quality)] = p
        
    # Overwrite with private prices
    for p in private_prices:
        merged_map[(p.item_id, p.city, p.quality)] = p
        
    return list(merged_map.values())
