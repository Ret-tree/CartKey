// ─── Price Match Policies & Detection ───
//
// CartKey detects when a user paid more than the current advertised price.
// Live API price checks work for Kroger/Harris Teeter today.
// All other chains use manual price entry — the user reports what they saw advertised
// and CartKey tracks the potential refund opportunity.

export interface StorePriceMatchPolicy {
  storeId: string;
  hasPolicy: boolean;
  refundWindowDays: number;
  policyUrl: string;
  notes: string;
  apiSupported: boolean; // true if CartKey can auto-check current prices
}

export const PRICE_MATCH_POLICIES: StorePriceMatchPolicy[] = [
  // Stores with formal price adjustment / price match policies
  { storeId: 'kroger', hasPolicy: true, refundWindowDays: 14, apiSupported: true,
    policyUrl: 'https://www.kroger.com/hc/help/store-experience/refund',
    notes: 'Bring your receipt to customer service within 14 days for refunds on advertised price drops.' },
  { storeId: 'harristeeter', hasPolicy: true, refundWindowDays: 14, apiSupported: true,
    policyUrl: 'https://www.harristeeter.com/hc/help/store-experience',
    notes: 'Customer service can issue refunds for items that went on sale within 14 days of purchase.' },
  { storeId: 'walmart', hasPolicy: true, refundWindowDays: 7, apiSupported: false,
    policyUrl: 'https://www.walmart.com/help/article/walmart-com-price-match-policy/4f24f3b5d9794a7cb27c0c3afa92bb01',
    notes: 'Walmart+ members may receive automatic refunds on price drops. In-store purchases require customer service.' },
  { storeId: 'target', hasPolicy: true, refundWindowDays: 14, apiSupported: false,
    policyUrl: 'https://www.target.com/c/price-match-guarantee/-/N-4sr7t',
    notes: 'Bring your receipt to Guest Services within 14 days for a price adjustment.' },
  { storeId: 'costco', hasPolicy: true, refundWindowDays: 30, apiSupported: false,
    policyUrl: 'https://customerservice.costco.com/app/answers/answer_view/a_id/1216',
    notes: 'Costco offers price adjustments within 30 days. Bring receipt to membership counter.' },
  { storeId: 'wholefds', hasPolicy: true, refundWindowDays: 7, apiSupported: false,
    policyUrl: 'https://www.wholefoodsmarket.com/customer-service',
    notes: 'Customer service can adjust prices for advertised price drops within 7 days.' },
  { storeId: 'safeway', hasPolicy: true, refundWindowDays: 14, apiSupported: false,
    policyUrl: 'https://www.safeway.com/customer-support.html',
    notes: 'Safeway accepts price adjustments within 14 days at the customer service desk.' },
  { storeId: 'publix', hasPolicy: true, refundWindowDays: 7, apiSupported: false,
    policyUrl: 'https://corporate.publix.com/about-publix/contact-publix/price-checks-refunds',
    notes: 'Publix honors price adjustments at customer service within 7 days.' },
  { storeId: 'wegmans', hasPolicy: true, refundWindowDays: 14, apiSupported: false,
    policyUrl: 'https://www.wegmans.com/help/contact-us/',
    notes: 'Wegmans customer service can adjust prices for items now advertised at lower prices.' },
  { storeId: 'heb', hasPolicy: true, refundWindowDays: 7, apiSupported: false,
    policyUrl: 'https://www.heb.com/static-page/customer-service',
    notes: 'H-E-B accepts price adjustments at customer service.' },
  { storeId: 'meijer', hasPolicy: true, refundWindowDays: 7, apiSupported: false,
    policyUrl: 'https://www.meijer.com/customer-service.html',
    notes: 'Meijer offers price adjustments within 7 days at customer service.' },
  { storeId: 'foodlion', hasPolicy: true, refundWindowDays: 14, apiSupported: false,
    policyUrl: 'https://www.foodlion.com/help/customer-service/',
    notes: 'Food Lion accepts price adjustments at customer service within 14 days.' },
  { storeId: 'giantfood', hasPolicy: true, refundWindowDays: 14, apiSupported: false,
    policyUrl: 'https://giantfood.com/help/customer-service/',
    notes: 'Giant customer service can issue price adjustments within 14 days.' },
  { storeId: 'stopshop', hasPolicy: true, refundWindowDays: 14, apiSupported: false,
    policyUrl: 'https://stopandshop.com/help/customer-service/',
    notes: 'Stop & Shop customer service handles price adjustments.' },
  { storeId: 'hannaford', hasPolicy: true, refundWindowDays: 14, apiSupported: false,
    policyUrl: 'https://www.hannaford.com/contact-us',
    notes: 'Hannaford honors price adjustments at customer service.' },
  { storeId: 'shoprite', hasPolicy: true, refundWindowDays: 7, apiSupported: false,
    policyUrl: 'https://www.shoprite.com/customer-service',
    notes: 'ShopRite accepts price adjustments at customer service within 7 days.' },
  { storeId: 'albertsons', hasPolicy: true, refundWindowDays: 14, apiSupported: false,
    policyUrl: 'https://www.albertsons.com/help/customer-support.html',
    notes: 'Albertsons honors price adjustments at customer service within 14 days.' },
  { storeId: 'sprouts', hasPolicy: true, refundWindowDays: 7, apiSupported: false,
    policyUrl: 'https://www.sprouts.com/customer-service/',
    notes: 'Sprouts customer service can issue price adjustments.' },
  { storeId: 'lowesfoods', hasPolicy: true, refundWindowDays: 14, apiSupported: false,
    policyUrl: 'https://www.lowesfoods.com/customer-service',
    notes: 'Lowes Foods customer service handles price adjustments.' },
  { storeId: 'hyvee', hasPolicy: true, refundWindowDays: 7, apiSupported: false,
    policyUrl: 'https://www.hy-vee.com/corporate/customer-service/',
    notes: 'Hy-Vee customer service can issue price adjustments.' },
  { storeId: 'winndixie', hasPolicy: true, refundWindowDays: 7, apiSupported: false,
    policyUrl: 'https://www.winndixie.com/customer-service',
    notes: 'Winn-Dixie customer service handles price adjustments.' },
  // Stores without formal policies (or unclear policies)
  { storeId: 'aldi', hasPolicy: false, refundWindowDays: 0, apiSupported: false,
    policyUrl: 'https://www.aldi.us/customer-service/',
    notes: 'ALDI does not have a formal price adjustment policy. Contact customer service for case-by-case requests.' },
  { storeId: 'lidl', hasPolicy: false, refundWindowDays: 0, apiSupported: false,
    policyUrl: 'https://www.lidl.com/customer-service',
    notes: 'Lidl does not advertise a formal price match policy.' },
  { storeId: 'traderjoes', hasPolicy: true, refundWindowDays: 7, apiSupported: false,
    policyUrl: 'https://www.traderjoes.com/home/contact-us',
    notes: 'Trader Joe\'s offers product satisfaction guarantee — return or refund any item.' },
  { storeId: 'other', hasPolicy: false, refundWindowDays: 0, apiSupported: false,
    policyUrl: '', notes: 'Check with customer service for price adjustment policy.' },
];

export function getPriceMatchPolicy(storeId: string): StorePriceMatchPolicy {
  return PRICE_MATCH_POLICIES.find((p) => p.storeId === storeId) || PRICE_MATCH_POLICIES[PRICE_MATCH_POLICIES.length - 1];
}

// ─── Price Match Opportunity ───

export interface PriceMatchOpportunity {
  id: string;
  purchaseId: string;
  itemName: string;
  storeId: string;
  storeName: string;
  pricePaid: number;
  currentPrice: number;
  potentialRefund: number;
  purchaseDate: string;
  detectedAt: string;
  source: 'api' | 'manual'; // how was the lower price detected
  withinWindow: boolean;    // is purchase still within store's refund window
  status: 'pending' | 'claimed' | 'dismissed';
  notes?: string;
}

export interface PriceMatchSummary {
  totalOpportunities: number;
  totalPotentialRefund: number;
  pendingCount: number;
  pendingRefund: number;
  expiredCount: number;
}

export function calculateSummary(opportunities: PriceMatchOpportunity[]): PriceMatchSummary {
  let totalRefund = 0;
  let pendingCount = 0;
  let pendingRefund = 0;
  let expiredCount = 0;

  for (const op of opportunities) {
    totalRefund += op.potentialRefund;
    if (op.status === 'pending') {
      if (op.withinWindow) {
        pendingCount++;
        pendingRefund += op.potentialRefund;
      } else {
        expiredCount++;
      }
    }
  }

  return {
    totalOpportunities: opportunities.length,
    totalPotentialRefund: totalRefund,
    pendingCount,
    pendingRefund,
    expiredCount,
  };
}

export function isWithinRefundWindow(purchaseDate: string, storeId: string): boolean {
  const policy = getPriceMatchPolicy(storeId);
  if (!policy.hasPolicy) return false;
  const purchase = new Date(purchaseDate);
  const cutoff = new Date(purchase);
  cutoff.setDate(cutoff.getDate() + policy.refundWindowDays);
  return cutoff >= new Date();
}

export function daysRemaining(purchaseDate: string, storeId: string): number {
  const policy = getPriceMatchPolicy(storeId);
  if (!policy.hasPolicy) return 0;
  const purchase = new Date(purchaseDate);
  const cutoff = new Date(purchase);
  cutoff.setDate(cutoff.getDate() + policy.refundWindowDays);
  const diff = cutoff.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
