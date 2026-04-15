import { generateId } from '../lib/geo';

// ─── Types ───
export type BudgetPeriod = 'weekly' | 'biweekly' | 'monthly';

export interface BudgetConfig {
  total: number;
  period: BudgetPeriod;
  categoryLimits: Record<string, number>; // category → dollar limit
  alertThresholds: number[]; // e.g. [0.5, 0.75, 0.9] for 50%, 75%, 90%
  savingsGoal: number; // monthly target
}

export interface PurchaseRecord {
  id: string;
  date: string; // ISO
  storeName: string;
  storeId: string;
  items: PurchaseItem[];
  subtotal: number;
  couponSavings: number;
  total: number;
  source: 'list_checkout' | 'manual' | 'receipt_scan';
}

export interface PurchaseItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
  couponApplied: boolean;
  couponSavings: number;
}

export interface SpendingSummary {
  periodStart: string;
  periodEnd: string;
  totalSpent: number;
  totalSaved: number;
  budget: number;
  remaining: number;
  percentUsed: number;
  byCategory: Record<string, number>;
  purchaseCount: number;
  triggeredAlerts: number[];
}

export interface SavingsReport {
  couponSavings: number;
  priceOptimization: number;
  totalSaved: number;
  monthlyGoal: number;
  goalProgress: number; // 0-1
}

// ─── Defaults ───
export const DEFAULT_BUDGET: BudgetConfig = {
  total: 600,
  period: 'monthly',
  categoryLimits: {},
  alertThresholds: [0.5, 0.75, 0.9],
  savingsGoal: 50,
};

export const BUDGET_CATEGORIES = [
  { id: 'produce', label: 'Produce', icon: '🥬', color: '#22C55E' },
  { id: 'dairy', label: 'Dairy', icon: '🥛', color: '#3B82F6' },
  { id: 'meat', label: 'Meat', icon: '🥩', color: '#EF4444' },
  { id: 'bakery', label: 'Bakery', icon: '🍞', color: '#F59E0B' },
  { id: 'snacks', label: 'Snacks', icon: '🍿', color: '#A855F7' },
  { id: 'beverages', label: 'Drinks', icon: '🥤', color: '#06B6D4' },
  { id: 'frozen', label: 'Frozen', icon: '🧊', color: '#6366F1' },
  { id: 'household', label: 'Home', icon: '🏠', color: '#78716C' },
  { id: 'personal', label: 'Personal', icon: '🧴', color: '#EC4899' },
  { id: 'other', label: 'Other', icon: '📦', color: '#9CA3AF' },
];

// ─── Period Helpers ───
export function getPeriodBounds(period: BudgetPeriod, referenceDate = new Date()): { start: Date; end: Date } {
  const d = new Date(referenceDate);
  let start: Date, end: Date;

  switch (period) {
    case 'weekly': {
      const day = d.getDay();
      start = new Date(d);
      start.setDate(d.getDate() - day); // Sunday
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 7);
      break;
    }
    case 'biweekly': {
      const day = d.getDay();
      const weekOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / (7 * 86400000));
      const isEvenWeek = weekOfYear % 2 === 0;
      start = new Date(d);
      start.setDate(d.getDate() - day - (isEvenWeek ? 0 : 7));
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 14);
      break;
    }
    case 'monthly':
    default: {
      start = new Date(d.getFullYear(), d.getMonth(), 1);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      break;
    }
  }
  return { start, end };
}

export function getDaysRemaining(period: BudgetPeriod): number {
  const { end } = getPeriodBounds(period);
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
}

export function getDaysTotal(period: BudgetPeriod): number {
  const { start, end } = getPeriodBounds(period);
  return Math.ceil((end.getTime() - start.getTime()) / 86400000);
}

// ─── Spending Calculations ───
export function getPeriodPurchases(purchases: PurchaseRecord[], period: BudgetPeriod): PurchaseRecord[] {
  const { start, end } = getPeriodBounds(period);
  return purchases.filter((p) => {
    const d = new Date(p.date);
    return d >= start && d < end;
  });
}

export function calculateSpendingSummary(
  purchases: PurchaseRecord[],
  budget: BudgetConfig
): SpendingSummary {
  const periodPurchases = getPeriodPurchases(purchases, budget.period);
  const { start, end } = getPeriodBounds(budget.period);

  const totalSpent = periodPurchases.reduce((s, p) => s + p.total, 0);
  const totalSaved = periodPurchases.reduce((s, p) => s + p.couponSavings, 0);
  const remaining = Math.max(0, budget.total - totalSpent);
  const percentUsed = budget.total > 0 ? totalSpent / budget.total : 0;

  const byCategory: Record<string, number> = {};
  for (const purchase of periodPurchases) {
    for (const item of purchase.items) {
      byCategory[item.category] = (byCategory[item.category] || 0) + item.totalPrice;
    }
  }

  const triggeredAlerts = budget.alertThresholds.filter((t) => percentUsed >= t);

  return {
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    totalSpent,
    totalSaved,
    budget: budget.total,
    remaining,
    percentUsed,
    byCategory,
    purchaseCount: periodPurchases.length,
    triggeredAlerts,
  };
}

export function calculateSavingsReport(
  purchases: PurchaseRecord[],
  budget: BudgetConfig
): SavingsReport {
  // Use current month regardless of budget period
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  const monthPurchases = purchases.filter((p) => {
    const d = new Date(p.date);
    return d >= monthStart && d < monthEnd;
  });

  const couponSavings = monthPurchases.reduce((s, p) => s + p.couponSavings, 0);
  const priceOptimization = couponSavings * 0.3; // estimate — would come from price comparison data later
  const totalSaved = couponSavings + priceOptimization;

  return {
    couponSavings,
    priceOptimization,
    totalSaved,
    monthlyGoal: budget.savingsGoal,
    goalProgress: budget.savingsGoal > 0 ? Math.min(1, totalSaved / budget.savingsGoal) : 0,
  };
}

export function getWeeklySpendingTrend(purchases: PurchaseRecord[], weeks = 4): { label: string; amount: number }[] {
  const result: { label: string; amount: number }[] = [];
  const now = new Date();

  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - w * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekTotal = purchases
      .filter((p) => { const d = new Date(p.date); return d >= weekStart && d < weekEnd; })
      .reduce((s, p) => s + p.total, 0);

    const label = w === 0 ? 'This wk' : w === 1 ? 'Last wk' : `${w}wk ago`;
    result.push({ label, amount: weekTotal });
  }
  return result;
}

// ─── Create Purchase from Shopping List Checkout ───
export function createPurchaseFromCheckout(
  listName: string,
  storeId: string,
  storeName: string,
  checkedItems: { name: string; quantity: number; category: string; matchedCouponIds: string[] }[],
  estimatedPrices: Record<string, number> // category → avg price per item
): PurchaseRecord {
  const items: PurchaseItem[] = checkedItems.map((ci) => {
    const basePrice = estimatedPrices[ci.category] || 4.00;
    const unitPrice = basePrice;
    const hasCoupon = ci.matchedCouponIds.length > 0;
    const couponSavings = hasCoupon ? basePrice * 0.15 : 0; // estimate 15% avg coupon savings
    return {
      name: ci.name,
      quantity: ci.quantity,
      unitPrice,
      totalPrice: unitPrice * ci.quantity - couponSavings,
      category: ci.category,
      couponApplied: hasCoupon,
      couponSavings,
    };
  });

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const couponSavings = items.reduce((s, i) => s + i.couponSavings, 0);

  return {
    id: generateId(),
    date: new Date().toISOString(),
    storeName,
    storeId,
    items,
    subtotal,
    couponSavings,
    total: subtotal - couponSavings,
    source: 'list_checkout',
  };
}

// Estimated avg prices by category (used when no receipt data exists)
export const ESTIMATED_CATEGORY_PRICES: Record<string, number> = {
  produce: 2.50,
  dairy: 4.00,
  meat: 7.00,
  bakery: 3.50,
  snacks: 4.50,
  beverages: 3.00,
  frozen: 5.00,
  canned: 2.00,
  condiments: 3.50,
  grains: 3.00,
  household: 8.00,
  personal: 6.00,
  other: 4.00,
};

export function formatCurrency(n: number): string {
  return '$' + n.toFixed(2);
}

export function formatPeriodLabel(period: BudgetPeriod): string {
  switch (period) {
    case 'weekly': return 'This Week';
    case 'biweekly': return 'This Pay Period';
    case 'monthly': return 'This Month';
  }
}
