import { describe, it, expect } from 'vitest';
import {
  detectStore, extractDate, parseLineItem, parseReceipt,
  parsedItemsToPurchaseItems, SAMPLE_RECEIPT_TEXT,
} from '../data/receiptParser';

describe('detectStore', () => {
  it('detects Kroger from header text', () => {
    const result = detectStore('KROGER\n123 Main St\nSome City');
    expect(result.id).toBe('kroger');
    expect(result.name).toBe('Kroger');
  });

  it('detects Walmart with spacing variations', () => {
    expect(detectStore('WAL-MART\nStore #1234').id).toBe('walmart');
    expect(detectStore('Walmart Supercenter').id).toBe('walmart');
  });

  it('detects Trader Joes', () => {
    expect(detectStore("TRADER JOE'S\n123 Main").id).toBe('traderjoes');
  });

  it('detects Whole Foods', () => {
    expect(detectStore('Whole Foods Market').id).toBe('wholefds');
  });

  it('detects H-E-B with variations', () => {
    expect(detectStore('H-E-B\nHouston TX').id).toBe('heb');
    expect(detectStore('HEB Grocery').id).toBe('heb');
  });

  it('returns other for unknown stores', () => {
    expect(detectStore('RANDOM CORNER STORE\n123 Main').id).toBe('other');
  });

  it('detects store from body if not in header', () => {
    expect(detectStore('Some text\nMore text\nSafeway #1234').id).toBe('safeway');
  });
});

describe('extractDate', () => {
  it('extracts MM/DD/YYYY format', () => {
    expect(extractDate('some line\n04/14/2026\nanother line')).toBe('2026-04-14');
  });

  it('extracts MM-DD-YYYY format', () => {
    expect(extractDate('date: 04-14-2026 10:32')).toBe('2026-04-14');
  });

  it('extracts MM/DD/YY format', () => {
    const result = extractDate('04/14/26');
    expect(result).toBe('2026-04-14');
  });

  it('returns today when no date found', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(extractDate('no date here')).toBe(today);
  });
});

describe('parseLineItem', () => {
  it('parses standard item with dollar sign', () => {
    const item = parseLineItem('ORGANIC MILK          $4.99');
    expect(item).not.toBeNull();
    expect(item!.name).toBe('ORGANIC MILK');
    expect(item!.totalPrice).toBe(4.99);
    expect(item!.category).toBe('dairy');
  });

  it('parses item without dollar sign', () => {
    const item = parseLineItem('WHEAT BREAD           3.49');
    expect(item).not.toBeNull();
    expect(item!.name).toBe('WHEAT BREAD');
    expect(item!.totalPrice).toBe(3.49);
  });

  it('parses item with trailing letter (tax flag)', () => {
    const item = parseLineItem('CHICKEN BREAST        $8.99 F');
    expect(item).not.toBeNull();
    expect(item!.name).toBe('CHICKEN BREAST');
    expect(item!.totalPrice).toBe(8.99);
  });

  it('detects coupon lines', () => {
    const item = parseLineItem('STORE CPN -MILK       $1.00');
    expect(item).not.toBeNull();
    expect(item!.isCoupon).toBe(true);
  });

  it('detects MFR coupon lines', () => {
    const item = parseLineItem('MFR CPN -BREAD        $0.50');
    expect(item).not.toBeNull();
    expect(item!.isCoupon).toBe(true);
  });

  it('auto-categorizes items', () => {
    const milk = parseLineItem('MILK 2%               $3.99');
    expect(milk!.category).toBe('dairy');

    const chicken = parseLineItem('CHICKEN THIGHS        $6.99');
    expect(chicken!.category).toBe('meat');

    const soap = parseLineItem('DISH SOAP             $3.49');
    expect(soap!.category).toBe('household');
  });

  it('returns null for divider lines', () => {
    expect(parseLineItem('=========================')).toBeNull();
    expect(parseLineItem('***********')).toBeNull();
  });

  it('returns null for skip lines', () => {
    expect(parseLineItem('CASHIER: John')).toBeNull();
    expect(parseLineItem('THANK YOU FOR SHOPPING')).toBeNull();
    expect(parseLineItem('VISA ****1234')).toBeNull();
  });

  it('returns null for empty/short lines', () => {
    expect(parseLineItem('')).toBeNull();
    expect(parseLineItem('AB')).toBeNull();
  });

  it('returns null for lines without prices', () => {
    expect(parseLineItem('Just some text without a price')).toBeNull();
  });
});

describe('parseReceipt (full)', () => {
  it('parses the sample Kroger receipt', () => {
    const result = parseReceipt(SAMPLE_RECEIPT_TEXT, 0.92);

    expect(result.storeName).toBe('Kroger');
    expect(result.storeId).toBe('kroger');
    expect(result.date).toBe('2026-04-14');
    expect(result.items.length).toBeGreaterThanOrEqual(8);
    expect(result.couponSavings).toBeGreaterThan(0);
    expect(result.subtotal).toBe(53.00);
    expect(result.tax).toBe(0.87);
    expect(result.total).toBe(52.37);
    expect(result.confidence).toBe(0.92);
  });

  it('extracts coupons separately from items', () => {
    const result = parseReceipt(SAMPLE_RECEIPT_TEXT, 0.9);
    const couponItems = result.items.filter((i) => i.isCoupon);
    expect(couponItems).toHaveLength(0); // coupons go to couponSavings, not items
    expect(result.couponSavings).toBe(1.50); // $1.00 + $0.50
  });

  it('categorizes detected items', () => {
    const result = parseReceipt(SAMPLE_RECEIPT_TEXT, 0.9);
    const categories = new Set(result.items.map((i) => i.category));
    expect(categories.size).toBeGreaterThan(1);
  });

  it('handles empty text', () => {
    const result = parseReceipt('', 0.5);
    expect(result.items).toHaveLength(0);
    expect(result.storeName).toBe('Unknown Store');
    expect(result.total).toBeNull();
  });

  it('handles text with no parseable items', () => {
    const result = parseReceipt('THANK YOU\nCOME AGAIN', 0.3);
    expect(result.items).toHaveLength(0);
  });
});

describe('parsedItemsToPurchaseItems', () => {
  it('converts parsed items to purchase items', () => {
    const result = parseReceipt(SAMPLE_RECEIPT_TEXT, 0.9);
    const purchaseItems = parsedItemsToPurchaseItems(result.items);
    expect(purchaseItems.length).toBeGreaterThan(0);
    purchaseItems.forEach((item) => {
      expect(item.name).toBeTruthy();
      expect(item.totalPrice).toBeGreaterThan(0);
      expect(item.category).toBeTruthy();
    });
  });

  it('filters out coupon items', () => {
    const items = [
      { name: 'Milk', quantity: 1, unitPrice: 4, totalPrice: 4, category: 'dairy', isCoupon: false, raw: '' },
      { name: 'Coupon', quantity: 1, unitPrice: 1, totalPrice: -1, category: 'other', isCoupon: true, raw: '' },
    ];
    const result = parsedItemsToPurchaseItems(items);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Milk');
  });
});
