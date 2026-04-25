import httpx
from typing import List, Optional
from core.config import settings
from schemas.market import AODPPriceData
from cachetools import TTLCache

# Cache for 5 minutes, up to 1000 entries
price_cache = TTLCache(maxsize=1000, ttl=300)

import asyncio

async def fetch_prices(items: List[str], locations: Optional[List[str]] = None) -> List[AODPPriceData]:
    """
    Fetch market prices from AODP API with parallel fetching and caching.
    """
    if not items:
        return []

    cache_key = f"{','.join(sorted(items))}:{','.join(sorted(locations)) if locations else 'all'}"
    if cache_key in price_cache:
        return price_cache[cache_key]

    CHUNK_SIZE = 50
    tasks = []
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        for i in range(0, len(items), CHUNK_SIZE):
            chunk = items[i : i + CHUNK_SIZE]
            items_str = ",".join(chunk)
            url = f"{settings.AODP_BASE_URL}/Prices/{items_str}"
            
            params = {}
            if locations:
                params["locations"] = ",".join(locations)
            
            tasks.append(client.get(url, params=params))
        
        # Execute all chunks in parallel
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_fetched_data = []
        for response in responses:
            if isinstance(response, Exception):
                print(f"--- [ERROR] Chunk fetch failed: {response} ---")
                continue
                
            if response.status_code == 429 or "Throttled" in response.text:
                print(f"--- [WARNING] AODP Throttled us! ---")
                continue
                
            try:
                data = response.json()
                if isinstance(data, list):
                    all_fetched_data.extend(data)
            except:
                continue

    results = [AODPPriceData(**item) for item in all_fetched_data]
    if results:
        price_cache[cache_key] = results
        
    return results
