// GET /api/kroger/auth/callback?code=...&state=...
// Kroger redirects here after the user authorizes.
// We verify state, exchange the code for tokens, persist refresh token,
// and set an HttpOnly session cookie.

import { exchangeCodeForTokens, generateOpaqueToken, buildSessionCookie, accessTokenKvKey } from '../../_oauth-helpers';

interface Env {
  KROGER_CLIENT_ID: string;
  KROGER_CLIENT_SECRET: string;
  DB: D1Database;
  COUPON_CACHE: KVNamespace;
}

const SESSION_MAX_AGE_DAYS = 90;
const STATE_TTL_MINUTES = 10;

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Handle Kroger error redirect
  if (error) {
    return htmlError(`Kroger denied authorization: ${error}`, '/');
  }

  if (!code || !state) {
    return htmlError('Missing code or state in callback', '/');
  }

  if (!context.env.KROGER_CLIENT_ID || !context.env.KROGER_CLIENT_SECRET) {
    return htmlError('Kroger API not configured', '/');
  }

  try {
    // Look up state — must exist and be recent
    const stateRow = await context.env.DB.prepare(
      'SELECT code_verifier, return_url, created_at FROM kroger_oauth_state WHERE state = ?'
    ).bind(state).first<{ code_verifier: string; return_url: string; created_at: string }>();

    if (!stateRow) {
      return htmlError('Invalid state token. Please try connecting again.', '/');
    }

    // Verify TTL — reject states older than 10 minutes
    const stateAge = Date.now() - new Date(stateRow.created_at).getTime();
    if (stateAge > STATE_TTL_MINUTES * 60 * 1000) {
      await context.env.DB.prepare('DELETE FROM kroger_oauth_state WHERE state = ?').bind(state).run();
      return htmlError('Authorization request expired. Please try again.', '/');
    }

    // Single-use: delete state immediately
    await context.env.DB.prepare('DELETE FROM kroger_oauth_state WHERE state = ?').bind(state).run();

    // Exchange the code for tokens
    const redirectUri = `${url.origin}/api/kroger/auth/callback`;
    const tokens = await exchangeCodeForTokens({
      clientId: context.env.KROGER_CLIENT_ID,
      clientSecret: context.env.KROGER_CLIENT_SECRET,
      code,
      redirectUri,
      codeVerifier: stateRow.code_verifier,
    });

    // Create a new session row with the refresh token
    const sessionId = generateOpaqueToken();
    const refreshExpiresAt = new Date(Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

    await context.env.DB.prepare(
      'INSERT INTO kroger_sessions (session_id, refresh_token, refresh_expires_at, scope) VALUES (?, ?, ?, ?)'
    ).bind(sessionId, tokens.refresh_token, refreshExpiresAt, tokens.scope).run();

    // Cache access token in KV with TTL just below its expiry
    const accessTtl = Math.max(60, tokens.expires_in - 60);
    try {
      await context.env.COUPON_CACHE.put(accessTokenKvKey(sessionId), tokens.access_token, {
        expirationTtl: accessTtl,
      });
    } catch {
      // KV failure is recoverable — refresh flow will fetch a new token next time
    }

    const sessionCookie = buildSessionCookie(sessionId, SESSION_MAX_AGE_DAYS * 24 * 60 * 60);
    const safeReturnUrl = stateRow.return_url || '/';

    // Redirect back to the app with success indicator
    const returnUrl = new URL(safeReturnUrl, url.origin);
    returnUrl.searchParams.set('kroger_connected', '1');

    return new Response(null, {
      status: 302,
      headers: {
        Location: returnUrl.toString(),
        'Set-Cookie': sessionCookie,
      },
    });
  } catch (err) {
    return htmlError(`OAuth callback failed: ${(err as Error).message}`, '/');
  }
};

function htmlError(message: string, returnUrl: string): Response {
  const safe = message.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  const html = `<!doctype html><html><body style="font-family: system-ui; max-width: 480px; margin: 60px auto; padding: 20px;">
<h1 style="color: #1A1F16;">Connection Failed</h1>
<p style="color: #555;">${safe}</p>
<a href="${returnUrl}" style="display: inline-block; padding: 12px 20px; background: #1A1F16; color: #C9A227; text-decoration: none; border-radius: 8px;">Return to CartKey</a>
</body></html>`;
  return new Response(html, { status: 400, headers: { 'Content-Type': 'text/html' } });
}
