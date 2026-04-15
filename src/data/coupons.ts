import type { Coupon, WeeklyAdItem, AppNotification } from '../lib/types';

// Helper to get dates relative to now
const now = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const daysAgo = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return fmt(d); };
const daysFromNow = (n: number) => { const d = new Date(now); d.setDate(d.getDate() + n); return fmt(d); };

export const MOCK_COUPONS: Coupon[] = [
  // ─── Produce ───
  {
    id: 'c001', source: 'manufacturer', retailerIds: ['kroger', 'safeway', 'walmart', 'target', 'wholefds'],
    productName: 'Organic Baby Spinach', brand: 'Earthbound Farm', description: '$1.50 off organic baby spinach 5oz+',
    discountType: 'fixed', discountValue: 1.50, minPurchase: 0, barcode: '50150EBF001',
    validFrom: daysAgo(3), validUntil: daysFromNow(18), categories: ['produce'],
    upcCodes: ['032601025106'], dietaryTags: ['vegan', 'vegetarian', 'keto', 'paleo', 'gluten-free'],
    allergens: [], verified: true, upvotes: 42, downvotes: 2,
  },
  {
    id: 'c002', source: 'manufacturer', retailerIds: ['kroger', 'safeway', 'harristeeter', 'giantfood'],
    productName: 'Driscoll\'s Strawberries', brand: 'Driscoll\'s', description: 'Buy one get one 50% off strawberries 1lb',
    discountType: 'bogo', discountValue: 50, minPurchase: 0, barcode: '50200DRS002',
    validFrom: daysAgo(1), validUntil: daysFromNow(12), categories: ['produce'],
    upcCodes: ['032601025107'], dietaryTags: ['vegan', 'vegetarian', 'paleo', 'gluten-free'],
    allergens: [], verified: true, upvotes: 67, downvotes: 1,
  },
  {
    id: 'c003', source: 'community', retailerIds: ['traderjoes'],
    productName: 'Avocados', brand: '', description: '4-pack avocados on sale this week',
    discountType: 'fixed', discountValue: 1.00, minPurchase: 0,
    validFrom: daysAgo(2), validUntil: daysFromNow(5), categories: ['produce'],
    upcCodes: [], dietaryTags: ['vegan', 'vegetarian', 'keto', 'paleo', 'gluten-free'],
    allergens: [], verified: false, upvotes: 15, downvotes: 3,
  },

  // ─── Dairy ───
  {
    id: 'c010', source: 'manufacturer', retailerIds: ['kroger', 'safeway', 'walmart', 'target', 'publix'],
    productName: 'Chobani Greek Yogurt', brand: 'Chobani', description: '25% off any Chobani multi-pack',
    discountType: 'percent', discountValue: 25, minPurchase: 5.00, barcode: '50300CHO010',
    validFrom: daysAgo(5), validUntil: daysFromNow(20), categories: ['dairy'],
    upcCodes: ['894700010045'], dietaryTags: ['vegetarian', 'gluten-free'],
    allergens: ['dairy'], verified: true, upvotes: 89, downvotes: 4,
  },
  {
    id: 'c011', source: 'manufacturer', retailerIds: ['kroger', 'walmart', 'target', 'wholefds', 'costco'],
    productName: 'Oatly Oat Milk', brand: 'Oatly', description: '$1.00 off any Oatly product',
    discountType: 'fixed', discountValue: 1.00, minPurchase: 0, barcode: '50310OAT011',
    validFrom: daysAgo(2), validUntil: daysFromNow(25), categories: ['dairy'],
    upcCodes: ['657622000118'], dietaryTags: ['vegan', 'vegetarian', 'gluten-free'],
    allergens: [], verified: true, upvotes: 56, downvotes: 2,
  },
  {
    id: 'c012', source: 'manufacturer', retailerIds: ['kroger', 'safeway', 'walmart', 'publix', 'harristeeter'],
    productName: 'Tillamook Cheddar Block', brand: 'Tillamook', description: '$2.00 off 2lb Tillamook cheddar',
    discountType: 'fixed', discountValue: 2.00, minPurchase: 0, barcode: '50320TIL012',
    validFrom: daysAgo(1), validUntil: daysFromNow(14), categories: ['dairy'],
    upcCodes: ['072830000109'], dietaryTags: ['vegetarian', 'keto', 'gluten-free'],
    allergens: ['dairy'], verified: true, upvotes: 34, downvotes: 1,
  },

  // ─── Meat ───
  {
    id: 'c020', source: 'manufacturer', retailerIds: ['kroger', 'safeway', 'walmart', 'publix', 'heb'],
    productName: 'Applegate Uncured Hot Dogs', brand: 'Applegate', description: '$1.50 off natural hot dogs',
    discountType: 'fixed', discountValue: 1.50, minPurchase: 0, barcode: '50400APG020',
    validFrom: daysAgo(4), validUntil: daysFromNow(10), categories: ['meat'],
    upcCodes: ['025317111003'], dietaryTags: ['paleo', 'keto', 'gluten-free'],
    allergens: [], verified: true, upvotes: 28, downvotes: 5,
  },
  {
    id: 'c021', source: 'manufacturer', retailerIds: ['wholefds', 'kroger', 'target', 'costco'],
    productName: 'Beyond Burger', brand: 'Beyond Meat', description: '$2.00 off Beyond Burger 2-pack',
    discountType: 'fixed', discountValue: 2.00, minPurchase: 0, barcode: '50410BYD021',
    validFrom: daysAgo(3), validUntil: daysFromNow(21), categories: ['meat'],
    upcCodes: ['858132003008'], dietaryTags: ['vegan', 'vegetarian', 'gluten-free'],
    allergens: [], verified: true, upvotes: 73, downvotes: 8,
  },

  // ─── Snacks ───
  {
    id: 'c030', source: 'manufacturer', retailerIds: ['kroger', 'safeway', 'walmart', 'target', 'costco', 'publix'],
    productName: 'KIND Bars Variety', brand: 'KIND', description: 'Buy 2 save $3 on KIND bar boxes',
    discountType: 'fixed', discountValue: 3.00, minPurchase: 10.00, barcode: '50500KND030',
    validFrom: daysAgo(6), validUntil: daysFromNow(8), categories: ['snacks'],
    upcCodes: ['602652177453'], dietaryTags: ['vegetarian', 'gluten-free'],
    allergens: ['treenuts', 'peanuts'], verified: true, upvotes: 95, downvotes: 3,
  },
  {
    id: 'c031', source: 'manufacturer', retailerIds: ['walmart', 'target', 'kroger', 'aldi'],
    productName: 'Goldfish Crackers', brand: 'Pepperidge Farm', description: '$1.00 off family size Goldfish',
    discountType: 'fixed', discountValue: 1.00, minPurchase: 0, barcode: '50510GLD031',
    validFrom: daysAgo(2), validUntil: daysFromNow(16), categories: ['snacks'],
    upcCodes: ['014100096764'], dietaryTags: ['vegetarian'],
    allergens: ['gluten', 'dairy'], verified: true, upvotes: 41, downvotes: 2,
  },
  {
    id: 'c032', source: 'community', retailerIds: ['traderjoes'],
    productName: 'Veggie Straws', brand: "Trader Joe's", description: 'On sale $2.49 this week',
    discountType: 'fixed', discountValue: 0.50, minPurchase: 0,
    validFrom: daysAgo(1), validUntil: daysFromNow(6), categories: ['snacks'],
    upcCodes: [], dietaryTags: ['vegan', 'vegetarian', 'gluten-free'],
    allergens: [], verified: false, upvotes: 12, downvotes: 1,
  },

  // ─── Beverages ───
  {
    id: 'c040', source: 'manufacturer', retailerIds: ['kroger', 'safeway', 'walmart', 'target', 'publix', 'heb'],
    productName: 'LaCroix Sparkling Water', brand: 'LaCroix', description: '$1.00 off 12-pack LaCroix',
    discountType: 'fixed', discountValue: 1.00, minPurchase: 0, barcode: '50600LAC040',
    validFrom: daysAgo(3), validUntil: daysFromNow(19), categories: ['beverages'],
    upcCodes: ['073360100116'], dietaryTags: ['vegan', 'vegetarian', 'keto', 'paleo', 'gluten-free'],
    allergens: [], verified: true, upvotes: 112, downvotes: 5,
  },
  {
    id: 'c041', source: 'manufacturer', retailerIds: ['wholefds', 'target', 'kroger', 'safeway'],
    productName: 'Celsius Energy Drink', brand: 'Celsius', description: 'Free Celsius with $20 purchase',
    discountType: 'freebie', discountValue: 0, minPurchase: 20.00, barcode: '50610CEL041',
    validFrom: daysAgo(1), validUntil: daysFromNow(7), categories: ['beverages'],
    upcCodes: ['889392000108'], dietaryTags: ['vegan', 'vegetarian', 'keto', 'gluten-free'],
    allergens: [], verified: true, upvotes: 38, downvotes: 6,
  },

  // ─── Bakery ───
  {
    id: 'c050', source: 'manufacturer', retailerIds: ['kroger', 'safeway', 'walmart', 'harristeeter', 'foodlion'],
    productName: "Dave's Killer Bread", brand: "Dave's Killer Bread", description: '$1.00 off any loaf',
    discountType: 'fixed', discountValue: 1.00, minPurchase: 0, barcode: '50700DKB050',
    validFrom: daysAgo(4), validUntil: daysFromNow(11), categories: ['bakery'],
    upcCodes: ['013764012615'], dietaryTags: ['vegan', 'vegetarian'],
    allergens: ['gluten'], verified: true, upvotes: 88, downvotes: 3,
  },
  {
    id: 'c051', source: 'manufacturer', retailerIds: ['wholefds', 'kroger', 'target', 'safeway'],
    productName: 'Canyon Bakehouse GF Bread', brand: 'Canyon Bakehouse', description: '$1.50 off gluten-free bread',
    discountType: 'fixed', discountValue: 1.50, minPurchase: 0, barcode: '50710CBH051',
    validFrom: daysAgo(2), validUntil: daysFromNow(22), categories: ['bakery'],
    upcCodes: ['853584002016'], dietaryTags: ['vegetarian', 'gluten-free'],
    allergens: ['eggs'], verified: true, upvotes: 45, downvotes: 1,
  },

  // ─── Frozen ───
  {
    id: 'c060', source: 'manufacturer', retailerIds: ['kroger', 'safeway', 'walmart', 'target', 'costco'],
    productName: "Amy's Frozen Burritos", brand: "Amy's Kitchen", description: 'Buy 3 save $2 on frozen burritos',
    discountType: 'fixed', discountValue: 2.00, minPurchase: 9.00, barcode: '50800AMY060',
    validFrom: daysAgo(5), validUntil: daysFromNow(15), categories: ['frozen'],
    upcCodes: ['042272001606'], dietaryTags: ['vegetarian'],
    allergens: ['dairy', 'gluten'], verified: true, upvotes: 52, downvotes: 4,
  },
  {
    id: 'c061', source: 'manufacturer', retailerIds: ['wholefds', 'target', 'kroger'],
    productName: 'Caulipower Pizza', brand: 'Caulipower', description: '$2.00 off cauliflower crust pizza',
    discountType: 'fixed', discountValue: 2.00, minPurchase: 0, barcode: '50810CPW061',
    validFrom: daysAgo(1), validUntil: daysFromNow(13), categories: ['frozen'],
    upcCodes: ['850003718019'], dietaryTags: ['vegetarian', 'gluten-free'],
    allergens: ['dairy'], verified: true, upvotes: 63, downvotes: 2,
  },

  // ─── Household ───
  {
    id: 'c070', source: 'manufacturer', retailerIds: ['kroger', 'safeway', 'walmart', 'target', 'costco', 'publix', 'heb'],
    productName: 'Seventh Generation Detergent', brand: 'Seventh Generation', description: '$3.00 off laundry detergent 90oz+',
    discountType: 'fixed', discountValue: 3.00, minPurchase: 0, barcode: '50900SVG070',
    validFrom: daysAgo(7), validUntil: daysFromNow(23), categories: ['household'],
    upcCodes: ['732913228102'], dietaryTags: [],
    allergens: [], verified: true, upvotes: 77, downvotes: 3,
  },
  {
    id: 'c071', source: 'manufacturer', retailerIds: ['walmart', 'target', 'kroger', 'costco'],
    productName: 'Bounty Paper Towels', brand: 'Bounty', description: '$2.00 off 6-roll Bounty select-a-size',
    discountType: 'fixed', discountValue: 2.00, minPurchase: 0, barcode: '50910BNT071',
    validFrom: daysAgo(3), validUntil: daysFromNow(17), categories: ['household'],
    upcCodes: ['037000863830'], dietaryTags: [],
    allergens: [], verified: true, upvotes: 55, downvotes: 1,
  },

  // ─── Personal Care ───
  {
    id: 'c080', source: 'manufacturer', retailerIds: ['walmart', 'target', 'kroger', 'safeway', 'publix'],
    productName: 'Native Deodorant', brand: 'Native', description: '$2.00 off any Native product',
    discountType: 'fixed', discountValue: 2.00, minPurchase: 0, barcode: '51000NAT080',
    validFrom: daysAgo(2), validUntil: daysFromNow(28), categories: ['personal'],
    upcCodes: ['859029004010'], dietaryTags: [],
    allergens: [], verified: true, upvotes: 44, downvotes: 2,
  },

  // ─── Baby ───
  {
    id: 'c090', source: 'manufacturer', retailerIds: ['walmart', 'target', 'kroger', 'costco', 'safeway'],
    productName: 'Pampers Diapers', brand: 'Pampers', description: '$5.00 off Pampers box 60ct+',
    discountType: 'fixed', discountValue: 5.00, minPurchase: 0, barcode: '51100PAM090',
    validFrom: daysAgo(4), validUntil: daysFromNow(30), categories: ['baby'],
    upcCodes: ['037000862956'], dietaryTags: [],
    allergens: [], verified: true, upvotes: 128, downvotes: 2,
  },

  // ─── Pet ───
  {
    id: 'c100', source: 'manufacturer', retailerIds: ['walmart', 'target', 'kroger', 'costco', 'publix'],
    productName: 'Blue Buffalo Dog Food', brand: 'Blue Buffalo', description: '$4.00 off 24lb bags',
    discountType: 'fixed', discountValue: 4.00, minPurchase: 0, barcode: '51200BLU100',
    validFrom: daysAgo(6), validUntil: daysFromNow(14), categories: ['pet'],
    upcCodes: ['840243105601'], dietaryTags: [],
    allergens: [], verified: true, upvotes: 66, downvotes: 4,
  },

  // ─── Expiring soon coupons ───
  {
    id: 'c110', source: 'manufacturer', retailerIds: ['kroger', 'safeway', 'walmart'],
    productName: 'Horizon Organic Milk', brand: 'Horizon', description: '$1.00 off half gallon organic milk',
    discountType: 'fixed', discountValue: 1.00, minPurchase: 0, barcode: '51300HOR110',
    validFrom: daysAgo(12), validUntil: daysFromNow(2), categories: ['dairy'],
    upcCodes: ['742365004636'], dietaryTags: ['vegetarian', 'gluten-free'],
    allergens: ['dairy'], verified: true, upvotes: 33, downvotes: 1,
  },
  {
    id: 'c111', source: 'community', retailerIds: ['aldi'],
    productName: 'Organic Bananas', brand: '', description: '$0.49/lb this week only',
    discountType: 'fixed', discountValue: 0.20, minPurchase: 0,
    validFrom: daysAgo(5), validUntil: daysFromNow(1), categories: ['produce'],
    upcCodes: [], dietaryTags: ['vegan', 'vegetarian', 'keto', 'paleo', 'gluten-free'],
    allergens: [], verified: false, upvotes: 8, downvotes: 0,
  },
];

// ─── Weekly Ad Items ───
export const MOCK_WEEKLY_ADS: WeeklyAdItem[] = [
  // Kroger weekly ad
  { id: 'wa001', storeId: 'kroger', productName: 'Boneless Chicken Breast', brand: '', description: 'Family pack', salePrice: 2.49, originalPrice: 4.99, unitPrice: '$2.49/lb', category: 'meat', validFrom: daysAgo(1), validUntil: daysFromNow(6), dietaryTags: ['keto', 'paleo', 'gluten-free'], allergens: [] },
  { id: 'wa002', storeId: 'kroger', productName: 'Kroger Whole Milk', brand: 'Kroger', description: 'Gallon', salePrice: 2.99, originalPrice: 3.79, unitPrice: '$0.02/fl oz', category: 'dairy', validFrom: daysAgo(1), validUntil: daysFromNow(6), dietaryTags: ['vegetarian', 'gluten-free'], allergens: ['dairy'] },
  { id: 'wa003', storeId: 'kroger', productName: 'Hass Avocados', brand: '', description: 'Each', salePrice: 0.88, originalPrice: 1.50, unitPrice: '$0.88/ea', category: 'produce', validFrom: daysAgo(1), validUntil: daysFromNow(6), dietaryTags: ['vegan', 'vegetarian', 'keto', 'paleo', 'gluten-free'], allergens: [] },
  { id: 'wa004', storeId: 'kroger', productName: 'Coca-Cola 12-Pack', brand: 'Coca-Cola', description: '12oz cans', salePrice: 4.99, originalPrice: 7.49, unitPrice: '$0.42/can', category: 'beverages', validFrom: daysAgo(1), validUntil: daysFromNow(6), dietaryTags: ['vegan', 'vegetarian', 'gluten-free'], allergens: [] },
  { id: 'wa005', storeId: 'kroger', productName: 'Tide Pods Laundry Detergent', brand: 'Tide', description: '42ct', salePrice: 11.99, originalPrice: 15.99, unitPrice: '$0.29/pod', category: 'household', validFrom: daysAgo(1), validUntil: daysFromNow(6), dietaryTags: [], allergens: [] },
  { id: 'wa006', storeId: 'kroger', productName: 'Strawberries', brand: '', description: '1lb package', salePrice: 2.50, originalPrice: 3.99, unitPrice: '$2.50/lb', category: 'produce', validFrom: daysAgo(1), validUntil: daysFromNow(6), dietaryTags: ['vegan', 'vegetarian', 'keto', 'paleo', 'gluten-free'], allergens: [] },

  // Safeway weekly ad
  { id: 'wa010', storeId: 'safeway', productName: 'Atlantic Salmon Fillet', brand: '', description: 'Fresh, per lb', salePrice: 8.99, originalPrice: 12.99, unitPrice: '$8.99/lb', category: 'meat', validFrom: daysAgo(1), validUntil: daysFromNow(6), dietaryTags: ['pescatarian', 'keto', 'paleo', 'gluten-free'], allergens: ['fish'] },
  { id: 'wa011', storeId: 'safeway', productName: 'Signature SELECT Ice Cream', brand: 'Safeway', description: '1.5qt', salePrice: 2.99, originalPrice: 5.49, unitPrice: '$0.06/fl oz', category: 'frozen', validFrom: daysAgo(1), validUntil: daysFromNow(6), dietaryTags: ['vegetarian'], allergens: ['dairy', 'eggs'] },
  { id: 'wa012', storeId: 'safeway', productName: 'Cherries', brand: '', description: 'Rainier or Bing, per lb', salePrice: 3.99, originalPrice: 6.99, unitPrice: '$3.99/lb', category: 'produce', validFrom: daysAgo(1), validUntil: daysFromNow(6), dietaryTags: ['vegan', 'vegetarian', 'keto', 'paleo', 'gluten-free'], allergens: [] },
  { id: 'wa013', storeId: 'safeway', productName: 'Bounty Paper Towels', brand: 'Bounty', description: '8 Big Rolls', salePrice: 12.99, originalPrice: 17.99, unitPrice: '$1.62/roll', category: 'household', validFrom: daysAgo(1), validUntil: daysFromNow(6), dietaryTags: [], allergens: [] },

  // Walmart weekly ad
  { id: 'wa020', storeId: 'walmart', productName: 'Great Value Ground Beef', brand: 'Great Value', description: '80/20, 3lb roll', salePrice: 9.97, originalPrice: 13.47, unitPrice: '$3.32/lb', category: 'meat', validFrom: daysAgo(1), validUntil: daysFromNow(6), dietaryTags: ['keto', 'paleo', 'gluten-free'], allergens: [] },
  { id: 'wa021', storeId: 'walmart', productName: 'Bananas', brand: '', description: 'Per lb', salePrice: 0.22, originalPrice: 0.28, unitPrice: '$0.22/lb', category: 'produce', validFrom: daysAgo(1), validUntil: daysFromNow(6), dietaryTags: ['vegan', 'vegetarian', 'paleo', 'gluten-free'], allergens: [] },
  { id: 'wa022', storeId: 'walmart', productName: 'Great Value Water 40-Pack', brand: 'Great Value', description: '16.9oz bottles', salePrice: 3.98, originalPrice: 4.98, unitPrice: '$0.10/bottle', category: 'beverages', validFrom: daysAgo(1), validUntil: daysFromNow(6), dietaryTags: ['vegan', 'vegetarian', 'keto', 'paleo', 'gluten-free'], allergens: [] },

  // Target weekly ad
  { id: 'wa030', storeId: 'target', productName: 'Good & Gather Organic Eggs', brand: 'Good & Gather', description: '1 dozen', salePrice: 4.29, originalPrice: 5.99, unitPrice: '$0.36/egg', category: 'dairy', validFrom: daysAgo(1), validUntil: daysFromNow(6), dietaryTags: ['vegetarian', 'keto', 'gluten-free'], allergens: ['eggs'] },
  { id: 'wa031', storeId: 'target', productName: 'Smartly Dish Soap', brand: 'Smartly', description: '28oz', salePrice: 1.99, originalPrice: 2.99, unitPrice: '$0.07/fl oz', category: 'household', validFrom: daysAgo(1), validUntil: daysFromNow(6), dietaryTags: [], allergens: [] },
  { id: 'wa032', storeId: 'target', productName: 'Ben & Jerry\'s Ice Cream', brand: "Ben & Jerry's", description: 'Pint, select varieties', salePrice: 3.99, originalPrice: 6.29, unitPrice: '$0.25/oz', category: 'frozen', validFrom: daysAgo(1), validUntil: daysFromNow(6), dietaryTags: ['vegetarian'], allergens: ['dairy', 'eggs', 'soy'] },
];

// ─── Mock Notifications ───
export const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: 'n001', type: 'coupon_new', title: '3 new coupons at Kroger', body: 'Save up to $5.50 on this week\'s deals', storeId: 'kroger', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 'n002', type: 'coupon_expiring', title: 'Coupon expiring tomorrow', body: 'Horizon Organic Milk $1.00 off expires tomorrow', couponId: 'c110', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 'n003', type: 'weekly_ad', title: 'Weekly ad is out!', body: 'Safeway\'s new weekly circular just dropped. Salmon is $8.99/lb.', storeId: 'safeway', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 'n004', type: 'coupon_new', title: 'Beyond Burger $2 off', body: 'Manufacturer coupon available at 4 stores near you', couponId: 'c021', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
  { id: 'n005', type: 'system', title: 'Welcome to CartKey!', body: 'Your coupons are ready. Swipe through to find savings at your favorite stores.', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
];

// ─── Coupon Filtering Helpers ───
export function filterCouponsByStore(coupons: Coupon[], storeId: string): Coupon[] {
  return coupons.filter((c) => c.retailerIds.includes(storeId));
}

export function filterCouponsByDiet(
  coupons: Coupon[],
  diet: string,
  allergens: string[],
  dietExclusions: Record<string, string[]>
): Coupon[] {
  const implicitAllergens = dietExclusions[diet] || [];
  const allExcluded = new Set([...allergens, ...implicitAllergens]);

  if (allExcluded.size === 0) return coupons;

  return coupons.filter((c) => {
    return !c.allergens.some((a) => allExcluded.has(a));
  });
}

export function filterCouponsByCategory(coupons: Coupon[], category: string): Coupon[] {
  if (category === 'all') return coupons;
  return coupons.filter((c) => c.categories.includes(category));
}

export function sortCoupons(coupons: Coupon[], sortBy: string): Coupon[] {
  const sorted = [...coupons];
  switch (sortBy) {
    case 'discount':
      return sorted.sort((a, b) => b.discountValue - a.discountValue);
    case 'expiring':
      return sorted.sort((a, b) => new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime());
    case 'brand':
      return sorted.sort((a, b) => a.brand.localeCompare(b.brand));
    case 'popular':
      return sorted.sort((a, b) => b.upvotes - a.upvotes);
    default:
      return sorted;
  }
}

export function isExpiringSoon(coupon: Coupon, days = 3): boolean {
  const expires = new Date(coupon.validUntil);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + days);
  return expires <= threshold;
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
