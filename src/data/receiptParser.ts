import { autoCategory } from './shopping';
import type { PurchaseItem } from './budget';

// ─── Types ───
export interface ParsedReceipt {
  storeName: string;
  storeId: string;
  date: string;
  items: ParsedLineItem[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  couponSavings: number;
  rawText: string;
  confidence: number; // 0-1 average OCR confidence
}

export interface ParsedLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weight?: string;     // e.g. "1.5 lb", "24 oz"
  category: string;
  isCoupon: boolean;
  raw: string;         // original OCR line
}

// ─── Store Detection ───
const STORE_PATTERNS: { pattern: RegExp; name: string; id: string }[] = [
  { pattern: /kroger/i, name: 'Kroger', id: 'kroger' },
  { pattern: /safeway/i, name: 'Safeway', id: 'safeway' },
  { pattern: /wal[\s-]?mart|walmart/i, name: 'Walmart', id: 'walmart' },
  { pattern: /target/i, name: 'Target', id: 'target' },
  { pattern: /costco/i, name: 'Costco', id: 'costco' },
  { pattern: /trader\s?joe/i, name: "Trader Joe's", id: 'traderjoes' },
  { pattern: /whole\s?foods/i, name: 'Whole Foods', id: 'wholefds' },
  { pattern: /aldi/i, name: 'Aldi', id: 'aldi' },
  { pattern: /publix/i, name: 'Publix', id: 'publix' },
  { pattern: /h[\s-]?e[\s-]?b\b/i, name: 'H-E-B', id: 'heb' },
  { pattern: /wegmans/i, name: 'Wegmans', id: 'wegmans' },
  { pattern: /harris\s?teeter/i, name: 'Harris Teeter', id: 'harristeeter' },
  { pattern: /food\s?lion/i, name: 'Food Lion', id: 'foodlion' },
  { pattern: /giant\s?food|giant\b/i, name: 'Giant Food', id: 'giantfood' },
  { pattern: /lidl/i, name: 'Lidl', id: 'lidl' },
];

export function detectStore(text: string): { name: string; id: string } {
  // Check first 5 lines for store name (usually at top of receipt)
  const headerLines = text.split('\n').slice(0, 8).join(' ');
  for (const sp of STORE_PATTERNS) {
    if (sp.pattern.test(headerLines)) return { name: sp.name, id: sp.id };
  }
  // Fallback: check entire text
  for (const sp of STORE_PATTERNS) {
    if (sp.pattern.test(text)) return { name: sp.name, id: sp.id };
  }
  return { name: 'Unknown Store', id: 'other' };
}

// ─── Date Extraction ───
const DATE_PATTERNS = [
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,           // MM/DD/YYYY or MM-DD-YYYY
  /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,              // YYYY-MM-DD
  /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+(\d{1,2}),?\s+(\d{4})/i, // Month DD, YYYY
];

export function extractDate(text: string): string {
  for (const line of text.split('\n')) {
    for (const pattern of DATE_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        // Try to parse into a valid date
        try {
          const d = new Date(match[0]);
          if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        } catch { /* continue */ }
        // Manual parse for MM/DD/YYYY
        if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(match[0])) {
          const parts = match[0].split(/[\/\-]/);
          let year = parseInt(parts[2]);
          if (year < 100) year += 2000;
          const d = new Date(year, parseInt(parts[0]) - 1, parseInt(parts[1]));
          if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        }
      }
    }
  }
  return new Date().toISOString().split('T')[0];
}

// ─── Line Item Parsing ───

// Common patterns for receipt line items
// "ITEM NAME           $X.XX" or "ITEM NAME      X.XX"
// "2 @ $3.99           $7.98" (quantity pricing)
// "1.5 lb @ $4.99/lb   $7.49" (weighted items)
const PRICE_LINE = /^(.+?)\s+\$?(\d+\.\d{2})\s*([A-Z]?)$/;
const QTY_PRICE_LINE = /^(\d+)\s*[@x]\s*\$?(\d+\.\d{2})\s+\$?(\d+\.\d{2})/i;
const WEIGHT_PRICE_LINE = /^([\d.]+)\s*(lb|oz|kg)\s*[@]\s*\$?([\d.]+)\s*\/\s*(?:lb|oz|kg)\s+\$?([\d.]+)/i;
const COUPON_LINE = /(?:coupon|cpn|disc|saving|mfr\s*cpn|store\s*cpn)/i;
const TOTAL_LINE = /^(?:total|grand\s*total|amount\s*due|balance\s*due)\s+\$?(\d+\.\d{2})/i;
const SUBTOTAL_LINE = /^(?:subtotal|sub\s*total|sub-total)\s+\$?(\d+\.\d{2})/i;
const TAX_LINE = /^(?:tax|sales\s*tax)\s+\$?(\d+\.\d{2})/i;

// Lines to skip entirely
const SKIP_PATTERNS = [
  /^[\s\-=*#]+$/,           // dividers
  /^\d{10,}/,               // barcodes/UPCs
  /^(store|cashier|register|terminal|trans|ref|auth|card|visa|master|debit|credit|change|cash|check)/i,
  /^(thank|welcome|return|refund|receipt|member|phone|address|tel|fax|www|http)/i,
  /^\(\d{3}\)/,             // phone numbers
  /^\d{1,5}\s+[A-Z]/,      // addresses (start with number)
];

export function parseLineItem(line: string): ParsedLineItem | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 3) return null;

  // Check if coupon/discount line FIRST (before skip check)
  const isCoupon = COUPON_LINE.test(trimmed);

  // Skip non-item lines (but NOT coupon lines)
  if (!isCoupon) {
    for (const skip of SKIP_PATTERNS) {
      if (skip.test(trimmed)) return null;
    }
  }

  // Weighted item: "1.5 lb @ $4.99/lb  $7.49"
  const weightMatch = trimmed.match(WEIGHT_PRICE_LINE);
  if (weightMatch) {
    const weight = parseFloat(weightMatch[1]);
    const unit = weightMatch[2];
    const unitPrice = parseFloat(weightMatch[3]);
    const totalPrice = parseFloat(weightMatch[4]);
    return {
      name: `Item (${weight} ${unit})`,
      quantity: 1, unitPrice, totalPrice,
      weight: `${weight} ${unit}`,
      category: 'other', isCoupon: false, raw: trimmed,
    };
  }

  // Quantity item: "2 @ $3.99  $7.98"
  const qtyMatch = trimmed.match(QTY_PRICE_LINE);
  if (qtyMatch) {
    return {
      name: 'Item',
      quantity: parseInt(qtyMatch[1]),
      unitPrice: parseFloat(qtyMatch[2]),
      totalPrice: parseFloat(qtyMatch[3]),
      category: 'other', isCoupon: false, raw: trimmed,
    };
  }

  // Standard item: "ORGANIC MILK  $4.99"
  const priceMatch = trimmed.match(PRICE_LINE);
  if (priceMatch) {
    const name = cleanItemName(priceMatch[1]);
    const price = parseFloat(priceMatch[2]);
    if (name.length < 2 || price <= 0) return null;

    return {
      name,
      quantity: 1,
      unitPrice: price,
      totalPrice: isCoupon ? -price : price,
      category: autoCategory(name),
      isCoupon,
      raw: trimmed,
    };
  }

  return null;
}

function cleanItemName(raw: string): string {
  return raw
    .replace(/\s{2,}/g, ' ')     // collapse whitespace
    .replace(/[#*]+/g, '')        // remove special chars
    .replace(/^\d{5,}\s+/, '')    // remove leading UPC
    .replace(/\s+F$/, '')         // remove tax flag
    .replace(/\s+[A-Z]$/, '')     // remove single trailing letter
    .trim();
}

// ─── Full Receipt Parser ───
export function parseReceipt(rawText: string, confidence: number = 0.8): ParsedReceipt {
  const lines = rawText.split('\n');
  const store = detectStore(rawText);
  const date = extractDate(rawText);

  const items: ParsedLineItem[] = [];
  let subtotal: number | null = null;
  let tax: number | null = null;
  let total: number | null = null;
  let couponSavings = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for summary lines
    const totalMatch = trimmed.match(TOTAL_LINE);
    if (totalMatch) { total = parseFloat(totalMatch[1]); continue; }

    const subMatch = trimmed.match(SUBTOTAL_LINE);
    if (subMatch) { subtotal = parseFloat(subMatch[1]); continue; }

    const taxMatch = trimmed.match(TAX_LINE);
    if (taxMatch) { tax = parseFloat(taxMatch[1]); continue; }

    // Parse line items
    const item = parseLineItem(trimmed);
    if (item) {
      if (item.isCoupon) {
        couponSavings += Math.abs(item.totalPrice);
      } else {
        items.push(item);
      }
    }
  }

  // If no total found, sum items
  if (total === null && items.length > 0) {
    total = items.reduce((s, i) => s + i.totalPrice, 0);
  }

  return {
    storeName: store.name,
    storeId: store.id,
    date,
    items,
    subtotal,
    tax,
    total,
    couponSavings,
    rawText,
    confidence,
  };
}

// ─── Convert ParsedReceipt to PurchaseRecord items ───
export function parsedItemsToPurchaseItems(items: ParsedLineItem[]): PurchaseItem[] {
  return items.filter((i) => !i.isCoupon && i.totalPrice > 0).map((i) => ({
    name: i.name,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    totalPrice: i.totalPrice,
    category: i.category,
    couponApplied: false,
    couponSavings: 0,
  }));
}

// ─── Sample receipt text for testing/demo ───
export const SAMPLE_RECEIPT_TEXT = `KROGER
123 Main Street
Stafford, VA 22554
04/14/2026  10:32 AM

ORGANIC MILK          $4.99
WHEAT BREAD           $3.49
CHICKEN BREAST        $8.99 F
BABY SPINACH          $3.99
KROGER EGGS 12CT      $4.29
CHEDDAR CHEESE        $5.49
BANANAS  2.3 LB       $1.29
GREEK YOGURT          $4.99
PAPER TOWELS          $11.99
DISH SOAP             $3.49
STORE CPN -MILK       $1.00
MFR CPN -BREAD        $0.50

SUBTOTAL              $53.00
TAX                   $0.87
TOTAL                 $52.37

VISA ****1234
THANK YOU FOR SHOPPING`;
