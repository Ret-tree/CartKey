// POST /api/kroger/auth/logout
// Removes the session from D1, clears KV access token cache, and clears cookie.
// Note: Kroger does not currently offer an explicit token revocation endpoint,
// so we just discard the tokens locally and let them expire naturally.

import { getSessionId, accessTokenKvKey, buildClearCookie } from '../../_oauth-helpers';

interface Env {
  DB: D1Database;
  COUPON_CACHE: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const sessionId = getSessionId(context.request);

  if (sessionId) {
    try {
      await context.env.DB.prepare('DELETE FROM kroger_sessions WHERE session_id = ?').bind(sessionId).run();
    } catch {}
    try {
      await context.env.COUPON_CACHE.delete(accessTokenKvKey(sessionId));
    } catch {}
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': buildClearCookie(),
    },
  });
};
