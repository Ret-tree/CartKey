// Cloudflare Pages Function: /api/coupons
// This endpoint will serve coupon data from D1 once the aggregation pipeline is active.
// For now, the frontend uses local mock data. This stub is ready for Phase 2 server-side integration.

interface Env {
  DB: D1Database;
  COUPON_CACHE: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const storeId = url.searchParams.get('store');
  const category = url.searchParams.get('category');
  const diet = url.searchParams.get('diet');
  const allergens = url.searchParams.get('allergens')?.split(',').filter(Boolean) || [];

  try {
    // Check KV cache first
    const cacheKey = `coupons:${storeId}:${category}:${diet}`;
    const cached = await context.env.COUPON_CACHE.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      });
    }

    // Query D1
    let query = 'SELECT * FROM coupons WHERE valid_until >= date("now")';
    const params: string[] = [];

    if (storeId) {
      query += ' AND retailer_ids LIKE ?';
      params.push(`%"${storeId}"%`);
    }
    if (category && category !== 'all') {
      query += ' AND categories LIKE ?';
      params.push(`%"${category}"%`);
    }

    query += ' ORDER BY upvotes DESC LIMIT 100';

    const result = await context.env.DB.prepare(query).bind(...params).all();

    let coupons = result.results || [];

    // Filter allergens in JS (JSON array fields)
    if (allergens.length > 0) {
      coupons = coupons.filter((c: any) => {
        const couponAllergens: string[] = JSON.parse(c.allergens || '[]');
        return !couponAllergens.some((a) => allergens.includes(a));
      });
    }

    const body = JSON.stringify({ coupons, count: coupons.length });

    // Cache for 5 minutes
    await context.env.COUPON_CACHE.put(cacheKey, body, { expirationTtl: 300 });

    return new Response(body, {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch coupons' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
