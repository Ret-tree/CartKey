import { describe, it, expect } from 'vitest';
import {
  getPriceMatchPolicy, calculateSummary, isWithinRefundWindow, daysRemaining,
  type PriceMatchOpportunity,
} from '../data/priceMatch';

const makeOp = (overrides: Partial<PriceMatchOpportunity>): PriceMatchOpportunity => ({
  id: 'test-' + Math.random(),
  purchaseId: 'p1',
  itemName: 'Test Item',
  storeId: 'kroger',
  storeName: 'Kroger',
  pricePaid: 5.00,
  currentPrice: 3.00,
  potentialRefund: 2.00,
  purchaseDate: new Date().toISOString(),
  detectedAt: new Date().toISOString(),
  source: 'api',
  withinWindow: true,
  status: 'pending',
  ...overrides,
});

describe('getPriceMatchPolicy', () => {
  it('returns Kroger 14-day policy', () => {
    const policy = getPriceMatchPolicy('kroger');
    expect(policy.hasPolicy).toBe(true);
    expect(policy.refundWindowDays).toBe(14);
    expect(policy.apiSupported).toBe(true);
  });

  it('returns Walmart 7-day policy with no API support', () => {
    const policy = getPriceMatchPolicy('walmart');
    expect(policy.hasPolicy).toBe(true);
    expect(policy.refundWindowDays).toBe(7);
    expect(policy.apiSupported).toBe(false);
  });

  it('returns Costco 30-day policy (longest)', () => {
    const policy = getPriceMatchPolicy('costco');
    expect(policy.refundWindowDays).toBe(30);
  });

  it('returns no-policy for ALDI', () => {
    const policy = getPriceMatchPolicy('aldi');
    expect(policy.hasPolicy).toBe(false);
  });

  it('falls back to "other" for unknown store', () => {
    const policy = getPriceMatchPolicy('nonexistent-store-xyz');
    expect(policy.storeId).toBe('other');
  });
});

describe('isWithinRefundWindow', () => {
  it('returns true for purchase 5 days ago at Kroger (14-day window)', () => {
    const date = new Date();
    date.setDate(date.getDate() - 5);
    expect(isWithinRefundWindow(date.toISOString(), 'kroger')).toBe(true);
  });

  it('returns false for purchase 30 days ago at Kroger', () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    expect(isWithinRefundWindow(date.toISOString(), 'kroger')).toBe(false);
  });

  it('returns true for 25-day-old purchase at Costco (30-day window)', () => {
    const date = new Date();
    date.setDate(date.getDate() - 25);
    expect(isWithinRefundWindow(date.toISOString(), 'costco')).toBe(true);
  });

  it('returns false for ALDI (no policy)', () => {
    expect(isWithinRefundWindow(new Date().toISOString(), 'aldi')).toBe(false);
  });
});

describe('daysRemaining', () => {
  it('returns 14 for purchase made today at Kroger', () => {
    expect(daysRemaining(new Date().toISOString(), 'kroger')).toBe(14);
  });

  it('returns 9 for purchase 5 days ago at Kroger', () => {
    const date = new Date();
    date.setDate(date.getDate() - 5);
    expect(daysRemaining(date.toISOString(), 'kroger')).toBe(9);
  });

  it('returns 0 for expired purchase', () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    expect(daysRemaining(date.toISOString(), 'kroger')).toBe(0);
  });

  it('returns 0 for store with no policy', () => {
    expect(daysRemaining(new Date().toISOString(), 'aldi')).toBe(0);
  });
});

describe('calculateSummary', () => {
  it('returns zeros for empty opportunities', () => {
    const summary = calculateSummary([]);
    expect(summary.totalOpportunities).toBe(0);
    expect(summary.totalPotentialRefund).toBe(0);
    expect(summary.pendingCount).toBe(0);
  });

  it('sums all refunds across opportunities', () => {
    const ops = [
      makeOp({ potentialRefund: 2.00 }),
      makeOp({ potentialRefund: 3.50 }),
      makeOp({ potentialRefund: 1.00 }),
    ];
    const summary = calculateSummary(ops);
    expect(summary.totalOpportunities).toBe(3);
    expect(summary.totalPotentialRefund).toBe(6.50);
    expect(summary.pendingCount).toBe(3);
    expect(summary.pendingRefund).toBe(6.50);
  });

  it('separates pending from claimed/dismissed', () => {
    const ops = [
      makeOp({ potentialRefund: 5.00, status: 'pending' }),
      makeOp({ potentialRefund: 3.00, status: 'claimed' }),
      makeOp({ potentialRefund: 1.00, status: 'dismissed' }),
    ];
    const summary = calculateSummary(ops);
    expect(summary.totalOpportunities).toBe(3);
    expect(summary.pendingCount).toBe(1);
    expect(summary.pendingRefund).toBe(5.00);
  });

  it('counts expired pending separately', () => {
    const ops = [
      makeOp({ potentialRefund: 5.00, withinWindow: true, status: 'pending' }),
      makeOp({ potentialRefund: 3.00, withinWindow: false, status: 'pending' }),
    ];
    const summary = calculateSummary(ops);
    expect(summary.pendingCount).toBe(1);
    expect(summary.expiredCount).toBe(1);
    expect(summary.pendingRefund).toBe(5.00);
  });
});
