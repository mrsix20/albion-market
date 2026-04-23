export interface ArbitrageOpportunity {
  item_id: string;
  quality: number;
  buy_from_city: string;
  buy_price: number;
  sell_to_city: string;
  sell_price: number;
  net_revenue: number;
  profit: number;
  roi_percentage: number;
  buy_price_date: string;
  sell_price_date: string;
  demand?: number;
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

export async function getBlackMarketFlips(items: string[]): Promise<FlipperResponse> {
  const response = await fetch('http://localhost:8000/api/v1/flipper', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items,
      royal_cities: ["Fort Sterling", "Lymhurst", "Bridgewatch", "Martlock", "Thetford", "Caerleon"],
      target_city: "Black Market"
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch flips');
  }

  return response.json();
}

export async function getItemPrices(itemId: string, locations: string[] = [], qualities: number[] = []): Promise<ItemPrice[]> {
  const locationsParam = locations.length > 0 ? locations.join(',') : '';
  const qualitiesParam = qualities.length > 0 ? qualities.join(',') : '';
  
  const url = `https://www.albion-online-data.com/api/v2/stats/prices/${itemId}?locations=${locationsParam}&qualities=${qualitiesParam}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch prices');
  }
  
  return response.json();
}
