// ─── OAuth Helpers ───
//
// PKCE generation, state token utilities, cookie helpers for the Kroger
// authorization_code flow. All methods are stateless and safe to use in
// edge runtime (no Node APIs).

const KROGER_AUTH_BASE = 'https://api.kroger.com/v1/connect/oauth2';

// PKCE: generate a cryptographically random verifier and its SHA-256 challenge
export async function generatePkce(): Promise<{ verifier: string; challenge: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const verifier = base64UrlEncode(bytes);

  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = base64UrlEncode(new Uint8Array(hashBuffer));

  return { verifier, challenge };
}

// Generate a 128-bit random opaque token (state, session_id)
export function generateOpaqueToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Build the authorization URL the user gets redirected to
export function buildAuthorizeUrl(opts: {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge: string;
}): string {
  const url = new URL(`${KROGER_AUTH_BASE}/authorize`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', opts.clientId);
  url.searchParams.set('redirect_uri', opts.redirectUri);
  url.searchParams.set('scope', opts.scope);
  url.searchParams.set('state', opts.state);
  url.searchParams.set('code_challenge', opts.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

// Exchange authorization code for access + refresh tokens
export async function exchangeCodeForTokens(opts: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<TokenResponse> {
  const credentials = btoa(`${opts.clientId}:${opts.clientSecret}`);
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: opts.code,
    redirect_uri: opts.redirectUri,
    code_verifier: opts.codeVerifier,
  });

  const response = await fetch(`${KROGER_AUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${errorText}`);
  }

  return await response.json();
}

// Refresh an expired access token using a refresh token
export async function refreshTokens(opts: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<TokenResponse> {
  const credentials = btoa(`${opts.clientId}:${opts.clientSecret}`);
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: opts.refreshToken,
  });

  const response = await fetch(`${KROGER_AUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${errorText}`);
  }

  return await response.json();
}

// ─── Cookie helpers (HttpOnly session) ───

const SESSION_COOKIE_NAME = 'ck_kr_session';

export function buildSessionCookie(sessionId: string, maxAgeSeconds: number): string {
  return [
    `${SESSION_COOKIE_NAME}=${sessionId}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; ');
}

export function buildClearCookie(): string {
  return [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Max-Age=0',
  ].join('; ');
}

export function getSessionId(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

// ─── Token cache key for KV ───

export function accessTokenKvKey(sessionId: string): string {
  return `kroger:access:${sessionId}`;
}
