// ─── User Access Token Helper ───
//
// Used by user-scoped endpoints (profile, coupons, fuel points).
// Returns null if the user is not connected or session is invalid.
// Automatically refreshes expired access tokens using the stored refresh token.

import { refreshTokens, accessTokenKvKey, getSessionId } from './_oauth-helpers';

interface Env {
  KROGER_CLIENT_ID: string;
  KROGER_CLIENT_SECRET: string;
  DB: D1Database;
  COUPON_CACHE: KVNamespace;
}

export interface UserTokenResult {
  accessToken: string;
  sessionId: string;
}

export async function getUserAccessToken(
  request: Request,
  env: Env
): Promise<UserTokenResult | null> {
  const sessionId = getSessionId(request);
  if (!sessionId) return null;

  // Try cached access token first
  try {
    const cached = await env.COUPON_CACHE.get(accessTokenKvKey(sessionId));
    if (cached) return { accessToken: cached, sessionId };
  } catch {}

  // Cache miss — look up refresh token in D1
  const session = await env.DB.prepare(
    'SELECT refresh_token, refresh_expires_at FROM kroger_sessions WHERE session_id = ?'
  ).bind(sessionId).first<{ refresh_token: string; refresh_expires_at: string }>();

  if (!session) return null;

  if (new Date(session.refresh_expires_at).getTime() < Date.now()) {
    // Refresh token expired — clean up
    await env.DB.prepare('DELETE FROM kroger_sessions WHERE session_id = ?').bind(sessionId).run();
    return null;
  }

  // Refresh the access token
  try {
    const tokens = await refreshTokens({
      clientId: env.KROGER_CLIENT_ID,
      clientSecret: env.KROGER_CLIENT_SECRET,
      refreshToken: session.refresh_token,
    });

    // Persist new refresh token if Kroger rotated it
    if (tokens.refresh_token && tokens.refresh_token !== session.refresh_token) {
      await env.DB.prepare(
        'UPDATE kroger_sessions SET refresh_token = ?, last_used_at = datetime(\'now\') WHERE session_id = ?'
      ).bind(tokens.refresh_token, sessionId).run();
    } else {
      await env.DB.prepare(
        'UPDATE kroger_sessions SET last_used_at = datetime(\'now\') WHERE session_id = ?'
      ).bind(sessionId).run();
    }

    // Cache new access token
    const ttl = Math.max(60, tokens.expires_in - 60);
    try {
      await env.COUPON_CACHE.put(accessTokenKvKey(sessionId), tokens.access_token, {
        expirationTtl: ttl,
      });
    } catch {}

    return { accessToken: tokens.access_token, sessionId };
  } catch (err) {
    // Refresh token rejected — session is dead
    await env.DB.prepare('DELETE FROM kroger_sessions WHERE session_id = ?').bind(sessionId).run();
    return null;
  }
}
