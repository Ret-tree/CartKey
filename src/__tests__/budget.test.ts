import { describe, it, expect } from 'vitest';
import {
  getPeriodBounds, getDaysRemaining, getDaysTotal,
  getPeriodPurchases, calculateSpendingSummary, calculateSavingsReport,
  getWeeklySpendingTrend, createPurchaseFromCheckout,
  formatCurrency, formatPeriodLabel, DEFAULT_BUDGET, ESTIMATED_CATEGORY_PRICES,
} from '../data/budget';
import type { BudgetConfig, PurchaseRecord, PurchaseItem } from '../data/budget';

const makePurchase = (overrides: Partial<PurchaseRecord> = {}): PurchaseRecord => ({
  id: 'test-1', date: new Date().toISOString(), storeName: 'Test Store', storeId: 'kroger',
  items: [{ name: 'Milk', quantity: 1, unitPrice: 4, totalPrice: 4, category: 'dairy', couponApplied: false, couponSavings: 0 }],
  subtotal: 4, couponSavings: 0, total: 4, source: 'manual',
  ...overrides,
});

describe('getPeriodBounds', () => {
  it('returns valid start and end for weekly', () => {
    const { start, end } = getPeriodBounds('weekly');
    expect(start.getDay()).toBe(0); // Sunday
    expect(end.getTime() - start.getTime()).toBe(7 * 86400000);
  });

  it('returns valid start and end for monthly', () => {
    const { start, end } = getPeriodBounds('monthly');
    expect(start.getDate()).toBe(1);
    expect(end.getDate()).toBe(1);
    expect(end.getMonth()).toBe((start.getMonth() + 1) % 12);
  });

  it('returns valid start and end for biweekly', () => {
    const { start, end } = getPeriodBounds('biweekly');
    expect(end.getTime() - start.getTime()).toBe(14 * 86400000);
  });
});

describe('getDaysRemaining', () => {
  it('returns positive number for current period', () => {
    expect(getDaysRemaining('monthly')).toBeGreaterThanOrEqual(0);
    expect(getDaysRemaining('weekly')).toBeGreaterThanOrEqual(0);
  });

  it('weekly never exceeds 7', () => {
    expect(getDaysRemaining('weekly')).toBeLessThanOrEqual(7);
  });
});

describe('getDaysTotal', () => {
  it('returns 7 for weekly', () => {
    expect(getDaysTotal('weekly')).toBe(7);
  });

  it('returns 14 for biweekly', () => {
    expect(getDaysTotal('biweekly')).toBe(14);
  });

  it('returns 28-31 for monthly', () => {
    const total = getDaysTotal('monthly');
    expect(total).toBeGreaterThanOrEqual(28);
    expect(total).toBeLessThanOrEqual(31);
  });
});

describe('getPeriodPurchases', () => {
  it('includes purchases within current period', () => {
    const p = makePurchase({ date: new Date().toISOString() });
    const result = getPeriodPurchases([p], 'monthly');
    expect(result).toHaveLength(1);
  });

  it('excludes purchases outside current period', () => {
    const old = new Date();
    old.setFullYear(old.getFullYear() - 1);
    const p = makePurchase({ date: old.toISOString() });
    const result = getPeriodPurchases([p], 'monthly');
    expect(result).toHaveLength(0);
  });
});

describe('calculateSpendingSummary', () => {
  const budget: BudgetConfig = { ...DEFAULT_BUDGET, total: 500, period: 'monthly' };

  it('calculates totals correctly', () => {
    const purchases = [
      makePurchase({ id: '1', total: 50, couponSavings: 5 }),
      makePurchase({ id: '2', total: 75, couponSavings: 10 }),
    ];
    const summary = calculateSpendingSummary(purchases, budget);
    expect(summary.totalSpent).toBe(125);
    expect(summary.totalSaved).toBe(15);
    expect(summary.remaining).toBe(375);
    expect(summary.percentUsed).toBeCloseTo(0.25);
    expect(summary.purchaseCount).toBe(2);
  });

  it('handles empty purchases', () => {
    const summary = calculateSpendingSummary([], budget);
    expect(summary.totalSpent).toBe(0);
    expect(summary.remaining).toBe(500);
    expect(summary.percentUsed).toBe(0);
  });

  it('triggers alerts at correct thresholds', () => {
    const purchases = [makePurchase({ total: 460 })]; // 92% of 500
    const summary = calculateSpendingSummary(purchases, { ...budget, alertThresholds: [0.5, 0.75, 0.9] });
    expect(summary.triggeredAlerts).toEqual([0.5, 0.75, 0.9]);
  });

  it('groups spending by category', () => {
    const items: PurchaseItem[] = [
      { name: 'Milk', quantity: 1, unitPrice: 4, totalPrice: 4, category: 'dairy', couponApplied: false, couponSavings: 0 },
      { name: 'Bread', quantity: 1, unitPrice: 3, totalPrice: 3, category: 'bakery', couponApplied: false, couponSavings: 0 },
    ];
    const purchases = [makePurchase({ items, total: 7 })];
    const summary = calculateSpendingSummary(purchases, budget);
    expect(summary.byCategory['dairy']).toBe(4);
    expect(summary.byCategory['bakery']).toBe(3);
  });

  it('remaining never goes below zero', () => {
    const purchases = [makePurchase({ total: 999 })];
    const summary = calculateSpendingSummary(purchases, budget);
    expect(summary.remaining).toBe(0);
  });
});

describe('calculateSavingsReport', () => {
  it('calculates coupon savings for current month', () => {
    const purchases = [makePurchase({ couponSavings: 12 })];
    const report = calculateSavingsReport(purchases, { ...DEFAULT_BUDGET, savingsGoal: 50 });
    expect(report.couponSavings).toBe(12);
    expect(report.goalProgress).toBeGreaterThan(0);
    expect(report.goalProgress).toBeLessThanOrEqual(1);
  });

  it('caps goal progress at 1', () => {
    const purchases = [makePurchase({ couponSavings: 200 })];
    const report = calculateSavingsReport(purchases, { ...DEFAULT_BUDGET, savingsGoal: 10 });
    expect(report.goalProgress).toBe(1);
  });
});

describe('getWeeklySpendingTrend', () => {
  it('returns correct number of weeks', () => {
    expect(getWeeklySpendingTrend([], 4)).toHaveLength(4);
    expect(getWeeklySpendingTrend([], 6)).toHaveLength(6);
  });

  it('labels last entry as "This wk"', () => {
    const trend = getWeeklySpendingTrend([], 4);
    expect(trend[trend.length - 1].label).toBe('This wk');
  });

  it('sums purchases within each week', () => {
    const today = [makePurchase({ id: '1', total: 50 }), makePurchase({ id: '2', total: 30 })];
    const trend = getWeeklySpendingTrend(today, 4);
    expect(trend[trend.length - 1].amount).toBe(80);
  });
});

describe('createPurchaseFromCheckout', () => {
  it('creates a purchase record from checkout items', () => {
    const items = [
      { name: 'Milk', quantity: 1, category: 'dairy', matchedCouponIds: ['c1'] },
      { name: 'Bread', quantity: 2, category: 'bakery', matchedCouponIds: [] },
    ];
    const purchase = createPurchaseFromCheckout('My List', 'kroger', 'Kroger', items, ESTIMATED_CATEGORY_PRICES);
    expect(purchase.items).toHaveLength(2);
    expect(purchase.storeId).toBe('kroger');
    expect(purchase.source).toBe('list_checkout');
    expect(purchase.total).toBeGreaterThan(0);
    expect(purchase.couponSavings).toBeGreaterThan(0); // first item has a coupon
  });
});

describe('formatCurrency', () => {
  it('formats whole numbers', () => { expect(formatCurrency(5)).toBe('$5.00'); });
  it('formats decimals', () => { expect(formatCurrency(12.5)).toBe('$12.50'); });
  it('formats zero', () => { expect(formatCurrency(0)).toBe('$0.00'); });
});

describe('formatPeriodLabel', () => {
  it('returns correct labels', () => {
    expect(formatPeriodLabel('weekly')).toBe('This Week');
    expect(formatPeriodLabel('biweekly')).toBe('This Pay Period');
    expect(formatPeriodLabel('monthly')).toBe('This Month');
  });
});
