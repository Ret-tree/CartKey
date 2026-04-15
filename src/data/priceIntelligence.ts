import type { PurchaseRecord, PurchaseItem } from './budget';
import type { Coupon } from '../lib/types';

// ─── Unit Price Normalization ───

export type StandardUnit = 'oz' | 'lb' | 'fl_oz' | 'gal' | 'ct' | 'each';

interface WeightParse {
  value: number;
  unit: string;
}

const WEIGHT_PATTERN = /(\d+\.?\d*)\s*(fl\s*oz|oz|lbs|lb|kg|gal|gallon|liter|ml|ct|count|pk|pack|g)\b/i;

const UNIT_TO_OZ: Record<string, number> = {
  oz: 1, lb: 16, lbs: 16, g: 0.03527, kg: 35.274,
  'fl oz': 1, 'fl_oz': 1, gal: 128, gallon: 128, ml: 0.03381, l: 33.814, liter: 33.814,
};

export function parseWeight(text: string): WeightParse | null {
  const match = text.match(WEIGHT_PATTERN);
  if (!match) return null;
  return { value: parseFloat(match[1]), unit: match[2].toLowerCase().replace(/s$/, '') };
}

export function normalizeToOz(weight: WeightParse): number | null {
  const factor = UNIT_TO_OZ[weight.unit];
  if (!factor) return null;
  return weight.value * factor;
}

export interface UnitPriceResult {
  pricePerOz: number | null;
  pricePerUnit: number | null;
  displayUnit: string;
  displayPrice: string;
  weight: WeightParse | null;
}

export function calculateUnitPrice(item: PurchaseItem, itemDescription?: string): UnitPriceResult {
  const text = itemDescription || item.name;
  const weight = parseWeight(text);

  if (weight) {
    const oz = normalizeToOz(weight);
    if (oz && oz > 0) {
      const pricePerOz = item.totalPrice / oz;
      // Pick display unit based on original
      if (['lb', 'lbs'].includes(weight.unit)) {
        return { pricePerOz, pricePerUnit: item.totalPrice / weight.value, displayUnit: '/lb', displayPrice: `$${(item.totalPrice / weight.value).toFixed(2)}/lb`, weight };
      }
      if (['gal', 'gallon'].includes(weight.unit)) {
        return { pricePerOz, pricePerUnit: item.totalPrice / weight.value, displayUnit: '/gal', displayPrice: `$${(item.totalPrice / weight.value).toFixed(2)}/gal`, weight };
      }
      return { pricePerOz, pricePerUnit: pricePerOz, displayUnit: '/oz', displayPrice: `$${pricePerOz.toFixed(2)}/oz`, weight };
    }
  }

  // Count-based items
  if (item.quantity > 1) {
    const each = item.totalPrice / item.quantity;
    return { pricePerOz: null, pricePerUnit: each, displayUnit: '/ea', displayPrice: `$${each.toFixed(2)}/ea`, weight: null };
  }

  return { pricePerOz: null, pricePerUnit: item.totalPrice, displayUnit: '/ea', displayPrice: `$${item.totalPrice.toFixed(2)}/ea`, weight: null };
}

// ─── Price History ───

export interface PricePoint {
  date: string;
  price: number;
  unitPrice: number | null;
  storeName: string;
  storeId: string;
}

export interface ProductPriceHistory {
  productName: string;
  category: string;
  pricePoints: PricePoint[];
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  lowestStore: string;
  priceDirection: 'up' | 'down' | 'stable';
  changePercent: number;
}

export function buildPriceHistory(purchases: PurchaseRecord[]): Map<string, ProductPriceHistory> {
  const productMap = new Map<string, PricePoint[]>();

  for (const purchase of purchases) {
    for (const item of purchase.items) {
      const key = item.name.toLowerCase().trim();
      const up = calculateUnitPrice(item);
      const point: PricePoint = {
        date: purchase.date,
        price: item.totalPrice,
        unitPrice: up.pricePerUnit,
        storeName: purchase.storeName,
        storeId: purchase.storeId,
      };
      const existing = productMap.get(key) || [];
      existing.push(point);
      productMap.set(key, existing);
    }
  }

  const result = new Map<string, ProductPriceHistory>();

  for (const [key, points] of productMap) {
    if (points.length < 1) continue;

    const sorted = [...points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const prices = sorted.map((p) => p.price);
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
    const lowest = Math.min(...prices);
    const highest = Math.max(...prices);
    const lowestPoint = sorted.find((p) => p.price === lowest)!;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    let changePercent = 0;
    if (sorted.length >= 2) {
      const first = sorted[0].price;
      const last = sorted[sorted.length - 1].price;
      changePercent = first > 0 ? ((last - first) / first) * 100 : 0;
      if (changePercent > 3) direction = 'up';
      else if (changePercent < -3) direction = 'down';
    }

    // Reconstruct name from first occurrence (preserve casing)
    const firstItem = purchases.flatMap((p) => p.items).find((i) => i.name.toLowerCase().trim() === key);

    result.set(key, {
      productName: firstItem?.name || key,
      category: firstItem?.category || 'other',
      pricePoints: sorted,
      averagePrice: avg,
      lowestPrice: lowest,
      highestPrice: highest,
      lowestStore: lowestPoint.storeName,
      priceDirection: direction,
      changePercent,
    });
  }

  return result;
}

export function getTopProducts(history: Map<string, ProductPriceHistory>, limit = 10): ProductPriceHistory[] {
  return Array.from(history.values())
    .sort((a, b) => b.pricePoints.length - a.pricePoints.length)
    .slice(0, limit);
}

export function getPriceAlerts(history: Map<string, ProductPriceHistory>): ProductPriceHistory[] {
  return Array.from(history.values()).filter((h) => h.priceDirection === 'up' && h.changePercent > 10);
}

// ─── Missed Savings Detection ───

export interface MissedSaving {
  purchaseDate: string;
  itemName: string;
  itemPrice: number;
  couponId: string;
  couponDescription: string;
  couponDiscount: number;
  storeName: string;
}

export function detectMissedSavings(
  purchases: PurchaseRecord[],
  coupons: Coupon[],
  clippedIds: string[],
  lookbackDays = 14
): MissedSaving[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - lookbackDays);

  const recentPurchases = purchases.filter((p) => new Date(p.date) >= cutoff);
  const missed: MissedSaving[] = [];

  for (const purchase of recentPurchases) {
    for (const item of purchase.items) {
      if (item.couponApplied) continue;

      const itemLower = item.name.toLowerCase();
      for (const coupon of coupons) {
        if (clippedIds.includes(coupon.id)) continue;
        if (new Date(coupon.validUntil) < new Date(purchase.date)) continue;
        if (new Date(coupon.validFrom) > new Date(purchase.date)) continue;
        if (!coupon.retailerIds.includes(purchase.storeId)) continue;

        const cpnLower = coupon.productName.toLowerCase();
        const brandLower = coupon.brand.toLowerCase();
        const matches = cpnLower.includes(itemLower) || itemLower.includes(cpnLower.split(' ')[0]) || (brandLower && itemLower.includes(brandLower));

        if (matches) {
          let discount = 0;
          if (coupon.discountType === 'fixed') discount = coupon.discountValue;
          else if (coupon.discountType === 'percent') discount = item.totalPrice * (coupon.discountValue / 100);

          if (discount > 0) {
            missed.push({
              purchaseDate: purchase.date,
              itemName: item.name,
              itemPrice: item.totalPrice,
              couponId: coupon.id,
              couponDescription: coupon.description,
              couponDiscount: discount,
              storeName: purchase.storeName,
            });
          }
        }
      }
    }
  }

  return missed.sort((a, b) => b.couponDiscount - a.couponDiscount);
}

// ─── Smart Recommendations ───

export interface ProductRecommendation {
  couponId: string;
  productName: string;
  brand: string;
  discount: string;
  reason: string;
  score: number;
}

export function generateRecommendations(
  purchases: PurchaseRecord[],
  coupons: Coupon[],
  clippedIds: string[],
  limit = 8
): ProductRecommendation[] {
  // Build purchase frequency map
  const freq = new Map<string, number>();
  for (const p of purchases) {
    for (const item of p.items) {
      const key = item.name.toLowerCase().trim();
      freq.set(key, (freq.get(key) || 0) + 1);
    }
  }

  const activeCoupons = coupons.filter((c) => !clippedIds.includes(c.id) && new Date(c.validUntil) >= new Date());
  const recs: ProductRecommendation[] = [];

  for (const coupon of activeCoupons) {
    const cpnLower = coupon.productName.toLowerCase();
    const brandLower = coupon.brand.toLowerCase();

    // Score based on purchase history match
    let score = 0;
    let reason = '';

    for (const [itemKey, count] of freq) {
      if (cpnLower.includes(itemKey) || itemKey.includes(cpnLower.split(' ')[0]) || (brandLower && itemKey.includes(brandLower))) {
        score = count * 10;
        reason = `You've bought this ${count} time${count > 1 ? 's' : ''}`;
        break;
      }
    }

    // Boost high-value coupons even without history
    if (score === 0 && coupon.discountType === 'fixed' && coupon.discountValue >= 2) {
      score = 3;
      reason = 'High-value coupon';
    }
    if (score === 0 && coupon.upvotes > 50) {
      score = 2;
      reason = 'Popular with other shoppers';
    }

    if (score > 0) {
      let discount = '';
      if (coupon.discountType === 'fixed') discount = `$${coupon.discountValue.toFixed(2)} off`;
      else if (coupon.discountType === 'percent') discount = `${coupon.discountValue}% off`;
      else if (coupon.discountType === 'bogo') discount = `BOGO ${coupon.discountValue}%`;
      else discount = 'FREE';

      recs.push({ couponId: coupon.id, productName: coupon.productName, brand: coupon.brand, discount, reason, score });
    }
  }

  return recs.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ─── Monthly Savings Report ───

export interface MonthlySavingsData {
  month: string; // "Jan", "Feb"...
  couponSavings: number;
  totalSpent: number;
}

export function getMonthlyHistory(purchases: PurchaseRecord[], months = 6): MonthlySavingsData[] {
  const result: MonthlySavingsData[] = [];
  const now = new Date();

  for (let m = months - 1; m >= 0; m--) {
    const start = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - m + 1, 1);
    const label = start.toLocaleDateString('en-US', { month: 'short' });

    const monthPurchases = purchases.filter((p) => {
      const d = new Date(p.date);
      return d >= start && d < end;
    });

    result.push({
      month: label,
      couponSavings: monthPurchases.reduce((s, p) => s + p.couponSavings, 0),
      totalSpent: monthPurchases.reduce((s, p) => s + p.total, 0),
    });
  }
  return result;
}

// ─── Crowdsource Price Submission (client-side prep) ───

export interface AnonymousPriceSubmission {
  productName: string;
  normalizedName: string;
  price: number;
  unitPricePerOz: number | null;
  weight: string | null;
  storeId: string;
  category: string;
  date: string;
}

export function preparePriceSubmissions(purchase: PurchaseRecord): AnonymousPriceSubmission[] {
  return purchase.items.map((item) => {
    const up = calculateUnitPrice(item);
    return {
      productName: item.name,
      normalizedName: item.name.toLowerCase().trim().replace(/\s+/g, ' '),
      price: item.totalPrice,
      unitPricePerOz: up.pricePerOz,
      weight: up.weight ? `${up.weight.value} ${up.weight.unit}` : null,
      storeId: purchase.storeId,
      category: item.category,
      date: purchase.date.split('T')[0],
    };
  });
}
