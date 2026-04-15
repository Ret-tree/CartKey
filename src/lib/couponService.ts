import type { Coupon, WeeklyAdItem } from '../lib/types';
import {
  MOCK_COUPONS, MOCK_WEEKLY_ADS, filterCouponsByStore, filterCouponsByDiet,
  filterCouponsByCategory, sortCoupons, isExpired,
} from '../data/coupons';
import { DIET_EXCLUSIONS } from '../data/dietary';

// ─── Adapter Interface ───
export interface CouponAdapter {
  name: string;
  fetchCoupons(storeId?: string): Promise<Coupon[]>;
  fetchWeeklyAds(storeId: string): Promise<WeeklyAdItem[]>;
}

// ─── Mock Adapter (default, uses bundled data) ───
export class MockCouponAdapter implements CouponAdapter {
  name = 'mock';

  async fetchCoupons(storeId?: string): Promise<Coupon[]> {
    let coupons = MOCK_COUPONS.filter((c) => !isExpired(c));
    if (storeId) coupons = filterCouponsByStore(coupons, storeId);
    return coupons;
  }

  async fetchWeeklyAds(storeId: string): Promise<WeeklyAdItem[]> {
    return MOCK_WEEKLY_ADS.filter((a) => a.storeId === storeId);
  }
}

// ─── API Adapter (calls Cloudflare Pages Functions) ───
export class ApiCouponAdapter implements CouponAdapter {
  name = 'api';
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async fetchCoupons(storeId?: string): Promise<Coupon[]> {
    try {
      const params = new URLSearchParams();
      if (storeId) params.set('store', storeId);
      const res = await fetch(`${this.baseUrl}/coupons?${params}`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      return (data.coupons || []).map(this.mapCoupon);
    } catch {
      // Fallback to mock on API failure
      console.warn('API coupon fetch failed, falling back to mock data');
      return new MockCouponAdapter().fetchCoupons(storeId);
    }
  }

  async fetchWeeklyAds(storeId: string): Promise<WeeklyAdItem[]> {
    try {
      const res = await fetch(`${this.baseUrl}/weekly-ads?store=${storeId}`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      return data.items || [];
    } catch {
      console.warn('API weekly ads fetch failed, falling back to mock data');
      return new MockCouponAdapter().fetchWeeklyAds(storeId);
    }
  }

  private mapCoupon(raw: Record<string, unknown>): Coupon {
    return {
      id: String(raw.id || ''),
      source: String(raw.source || 'api'),
      retailerIds: JSON.parse(String(raw.retailer_ids || '[]')),
      productName: String(raw.product_name || ''),
      brand: String(raw.brand || ''),
      description: String(raw.description || ''),
      discountType: String(raw.discount_type || 'fixed') as Coupon['discountType'],
      discountValue: Number(raw.discount_value || 0),
      minPurchase: Number(raw.min_purchase || 0),
      barcode: raw.barcode ? String(raw.barcode) : undefined,
      imageUrl: raw.image_url ? String(raw.image_url) : undefined,
      validFrom: String(raw.valid_from || ''),
      validUntil: String(raw.valid_until || ''),
      categories: JSON.parse(String(raw.categories || '[]')),
      upcCodes: JSON.parse(String(raw.upc_codes || '[]')),
      dietaryTags: JSON.parse(String(raw.dietary_tags || '[]')),
      allergens: JSON.parse(String(raw.allergens || '[]')),
      verified: Boolean(raw.verified),
      upvotes: Number(raw.upvotes || 0),
      downvotes: Number(raw.downvotes || 0),
    };
  }
}

// ─── Service (singleton, manages active adapter) ───
class CouponService {
  private adapter: CouponAdapter;

  constructor() {
    // Default to mock — switch to API when D1 is populated
    this.adapter = new MockCouponAdapter();
  }

  setAdapter(adapter: CouponAdapter) {
    this.adapter = adapter;
    console.log(`CouponService: switched to ${adapter.name} adapter`);
  }

  getAdapterName() { return this.adapter.name; }

  async getCoupons(opts: {
    storeId?: string;
    category?: string;
    diet?: string;
    allergens?: string[];
    sortBy?: string;
    search?: string;
  } = {}): Promise<Coupon[]> {
    let coupons = await this.adapter.fetchCoupons(opts.storeId);

    if (opts.diet || (opts.allergens && opts.allergens.length > 0)) {
      coupons = filterCouponsByDiet(coupons, opts.diet || '', opts.allergens || [], DIET_EXCLUSIONS);
    }
    if (opts.category && opts.category !== 'all') {
      coupons = filterCouponsByCategory(coupons, opts.category);
    }
    if (opts.search) {
      const q = opts.search.toLowerCase();
      coupons = coupons.filter((c) =>
        c.productName.toLowerCase().includes(q) || c.brand.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }
    if (opts.sortBy) {
      coupons = sortCoupons(coupons, opts.sortBy);
    }
    return coupons;
  }

  async getWeeklyAds(storeId: string): Promise<WeeklyAdItem[]> {
    return this.adapter.fetchWeeklyAds(storeId);
  }
}

// Singleton export
export const couponService = new CouponService();

// Enable API mode (call this when D1 is ready)
export function enableApiCoupons(baseUrl = '/api') {
  couponService.setAdapter(new ApiCouponAdapter(baseUrl));
}
