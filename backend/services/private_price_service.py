from typing import List, Dict, Optional
from datetime import datetime
from schemas.market import AODPPriceData

# ─────────────────────────────────────────────────────────────────────────────
# Stores are now user-specific
# Structure: { "user_id": { (item_id, city, quality): AODPPriceData } }
# ─────────────────────────────────────────────────────────────────────────────
_private_store: Dict[str, Dict[tuple, AODPPriceData]] = {}
_bm_tiers_store: Dict[str, Dict[tuple, dict]] = {}

def clean_old_data(user_id: str):
    """
    Remove data older than 12 hours from a user's store to prevent memory buildup.
    """
    store = get_user_private_store(user_id)
    bm_store = get_user_bm_tiers_store(user_id)
    now = datetime.utcnow()
    
    # Clean standard prices
    to_delete = []
    for key, data in store.items():
        # Use the most recent update date from the data
        date_str = data.sell_price_min_date or data.buy_price_max_date
        try:
            d = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            if (now.replace(tzinfo=None) - d.replace(tzinfo=None)).total_seconds() > 12 * 3600:
                to_delete.append(key)
        except:
            continue
    for key in to_delete:
        del store[key]

    # Clean BM tiers
    to_delete_bm = []
    for key, tier in bm_store.items():
        try:
            d = datetime.fromisoformat(tier["date"].replace("Z", "+00:00"))
            if (now.replace(tzinfo=None) - d.replace(tzinfo=None)).total_seconds() > 12 * 3600:
                to_delete_bm.append(key)
        except:
            continue
    for key in to_delete_bm:
        del bm_store[key]

def get_user_private_store(user_id: str) -> Dict[tuple, AODPPriceData]:
    if user_id not in _private_store:
        _private_store[user_id] = {}
    return _private_store[user_id]

def get_user_bm_tiers_store(user_id: str) -> Dict[tuple, dict]:
    if user_id not in _bm_tiers_store:
        _bm_tiers_store[user_id] = {}
    return _bm_tiers_store[user_id]

def update_private_prices(prices: List[AODPPriceData], user_id: str = "global"):
    """
    Store incoming private city sell price data for a specific user.
    """
    # Clean old data before adding new one
    clean_old_data(user_id)
    
    store = get_user_private_store(user_id)
    for price in prices:
        price.is_private = True
        key = (price.item_id, price.city, price.quality)
        store[key] = price

def update_bm_tiers(item_id: str, quality: int, price: int, qty: int, date: str, user_id: str = "global"):
    """
    Store a single BM buy order price tier for a specific user.
    """
    # Clean old data before adding new one
    clean_old_data(user_id)
    
    store = get_user_bm_tiers_store(user_id)
    key = (item_id, quality, price)
    store[key] = {
        "price": price,
        "qty": qty,
        "date": date,
        "item_id": item_id,
        "quality": quality,
    }

def get_bm_tiers(item_id: str, quality: int, user_id: str = "global") -> List[dict]:
    """
    Get all price tiers for a specific user.
    """
    store = get_user_bm_tiers_store(user_id)
    results = []
    for (iid, q, price), tier in store.items():
        if iid == item_id and q == quality:
            results.append(tier)
    return sorted(results, key=lambda x: x["price"], reverse=True)

def get_all_bm_tier_item_ids(user_id: str = "global") -> List[str]:
    """Return all unique item IDs for a specific user."""
    store = get_user_bm_tiers_store(user_id)
    return list({iid for (iid, _, _) in store.keys()})

def get_all_private_item_ids(user_id: str = "global") -> List[str]:
    """Return all unique item IDs present in the private store for a user."""
    store = get_user_private_store(user_id)
    return list({iid for (iid, _, _) in store.keys()})

def get_private_prices(items: List[str], locations: Optional[List[str]] = None, user_id: str = "global") -> List[AODPPriceData]:
    """
    Retrieve stored private prices for a specific user.
    """
    store = get_user_private_store(user_id)
    results = []
    for (item_id, city, quality), data in store.items():
        if item_id in items:
            if locations is None or city in locations:
                results.append(data)
    return results

def merge_prices(public_prices: List[AODPPriceData], items: List[str], locations: Optional[List[str]] = None, user_id: str = "global") -> List[AODPPriceData]:
    """
    Merges public prices with private prices of a specific user.
    """
    private_prices = get_private_prices(items, locations, user_id)
    
    merged_map = {}
    for p in public_prices:
        merged_map[(p.item_id, p.city, p.quality)] = p
    for p in private_prices:
        merged_map[(p.item_id, p.city, p.quality)] = p
        
    return list(merged_map.values())
