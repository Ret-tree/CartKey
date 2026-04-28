# CartKey

One key to every loyalty card and coupon you use at the grocery store.

CartKey is an open-source progressive web app that consolidates loyalty cards, manual coupons, shopping lists, meal planning, budget tracking, and receipt scanning into a single tool. Built for shoppers who want one app open at the register instead of fumbling through five.

Live at [grocery.blackatlas.tech](https://grocery.blackatlas.tech).

## What It Does

**Loyalty Card Vault.** Store loyalty cards for 15 major US grocery chains (Kroger, Safeway, Walmart, Target, Costco, Trader Joe's, Whole Foods, Aldi, Publix, H-E-B, Wegmans, Harris Teeter, Food Lion, Giant Food, Lidl) plus a generic option. Each card uses the correct barcode symbology for its retailer (Code 128 for most, QR for Walmart/Whole Foods/Aldi/Lidl). Per-retailer card number validation catches typos before saving. Phone number alternate lookup for stores that accept it on the PIN pad.

**Geolocation.** When you open CartKey near a real grocery store location (48 stores across the Northern Virginia and DC metro area are pre-loaded), it surfaces the matching loyalty card on the home screen. The OpenStreetMap import script in `scripts/import-stores.ts` lets you expand the location database to any region.

**Checkout Mode.** A full-screen flow optimized for the register. Loyalty card barcode displays large with screen wake lock active. Swipe through any saved coupon barcodes for the current store. Mark coupons used and optionally log the trip to your budget — all without unlocking your phone again.

**Coupon Hub.** Direct deep links to every retailer's official coupon page (Kroger Plus, Safeway Just for U, Target Circle, etc.) — manage your digital coupons through the real systems. A manual coupon tracker for paper coupons, mailers, and in-store printouts with optional barcode storage so they appear in checkout mode.

**Shopping Lists.** Create multiple lists with 13-category auto-categorization by grocery aisle. Quick item entry, quantity adjustment, finish-trip prompt when all items are checked.

**Meal Planning.** Seven-day calendar with breakfast, lunch, dinner, and snack slots. Six sample recipes with full ingredients and instructions. Generate a shopping list from your meal plan with ingredient aggregation that automatically subtracts items already in your pantry.

**Pantry Tracker.** Track items on hand with optional expiration dates so meal-plan list generation skips what you already have.

**Budget & Spending.** Configurable weekly, biweekly, or monthly budget with color-coded gauge, per-day pacing, and threshold alerts. Optional category spending limits. Manual purchase logging or automatic logging from checkout mode.

**Receipt Scanning.** Camera-based OCR via Tesseract.js. Recognizes 15 store receipt formats. Review and correct extracted line items before saving. Receipts feed the budget and price history automatically.

**Price Intelligence.** Per-product price tracking with SVG line charts, store comparison, and direction detection (rising, falling, stable). Unit price normalization to dollars per ounce, pound, or gallon for true value comparison. Six-month spending and savings trends. Category breakdown.

**Data Backup.** Export everything to a JSON file. Restore from any backup file. Your data lives only on your device — backups protect against device loss or browser data clearing.

**Privacy.** No accounts, no servers, no tracking, no ads. Every byte of personal data is stored in your browser's localStorage. Geolocation is requested only when you tap the location button. Read [PRIVACY.md](./PRIVACY.md) for details.

## What It Doesn't Do (Yet)

**Live digital coupon discovery.** The Coupon Hub links to retailer coupon pages but doesn't pull coupons into CartKey. Direct integrations with Kroger and other retailer APIs are planned. The architecture is in place; the partnerships are not.

**Cross-device sync.** Data is local-only. If you switch phones or clear your browser, you'll need to import a backup file.

**Multi-user accounts.** CartKey is a single-user app today.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Barcode rendering:** [bwip-js](https://github.com/metafloor/bwip-js) — battle-tested, supports 200+ symbologies
- **OCR:** Tesseract.js (lazy-loaded, ~15 KB chunk)
- **Storage:** Browser localStorage
- **Hosting:** Cloudflare Pages (static site)
- **PWA:** Vite PWA plugin with service worker caching

## Quick Start

```bash
git clone https://github.com/YOUR_ORG/cartkey.git
cd cartkey
npm install
npm run dev      # Vite dev server at localhost:8080
npm test         # 166 tests across 6 suites
npm run build    # Production output in dist/
```

## Deployment

The app deploys as a pure static site to Cloudflare Pages. Connect your GitHub fork to a Cloudflare Pages project, set build command to `npm run build` and output directory to `dist`, set the `NODE_VERSION` environment variable to `20`, and push to deploy.

The `functions/api/` directory and `migrations/` SQL files are present for future server-side coupon API integration but are unused by the current build — you can ignore them at deploy time.

## Project Structure

```
cartkey/
├── src/
│   ├── App.tsx                    # Main app shell
│   ├── components/
│   │   ├── onboarding/            # First-run setup
│   │   ├── cards/                 # Loyalty cards & barcodes
│   │   ├── coupons/               # CouponHub & notifications
│   │   ├── shopping/              # Lists & pantry
│   │   ├── meals/                 # Meal planner
│   │   ├── budget/                # Budget & price intelligence
│   │   ├── receipts/              # OCR scanner & correction
│   │   ├── checkout/              # Register flow
│   │   └── Icons.tsx              # SVG icon set
│   ├── data/                      # Stores, locations, coupons (mock fallback), recipes
│   ├── lib/                       # Validation, barcode, geo, export utilities
│   ├── hooks/                     # Storage, geolocation
│   └── __tests__/                 # 166 tests
├── functions/api/                 # Cloudflare Pages Functions (unused at present)
├── migrations/                    # D1 schema (unused at present)
├── scripts/import-stores.ts       # OpenStreetMap location importer
└── public/                        # Icons, manifest
```

## Adding a Region

To add real store locations for a region beyond Northern Virginia:

```bash
npx tsx scripts/import-stores.ts --bbox SOUTH,WEST,NORTH,EAST
```

For example, the full DC metro: `--bbox 38.7,-77.6,39.2,-76.8`. The script queries OpenStreetMap's Overpass API and writes a typed location file. Merge the output into `src/data/storeLocations.ts`.

## Contributing

CartKey is MIT-licensed and contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the development workflow and code conventions.

Open an issue at [github.com/YOUR_ORG/cartkey/issues](https://github.com/YOUR_ORG/cartkey/issues) for bugs, feature requests, or general feedback.

## License

MIT — Copyright (c) BlackAtlas LLC. See [LICENSE](./LICENSE).

## Security

If you discover a security vulnerability, please email security@blackatlas.tech rather than opening a public issue. See [SECURITY.md](./SECURITY.md) for details.
