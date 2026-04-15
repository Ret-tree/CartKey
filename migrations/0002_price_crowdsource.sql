-- CartKey Price Crowdsource Schema v2
-- Stores anonymous price submissions from users

CREATE TABLE IF NOT EXISTS price_submissions (
  id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  price REAL NOT NULL,
  unit_price_per_oz REAL,
  weight TEXT,
  store_id TEXT NOT NULL,
  category TEXT NOT NULL,
  purchase_date TEXT NOT NULL,
  submitted_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (store_id) REFERENCES stores(id)
);

CREATE INDEX idx_prices_product ON price_submissions(normalized_name, store_id);
CREATE INDEX idx_prices_store ON price_submissions(store_id, purchase_date);
CREATE INDEX idx_prices_category ON price_submissions(category);
CREATE INDEX idx_prices_date ON price_submissions(purchase_date);

-- Aggregated view for quick lookups (materialized periodically via Worker cron)
CREATE TABLE IF NOT EXISTS price_aggregates (
  normalized_name TEXT NOT NULL,
  store_id TEXT NOT NULL,
  category TEXT NOT NULL,
  avg_price REAL NOT NULL,
  min_price REAL NOT NULL,
  max_price REAL NOT NULL,
  avg_unit_price_per_oz REAL,
  sample_count INTEGER NOT NULL,
  last_updated TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (normalized_name, store_id)
);
