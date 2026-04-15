// Cloudflare Pages Function: /api/weekly-ads
// Serves weekly ad data for a specific store from D1.

interface Env {
  DB: D1Database;
  COUPON_CACHE: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const storeId = url.searchParams.get('store');

  if (!storeId) {
    return new Response(JSON.stringify({ error: 'store parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const cacheKey = `weekly-ads:${storeId}`;
    const cached = await context.env.COUPON_CACHE.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' },
      });
    }

    const result = await context.env.DB.prepare(
      `SELECT * FROM weekly_ads 
       WHERE store_id = ? AND valid_until >= date('now')
       ORDER BY category, sale_price ASC`
    ).bind(storeId).all();

    const body = JSON.stringify({ items: result.results || [], count: result.results?.length || 0 });

    await context.env.COUPON_CACHE.put(cacheKey, body, { expirationTtl: 1800 });

    return new Response(body, {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch weekly ads' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
