from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional
from schemas.market import FlipperRequest, FlipperResponse, ArbitrageOpportunity
from services.aodp_client import fetch_prices
from services.private_price_service import merge_prices, get_bm_tiers, get_all_bm_tier_item_ids, get_all_private_item_ids
from core.albion_math import calculate_profit

router = APIRouter()

@router.post("/flipper", response_model=FlipperResponse)
async def get_black_market_flips(request: FlipperRequest, x_user_id: Optional[str] = Header(None)):
    """
    Find arbitrage opportunities between Royal Cities and the Black Market.
    """
    user_id = x_user_id or "global"
    tax_rate = 0.04 if request.has_premium else 0.08
    # Combine target locations
    all_locations = request.royal_cities + [request.target_city]
    
    # Expand items list with items the user has actually scanned privately
    # This allows items outside the DEFAULT_ITEMS to show up if the user scans them.
    # Expand items list with items the user has actually scanned privately
    private_item_ids = get_all_private_item_ids(user_id=user_id)
    combined_items = list(set(request.items + private_item_ids + get_all_bm_tier_item_ids(user_id=user_id)))
    
    # --- SMART FILTERING OPTIMIZATION ---
    # Only fetch from AODP the items we DON'T have fresh private data for.
    from services.private_price_service import get_fresh_private_item_ids
    
    fresh_private_item_ids = get_fresh_private_item_ids(user_id, combined_items, minutes=30)
    items_to_fetch_publicly = [i for i in combined_items if i not in fresh_private_item_ids]

    try:
        # Fetch ONLY what we don't have privately
        public_data = await fetch_prices(items_to_fetch_publicly, all_locations)
        # Merge with private data (this will include the skipped items)
        raw_data = merge_prices(public_data, combined_items, all_locations, user_id=user_id)
    except Exception as e:
        print(f"Error in smart fetch: {e}")
        # Fallback to merge even if public fetch failed
        raw_data = merge_prices([], combined_items, all_locations, user_id=user_id)
        
    # Group data by item_id and quality
    item_quality_map = {}
    for entry in raw_data:
        key = (entry.item_id, entry.quality)
        if key not in item_quality_map:
            item_quality_map[key] = {"royal_cities": [], "black_market": None}
            
        if entry.city == request.target_city:
            item_quality_map[key]["black_market"] = entry
        elif entry.city in request.royal_cities:
            item_quality_map[key]["royal_cities"].append(entry)
            
    opportunities = []
    
    from datetime import datetime, timezone

    def parse_date(date_str: str):
        try:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except:
            return None

    def is_fresh(date_str: str, max_hours: int = 24) -> bool:
        """Returns True if date is within max_hours from now."""
        d = parse_date(date_str)
        if d is None:
            return False
        now = datetime.now(timezone.utc)
        if d.tzinfo is None:
            d = d.replace(tzinfo=timezone.utc)
        return (now - d).total_seconds() < max_hours * 3600

    def get_best_bm_sell_target(bm_data) -> tuple:
        """
        Returns (sell_price, sell_price_min, date).
        For private data: sell_price = buy_price_min (conservative, most orders fill here).
        For public data: sell_price = buy_price_max (only value available).
        Private data bypasses the freshness check entirely.
        """
        bp_max = bm_data.buy_price_max
        bp_min = bm_data.buy_price_min if bm_data.buy_price_min > 0 else bp_max
        bp_max_date = bm_data.buy_price_max_date

        if bm_data.is_private:
            # Use min price for profit calculation (most realistic for bulk selling)
            # but also return max so UI can show "X → Y" range
            if bp_min > 0:
                return bp_min, bp_max, bp_max_date
            return 0, 0, bp_max_date

        # Public data: only max is meaningful, allow data up to 24 hours old
        if bp_max > 0 and is_fresh(bp_max_date, max_hours=24):
            return bp_max, bp_max, bp_max_date

        return 0, 0, bp_max_date

    # Calculate arbitrage
    for (item_id, quality), locations in item_quality_map.items():
        bm_data = locations["black_market"]
        city_data_list = locations["royal_cities"]
        
        if not bm_data or not city_data_list:
            continue

        bm_price, bm_price_max, bm_date = get_best_bm_sell_target(bm_data)

        # Skip if BM price is stale or missing
        if bm_price <= 0:
            continue
            
        # We want to buy from a Royal City using its Sell Order (sell_price_min)
        for city_data in city_data_list:
            city_sell_price = city_data.sell_price_min
            city_date = city_data.sell_price_min_date

            if city_sell_price <= 0:
                continue

            # Skip if city sell price data is stale (> 6 hours) for non-private data
            if not city_data.is_private and not is_fresh(city_date, max_hours=6):
                continue

            # Sanity check removed as per user request to allow ultra deals
            if False: 
                print(f"[SANITY SKIP] {item_id} Q{quality}: BM={bm_price_max} vs City={city_sell_price} — ratio too high")
                continue
                
            # Calculate profit using the MAX (best) BM price — this is the real opportunity
            # The min price is stored separately for UI display as a "range warning"
            profit_data = calculate_profit(
                buy_price=city_sell_price,
                sale_price=bm_price_max,
                direct_sell=True,
                tax_rate=tax_rate
            )

            # ROI check removed as per user request
            if False:
                print(f"[SANITY SKIP] {item_id} Q{quality}: ROI={profit_data['roi_percentage']:.1f}% — too high")
                continue
            
            # Only include profitable flips (based on max/best price)
            if profit_data["profit"] > 0:
                opportunities.append(
                    ArbitrageOpportunity(
                        item_id=item_id,
                        quality=quality,
                        buy_from_city=city_data.city,
                        buy_price=city_sell_price,
                        sell_to_city=request.target_city,
                        sell_price=bm_price_max,       # Best price (used for profit calc & display)
                        sell_price_max=bm_price_max,   # Same — kept for future range UI
                        net_revenue=profit_data["net_revenue"],
                        profit=profit_data["profit"],
                        roi_percentage=profit_data["roi_percentage"],
                        buy_price_date=city_date,
                        sell_price_date=bm_date,
                        demand=bm_data.buy_price_max_quantity,
                        is_private=city_data.is_private or bm_data.is_private
                    )
                )

    # ── PHASE 2: Private BM tiers → one opportunity per distinct price tier ──
    # This ensures items like "Master's Bag Normal @ 49k (qty:50)" and 
    # "Master's Bag Normal @ 61k (qty:115)" appear as SEPARATE rows
    
    # Collect all city sell data from private store for lookup
    city_sell_map = {}  # (item_id, city, quality) → city_data
    for entry in raw_data:
        if entry.city != "Black Market" and entry.sell_price_min > 0:
            city_sell_map[(entry.item_id, entry.city, entry.quality)] = entry

    tier_item_ids = get_all_bm_tier_item_ids(user_id=user_id)
    processed_tier_keys = set()  # track (item_id, quality, price) to avoid duplicates

    for (item_id, quality), locations in item_quality_map.items():
        if item_id not in tier_item_ids:
            continue
        
        tiers = get_bm_tiers(item_id, quality, user_id=user_id)  # sorted by price desc
        if not tiers:
            continue

        city_data_list = locations["royal_cities"]
        if not city_data_list:
            continue

        for tier in tiers:
            tier_price = tier["price"]
            tier_qty = tier["qty"]
            tier_date = tier["date"]
            tier_key = (item_id, quality, tier_price)
            
            if tier_key in processed_tier_keys:
                continue
            processed_tier_keys.add(tier_key)

            # Find cheapest city source for this item+quality
            for city_data in city_data_list:
                city_sell_price = city_data.sell_price_min
                city_date = city_data.sell_price_min_date
                
                if city_sell_price <= 0:
                    continue
                if not city_data.is_private and not is_fresh(city_date, max_hours=6):
                    continue
                    
                profit_data = calculate_profit(
                    buy_price=city_sell_price,
                    sale_price=tier_price,
                    direct_sell=True,
                    tax_rate=tax_rate
                )
                
                if profit_data["profit"] > 0:
                    opportunities.append(
                        ArbitrageOpportunity(
                            item_id=item_id,
                            quality=quality,
                            buy_from_city=city_data.city,
                            buy_price=city_sell_price,
                            sell_to_city=request.target_city,
                            sell_price=tier_price,
                            sell_price_max=tier_price,
                            net_revenue=profit_data["net_revenue"],
                            profit=profit_data["profit"],
                            roi_percentage=profit_data["roi_percentage"],
                            buy_price_date=city_date,
                            sell_price_date=tier_date,
                            demand=tier_qty,     # Exact qty at THIS price tier
                            is_private=True
                        )
                    )
                    break  # Use cheapest city only, avoid duplicates per city

    # Sort opportunities by profit descending
    opportunities.sort(key=lambda x: x.profit, reverse=True)
    
    return FlipperResponse(opportunities=opportunities)

@router.delete("/clear")
async def clear_private_market(x_user_id: Optional[str] = Header(None)):
    """
    Clears all private market data for the current user.
    """
    from services.private_price_service import clear_all_private_data
    user_id = x_user_id or "global"
    success = clear_all_private_data(user_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to clear market data.")
    return {"status": "success", "message": "All private data cleared."}
