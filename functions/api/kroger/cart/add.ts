// PUT /api/kroger/cart/add
// Body: { items: [{ upc?: string, name: string, quantity: number }] }
// Adds items to the user's Kroger online cart for pickup or delivery.
// Requires user to be connected via OAuth.
//
// Kroger Cart API requires UPCs, so items without a UPC are first looked up
// via Product API search. Items that can't be matched are returned as failures
// in the response so the UI can show the user what couldn't be added.

import { getUserAccessToken } from '../../_user-token';
import { KrogerClient } from '../../_kroger-client';

interface Env {
  KROGER_CLIENT_ID: string;
  KROGER_CLIENT_SECRET: string;
  DB: D1Database;
  COUPON_CACHE: KVNamespace;
}

interface AddToCartRequest {
  items: { upc?: string; name: string; quantity?: number }[];
  zip?: string;     // Used to find a location for product UPC lookups
  chain?: string;   // KROGER, HARRIS_TEETER, etc.
}

interface AddToCartItemResult {
  itemName: string;
  added: boolean;
  upc?: string;
  matchedProduct?: string;
  reason?: string;
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const tokenResult = await getUserAccessToken(context.request, context.env);
  if (!tokenResult) return jsonError('Not connected to Kroger', 401);

  let body: AddToCartRequest;
  try {
    body = await context.request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return jsonError('items array required', 400);
  }
  if (body.zip && !/^\d{5}$/.test(body.zip)) {
    return jsonError('zip must be 5 digits', 400);
  }

  const items = body.items.slice(0, 50); // Kroger cart endpoint accepts up to 50

  // ─── Resolve UPCs for items that don't have one ───
  const itemsNeedingLookup = items.filter((i) => !i.upc);
  const resolved = new Map<string, { upc: string; productName: string }>();

  if (itemsNeedingLookup.length > 0) {
    const productClient = new KrogerClient(
      context.env.KROGER_CLIENT_ID,
      context.env.KROGER_CLIENT_SECRET
    );

    // Find a location to scope product searches (Kroger products vary by store)
    let locationId: string | undefined;
    if (body.zip) {
      const locCacheKey = `kroger:loc:${body.chain || 'KROGER'}:${body.zip}`;
      try {
        const cached = await context.env.COUPON_CACHE.get(locCacheKey);
        if (cached) locationId = cached;
      } catch {}

      if (!locationId) {
        try {
          const locations = await productClient.findLocations(body.zip, 25, 1, body.chain);
          if (locations.length > 0) {
            locationId = locations[0].locationId;
            try { await context.env.COUPON_CACHE.put(locCacheKey, locationId, { expirationTtl: 7 * 24 * 60 * 60 }); } catch {}
          }
        } catch {}
      }
    }

    // Look up each item's UPC in parallel
    const lookups = await Promise.allSettled(
      itemsNeedingLookup.map(async (item) => {
        const products = await productClient.searchProducts(item.name, locationId, 1);
        return { item, product: products[0] };
      })
    );

    for (const result of lookups) {
      if (result.status !== 'fulfilled' || !result.value.product) continue;
      const { item, product } = result.value;
      const upc = product.upc || product.productId;
      if (upc) {
        resolved.set(item.name, { upc, productName: product.description });
      }
    }
  }

  // ─── Build cart payload ───
  const cartItems: { upc: string; quantity: number; modality?: string }[] = [];
  const results: AddToCartItemResult[] = [];

  for (const item of items) {
    const quantity = Math.max(1, Math.floor(item.quantity || 1));

    if (item.upc) {
      cartItems.push({ upc: item.upc, quantity, modality: 'PICKUP' });
      results.push({ itemName: item.name, added: true, upc: item.upc });
      continue;
    }

    const match = resolved.get(item.name);
    if (match) {
      cartItems.push({ upc: match.upc, quantity, modality: 'PICKUP' });
      results.push({
        itemName: item.name,
        added: true,
        upc: match.upc,
        matchedProduct: match.productName,
      });
    } else {
      results.push({
        itemName: item.name,
        added: false,
        reason: 'No matching Kroger product found',
      });
    }
  }

  if (cartItems.length === 0) {
    return jsonResponse({
      success: false,
      results,
      addedCount: 0,
      message: 'No items could be matched to Kroger products',
    });
  }

  // ─── Send to Kroger Cart API ───
  try {
    const response = await fetch('https://api.kroger.com/v1/cart/add', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${tokenResult.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: cartItems }),
    });

    if (!response.ok) {
      const text = await response.text();
      // Mark all attempted-add items as failed
      const errorReason = response.status === 401
        ? 'Session expired — please reconnect'
        : `Kroger Cart API error: ${response.status}`;
      for (const r of results) {
        if (r.added) {
          r.added = false;
          r.reason = errorReason;
        }
      }
      return jsonResponse({
        success: false,
        results,
        addedCount: 0,
        error: errorReason,
        details: text.slice(0, 200),
      }, response.status);
    }

    return jsonResponse({
      success: true,
      results,
      addedCount: cartItems.length,
      message: `Added ${cartItems.length} item${cartItems.length > 1 ? 's' : ''} to your Kroger cart`,
    });
  } catch (err) {
    return jsonError(`Cart API request failed: ${(err as Error).message}`, 502);
  }
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
