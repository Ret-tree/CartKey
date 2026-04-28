import type { Coupon, WeeklyAdItem } from '../lib/types';

// ─── No mock coupons ───
// CartKey does not ship with fabricated coupon data. The mock arrays below
// are intentionally empty. The MockCouponAdapter in lib/couponService.ts
// returns these empty arrays. When real data sources (Kroger API, Quotient,
// etc.) are connected, the ApiCouponAdapter takes over.

export const MOCK_COUPONS: Coupon[] = [];
export const MOCK_WEEKLY_ADS: WeeklyAdItem[] = [];

// ─── Helper functions (preserved for future real data) ───

export function filterCouponsByStore(coupons: Coupon[], storeId: string): Coupon[] {
  return coupons.filter((c) => c.retailerIds.includes(storeId));
}

export function filterCouponsByDiet(
  coupons: Coupon[],
  diet: string,
  allergens: string[],
  dietExclusions: Record<string, string[]>
): Coupon[] {
  return coupons.filter((c) => {
    if (allergens.some((a) => c.allergens.includes(a))) return false;
    if (diet && dietExclusions[diet]) {
      if (c.dietaryTags.some((t) => dietExclusions[diet].includes(t))) return false;
    }
    return true;
  });
}

export function filterCouponsByCategory(coupons: Coupon[], category: string): Coupon[] {
  if (category === 'all') return coupons;
  return coupons.filter((c) => c.categories.includes(category));
}

export function sortCoupons(coupons: Coupon[], sortBy: string): Coupon[] {
  const sorted = [...coupons];
  switch (sortBy) {
    case 'expiring':
      return sorted.sort((a, b) => new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime());
    case 'value':
      return sorted.sort((a, b) => b.discountValue - a.discountValue);
    case 'popular':
      return sorted.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
    default:
      return sorted;
  }
}

export function isExpiringSoon(coupon: Coupon, days = 3): boolean {
  const expiry = new Date(coupon.validUntil);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  return expiry <= cutoff && expiry >= new Date();
}

export function isExpired(coupon: Coupon): boolean {
  return new Date(coupon.validUntil) < new Date();
}

export function formatDiscount(coupon: Coupon): string {
  switch (coupon.discountType) {
    case 'fixed': return `$${coupon.discountValue.toFixed(2)} off`;
    case 'percent': return `${coupon.discountValue}% off`;
    case 'bogo': return `BOGO ${coupon.discountValue}% off`;
    case 'freebie': return 'FREE';
    default: return '';
  }
}
