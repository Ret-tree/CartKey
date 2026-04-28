// GET /api/kroger/auth/start
// Redirects the user to Kroger's authorization page with PKCE challenge.
// Stores the PKCE verifier and CSRF state in D1 for later verification.

import { generatePkce, generateOpaqueToken, buildAuthorizeUrl } from '../../_oauth-helpers';

interface Env {
  KROGER_CLIENT_ID: string;
  KROGER_CLIENT_SECRET: string;
  DB: D1Database;
}

// Scopes we request:
// - profile.compact: user identity (for display in CartKey)
// - cart.basic:write: add items to user's cart (for "Send to Kroger" feature)
// - product.compact: product catalog (already covered by client_credentials)
const REQUESTED_SCOPES = 'profile.compact cart.basic:write product.compact';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!context.env.KROGER_CLIENT_ID) {
    return errorResponse('Kroger API not configured');
  }

  const url = new URL(context.request.url);
  const returnUrl = url.searchParams.get('return') || '/';

  // Validate return URL is same-origin to prevent open redirect
  const safeReturn = isSafeReturnUrl(returnUrl) ? returnUrl : '/';

  try {
    const { verifier, challenge } = await generatePkce();
    const state = generateOpaqueToken();

    // Store state + verifier in D1 (10-minute TTL enforced by GC on read)
    await context.env.DB.prepare(
      'INSERT INTO kroger_oauth_state (state, code_verifier, return_url) VALUES (?, ?, ?)'
    ).bind(state, verifier, safeReturn).run();

    // Build redirect URI from current request origin
    const redirectUri = `${url.origin}/api/kroger/auth/callback`;

    const authorizeUrl = buildAuthorizeUrl({
      clientId: context.env.KROGER_CLIENT_ID,
      redirectUri,
      scope: REQUESTED_SCOPES,
      state,
      codeChallenge: challenge,
    });

    return Response.redirect(authorizeUrl, 302);
  } catch (error) {
    return errorResponse(`Failed to start OAuth: ${(error as Error).message}`);
  }
};

function isSafeReturnUrl(url: string): boolean {
  // Only allow relative URLs starting with / and not //
  return url.startsWith('/') && !url.startsWith('//');
}

function errorResponse(message: string): Response {
  return new Response(`<html><body><h1>OAuth Error</h1><p>${escapeHtml(message)}</p><a href="/">Return to CartKey</a></body></html>`, {
    status: 500,
    headers: { 'Content-Type': 'text/html' },
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
