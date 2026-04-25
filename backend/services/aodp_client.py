import httpx
from typing import List, Optional
from core.config import settings
from schemas.market import AODPPriceData
from cachetools import TTLCache

# Cache for 5 minutes, up to 1000 entries
price_cache = TTLCache(maxsize=1000, ttl=300)

async def fetch_prices(items: List[str], locations: Optional[List[str]] = None) -> List[AODPPriceData]:
    """
    Fetch market prices from AODP API with caching and chunking.
    """
    if not items:
        return []

    # Generate a cache key based on items and locations
    cache_key = f"{','.join(sorted(items))}:{','.join(sorted(locations)) if locations else 'all'}"
    if cache_key in price_cache:
        return price_cache[cache_key]

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
                
                # Check for throttling or other non-JSON responses
                if response.status_code == 429 or "Throttled" in response.text:
                    print(f"--- [WARNING] AODP Throttled us! Using partial data. ---")
                    break
                
                response.raise_for_status()
                data = response.json()
                all_fetched_data.extend(data)
            except Exception as e:
                print(f"Error fetching chunk: {e}")
                continue

    results = [AODPPriceData(**item) for item in all_fetched_data]
    
    # Store in cache if we got some results
    if results:
        price_cache[cache_key] = results
        
    return results
