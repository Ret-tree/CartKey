// POST /api/kroger/price-check
// Body: { items: [{ name: "Tide Pods", upc?: "..." }], zip: "22554" }
// Returns current Kroger pricing for matched products
// Used by the price match feature to compare receipts against current shelf prices

import { KrogerClient } from './_kroger-client';

interface Env {
  KROGER_CLIENT_ID: string;
  KROGER_CLIENT_SECRET: string;
  COUPON_CACHE: KVNamespace;
}

interface PriceCheckRequest {
  items: { name: string; upc?: string }[];
  zip: string;
  chain?: string; // Kroger API chain code, e.g. KROGER, HARRIS_TEETER, FRED_MEYER
}

interface PriceCheckResult {
  itemName: string;
  matched: boolean;
  productName?: string;
  brand?: string;
  regularPrice?: number;
  salePrice?: number;
  size?: string;
  imageUrl?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!context.env.KROGER_CLIENT_ID || !context.env.KROGER_CLIENT_SECRET) {
    return jsonError('Kroger API not configured', 503);
  }

  let body: PriceCheckRequest;
  try {
    body = await context.request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return jsonError('items array required', 400);
  }
  if (!body.zip || !/^\d{5}$/.test(body.zip)) {
    return jsonError('Valid 5-digit zip required', 400);
  }

  try {
    const client = new KrogerClient(context.env.KROGER_CLIENT_ID, context.env.KROGER_CLIENT_SECRET);

    // Find nearest store of the specified chain (cached per-chain)
    const chain = body.chain || 'KROGER';
    const locCacheKey = `kroger:loc:${chain}:${body.zip}`;
    let locationId: string | null = null;
    try {
      const cached = await context.env.COUPON_CACHE.get(locCacheKey);
      if (cached) locationId = cached;
    } catch {}

    if (!locationId) {
      const locations = await client.findLocations(body.zip, 25, 1, chain);
      if (locations.length === 0) {
        return jsonResponse({ results: body.items.map((i) => ({ itemName: i.name, matched: false })), locationId: null });
      }
      locationId = locations[0].locationId;
      try { await context.env.COUPON_CACHE.put(locCacheKey, locationId, { expirationTtl: 7 * 24 * 60 * 60 }); } catch {}
    }

    // Look up each item in parallel — limit to 20 items per request
    const items = body.items.slice(0, 20);
    const results = await Promise.all(
      items.map(async (item): Promise<PriceCheckResult> => {
        try {
          // Try UPC first if available, then fall back to name search
          let products = item.upc ? await client.getProductsByUpc([item.upc], locationId!) : [];
          if (products.length === 0) {
            products = await client.searchProducts(item.name, locationId!, 3);
          }
          if (products.length === 0) {
            return { itemName: item.name, matched: false };
          }

          const product = products[0];
          const productItem = product.items.find((i) => i.price);
          if (!productItem || !productItem.price) {
            return { itemName: item.name, matched: false };
          }

          const image = product.images.find((i) => i.perspective === 'front')?.sizes.find((s) => s.size === 'medium')?.url;

          return {
            itemName: item.name,
            matched: true,
            productName: product.description,
            brand: product.brand,
            regularPrice: productItem.price.regular,
            salePrice: productItem.price.promo > 0 ? productItem.price.promo : undefined,
            size: productItem.size,
            imageUrl: image,
          };
        } catch {
          return { itemName: item.name, matched: false };
        }
      })
    );

    return jsonResponse({ results, locationId });
  } catch (error) {
    return jsonError(`Kroger API error: ${(error as Error).message}`, 502);
  }
};

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
