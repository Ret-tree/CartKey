import type { Coupon } from '../../lib/types';

// Test-only coupon fixtures. NOT shipped with the app.
// These exist only so helper functions in data/coupons.ts can be unit tested.
export const TEST_COUPONS: Coupon[] = [
  {
    id: 't001', source: 'manufacturer', retailerIds: ['kroger', 'safeway', 'walmart', 'target'],
    productName: 'Chobani Greek Yogurt', brand: 'Chobani', description: '$1 off',
    discountType: 'fixed', discountValue: 1.00, minPurchase: 0,
    validFrom: '2026-01-01', validUntil: '2030-01-01',
    categories: ['dairy'], upcCodes: ['818290011435'],
    dietaryTags: ['vegetarian', 'dairy'], allergens: ['dairy'],
    verified: true, upvotes: 100, downvotes: 5,
  },
  {
    id: 't002', source: 'store', retailerIds: ['kroger'],
    productName: 'Fresh Spinach', brand: 'Generic', description: '50% off',
    discountType: 'percent', discountValue: 50, minPurchase: 0,
    validFrom: '2026-01-01', validUntil: '2030-01-01',
    categories: ['produce'], upcCodes: [],
    dietaryTags: ['vegan', 'vegetarian', 'gluten-free'], allergens: [],
    verified: true, upvotes: 50, downvotes: 0,
  },
  {
    id: 't003', source: 'store', retailerIds: ['kroger'],
    productName: 'Wonder Bread', brand: 'Wonder', description: '$0.50 off',
    discountType: 'fixed', discountValue: 0.50, minPurchase: 0,
    validFrom: '2026-01-01', validUntil: '2030-01-01',
    categories: ['bakery'], upcCodes: [],
    dietaryTags: ['vegetarian'], allergens: ['gluten'],
    verified: true, upvotes: 20, downvotes: 1,
  },
  {
    id: 't004', source: 'manufacturer', retailerIds: ['safeway', 'kroger'],
    productName: 'Oatly Oat Milk', brand: 'Oatly', description: '$2 off',
    discountType: 'fixed', discountValue: 2.00, minPurchase: 0,
    validFrom: '2026-01-01', validUntil: '2030-01-01',
    categories: ['dairy'], upcCodes: [],
    dietaryTags: ['vegan', 'vegetarian'], allergens: [],
    verified: true, upvotes: 75, downvotes: 2,
  },
];
