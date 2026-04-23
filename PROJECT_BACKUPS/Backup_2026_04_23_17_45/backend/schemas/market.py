from pydantic import BaseModel
from typing import List, Optional

# Schema for the incoming external data from AODP
class AODPPriceData(BaseModel):
    item_id: str
    city: str
    quality: int
    sell_price_min: int
    sell_price_min_date: str
    sell_price_max: int
    sell_price_max_date: str
    buy_price_min: int
    buy_price_min_date: str
    buy_price_max: int
    buy_price_max_date: str
    # New fields for demand analysis
    buy_price_max_quantity: Optional[int] = 0
    sell_price_min_quantity: Optional[int] = 0
    is_private: Optional[bool] = False

# Schemas for our internal responses
class ArbitrageOpportunity(BaseModel):
    item_id: str
    quality: int
    buy_from_city: str
    buy_price: int
    sell_to_city: str
    sell_price: int
    net_revenue: float
    profit: float
    roi_percentage: float
    buy_price_date: str
    sell_price_date: str
    demand: Optional[int] = 0 # Quantity requested by Black Market
    is_private: Optional[bool] = False # Flag for exclusive sync data
    
class FlipperResponse(BaseModel):
    opportunities: List[ArbitrageOpportunity]
    
class FlipperRequest(BaseModel):
    items: List[str]
    royal_cities: Optional[List[str]] = ["Fort Sterling", "Lymhurst", "Bridgewatch", "Martlock", "Thetford"]
    target_city: Optional[str] = "Black Market"

class TradeRouteRequest(BaseModel):
    items: List[str]
    source_city: str
    destination_city: str
    tax: Optional[float] = 0.065
    quality: Optional[List[int]] = [1, 2, 3]

class TradeRouteResponse(BaseModel):
    opportunities: List[ArbitrageOpportunity]
