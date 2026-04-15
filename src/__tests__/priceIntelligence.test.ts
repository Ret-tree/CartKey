import { describe, it, expect } from 'vitest';
import {
  parseWeight, normalizeToOz, calculateUnitPrice, buildPriceHistory,
  getTopProducts, getPriceAlerts, detectMissedSavings, generateRecommendations,
  getMonthlyHistory, preparePriceSubmissions,
} from '../data/priceIntelligence';
import type { PurchaseRecord, PurchaseItem } from '../data/budget';
import type { Coupon } from '../lib/types';

// ─── Helpers ───
const makeItem = (name: string, price: number, qty = 1): PurchaseItem => ({
  name, quantity: qty, unitPrice: price / qty, totalPrice: price, category: 'other', couponApplied: false, couponSavings: 0,
});

const makePurchase = (id: string, items: PurchaseItem[], store = 'kroger', storeName = 'Kroger', daysAgo = 0): PurchaseRecord => {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return { id, date: d.toISOString(), storeName, storeId: store, items, subtotal: items.reduce((s, i) => s + i.totalPrice, 0), couponSavings: 0, total: items.reduce((s, i) => s + i.totalPrice, 0), source: 'manual' };
};

// ─── parseWeight ───
describe('parseWeight', () => {
  it('parses "24 oz"', () => {
    const r = parseWeight('Cereal 24 oz');
    expect(r).not.toBeNull();
    expect(r!.value).toBe(24);
    expect(r!.unit).toBe('oz');
  });

  it('parses "1.5 lb"', () => {
    const r = parseWeight('Chicken 1.5 lb');
    expect(r!.value).toBe(1.5);
    expect(r!.unit).toBe('lb');
  });

  it('parses "500 g"', () => {
    const r = parseWeight('Pasta 500 g');
    expect(r!.value).toBe(500);
    expect(r!.unit).toBe('g');
  });

  it('parses "1 gal"', () => {
    const r = parseWeight('Milk 1 gal');
    expect(r!.value).toBe(1);
    expect(r!.unit).toBe('gal');
  });

  it('returns null for no weight', () => {
    expect(parseWeight('Bananas')).toBeNull();
  });
});

// ─── normalizeToOz ───
describe('normalizeToOz', () => {
  it('converts lb to oz', () => {
    expect(normalizeToOz({ value: 1, unit: 'lb' })).toBe(16);
    expect(normalizeToOz({ value: 2.5, unit: 'lb' })).toBe(40);
  });

  it('keeps oz as oz', () => {
    expect(normalizeToOz({ value: 12, unit: 'oz' })).toBe(12);
  });

  it('converts gal to oz', () => {
    expect(normalizeToOz({ value: 1, unit: 'gal' })).toBe(128);
  });

  it('returns null for unknown unit', () => {
    expect(normalizeToOz({ value: 1, unit: 'bushel' })).toBeNull();
  });
});

// ─── calculateUnitPrice ───
describe('calculateUnitPrice', () => {
  it('calculates per-oz price from weight in name', () => {
    const item = makeItem('Cereal 24 oz', 4.99);
    const up = calculateUnitPrice(item);
    expect(up.pricePerOz).toBeCloseTo(4.99 / 24, 2);
    expect(up.displayUnit).toBe('/oz');
  });

  it('calculates per-lb price', () => {
    const item = makeItem('Chicken 2 lb', 8.99);
    const up = calculateUnitPrice(item);
    expect(up.displayUnit).toBe('/lb');
    expect(up.pricePerUnit).toBeCloseTo(8.99 / 2, 2);
  });

  it('calculates per-each for multi-quantity items', () => {
    const item = makeItem('Yogurt', 6.00, 3);
    const up = calculateUnitPrice(item);
    expect(up.displayUnit).toBe('/ea');
    expect(up.pricePerUnit).toBeCloseTo(2.00, 2);
  });

  it('returns per-each for items with no weight', () => {
    const item = makeItem('Bread', 3.49);
    const up = calculateUnitPrice(item);
    expect(up.displayUnit).toBe('/ea');
    expect(up.pricePerUnit).toBe(3.49);
  });

  it('uses itemDescription override for weight parsing', () => {
    const item = makeItem('Milk', 3.99);
    const up = calculateUnitPrice(item, 'Milk 1 gal');
    expect(up.displayUnit).toBe('/gal');
  });
});

// ─── buildPriceHistory ───
describe('buildPriceHistory', () => {
  it('groups purchases by product name', () => {
    const purchases = [
      makePurchase('p1', [makeItem('Milk', 3.99)], 'kroger', 'Kroger', 7),
      makePurchase('p2', [makeItem('Milk', 4.29)], 'safeway', 'Safeway', 3),
      makePurchase('p3', [makeItem('Bread', 3.49)], 'kroger', 'Kroger', 5),
    ];
    const history = buildPriceHistory(purchases);
    expect(history.size).toBe(2);
    expect(history.get('milk')!.pricePoints).toHaveLength(2);
    expect(history.get('bread')!.pricePoints).toHaveLength(1);
  });

  it('calculates min/max/avg correctly', () => {
    const purchases = [
      makePurchase('p1', [makeItem('Milk', 3.50)], 'kroger', 'Kroger', 10),
      makePurchase('p2', [makeItem('Milk', 4.50)], 'safeway', 'Safeway', 5),
      makePurchase('p3', [makeItem('Milk', 4.00)], 'kroger', 'Kroger', 1),
    ];
    const h = buildPriceHistory(purchases).get('milk')!;
    expect(h.lowestPrice).toBe(3.50);
    expect(h.highestPrice).toBe(4.50);
    expect(h.averagePrice).toBe(4.00);
    expect(h.lowestStore).toBe('Kroger');
  });

  it('detects price direction', () => {
    const purchases = [
      makePurchase('p1', [makeItem('Eggs', 3.00)], 'kroger', 'Kroger', 30),
      makePurchase('p2', [makeItem('Eggs', 5.00)], 'kroger', 'Kroger', 1),
    ];
    const h = buildPriceHistory(purchases).get('eggs')!;
    expect(h.priceDirection).toBe('up');
    expect(h.changePercent).toBeGreaterThan(50);
  });

  it('returns empty map for no purchases', () => {
    expect(buildPriceHistory([]).size).toBe(0);
  });
});

// ─── getTopProducts / getPriceAlerts ───
describe('getTopProducts', () => {
  it('returns products sorted by purchase count', () => {
    const purchases = [
      makePurchase('p1', [makeItem('Milk', 4), makeItem('Bread', 3)], 'kroger', 'Kroger', 7),
      makePurchase('p2', [makeItem('Milk', 4)], 'kroger', 'Kroger', 3),
    ];
    const h = buildPriceHistory(purchases);
    const top = getTopProducts(h, 5);
    expect(top[0].productName.toLowerCase()).toBe('milk');
  });
});

describe('getPriceAlerts', () => {
  it('flags products with >10% increase', () => {
    const purchases = [
      makePurchase('p1', [makeItem('Gas', 3.00)], 'kroger', 'Kroger', 30),
      makePurchase('p2', [makeItem('Gas', 4.00)], 'kroger', 'Kroger', 1), // 33% increase
    ];
    const alerts = getPriceAlerts(buildPriceHistory(purchases));
    expect(alerts.length).toBe(1);
    expect(alerts[0].productName.toLowerCase()).toBe('gas');
  });

  it('does not flag stable prices', () => {
    const purchases = [
      makePurchase('p1', [makeItem('Water', 1.00)], 'kroger', 'Kroger', 30),
      makePurchase('p2', [makeItem('Water', 1.02)], 'kroger', 'Kroger', 1),
    ];
    expect(getPriceAlerts(buildPriceHistory(purchases))).toHaveLength(0);
  });
});

// ─── detectMissedSavings ───
describe('detectMissedSavings', () => {
  const mockCoupon: Coupon = {
    id: 'c-test', source: 'manufacturer', retailerIds: ['kroger'], productName: 'Milk', brand: 'Horizon',
    description: '$1 off milk', discountType: 'fixed', discountValue: 1.00, minPurchase: 0,
    validFrom: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    categories: ['dairy'], upcCodes: [], dietaryTags: [], allergens: [], verified: true, upvotes: 10, downvotes: 0,
  };

  it('detects missed coupon for purchased item', () => {
    const purchases = [makePurchase('p1', [makeItem('Milk', 4.99)])];
    const missed = detectMissedSavings(purchases, [mockCoupon], []);
    expect(missed.length).toBe(1);
    expect(missed[0].couponDiscount).toBe(1.00);
  });

  it('does not flag if coupon was clipped', () => {
    const purchases = [makePurchase('p1', [makeItem('Milk', 4.99)])];
    const missed = detectMissedSavings(purchases, [mockCoupon], ['c-test']);
    expect(missed).toHaveLength(0);
  });

  it('does not flag if coupon is for wrong store', () => {
    const purchases = [makePurchase('p1', [makeItem('Milk', 4.99)], 'walmart', 'Walmart')];
    const missed = detectMissedSavings(purchases, [mockCoupon], []);
    expect(missed).toHaveLength(0);
  });

  it('handles no purchases', () => {
    expect(detectMissedSavings([], [mockCoupon], [])).toHaveLength(0);
  });
});

// ─── generateRecommendations ───
describe('generateRecommendations', () => {
  const mockCoupon: Coupon = {
    id: 'c-rec', source: 'manufacturer', retailerIds: ['kroger'], productName: 'Yogurt', brand: 'Chobani',
    description: '$1 off yogurt', discountType: 'fixed', discountValue: 1.00, minPurchase: 0,
    validFrom: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    categories: ['dairy'], upcCodes: [], dietaryTags: [], allergens: [], verified: true, upvotes: 50, downvotes: 1,
  };

  it('recommends coupons for frequently purchased products', () => {
    const purchases = [
      makePurchase('p1', [makeItem('Yogurt', 5.99)], 'kroger', 'Kroger', 14),
      makePurchase('p2', [makeItem('Yogurt', 5.99)], 'kroger', 'Kroger', 7),
    ];
    const recs = generateRecommendations(purchases, [mockCoupon], []);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].productName).toBe('Yogurt');
  });

  it('does not recommend already-clipped coupons', () => {
    const purchases = [makePurchase('p1', [makeItem('Yogurt', 5.99)])];
    const recs = generateRecommendations(purchases, [mockCoupon], ['c-rec']);
    expect(recs).toHaveLength(0);
  });
});

// ─── getMonthlyHistory ───
describe('getMonthlyHistory', () => {
  it('returns correct number of months', () => {
    expect(getMonthlyHistory([], 6)).toHaveLength(6);
    expect(getMonthlyHistory([], 3)).toHaveLength(3);
  });

  it('last entry is current month', () => {
    const data = getMonthlyHistory([], 6);
    const expected = new Date().toLocaleDateString('en-US', { month: 'short' });
    expect(data[data.length - 1].month).toBe(expected);
  });

  it('sums purchases within each month', () => {
    const purchases = [
      makePurchase('p1', [makeItem('A', 50)], 'kroger', 'Kroger', 0),
      makePurchase('p2', [makeItem('B', 30)], 'kroger', 'Kroger', 1),
    ];
    const data = getMonthlyHistory(purchases, 1);
    expect(data[0].totalSpent).toBe(80);
  });
});

// ─── preparePriceSubmissions ───
describe('preparePriceSubmissions', () => {
  it('creates anonymous submissions from purchase', () => {
    const purchase = makePurchase('p1', [makeItem('Milk 1 gal', 3.99), makeItem('Bread', 3.49)]);
    const subs = preparePriceSubmissions(purchase);
    expect(subs).toHaveLength(2);
    expect(subs[0].normalizedName).toBe('milk 1 gal');
    expect(subs[0].storeId).toBe('kroger');
    expect(subs[0].unitPricePerOz).not.toBeNull(); // has weight
    expect(subs[1].unitPricePerOz).toBeNull();     // no weight
  });

  it('strips dates to date-only format', () => {
    const purchase = makePurchase('p1', [makeItem('Apple', 1.50)]);
    const subs = preparePriceSubmissions(purchase);
    expect(subs[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
