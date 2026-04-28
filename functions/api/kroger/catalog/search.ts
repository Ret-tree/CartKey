// GET /api/kroger/catalog/search?q=tide&zip=22554&chain=KROGER&limit=10
// Returns structured product data from Kroger's catalog for autocomplete.
// Used by shopping list autocomplete and receipt enrichment.
//
// Cached in KV for 24 hours per (query, location).

import { KrogerClient } from '../_kroger-client';

interface Env {
  KROGER_CLIENT_ID: string;
  KROGER_CLIENT_SECRET: string;
  COUPON_CACHE: KVNamespace;
}

interface CatalogResult {
  upc: string;
  productName: string;
  brand: string;
  size: string;
  category: string;
  imageUrl: string | null;
  regularPrice: number | null;
  salePrice: number | null;
}

const CACHE_TTL = 24 * 60 * 60; // 24 hours

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const query = (url.searchParams.get('q') || '').trim();
  const zip = url.searchParams.get('zip') || '';
  const chain = url.searchParams.get('chain') || 'KROGER';
  const limit = Math.min(20, parseInt(url.searchParams.get('limit') || '8', 10));

  if (query.length < 2) {
    return jsonResponse({ results: [], cached: false });
  }
  if (zip && !/^\d{5}$/.test(zip)) {
    return jsonError('zip must be 5 digits', 400);
  }
  if (!context.env.KROGER_CLIENT_ID || !context.env.KROGER_CLIENT_SECRET) {
    return jsonError('Kroger API not configured', 503);
  }

  const cacheKey = `kroger:catalog:${chain}:${zip || 'noloc'}:${query.toLowerCase()}:${limit}`;
  try {
    const cached = await context.env.COUPON_CACHE.get(cacheKey, 'json');
    if (cached) return jsonResponse({ ...cached, cached: true });
  } catch {}

  try {
    const client = new KrogerClient(context.env.KROGER_CLIENT_ID, context.env.KROGER_CLIENT_SECRET);

    // Resolve location once if zip provided (cached separately for 7d)
    let locationId: string | undefined;
    if (zip) {
      const locCacheKey = `kroger:loc:${chain}:${zip}`;
      try {
        const cached = await context.env.COUPON_CACHE.get(locCacheKey);
        if (cached) locationId = cached;
      } catch {}

      if (!locationId) {
        const locations = await client.findLocations(zip, 25, 1, chain);
        if (locations.length > 0) {
          locationId = locations[0].locationId;
          try { await context.env.COUPON_CACHE.put(locCacheKey, locationId, { expirationTtl: 7 * 24 * 60 * 60 }); } catch {}
        }
      }
    }

    const products = await client.searchProducts(query, locationId, limit);

    const results: CatalogResult[] = products.map((p) => {
      const item = p.items?.[0];
      const image = p.images.find((i) => i.perspective === 'front')?.sizes.find((s) => s.size === 'medium')?.url || null;
      return {
        upc: p.upc || p.productId,
        productName: p.description,
        brand: p.brand || '',
        size: item?.size || '',
        category: p.categories?.[0] || '',
        imageUrl: image,
        regularPrice: item?.price?.regular ?? null,
        salePrice: (item?.price?.promo && item.price.promo > 0 && item.price.promo < (item.price.regular || Infinity))
          ? item.price.promo : null,
      };
    });

    const payload = { results, cached: false };
    try {
      await context.env.COUPON_CACHE.put(cacheKey, JSON.stringify({ results }), { expirationTtl: CACHE_TTL });
    } catch {}

    return jsonResponse(payload);
  } catch (err) {
    return jsonError(`Catalog search failed: ${(err as Error).message}`, 502);
  }
};

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
