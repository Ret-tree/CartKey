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

// Check current Kroger-family prices for a list of items
// chain: Kroger API chain code (KROGER, HARRIS_TEETER, FRED_MEYER, etc.)
export async function checkKrogerPrices(items: PriceCheckItem[], zip: string, chain = 'KROGER'): Promise<PriceCheckResult[]> {
  if (items.length === 0 || !/^\d{5}$/.test(zip)) return [];
  try {
    const res = await fetch('/api/kroger/price-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, zip, chain }),
    });
    if (!res.ok) return items.map((i) => ({ itemName: i.name, matched: false }));
    const data = await res.json() as { results: PriceCheckResult[] };
    return data.results || [];
  } catch {
    return items.map((i) => ({ itemName: i.name, matched: false }));
  }
}

// ─── User OAuth (Kroger account connection) ───

export interface KrogerProfile {
  profileId: string;
  loyaltyId: string | null;
}

// Check whether the user is currently connected to Kroger
export async function getKrogerConnectionStatus(): Promise<{ connected: boolean }> {
  try {
    const res = await fetch('/api/kroger/me/status', { credentials: 'include' });
    if (!res.ok) return { connected: false };
    return await res.json();
  } catch {
    return { connected: false };
  }
}

// Fetch the user's Kroger profile (requires connection)
export async function fetchKrogerProfile(): Promise<KrogerProfile | null> {
  try {
    const res = await fetch('/api/kroger/me/profile', { credentials: 'include' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Initiate the OAuth flow — redirects the browser to Kroger
export function startKrogerConnection(returnUrl = window.location.pathname): void {
  const url = `/api/kroger/auth/start?return=${encodeURIComponent(returnUrl)}`;
  window.location.href = url;
}

// Disconnect — clears server session and cookie
export async function disconnectKroger(): Promise<boolean> {
  try {
    const res = await fetch('/api/kroger/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Cart API (Public) — Send list to Kroger ───

export interface CartItem {
  name: string;
  upc?: string;
  quantity?: number;
}

export interface CartItemResult {
  itemName: string;
  added: boolean;
  upc?: string;
  matchedProduct?: string;
  reason?: string;
}

export interface CartAddResponse {
  success: boolean;
  results: CartItemResult[];
  addedCount: number;
  message?: string;
  error?: string;
}

// Add items to the user's Kroger online cart. Requires user OAuth.
export async function addToKrogerCart(
  items: CartItem[],
  zip?: string,
  chain = 'KROGER'
): Promise<CartAddResponse> {
  try {
    const res = await fetch('/api/kroger/cart/add', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ items, zip, chain }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        results: items.map((i) => ({ itemName: i.name, added: false, reason: data.error })),
        addedCount: 0,
        error: data.error || `HTTP ${res.status}`,
      };
    }
    return data;
  } catch (err) {
    return {
      success: false,
      results: items.map((i) => ({ itemName: i.name, added: false, reason: 'Network error' })),
      addedCount: 0,
      error: (err as Error).message,
    };
  }
}

// ─── Catalog API V2 — Product autocomplete ───

export interface CatalogProduct {
  upc: string;
  productName: string;
  brand: string;
  size: string;
  category: string;
  imageUrl: string | null;
  regularPrice: number | null;
  salePrice: number | null;
}

// Search Kroger's catalog for autocomplete suggestions.
// Returns empty array on error or query too short.
export async function searchKrogerCatalog(
  query: string,
  zip = '',
  chain = 'KROGER',
  limit = 8
): Promise<CatalogProduct[]> {
  if (query.trim().length < 2) return [];
  try {
    const params = new URLSearchParams({ q: query, chain, limit: String(limit) });
    if (zip) params.set('zip', zip);
    const res = await fetch(`/api/kroger/catalog/search?${params}`);
    if (!res.ok) return [];
    const data = await res.json() as { results: CatalogProduct[] };
    return data.results || [];
  } catch {
    return [];
  }
}
