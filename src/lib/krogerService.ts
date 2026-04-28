// Client-side wrapper for Kroger Pages Functions endpoints

export interface KrogerDeal {
  productId: string;
  upc: string;
  productName: string;
  brand: string;
  regularPrice: number;
  salePrice: number;
  savings: number;
  size: string;
  imageUrl: string | null;
  category: string;
  locationId: string;
  retrievedAt: string;
}

export interface KrogerDealsResponse {
  deals: KrogerDeal[];
  locationId: string | null;
  locationName: string | null;
  retrievedAt: string;
}

export interface PriceCheckItem {
  name: string;
  upc?: string;
}

export interface PriceCheckResult {
  itemName: string;
  matched: boolean;
  productName?: string;
  brand?: string;
  regularPrice?: number;
  salePrice?: number;
  size?: string;
  imageUrl?: string;
}

// Fetch current Kroger deals near a zip code
export async function fetchKrogerDeals(zip: string, category = 'all'): Promise<KrogerDealsResponse | null> {
  if (!/^\d{5}$/.test(zip)) return null;
  try {
    const params = new URLSearchParams({ zip, category });
    const res = await fetch(`/api/kroger/deals?${params}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Check current Kroger prices for a list of items
export async function checkKrogerPrices(items: PriceCheckItem[], zip: string): Promise<PriceCheckResult[]> {
  if (items.length === 0 || !/^\d{5}$/.test(zip)) return [];
  try {
    const res = await fetch('/api/kroger/price-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, zip }),
    });
    if (!res.ok) return items.map((i) => ({ itemName: i.name, matched: false }));
    const data = await res.json() as { results: PriceCheckResult[] };
    return data.results || [];
  } catch {
    return items.map((i) => ({ itemName: i.name, matched: false }));
  }
}
