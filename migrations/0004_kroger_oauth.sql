-- ─── Kroger User OAuth Session Storage ───
--
-- Stores per-user OAuth state and refresh tokens.
-- Each session is identified by an opaque session_id (HttpOnly cookie).
-- Access tokens are short-lived (30min) and stored in KV with TTL.
-- Refresh tokens are long-lived and stored in D1, encrypted at rest by Cloudflare.

CREATE TABLE IF NOT EXISTS kroger_sessions (
  session_id TEXT PRIMARY KEY,
  refresh_token TEXT NOT NULL,
  refresh_expires_at TEXT NOT NULL,
  scope TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── OAuth State (CSRF protection) ───
--
-- Short-lived state tokens for the OAuth authorization redirect.
-- Generated when user clicks "Connect Kroger", verified on callback.
-- TTL: 10 minutes.

CREATE TABLE IF NOT EXISTS kroger_oauth_state (
  state TEXT PRIMARY KEY,
  code_verifier TEXT NOT NULL,
  return_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_kroger_state_age ON kroger_oauth_state(created_at);
CREATE INDEX idx_kroger_sessions_age ON kroger_sessions(last_used_at);
