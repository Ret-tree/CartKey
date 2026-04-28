// GET /api/kroger/me/status
// Returns whether the current session is connected to Kroger.
// Used by the UI to decide whether to show "Connect" or user data.

import { getUserAccessToken } from '../../_user-token';

interface Env {
  KROGER_CLIENT_ID: string;
  KROGER_CLIENT_SECRET: string;
  DB: D1Database;
  COUPON_CACHE: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const result = await getUserAccessToken(context.request, context.env);

  if (!result) {
    return jsonResponse({ connected: false });
  }

  return jsonResponse({ connected: true });
};

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
