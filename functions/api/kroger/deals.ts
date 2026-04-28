// GET /api/kroger/deals?zip=22554&category=produce
// Returns current Kroger sale items near a zip code, cached in KV for 6 hours

import { KrogerClient, mapProductsToDeals, type KrogerDeal } from '../_kroger-client';

interface Env {
  KROGER_CLIENT_ID: string;
  KROGER_CLIENT_SECRET: string;
  COUPON_CACHE: KVNamespace;
}

const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours

// Common search terms across grocery categories — used to populate deals
// since Kroger's API requires a search term (no "show me all current deals" endpoint)
const CATEGORY_QUERIES: Record<string, string[]> = {
  produce: ['apple', 'banana', 'lettuce', 'tomato', 'avocado', 'onion', 'potato', 'carrot'],
  dairy: ['milk', 'cheese', 'yogurt', 'butter', 'eggs', 'cream'],
  meat: ['chicken', 'beef', 'pork', 'turkey', 'bacon', 'sausage'],
  bakery: ['bread', 'bagel', 'muffin', 'roll', 'tortilla'],
  pantry: ['pasta', 'rice', 'cereal', 'soup', 'sauce', 'oil'],
  beverages: ['water', 'soda', 'juice', 'coffee', 'tea'],
  snacks: ['chips', 'cookies', 'crackers', 'nuts', 'popcorn'],
  frozen: ['pizza', 'ice cream', 'frozen vegetables'],
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const zip = url.searchParams.get('zip');
  const category = url.searchParams.get('category') || 'all';

  if (!zip || !/^\d{5}$/.test(zip)) {
    return jsonError('Valid 5-digit zip required', 400);
  }

  const cacheKey = `kroger:deals:${zip}:${category}`;

  // Check cache first
  try {
    const cached = await context.env.COUPON_CACHE.get(cacheKey, 'json');
    if (cached) {
      return jsonResponse(cached, { 'X-Cache': 'HIT' });
    }
  } catch {
    // KV not available — continue to fresh fetch
  }

  // Validate credentials configured
  if (!context.env.KROGER_CLIENT_ID || !context.env.KROGER_CLIENT_SECRET) {
    return jsonError('Kroger API not configured', 503);
  }

  try {
    const client = new KrogerClient(context.env.KROGER_CLIENT_ID, context.env.KROGER_CLIENT_SECRET);

    // Find nearest store
    const locations = await client.findLocations(zip, 25, 5);
    if (locations.length === 0) {
      const empty = { deals: [], locationId: null, locationName: null, retrievedAt: new Date().toISOString() };
      try { await context.env.COUPON_CACHE.put(cacheKey, JSON.stringify(empty), { expirationTtl: CACHE_TTL_SECONDS }); } catch {}
      return jsonResponse(empty);
    }

    const location = locations[0];

    // Pick search terms based on category
    const terms = category === 'all'
      ? Object.values(CATEGORY_QUERIES).flat().slice(0, 12)
      : (CATEGORY_QUERIES[category] || [category]);

    // Query products in parallel
    const productResults = await Promise.allSettled(
      terms.map((term) => client.searchProducts(term, location.locationId, 8))
    );

    const allDeals: KrogerDeal[] = [];
    const seen = new Set<string>();

    for (const result of productResults) {
      if (result.status !== 'fulfilled') continue;
      const deals = mapProductsToDeals(result.value, location.locationId);
      for (const d of deals) {
        if (!seen.has(d.productId)) {
          seen.add(d.productId);
          allDeals.push(d);
        }
      }
    }

    // Sort by savings descending
    allDeals.sort((a, b) => b.savings - a.savings);

    const payload = {
      deals: allDeals.slice(0, 50),
      locationId: location.locationId,
      locationName: `${location.name}, ${location.address.city}, ${location.address.state}`,
      retrievedAt: new Date().toISOString(),
    };

    // Cache result
    try {
      await context.env.COUPON_CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: CACHE_TTL_SECONDS });
    } catch {}

    return jsonResponse(payload, { 'X-Cache': 'MISS' });
  } catch (error) {
    return jsonError(`Kroger API error: ${(error as Error).message}`, 502);
  }
};

function jsonResponse(body: unknown, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...extraHeaders },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
