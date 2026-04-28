// Kroger API client for Cloudflare Pages Functions
// Uses Client Credentials grant for product catalog access (no user OAuth needed)
// Docs: https://developer.kroger.com/

const KROGER_BASE = 'https://api.kroger.com/v1';

export interface KrogerProduct {
  productId: string;
  upc: string;
  brand: string;
  description: string;
  categories: string[];
  items: KrogerProductItem[];
  images: { perspective: string; sizes: { size: string; url: string }[] }[];
}

export interface KrogerProductItem {
  itemId: string;
  size: string;
  price?: { regular: number; promo: number };
  inventory?: { stockLevel: string };
}

export interface KrogerLocation {
  locationId: string;
  chain: string;
  name: string;
  address: { addressLine1: string; city: string; state: string; zipCode: string };
  geolocation: { latitude: number; longitude: number };
}

export class KrogerClient {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  private async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const credentials = btoa(`${this.clientId}:${this.clientSecret}`);
    const response = await fetch(`${KROGER_BASE}/connect/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials&scope=product.compact',
    });

    if (!response.ok) {
      throw new Error(`Kroger OAuth failed: ${response.status}`);
    }

    const data = await response.json() as { access_token: string; expires_in: number };
    this.accessToken = data.access_token;
    // Refresh 60 seconds before expiry to be safe
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this.accessToken;
  }

  async findLocations(zipCode: string, radiusMiles = 10, limit = 10): Promise<KrogerLocation[]> {
    const token = await this.getToken();
    const url = new URL(`${KROGER_BASE}/locations`);
    url.searchParams.set('filter.zipCode.near', zipCode);
    url.searchParams.set('filter.radiusInMiles', String(radiusMiles));
    url.searchParams.set('filter.limit', String(limit));

    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Kroger locations failed: ${response.status}`);
    const data = await response.json() as { data: KrogerLocation[] };
    return data.data || [];
  }

  async searchProducts(query: string, locationId?: string, limit = 25): Promise<KrogerProduct[]> {
    const token = await this.getToken();
    const url = new URL(`${KROGER_BASE}/products`);
    url.searchParams.set('filter.term', query);
    url.searchParams.set('filter.limit', String(limit));
    if (locationId) url.searchParams.set('filter.locationId', locationId);

    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Kroger products failed: ${response.status}`);
    const data = await response.json() as { data: KrogerProduct[] };
    return data.data || [];
  }

  async getProductsByUpc(upcs: string[], locationId?: string): Promise<KrogerProduct[]> {
    if (upcs.length === 0) return [];
    const token = await this.getToken();
    const url = new URL(`${KROGER_BASE}/products`);
    url.searchParams.set('filter.productId', upcs.slice(0, 50).join(','));
    if (locationId) url.searchParams.set('filter.locationId', locationId);

    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Kroger UPC lookup failed: ${response.status}`);
    const data = await response.json() as { data: KrogerProduct[] };
    return data.data || [];
  }
}

// ─── Map Kroger products to CartKey deal format ───
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

export function mapProductsToDeals(products: KrogerProduct[], locationId: string): KrogerDeal[] {
  const deals: KrogerDeal[] = [];
  const now = new Date().toISOString();

  for (const p of products) {
    for (const item of p.items) {
      if (!item.price) continue;
      const regular = item.price.regular;
      const promo = item.price.promo;
      // Only include items currently on promotion (promo > 0 && promo < regular)
      if (promo <= 0 || promo >= regular) continue;

      const image = p.images.find((i) => i.perspective === 'front')?.sizes.find((s) => s.size === 'medium')?.url || null;

      deals.push({
        productId: p.productId,
        upc: p.upc || p.productId,
        productName: p.description,
        brand: p.brand || '',
        regularPrice: regular,
        salePrice: promo,
        savings: regular - promo,
        size: item.size || '',
        imageUrl: image,
        category: p.categories?.[0] || 'general',
        locationId,
        retrievedAt: now,
      });
    }
  }

  return deals;
}
