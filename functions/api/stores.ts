// Cloudflare Pages Function: /api/stores
// Serves store location data from D1 for geolocation matching.

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const lat = parseFloat(url.searchParams.get('lat') || '0');
  const lng = parseFloat(url.searchParams.get('lng') || '0');
  const radius = parseFloat(url.searchParams.get('radius') || '500'); // meters

  if (!lat || !lng) {
    return new Response(JSON.stringify({ error: 'lat and lng are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Approximate bounding box filter (D1/SQLite doesn't have PostGIS)
    // ~0.004 degrees latitude ≈ 500m, longitude varies by latitude
    const latDelta = (radius / 111320);
    const lngDelta = (radius / (111320 * Math.cos(lat * Math.PI / 180)));

    const result = await context.env.DB.prepare(
      `SELECT * FROM stores 
       WHERE latitude BETWEEN ? AND ? 
       AND longitude BETWEEN ? AND ?
       ORDER BY ((latitude - ?) * (latitude - ?) + (longitude - ?) * (longitude - ?)) ASC
       LIMIT 10`
    ).bind(
      lat - latDelta, lat + latDelta,
      lng - lngDelta, lng + lngDelta,
      lat, lat, lng, lng
    ).all();

    return new Response(JSON.stringify({ stores: result.results || [], count: result.results?.length || 0 }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch stores' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
