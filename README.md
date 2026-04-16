# 🛒 CartKey

**Every card. Every coupon. One app.**

CartKey is an open-source Progressive Web App that unifies grocery store loyalty cards, coupons, and shopping tools into a single interface. When you approach a store, CartKey surfaces your loyalty barcode, available coupons, and weekly ad deals — filtered to your dietary preferences.

## Features

### Phase 1 — Foundation
- **Loyalty Card Vault** — Store unlimited loyalty cards with barcode rendering (Code 128, EAN-13, UPC-A, PDF417, QR, Aztec)
- **Store Detection** — Geolocation-based auto-detection of nearby stores
- **Apple/Google Wallet** — Generate wallet passes for lock-screen barcode access
- **Dietary Profiles** — Set diet type and FDA Top 9 allergen preferences
- **Offline Support** — Full PWA with service worker caching
- **Guided Onboarding** — First card added in under 60 seconds

### Phase 2 — Coupon Engine
- **Coupon Browser** — Search, filter, and clip coupons with dietary awareness
- **Weekly Ad Browser** — Browse store circulars with unit pricing and sale data
- **Dietary Filtering** — Auto-hide coupons that conflict with your allergens or diet
- **Notification Center** — Alerts for new coupons, expiring deals, and weekly ad drops
- **Coupon Clipping** — Save coupons for a checkout-ready scannable list

### Phase 3 — Shopping Lists & Meal Planning
- **Shopping Lists** — Create multiple lists with auto-categorization by grocery aisle
- **Coupon Matching** — Auto-detect coupons that match items on your list with inline clip
- **Meal Planner** — Weekly calendar with drag-to-assign recipes across 7 days × 4 meal slots
- **Recipe Browser** — Browse and expand recipes with ingredients and step-by-step instructions
- **List Generation** — One-tap generate a shopping list from your meal plan with ingredient aggregation
- **Pantry Tracker** — Track items on hand; meal plan list generation subtracts pantry stock
- **Savings Estimation** — See estimated coupon savings per shopping list

### Phase 4 — Receipt Intelligence, Budgeting & Price Intelligence
- **Receipt Scanning** — Camera-based OCR via Tesseract.js with client-side image preprocessing (grayscale, contrast, threshold)
- **15-Store Detection** — Auto-identifies Kroger, Safeway, Walmart, Target, Costco, Trader Joe's, Whole Foods, Aldi, Publix, H-E-B, Wegmans, Harris Teeter, Food Lion, Giant Food, Lidl from receipt text
- **Receipt Correction UI** — Review, edit, add, and remove OCR-extracted items with confidence scoring before saving
- **Budget Dashboard** — Configurable weekly/biweekly/monthly budget with color-coded gauge, per-day pacing, and threshold alerts
- **Category Spending Limits** — Optional per-category caps with over-limit warnings
- **Weekly Spending Trend** — 4-week SVG bar chart on the budget overview
- **Manual Purchase Logging** — Enter items and prices by hand when no receipt is available
- **Savings Goal Tracking** — Monthly savings target with coupon and price-optimization progress
- **Unit Price Normalization** — Calculates $/oz, $/lb, $/gal, $/each from receipt weight data for true value comparison
- **Price History** — Per-product price tracking with SVG line charts, min/max/avg, and store comparison
- **Price Direction Detection** — Flags products trending up (potential shrinkflation) vs. stable or falling
- **Missed Savings Detection** — Identifies coupons that were available for items you bought but didn't clip
- **Smart Recommendations** — Suggests coupons based on your purchase frequency with one-tap clip
- **Monthly Trends** — 6-month spending and savings history with SVG charts and category breakdowns
- **Crowdsource-Ready** — Anonymous price submission schema and API endpoint ready for community price data

## Quick Start

```bash
# Clone
git clone https://github.com/blackatlas/cartkey.git
cd cartkey

# Install
npm install

# Development (frontend only)
npm run dev

# Run tests
npm test

# Development (full Cloudflare Pages emulation)
npx wrangler pages dev -- npm run dev

# Build for production
npm run build
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| PWA | Workbox (via vite-plugin-pwa) |
| Hosting | Cloudflare Pages |
| Database | Cloudflare D1 (SQLite) |
| Cache | Cloudflare KV |
| Storage | Cloudflare R2 |
| API | Cloudflare Pages Functions |

## Project Structure

```
cartkey/
├── public/          # Static assets, PWA manifest, Cloudflare headers
├── src/
│   ├── components/  # React components organized by feature
│   ├── data/        # Store database, coupon data, dietary constants
│   ├── hooks/       # Custom React hooks (storage, geolocation)
│   ├── lib/         # Utilities (barcode encoder, geo, types)
│   ├── App.tsx      # Main application shell
│   └── main.tsx     # Entry point
├── functions/       # Cloudflare Pages Functions (API routes)
├── migrations/      # D1 database migrations
├── wrangler.toml    # Cloudflare configuration
└── vite.config.ts   # Vite + PWA configuration
```

## Deployment

CartKey deploys automatically via Cloudflare Pages connected to GitHub.

1. Push to `main` → production at `grocery.blackatlas.tech`
2. Push to any branch → preview deployment at a unique URL

### Manual Setup

```bash
# Create D1 database
npx wrangler d1 create cartkey-db

# Apply migrations
npx wrangler d1 migrations apply cartkey-db

# Deploy
npx wrangler pages deploy dist
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. All contributions welcome:

- 🏪 Add new store chains to the database
- 🏷️ Write coupon source adapters
- 🗺️ Submit store aisle layouts
- 🌍 Translate to new languages
- ♿ Accessibility testing
- 📖 Documentation

## License

[MIT](LICENSE) — BlackAtlas LLC
