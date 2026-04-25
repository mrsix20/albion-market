from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional
from schemas.market import TradeRouteRequest, TradeRouteResponse, ArbitrageOpportunity
from services.private_price_service import merge_prices, get_all_private_item_ids
from services.aodp_client import fetch_prices
from core.albion_math import calculate_profit

router = APIRouter()

@router.post("/trade-routes", response_model=TradeRouteResponse)
async def get_trade_routes(request: TradeRouteRequest, x_user_id: Optional[str] = Header(None)):
    """
    Find arbitrage opportunities between cities. Supports 'All' for global search.
    """
    user_id = x_user_id or "global"
    royal_cities = ["Fort Sterling", "Lymhurst", "Bridgewatch", "Martlock", "Thetford", "Caerleon", "Brecilien"]
    
    source_locations = [request.source_city] if request.source_city != "All" else royal_cities
    dest_locations = [request.destination_city] if request.destination_city != "All" else royal_cities
    
    all_query_locations = list(set(source_locations + dest_locations))
    
    # Expand search to include items the user has actually scanned
    private_item_ids = get_all_private_item_ids(user_id=user_id)
    combined_items = list(set(request.items + private_item_ids))
    
    try:
        # Fetch public data
        public_data = await fetch_prices(combined_items, all_query_locations)
        
        # Merge with private data (Private sync data takes priority) for this specific user
        raw_data = merge_prices(public_data, combined_items, all_query_locations, user_id=user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data from AODP: {str(e)}")
        
    # Group data by (item_id, quality, city)
    data_map = {}
    for entry in raw_data:
        if entry.quality not in request.quality:
            continue
        data_map[(entry.item_id, entry.quality, entry.city)] = entry
            
    opportunities = []
    
    # Compare all valid source-to-destination pairs
    for item_id in combined_items:
        for quality in request.quality:
            for src_city in source_locations:
                for dst_city in dest_locations:
                    if src_city == dst_city:
                        continue
                        
                    src_data = data_map.get((item_id, quality, src_city))
                    dst_data = data_map.get((item_id, quality, dst_city))
                    
                    if not src_data or not dst_data:
                        continue
                        
                    buy_price = src_data.sell_price_min
                    sale_price = dst_data.sell_price_min
                    
                    if buy_price <= 0 or sale_price <= 0:
                        continue
                        
                    profit_data = calculate_profit(buy_price=buy_price, sale_price=sale_price, tax_rate=request.tax, direct_sell=False)
                    
                    # ROI sanity check removed as per user request to see all deals
                    if profit_data["profit"] > 0:
                        opportunities.append(
                            ArbitrageOpportunity(
                                item_id=item_id,
                                quality=quality,
                                buy_from_city=src_city,
                                buy_price=buy_price,
                                sell_to_city=dst_city,
                                sell_price=sale_price,
                                net_revenue=profit_data["net_revenue"],
                                profit=profit_data["profit"],
                                roi_percentage=profit_data["roi_percentage"],
                                buy_price_date=src_data.sell_price_min_date,
                                sell_price_date=dst_data.sell_price_min_date,
                                demand=dst_data.sell_price_min_quantity,
                                is_private=src_data.is_private or dst_data.is_private
                            )
                        )

    # Sort by ROI descending
    opportunities.sort(key=lambda x: x.roi_percentage, reverse=True)
    
    return TradeRouteResponse(opportunities=opportunities)
