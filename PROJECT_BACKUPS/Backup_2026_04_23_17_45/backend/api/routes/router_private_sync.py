from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from schemas.market import AODPPriceData
from services.private_price_service import update_private_prices

router = APIRouter()

# --- Official Client Compatibility Schemas ---
class OfficialMarketOrder(BaseModel):
    Id: int
    ItemTypeId: str
    LocationId: str
    QualityLevel: int
    UnitPriceSilver: int
    AuctionType: str

class OfficialMarketUpload(BaseModel):
    Orders: List[OfficialMarketOrder]

@router.post("/private-sync")
@router.post("/private-sync/")
async def sync_private_prices(prices: List[AODPPriceData]):
    try:
        update_private_prices(prices)
        return {"status": "success", "synced_count": len(prices)}
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
async def sync_official_market_orders(upload: OfficialMarketUpload, path: Optional[str] = None):
    try:
        if path:
            pass # Suppressing diagnostic print to avoid spam
            
        converted_prices = []
        now = datetime.utcnow().isoformat() + "Z"
        
        for order in upload.Orders:
            if order.AuctionType == "offer":
                global _forced_city
                if _forced_city:
                    city_name = _forced_city
                else:
                    # Translate the numeric LocationId to the City Name
                    city_name = LOCATION_MAP.get(str(order.LocationId), str(order.LocationId))
                
                # Albion protocol multiplies silver by 10000. We must normalize it.
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
        
        if converted_prices:
            update_private_prices(converted_prices)
            city_display = _forced_city if _forced_city else "Auto"
            print(f"--- [SUCCESS] Received {len(converted_prices)} orders from Official Client! (Forced City: {city_display}) ---")
            
        return {"status": "success", "synced_count": len(converted_prices)}
    except Exception as e:
        print(f"--- [ERROR] Failed to process official orders: {e} ---")
        raise HTTPException(status_code=500, detail=str(e))

from services.private_price_service import _private_store

@router.get("/debug-store")
async def debug_store():
    return {f"{k[0]}_{k[1]}_{k[2]}": v for k, v in _private_store.items()}

