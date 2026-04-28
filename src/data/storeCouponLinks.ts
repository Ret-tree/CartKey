// ─── Official store coupon and deals URLs ───
// These link users directly to the retailer's own coupon system.

export interface StoreCouponLink {
  storeId: string;
  name: string;
  couponUrl: string;
  appScheme?: string;      // Deep link to native app if installed
  description: string;
}

export const STORE_COUPON_LINKS: StoreCouponLink[] = [
  { storeId: 'kroger', name: 'Kroger Digital Coupons', couponUrl: 'https://www.kroger.com/cl/coupons', appScheme: 'kroger://', description: 'Load coupons to your Plus Card' },
  { storeId: 'safeway', name: 'Safeway Just for U', couponUrl: 'https://www.safeway.com/justforu/coupons-deals.html', description: 'Clip digital coupons to your Club Card' },
  { storeId: 'target', name: 'Target Circle Offers', couponUrl: 'https://www.target.com/circle', appScheme: 'target://', description: 'Add Target Circle offers to your account' },
  { storeId: 'walmart', name: 'Walmart Rollbacks', couponUrl: 'https://www.walmart.com/shop/deals', description: 'Browse current rollbacks and deals' },
  { storeId: 'costco', name: 'Costco Member Deals', couponUrl: 'https://www.costco.com/warehouse-coupon-offers.html', description: 'View in-warehouse coupon book' },
  { storeId: 'publix', name: 'Publix Digital Coupons', couponUrl: 'https://www.publix.com/savings/digital-coupons', description: 'Clip coupons to your Club Publix account' },
  { storeId: 'heb', name: 'H-E-B Digital Coupons', couponUrl: 'https://www.heb.com/deals/digital-coupons', description: 'Clip coupons to your H-E-B account' },
  { storeId: 'wegmans', name: 'Wegmans Digital Coupons', couponUrl: 'https://www.wegmans.com/digital-coupons/', description: 'Load coupons to your Shoppers Club' },
  { storeId: 'harristeeter', name: 'Harris Teeter e-VIC', couponUrl: 'https://www.harristeeter.com/cl/coupons', description: 'Load e-VIC digital coupons' },
  { storeId: 'foodlion', name: 'Food Lion MVP Coupons', couponUrl: 'https://www.foodlion.com/coupons/', description: 'Clip coupons to your MVP card' },
  { storeId: 'giantfood', name: 'Giant Food Digital Coupons', couponUrl: 'https://giantfood.com/savings/digital-coupons', description: 'Load coupons to your Giant Card' },
  { storeId: 'lidl', name: 'Lidl Plus Coupons', couponUrl: 'https://www.lidl.com/coupons', description: 'View Lidl Plus in-app coupons' },
  { storeId: 'wholefds', name: 'Whole Foods Prime Deals', couponUrl: 'https://www.wholefoodsmarket.com/sales-flyer', description: 'Prime member deals and weekly sales' },
  { storeId: 'aldi', name: 'ALDI Weekly Specials', couponUrl: 'https://www.aldi.us/weekly-specials/', description: 'Browse this week\'s ALDI Finds' },
  { storeId: 'traderjoes', name: "Trader Joe's Fearless Flyer", couponUrl: 'https://www.traderjoes.com/home/discover/fearless-flyer', description: 'New and seasonal products' },
  { storeId: 'sprouts', name: 'Sprouts Rewards Deals', couponUrl: 'https://www.sprouts.com/sprouts-rewards/', description: 'Personalized rewards and offers' },
  { storeId: 'lowesfoods', name: 'Lowes Foods Fresh Rewards', couponUrl: 'https://www.lowesfoods.com/savings/coupons', description: 'Clip digital coupons to your Fresh Rewards' },
  { storeId: 'stopshop', name: 'Stop & Shop GO Rewards', couponUrl: 'https://stopandshop.com/savings/coupons', description: 'Load digital coupons and earn points' },
  { storeId: 'hannaford', name: 'Hannaford Rewards', couponUrl: 'https://www.hannaford.com/savings/digital-coupons', description: 'Clip digital coupons to your account' },
  { storeId: 'hyvee', name: 'Hy-Vee Deals', couponUrl: 'https://www.hy-vee.com/deals/coupons', description: 'Browse and clip Hy-Vee coupons' },
  { storeId: 'meijer', name: 'Meijer mPerks', couponUrl: 'https://www.meijer.com/mperks.html', description: 'Clip digital coupons and rewards' },
  { storeId: 'shoprite', name: 'ShopRite Price Plus Club', couponUrl: 'https://www.shoprite.com/sm/pickup/rsid/3000/digital-coupons', description: 'Load digital coupons to your Price Plus Club' },
  { storeId: 'albertsons', name: 'Albertsons for U', couponUrl: 'https://www.albertsons.com/foru/coupons-deals.html', description: 'Clip personalized for U coupons' },
  { storeId: 'winndixie', name: 'Winn-Dixie Rewards', couponUrl: 'https://www.winndixie.com/savings/coupons', description: 'Load coupons to your Rewards account' },
];

export function getStoreLinks(storeIds: string[]): StoreCouponLink[] {
  return STORE_COUPON_LINKS.filter((l) => storeIds.includes(l.storeId));
}

export function getLinkForStore(storeId: string): StoreCouponLink | undefined {
  return STORE_COUPON_LINKS.find((l) => l.storeId === storeId);
}
