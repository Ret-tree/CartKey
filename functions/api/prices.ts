// Cloudflare Pages Function: /api/prices
// Accepts anonymous price submissions and returns aggregated price data.
// Dormant until grocery.blackatlas.tech has real user traffic.

interface Env {
  DB: D1Database;
}

interface PriceSubmission {
  productName: string;
  normalizedName: string;
  price: number;
  unitPricePerOz: number | null;
  weight: string | null;
  storeId: string;
  category: string;
  date: string;
}

// POST /api/prices — Submit anonymous price data
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as { items: PriceSubmission[] };
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return new Response(JSON.stringify({ error: 'items array required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Validate and insert (max 50 items per request)
    const items = body.items.slice(0, 50);
    const stmt = context.env.DB.prepare(
      `INSERT INTO price_submissions (id, product_name, normalized_name, price, unit_price_per_oz, weight, store_id, category, purchase_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const batch = items.map((item) => {
      const id = crypto.randomUUID();
      return stmt.bind(
        id,
        item.productName.slice(0, 200),
        item.normalizedName.slice(0, 200),
        item.price,
        item.unitPricePerOz,
        item.weight,
        item.storeId.slice(0, 50),
        item.category.slice(0, 50),
        item.date.slice(0, 10),
      );
    });

    await context.env.DB.batch(batch);

    return new Response(JSON.stringify({ submitted: items.length }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Submission failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// GET /api/prices?product=milk&store=kroger — Query aggregated prices
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const product = url.searchParams.get('product');
  const storeId = url.searchParams.get('store');

  try {
    let query = 'SELECT * FROM price_aggregates WHERE 1=1';
    const params: string[] = [];

    if (product) {
      query += ' AND normalized_name LIKE ?';
      params.push(`%${product.toLowerCase()}%`);
    }
    if (storeId) {
      query += ' AND store_id = ?';
      params.push(storeId);
    }

    query += ' ORDER BY sample_count DESC LIMIT 50';

    const result = await context.env.DB.prepare(query).bind(...params).all();

    return new Response(JSON.stringify({ prices: result.results || [] }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Query failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
