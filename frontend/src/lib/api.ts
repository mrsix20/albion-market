export interface ArbitrageOpportunity {
  item_id: string;
  quality: number;
  buy_from_city: string;
  buy_price: number;
  sell_to_city: string;
  sell_price: number;       // Conservative (min) BM buy order price
  sell_price_max?: number;  // Best (max) BM buy order price
  net_revenue: number;
  profit: number;
  roi_percentage: number;
  buy_price_date: string;
  sell_price_date: string;
  demand?: number;
  is_private?: boolean;
}

export interface FlipperResponse {
  opportunities: ArbitrageOpportunity[];
}

export interface ItemPrice {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  sell_price_max: number;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://albion-market-production-d5f2.up.railway.app';

export async function getBlackMarketFlips(items: string[], userId?: string, hasPremium: boolean = false): Promise<FlipperResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (userId) {
    headers['X-User-ID'] = userId;
  }

  // Add a 15-second timeout to prevent infinite hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE}/api/v1/flipper`, {
      method: 'POST',
      headers: headers,
      signal: controller.signal,
      body: JSON.stringify({
        items,
        royal_cities: ["Fort Sterling", "Lymhurst", "Bridgewatch", "Martlock", "Thetford", "Caerleon"],
        target_city: "Black Market",
        has_premium: hasPremium
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Failed to fetch flips');
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return { opportunities: [] };
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Fetch error:", error);
    if (error.name === 'AbortError') {
       console.warn("Request timed out after 15 seconds");
    }
    return { opportunities: [] }; // Return empty list instead of throwing to keep UI alive
  }
}

export async function getItemPrices(itemId: string, locations: string[] = [], qualities: number[] = []): Promise<ItemPrice[]> {
  const locationsParam = locations.length > 0 ? locations.join(',') : '';
  const qualitiesParam = qualities.length > 0 ? qualities.join(',') : '';
  
  const url = `https://europe.albion-online-data.com/api/v2/stats/prices/${itemId}?locations=${locationsParam}&qualities=${qualitiesParam}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch prices');
  }
  
  return response.json();
}

export async function invalidateDeal(itemId: string, quality: number, city: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/private-sync/invalidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item_id: itemId,
      quality,
      city
    }),
  });

  if (!response.ok) {
    console.error('Failed to invalidate deal');
  }
}

export async function clearAllData(userId?: string): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (userId) {
    headers['X-User-ID'] = userId;
  }

  const response = await fetch(`${API_BASE}/api/v1/private-sync/clear-all`, {
    method: 'POST',
    headers: headers,
  });

  if (!response.ok) {
    console.error('Failed to clear all data');
  }
}

export async function getTradeRoutes(params: any, userId?: string): Promise<FlipperResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (userId) {
    headers['X-User-ID'] = userId;
  }

  const response = await fetch(`${API_BASE}/api/v1/trade-routes`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch trade routes');
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return { opportunities: [] };
  }

  return response.json();
}
