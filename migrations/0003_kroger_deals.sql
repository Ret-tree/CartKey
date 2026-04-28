-- Cached Kroger deals — populated by /api/kroger/deals endpoint
-- TTL is enforced at the KV layer; this table is for analytics/aggregation if needed later

CREATE TABLE IF NOT EXISTS kroger_deals_cache (
  product_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  upc TEXT,
  product_name TEXT NOT NULL,
  brand TEXT,
  regular_price REAL NOT NULL,
  sale_price REAL NOT NULL,
  savings REAL NOT NULL,
  size TEXT,
  image_url TEXT,
  category TEXT,
  retrieved_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (product_id, location_id)
);

CREATE INDEX idx_kroger_deals_location ON kroger_deals_cache(location_id, savings DESC);
CREATE INDEX idx_kroger_deals_category ON kroger_deals_cache(category, location_id);
