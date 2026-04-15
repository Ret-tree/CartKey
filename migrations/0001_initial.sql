-- CartKey Database Schema v1
-- Cloudflare D1 (SQLite)

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  icon TEXT NOT NULL DEFAULT '🏷️',
  barcode_type TEXT NOT NULL DEFAULT 'Code 128',
  latitude REAL,
  longitude REAL,
  address TEXT,
  chain_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  retailer_ids TEXT NOT NULL DEFAULT '[]',
  product_name TEXT NOT NULL,
  brand TEXT,
  description TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK(discount_type IN ('percent','fixed','bogo','freebie')),
  discount_value REAL NOT NULL,
  min_purchase REAL DEFAULT 0,
  barcode TEXT,
  image_url TEXT,
  valid_from TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  categories TEXT NOT NULL DEFAULT '[]',
  upc_codes TEXT NOT NULL DEFAULT '[]',
  dietary_tags TEXT NOT NULL DEFAULT '[]',
  allergens TEXT NOT NULL DEFAULT '[]',
  verified INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS weekly_ads (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  sale_price REAL NOT NULL,
  original_price REAL,
  unit_price TEXT,
  image_url TEXT,
  category TEXT NOT NULL,
  valid_from TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  dietary_tags TEXT NOT NULL DEFAULT '[]',
  allergens TEXT NOT NULL DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (store_id) REFERENCES stores(id)
);

CREATE INDEX idx_coupons_valid ON coupons(valid_from, valid_until);
CREATE INDEX idx_coupons_categories ON coupons(categories);
CREATE INDEX idx_weekly_ads_store ON weekly_ads(store_id, valid_from, valid_until);
CREATE INDEX idx_stores_location ON stores(latitude, longitude);
