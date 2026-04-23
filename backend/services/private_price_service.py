from typing import List, Dict, Optional
from datetime import datetime
from schemas.market import AODPPriceData

# ─────────────────────────────────────────────────────────────────────────────
# Store 1: City sell orders (one entry per item+city+quality)
# Key: (item_id, city, quality)
# ─────────────────────────────────────────────────────────────────────────────
_private_store: Dict[tuple, AODPPriceData] = {}

# ─────────────────────────────────────────────────────────────────────────────
# Store 2: BM buy order tiers (separate entry per distinct price tier)
# Key: (item_id, quality, price) → keeps each price tier as its own row
# This is critical because the same item+quality can have multiple price tiers
# Example: Master's Bag Normal @ 49,296 (qty:50) AND @ 60,672 (qty:100)
# ─────────────────────────────────────────────────────────────────────────────
_bm_tiers_store: Dict[tuple, dict] = {}
# Value: {"price": int, "qty": int, "date": str}

def update_private_prices(prices: List[AODPPriceData]):
    """
    Store incoming private city sell price data.
    BM buy orders should go through update_bm_tiers() instead.
    """
    for price in prices:
        price.is_private = True
        # Skip BM buy order entries — they're handled by update_bm_tiers
        if price.city == "Black Market" and price.buy_price_max > 0:
            continue
        key = (price.item_id, price.city, price.quality)
        _private_store[key] = price

def update_bm_tiers(item_id: str, quality: int, price: int, qty: int, date: str):
    """
    Store a single BM buy order price tier.
    Each (item_id, quality, price) gets its own entry.
    """
    key = (item_id, quality, price)
    _bm_tiers_store[key] = {
        "price": price,
        "qty": qty,
        "date": date,
        "item_id": item_id,
        "quality": quality,
    }

def get_bm_tiers(item_id: str, quality: int) -> List[dict]:
    """
    Get all price tiers for a specific item+quality from the BM orders store.
    Returns list sorted by price descending (best deal first).
    """
    results = []
    for (iid, q, price), tier in _bm_tiers_store.items():
        if iid == item_id and q == quality:
            results.append(tier)
    return sorted(results, key=lambda x: x["price"], reverse=True)

def get_all_bm_tier_item_ids() -> List[str]:
    """Return all unique item IDs that have BM tier data."""
    return list({iid for (iid, _, _) in _bm_tiers_store.keys()})

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
    
    merged_map = {}
    
    # Fill with public prices first
    for p in public_prices:
        merged_map[(p.item_id, p.city, p.quality)] = p
        
    # Overwrite with private prices
    for p in private_prices:
        merged_map[(p.item_id, p.city, p.quality)] = p
        
    return list(merged_map.values())
