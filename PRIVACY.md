# Privacy Policy

**Last updated: April 15, 2026**

CartKey is built by BlackAtlas LLC. This document explains what data CartKey collects, how it is used, and what control you have over it.

The short version: **CartKey does not have a server-side database for user data, does not have user accounts, does not track you, and does not send your information anywhere.** Everything stays on your device.

## What CartKey Stores

The following information is stored locally in your browser's `localStorage` on the device where you use CartKey:

- Loyalty card numbers, store IDs, and optional phone numbers you enter
- Dietary preferences and allergens you select during onboarding
- Manual coupons you create (description, discount, optional barcode, expiration)
- Shopping lists and items you add
- Meal plans and pantry items
- Budget configuration and purchase history (from manual entry or receipt scans)
- Theme preference (light, dark, or system)
- Notification read state
- Pending trip state (when a shopping list is checked off near a store)

This data never leaves your device unless you explicitly export it via the backup feature.

## What CartKey Does Not Store

CartKey does not collect, store, or transmit:

- Personally identifiable information (your name, email, address, or government ID)
- Payment information
- Account credentials for any retailer
- Photos or images (receipt photos are processed in your browser by Tesseract.js OCR and discarded after text extraction)
- Behavioral analytics or usage tracking from within the app
- Any data through advertising networks (CartKey shows no ads)

## Geolocation

CartKey requests access to your device's location only when you tap a location button or open the app and have geolocation enabled. Location data is used solely to match your current position against a local database of grocery store coordinates and surface the appropriate loyalty card. Your location is never transmitted to any server, never stored long-term, and never associated with any identifier.

You can deny location access at any time through your browser or device settings. CartKey will continue to function without it — you'll just need to manually open the relevant loyalty card when you arrive at a store.

## Camera Access

Camera access is requested only when you tap the receipt scan button. Receipt images are processed entirely in your browser by Tesseract.js (a JavaScript OCR library that runs locally) to extract text. Images are never uploaded, stored, or transmitted anywhere. After OCR completes, the image is discarded; only the structured line item data is saved to your purchase history if you choose to save the receipt.

## Cookies and Tracking

CartKey uses no cookies. CartKey uses no tracking pixels, third-party analytics scripts, advertising networks, or fingerprinting techniques. Page navigations within CartKey are not logged anywhere.

If we add Cloudflare Web Analytics in the future, it will be the privacy-respecting kind that uses no cookies and collects no individually identifiable information. We will update this document if and when that happens.

## Third-Party Services

CartKey loads two external resources at runtime:

- **Google Fonts** (fonts.googleapis.com) for the typography. Google may log the IP address of font requests per Google's own privacy policies. This loading is done by your browser and CartKey has no knowledge of these requests.
- **Cloudflare** is the hosting provider for the static site. Cloudflare logs basic request metadata (IP address, user agent, requested URL) for security and performance reasons under their own privacy policy. Cloudflare does not share this data with us in any identifiable form.

The Coupon Hub feature contains links to retailer websites (Kroger, Safeway, etc.). When you tap one of these links, you leave CartKey and arrive at that retailer's site, which has its own privacy practices.

## Data Export and Deletion

You can export all of your CartKey data as a JSON file at any time through Profile → Data & Backup → Export Backup.

You can delete all of your CartKey data at any time through Profile → Reset All Data, or by clearing your browser's site data for grocery.blackatlas.tech.

Because no copy of your data exists on any server, deletion in the app is genuinely permanent. We have no records to delete on our end because we never received them.

## Children

CartKey is not designed for or directed at children under 13. We do not knowingly collect data from children. Because CartKey collects no personal information from anyone, this is technically a non-issue, but we want to be explicit about it.

## Changes to This Policy

If this policy changes meaningfully, we will update the "Last updated" date at the top and note the change in the GitHub repository's release notes. Because we do not have your contact information, we cannot notify you directly — please check this page periodically if you want to stay current.

## Contact

For privacy questions or concerns, email **privacy@blackatlas.tech**.

For security vulnerabilities, see [SECURITY.md](./SECURITY.md).

The CartKey source code is available at [github.com/YOUR_ORG/cartkey](https://github.com/YOUR_ORG/cartkey) — you can verify any of the claims in this document by reading the code yourself.
