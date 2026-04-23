from fastapi import APIRouter, HTTPException
from typing import List
from schemas.market import FlipperRequest, FlipperResponse, ArbitrageOpportunity
from services.aodp_client import fetch_prices
from services.private_price_service import merge_prices
from core.albion_math import calculate_profit

router = APIRouter()

@router.post("/flipper", response_model=FlipperResponse)
async def get_black_market_flips(request: FlipperRequest):
    """
    Find arbitrage opportunities between Royal Cities and the Black Market.
    """
    # Combine target locations
    all_locations = request.royal_cities + [request.target_city]
    
    try:
        # Fetch data for all requested items in all locations
        public_data = await fetch_prices(request.items, all_locations)
        # Merge with private data
        raw_data = merge_prices(public_data, request.items, all_locations)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data from AODP: {str(e)}")
        
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
    
    # Calculate arbitrage
    for (item_id, quality), locations in item_quality_map.items():
        bm_data = locations["black_market"]
        city_data_list = locations["royal_cities"]
        
        if not bm_data or not city_data_list:
            continue
            
        # We want to sell to Black Market using its Buy Order (buy_price_max)
        bm_buy_price = bm_data.buy_price_max
        if bm_buy_price <= 0:
            continue
            
        # We want to buy from a Royal City using its Sell Order (sell_price_min)
        for city_data in city_data_list:
            city_sell_price = city_data.sell_price_min
            
            if city_sell_price <= 0:
                continue
                
            # Calculate metrics
            profit_data = calculate_profit(buy_price=city_sell_price, sale_price=bm_buy_price, direct_sell=True)
            
            # Only include profitable flips
            if profit_data["profit"] > 0:
                opportunities.append(
                    ArbitrageOpportunity(
                        item_id=item_id,
                        quality=quality,
                        buy_from_city=city_data.city,
                        buy_price=city_sell_price,
                        sell_to_city=request.target_city,
                        sell_price=bm_buy_price,
                        net_revenue=profit_data["net_revenue"],
                        profit=profit_data["profit"],
                        roi_percentage=profit_data["roi_percentage"],
                        buy_price_date=city_data.sell_price_min_date,
                        sell_price_date=bm_data.buy_price_max_date,
                        demand=bm_data.buy_price_max_quantity,
                        is_private=city_data.is_private or bm_data.is_private
                    )
                )

    # Sort opportunities by profit descending
    opportunities.sort(key=lambda x: x.profit, reverse=True)
    
    return FlipperResponse(opportunities=opportunities)
