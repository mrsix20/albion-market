import httpx
from typing import List, Optional
from core.config import settings
from schemas.market import AODPPriceData
from cachetools import TTLCache

# Cache for 1 minute, up to 100 entries
price_cache = TTLCache(maxsize=100, ttl=60)

async def fetch_prices(items: List[str], locations: Optional[List[str]] = None) -> List[AODPPriceData]:
    """
    Fetch market prices from AODP API with caching and chunking.
    """
    if not items:
        return []

    # Chunk items to avoid long URLs (40 items per request is safe)
    CHUNK_SIZE = 40
    all_fetched_data = []
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        for i in range(0, len(items), CHUNK_SIZE):
            chunk = items[i : i + CHUNK_SIZE]
            items_str = ",".join(chunk)
            url = f"{settings.AODP_BASE_URL}/Prices/{items_str}"
            
            params = {}
            if locations:
                params["locations"] = ",".join(locations)
            
            try:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                all_fetched_data.extend(data)
            except Exception as e:
                print(f"Error fetching chunk: {e}")
                continue

    return [AODPPriceData(**item) for item in all_fetched_data]
