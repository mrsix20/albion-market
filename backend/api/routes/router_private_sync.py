from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from schemas.market import AODPPriceData
from services.private_price_service import update_private_prices, update_bm_tiers

router = APIRouter()

# --- Official Client Compatibility Schemas ---
class OfficialMarketOrder(BaseModel):
    Id: int
    ItemTypeId: str
    LocationId: str
    QualityLevel: int
    UnitPriceSilver: int
    AuctionType: str
    Amount: Optional[int] = 1  # Quantity requested/offered

class OfficialMarketUpload(BaseModel):
    Orders: List[OfficialMarketOrder]

class InvalidateRequest(BaseModel):
    item_id: str
    quality: int
    city: str

@router.post("/private-sync")
@router.post("/private-sync/")
async def sync_private_prices(prices: List[AODPPriceData], x_user_id: Optional[str] = Header(None)):
    try:
        user_id = x_user_id or "global"
        update_private_prices(prices, user_id=user_id)
        return {"status": "success", "synced_count": len(prices), "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/private-sync/invalidate")
async def invalidate_deal(req: InvalidateRequest, x_user_id: Optional[str] = Header(None)):
    try:
        from services.private_price_service import ingest_private_data
        user_id = x_user_id or "global"
        now = datetime.utcnow().isoformat() + "Z"
        
        dummy_price = AODPPriceData(
            item_id=req.item_id,
            city=req.city,
            quality=req.quality,
            sell_price_min=0,
            sell_price_min_date=now,
            sell_price_max=0,
            sell_price_max_date=now,
            buy_price_min=0,
            buy_price_min_date=now,
            buy_price_max=0,
            buy_price_max_date=now,
            is_private=True
        )
        ingest_private_data(user_id, [dummy_price])
        return {"status": "success", "message": "Deal invalidated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/private-sync/clear-all")
async def clear_all_data(x_user_id: Optional[str] = Header(None)):
    try:
        from services.private_price_service import clear_all_private_data
        user_id = x_user_id or "global"
        success = clear_all_private_data(user_id)
        if success:
            return {"status": "success", "message": "All private data cleared"}
        else:
            raise HTTPException(status_code=500, detail="Failed to clear data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

LOCATION_MAP = {
    "4": "Fort Sterling",
    "0004": "Fort Sterling",
    "1002": "Lymhurst",
    "2004": "Bridgewatch",
    "3004": "Martlock",
    "3005": "Caerleon",
    "3008": "Caerleon",
    "3003": "Black Market",
    "4002": "Thetford",
    "0313": "Brecilien",
    "3013": "Brecilien"
}

_forced_city = None

@router.post("/force-city/{city_name}")
async def force_sync_city(city_name: str):
    global _forced_city
    if city_name.lower() == "none" or city_name.lower() == "all":
        _forced_city = None
        return {"status": "success", "forced_city": None}
    _forced_city = city_name
    return {"status": "success", "forced_city": _forced_city}

@router.post("/private-sync/marketorders")
@router.post("/private-sync/marketorders.ingest")
@router.post("/{path:path}")
async def sync_official_market_orders(upload: OfficialMarketUpload, path: Optional[str] = None, x_user_id: Optional[str] = Header(None)):
    try:
        user_id = x_user_id or "global"
        print(f"--- [INCOMING] User: {user_id} | Path: {path} | Orders: {len(upload.Orders)} ---")
        if path:
            pass
            
        converted_prices = []
        now = datetime.utcnow().isoformat() + "Z"
        
        # Group BM buy orders per (item_id, quality, price) — each price tier is SEPARATE
        # Key: (item_id, quality, price) → total qty at that price
        bm_price_tiers: dict = {}
        
        for order in upload.Orders:
            # --- Capture BM Buy Orders ("request" = BM wants to BUY from players) ---
            if order.AuctionType == "request" and LOCATION_MAP.get(str(order.LocationId)) == "Black Market":
                normalized_price = int(order.UnitPriceSilver / 10000)
                if normalized_price <= 0:
                    continue
                # Key includes price so different price tiers stay SEPARATE
                tier_key = (order.ItemTypeId, order.QualityLevel, normalized_price)
                if tier_key not in bm_price_tiers:
                    bm_price_tiers[tier_key] = 0
                bm_price_tiers[tier_key] += order.Amount

                # --- ALSO add to converted_prices so it updates the main Private Store ---
                # This ensures Phase 1 of the flipper sees the update immediately
                price_data = AODPPriceData(
                    item_id=order.ItemTypeId,
                    city="Black Market", 
                    quality=order.QualityLevel,
                    sell_price_min=0,
                    sell_price_min_date=now,
                    sell_price_max=0,
                    sell_price_max_date=now,
                    buy_price_min=normalized_price,
                    buy_price_min_date=now,
                    buy_price_max=normalized_price,
                    buy_price_max_date=now,
                    buy_price_max_quantity=order.Amount,
                    is_private=True
                )
                converted_prices.append(price_data)

            # --- Capture City Sell Orders ("offer" = player offers item for sale) ---
            elif order.AuctionType == "offer":
                global _forced_city
                if _forced_city:
                    city_name = _forced_city
                else:
                    city_name = LOCATION_MAP.get(str(order.LocationId), str(order.LocationId))
                
                normalized_price = int(order.UnitPriceSilver / 10000)
                
                price_data = AODPPriceData(
                    item_id=order.ItemTypeId,
                    city=city_name, 
                    quality=order.QualityLevel,
                    sell_price_min=normalized_price,
                    sell_price_min_date=now,
                    sell_price_max=normalized_price,
                    sell_price_max_date=now,
                    buy_price_min=0,
                    buy_price_min_date=now,
                    buy_price_max=0,
                    buy_price_max_date=now,
                    is_private=True
                )
                converted_prices.append(price_data)
        
        # Store each BM price tier separately in the tiers store
        tier_count = 0
        for (item_id, quality, price), qty in bm_price_tiers.items():
            update_bm_tiers(item_id, quality, price, qty, now, user_id=user_id)
            tier_count += 1
        
        if converted_prices:
            update_private_prices(converted_prices, user_id=user_id)

        city_display = _forced_city if _forced_city else "Auto"
        print(f"--- [SUCCESS] User: {user_id} | City offers: {len(converted_prices)} | BM price tiers: {tier_count} (City: {city_display}) ---")
            
        return {"status": "success", "synced_count": len(converted_prices) + tier_count, "user_id": user_id}
    except Exception as e:
        print(f"--- [ERROR] Failed to process official orders: {e} ---")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/debug-db")
async def debug_db(x_user_id: Optional[str] = Header(None)):
    from services.private_price_service import get_all_private_item_ids
    user_id = x_user_id or "global"
    items = get_all_private_item_ids(user_id)
    return {"user_id": user_id, "tracked_items_count": len(items), "items": items}
