// ─── Store Types ───
export type BarcodeSymbology = 'code128' | 'code39' | 'ean13' | 'upca' | 'pdf417' | 'qrcode' | 'azteccode' | 'datamatrix';

export interface Store {
  id: string;
  name: string;
  color: string;
  icon: string;
  barcodeSymbology: BarcodeSymbology;
  supportsPhone: boolean;
  lat?: number;
  lng?: number;
  address?: string;
}

// ─── Card Types ───
export interface LoyaltyCard {
  id: string;
  storeId: string;
  storeName: string;
  cardNumber: string;
  phoneNumber?: string;
  color: string;
  icon: string;
  addedAt: string;
}

// ─── Theme ───
export type ThemeMode = 'light' | 'dark' | 'system';

// ─── Dietary Types ───
export interface DietaryProfile {
  diet: string;
  allergens: string[];
  customExclusions: string;
}

// ─── Coupon Types ───
export type DiscountType = 'percent' | 'fixed' | 'bogo' | 'freebie';

export interface Coupon {
  id: string;
  source: string;
  retailerIds: string[];
  productName: string;
  brand: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchase: number;
  barcode?: string;
  imageUrl?: string;
  validFrom: string;
  validUntil: string;
  categories: string[];
  upcCodes: string[];
  dietaryTags: string[];
  allergens: string[];
  verified: boolean;
  upvotes: number;
  downvotes: number;
}

// ─── Weekly Ad Types ───
export interface WeeklyAdItem {
  id: string;
  storeId: string;
  productName: string;
  brand: string;
  description: string;
  salePrice: number;
  originalPrice?: number;
  unitPrice?: string;
  imageUrl?: string;
  category: string;
  validFrom: string;
  validUntil: string;
  dietaryTags: string[];
  allergens: string[];
}

export interface WeeklyAd {
  storeId: string;
  storeName: string;
  validFrom: string;
  validUntil: string;
  items: WeeklyAdItem[];
}

// ─── Notification Types ───
export interface AppNotification {
  id: string;
  type: 'coupon_new' | 'coupon_expiring' | 'weekly_ad' | 'system';
  title: string;
  body: string;
  storeId?: string;
  couponId?: string;
  read: boolean;
  createdAt: string;
}

// ─── App State ───
export type TabId = 'home' | 'coupons' | 'cards' | 'profile' | 'settings';

export type CouponSortBy = 'discount' | 'expiring' | 'category' | 'brand';
export type CouponCategory = 'all' | 'produce' | 'dairy' | 'meat' | 'bakery' | 'snacks' | 'beverages' | 'frozen' | 'household' | 'personal' | 'baby' | 'pet';

export const COUPON_CATEGORIES: { id: CouponCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🏷️' },
  { id: 'produce', label: 'Produce', icon: '🥬' },
  { id: 'dairy', label: 'Dairy', icon: '🥛' },
  { id: 'meat', label: 'Meat', icon: '🥩' },
  { id: 'bakery', label: 'Bakery', icon: '🍞' },
  { id: 'snacks', label: 'Snacks', icon: '🍿' },
  { id: 'beverages', label: 'Drinks', icon: '🥤' },
  { id: 'frozen', label: 'Frozen', icon: '🧊' },
  { id: 'household', label: 'Home', icon: '🏠' },
  { id: 'personal', label: 'Personal', icon: '🧴' },
  { id: 'baby', label: 'Baby', icon: '👶' },
  { id: 'pet', label: 'Pet', icon: '🐾' },
];
