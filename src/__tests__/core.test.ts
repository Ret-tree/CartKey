import { describe, it, expect } from 'vitest';
import { encodeCode128B } from '../lib/barcode';
import { getDistance, findNearestStore, generateId } from '../lib/geo';
import {
  filterCouponsByStore, filterCouponsByDiet, filterCouponsByCategory,
  sortCoupons, isExpiringSoon, isExpired, formatDiscount, MOCK_COUPONS,
} from '../data/coupons';
import { DIET_EXCLUSIONS } from '../data/dietary';
import { STORES } from '../data/stores';
import { STORE_LOCATIONS, findNearestLocation } from '../data/storeLocations';
import type { Coupon } from '../lib/types';

// ─── Barcode Encoder ───
describe('encodeCode128B', () => {
  it('encodes a simple string to binary pattern', () => {
    const result = encodeCode128B('1234');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^[01]+$/);
  });

  it('produces consistent encoding for same input', () => {
    const a = encodeCode128B('A');
    const b = encodeCode128B('A');
    expect(a).toBe(b);
  });

  it('output length increases with input length', () => {
    const short = encodeCode128B('A');
    const long = encodeCode128B('ABCDEF');
    expect(long.length).toBeGreaterThan(short.length);
  });

  it('produces different outputs for different inputs', () => {
    const a = encodeCode128B('ABC');
    const b = encodeCode128B('XYZ');
    expect(a).not.toBe(b);
  });

  it('handles alphanumeric card numbers', () => {
    const result = encodeCode128B('49012345678');
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(50);
  });

  it('handles empty string', () => {
    const result = encodeCode128B('');
    expect(result).toBeTruthy(); // start + checksum + stop
  });
});

// ─── Geo Utilities ───
describe('getDistance', () => {
  it('returns 0 for same point', () => {
    expect(getDistance(38.95, -77.35, 38.95, -77.35)).toBe(0);
  });

  it('returns correct approximate distance for known locations', () => {
    // DC to Baltimore ~55km
    const d = getDistance(38.9072, -77.0369, 39.2904, -76.6122);
    expect(d).toBeGreaterThan(40000);
    expect(d).toBeLessThan(70000);
  });

  it('returns distance in meters', () => {
    // Two points ~1km apart
    const d = getDistance(38.95, -77.35, 38.959, -77.35);
    expect(d).toBeGreaterThan(900);
    expect(d).toBeLessThan(1100);
  });
});

describe('findNearestStore', () => {
  it('finds a store within radius', () => {
    // Use a real Stafford VA location near known stores
    const result = findNearestLocation(38.4743, -77.4280, 500);
    expect(result).not.toBeNull();
    expect(result!.chainId).toBe('kroger');
  });

  it('returns null when no stores within radius', () => {
    const result = findNearestLocation(0, 0, 500);
    expect(result).toBeNull();
  });

  it('skips stores without coordinates', () => {
    const result = findNearestStore(38.95, -77.35, [{ id: 'test', name: 'Test', color: '#000', icon: '🏪', barcodeSymbology: 'code128', supportsPhone: false }], 500);
    expect(result).toBeNull();
  });

  it('respects max distance parameter', () => {
    // Point far from any store
    const result = findNearestLocation(39.5, -78.5, 100);
    expect(result).toBeNull();
  });
});

describe('generateId', () => {
  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it('returns string IDs', () => {
    expect(typeof generateId()).toBe('string');
    expect(generateId().length).toBeGreaterThan(5);
  });
});

// ─── Coupon Filtering ───
describe('filterCouponsByStore', () => {
  it('filters coupons by store ID', () => {
    const result = filterCouponsByStore(MOCK_COUPONS, 'kroger');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((c) => expect(c.retailerIds).toContain('kroger'));
  });

  it('returns empty for unknown store', () => {
    const result = filterCouponsByStore(MOCK_COUPONS, 'nonexistent');
    expect(result).toHaveLength(0);
  });

  it('a coupon available at multiple stores appears for each', () => {
    const c = MOCK_COUPONS.find((c) => c.retailerIds.length > 3)!;
    c.retailerIds.forEach((storeId) => {
      const result = filterCouponsByStore([c], storeId);
      expect(result).toHaveLength(1);
    });
  });
});

describe('filterCouponsByDiet', () => {
  it('filters out dairy coupons for vegan diet', () => {
    const result = filterCouponsByDiet(MOCK_COUPONS, 'vegan', [], DIET_EXCLUSIONS);
    result.forEach((c) => {
      expect(c.allergens).not.toContain('dairy');
      expect(c.allergens).not.toContain('eggs');
    });
  });

  it('filters out explicit allergens', () => {
    const result = filterCouponsByDiet(MOCK_COUPONS, '', ['gluten', 'peanuts'], DIET_EXCLUSIONS);
    result.forEach((c) => {
      expect(c.allergens).not.toContain('gluten');
      expect(c.allergens).not.toContain('peanuts');
    });
  });

  it('combines diet exclusions with explicit allergens', () => {
    // Vegan (excludes dairy, eggs) + explicit gluten allergy
    const result = filterCouponsByDiet(MOCK_COUPONS, 'vegan', ['gluten'], DIET_EXCLUSIONS);
    result.forEach((c) => {
      expect(c.allergens).not.toContain('dairy');
      expect(c.allergens).not.toContain('eggs');
      expect(c.allergens).not.toContain('gluten');
    });
  });

  it('returns all coupons when no restrictions', () => {
    const result = filterCouponsByDiet(MOCK_COUPONS, '', [], DIET_EXCLUSIONS);
    expect(result).toHaveLength(MOCK_COUPONS.length);
  });

  it('returns all coupons for omnivore diet', () => {
    const result = filterCouponsByDiet(MOCK_COUPONS, 'omnivore', [], DIET_EXCLUSIONS);
    expect(result).toHaveLength(MOCK_COUPONS.length);
  });
});

describe('filterCouponsByCategory', () => {
  it('returns all coupons for "all" category', () => {
    expect(filterCouponsByCategory(MOCK_COUPONS, 'all')).toHaveLength(MOCK_COUPONS.length);
  });

  it('filters by specific category', () => {
    const produce = filterCouponsByCategory(MOCK_COUPONS, 'produce');
    expect(produce.length).toBeGreaterThan(0);
    produce.forEach((c) => expect(c.categories).toContain('produce'));
  });

  it('returns empty for category with no coupons', () => {
    const result = filterCouponsByCategory(MOCK_COUPONS, 'nonexistent');
    expect(result).toHaveLength(0);
  });
});

describe('sortCoupons', () => {
  it('sorts by discount value descending', () => {
    const sorted = sortCoupons(MOCK_COUPONS, 'discount');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].discountValue).toBeGreaterThanOrEqual(sorted[i].discountValue);
    }
  });

  it('sorts by expiration ascending', () => {
    const sorted = sortCoupons(MOCK_COUPONS, 'expiring');
    for (let i = 1; i < sorted.length; i++) {
      expect(new Date(sorted[i - 1].validUntil).getTime()).toBeLessThanOrEqual(new Date(sorted[i].validUntil).getTime());
    }
  });

  it('sorts by popularity descending', () => {
    const sorted = sortCoupons(MOCK_COUPONS, 'popular');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].upvotes).toBeGreaterThanOrEqual(sorted[i].upvotes);
    }
  });
});

describe('formatDiscount', () => {
  it('formats fixed discount', () => {
    expect(formatDiscount({ discountType: 'fixed', discountValue: 1.50 } as Coupon)).toBe('$1.50 off');
  });

  it('formats percent discount', () => {
    expect(formatDiscount({ discountType: 'percent', discountValue: 25 } as Coupon)).toBe('25% off');
  });

  it('formats BOGO discount', () => {
    expect(formatDiscount({ discountType: 'bogo', discountValue: 50 } as Coupon)).toBe('BOGO 50% off');
  });

  it('formats freebie', () => {
    expect(formatDiscount({ discountType: 'freebie', discountValue: 0 } as Coupon)).toBe('FREE');
  });
});

describe('isExpiringSoon', () => {
  it('returns true for coupon expiring within threshold', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isExpiringSoon({ validUntil: tomorrow.toISOString() } as Coupon, 3)).toBe(true);
  });

  it('returns false for coupon with plenty of time', () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 30);
    expect(isExpiringSoon({ validUntil: farFuture.toISOString() } as Coupon, 3)).toBe(false);
  });
});

describe('isExpired', () => {
  it('returns true for past date', () => {
    expect(isExpired({ validUntil: '2020-01-01' } as Coupon)).toBe(true);
  });

  it('returns false for future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    expect(isExpired({ validUntil: future.toISOString() } as Coupon)).toBe(false);
  });
});

// ─── Store Database ───
describe('Store Database', () => {
  it('has all expected stores', () => {
    expect(STORES.length).toBeGreaterThanOrEqual(15);
  });

  it('all stores have required fields', () => {
    STORES.forEach((s) => {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(s.icon).toBeTruthy();
      expect(s.barcodeSymbology).toBeTruthy();
    });
  });

  it('store locations have valid coordinates and chain references', () => {
    expect(STORE_LOCATIONS.length).toBeGreaterThan(30);
    STORE_LOCATIONS.forEach((loc) => {
      expect(loc.lat).toBeGreaterThan(30);
      expect(loc.lat).toBeLessThan(45);
      expect(loc.lng).toBeLessThan(-70);
      expect(loc.lng).toBeGreaterThan(-80);
      expect(loc.chainId).toBeTruthy();
      expect(loc.address).toBeTruthy();
      // Chain must exist in STORES
      const chain = STORES.find((s) => s.id === loc.chainId);
      expect(chain).toBeDefined();
    });
  });
});
