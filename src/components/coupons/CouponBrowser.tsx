import { useState, useMemo, useEffect } from 'react';
import { formatDiscount, isExpiringSoon, isExpired } from '../../data/coupons';
import { couponService } from '../../lib/couponService';
import { BarcodeDisplay } from '../cards/BarcodeDisplay';
import type { Coupon, DietaryProfile, CouponCategory } from '../../lib/types';
import { COUPON_CATEGORIES } from '../../lib/types';

interface Props {
  nearbyStoreId: string | null;
  profile: DietaryProfile;
  clippedIds: string[];
  onClip: (id: string) => void;
  onUnclip: (id: string) => void;
}

export function CouponBrowser({ nearbyStoreId, profile, clippedIds, onClip, onUnclip }: Props) {
  const [category, setCategory] = useState<CouponCategory>('all');
  const [sortBy, setSortBy] = useState('popular');
  const [search, setSearch] = useState('');
  const [dietFilter, setDietFilter] = useState(true);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [view, setView] = useState<'browse' | 'clipped'>('browse');
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch coupons via service (mock or API depending on config)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    couponService.getCoupons({
      storeId: nearbyStoreId || undefined,
      category: category !== 'all' ? category : undefined,
      diet: dietFilter ? profile.diet : undefined,
      allergens: dietFilter ? profile.allergens : undefined,
      sortBy,
      search: search || undefined,
    }).then((coupons) => {
      if (!cancelled) { setAllCoupons(coupons); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [nearbyStoreId, category, sortBy, search, dietFilter, profile]);

  const activeCoupons = allCoupons;
  const filtered = activeCoupons;

  const clippedCoupons = useMemo(() => activeCoupons.filter((c) => clippedIds.includes(c.id)), [activeCoupons, clippedIds]);

  const daysUntilExpiry = (c: Coupon) => {
    const diff = new Date(c.validUntil).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header tabs */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-forest-600 font-display">Coupons</h2>
          {clippedIds.length > 0 && (
            <button onClick={() => setView(view === 'clipped' ? 'browse' : 'clipped')}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{ background: view === 'clipped' ? '#1B4332' : '#F3F4F6', color: view === 'clipped' ? 'white' : '#374151' }}>
              Clipped ({clippedIds.length})
            </button>
          )}
        </div>

        {view === 'browse' && (
          <>
            {/* Search */}
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input type="text" placeholder="Search coupons..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none focus:ring-2 focus:ring-forest-500/20" />
            </div>

            {/* Diet filter toggle + sort */}
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setDietFilter(!dietFilter)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                style={{
                  borderColor: dietFilter ? '#2D6A4F' : '#E5E7EB',
                  background: dietFilter ? '#ECFDF5' : 'white',
                  color: dietFilter ? '#2D6A4F' : '#6B7280',
                }}>
                {dietFilter ? '🥗' : '🍽️'} {dietFilter ? 'Diet Filtered' : 'Show All'}
              </button>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 bg-white text-gray-600 outline-none">
                <option value="popular">Most Popular</option>
                <option value="discount">Highest Savings</option>
                <option value="expiring">Expiring Soon</option>
                <option value="brand">By Brand</option>
              </select>
              <span className="ml-auto text-[10px] text-gray-400">{filtered.length} results</span>
            </div>

            {/* Category pills */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
              {COUPON_CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => setCategory(cat.id)}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
                  style={{
                    background: category === cat.id ? '#1B4332' : '#F3F4F6',
                    color: category === cat.id ? 'white' : '#6B7280',
                  }}>
                  <span>{cat.icon}</span> {cat.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Coupon list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide">
        {view === 'clipped' ? (
          clippedCoupons.length === 0 ? (
            <div className="text-center py-12">
              
              <p className="text-sm font-semibold text-gray-700">No clipped coupons</p>
              <p className="text-xs text-gray-400 mt-1">Clip coupons from the browse tab to use at checkout</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 font-medium">Ready for checkout — show these at the register</p>
              {clippedCoupons.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} isClipped onClip={onClip} onUnclip={onUnclip} onSelect={setSelectedCoupon} daysLeft={daysUntilExpiry(coupon)} />
              ))}
            </div>
          )
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            
            <p className="text-sm font-semibold text-gray-700">No coupons found</p>
            <p className="text-xs text-gray-400 mt-1">
              {nearbyStoreId ? 'Try a different category or disable diet filtering' : 'Select a store or enable location to see store-specific coupons'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} isClipped={clippedIds.includes(coupon.id)}
                onClip={onClip} onUnclip={onUnclip} onSelect={setSelectedCoupon} daysLeft={daysUntilExpiry(coupon)} />
            ))}
          </div>
        )}
      </div>

      {/* Coupon Detail Modal */}
      {selectedCoupon && (
        <CouponDetailModal coupon={selectedCoupon} isClipped={clippedIds.includes(selectedCoupon.id)}
          onClip={onClip} onUnclip={onUnclip} onClose={() => setSelectedCoupon(null)} daysLeft={daysUntilExpiry(selectedCoupon)} />
      )}
    </div>
  );
}

// ─── Coupon Card ───
function CouponCard({ coupon, isClipped, onClip, onUnclip, onSelect, daysLeft }: {
  coupon: Coupon; isClipped: boolean; onClip: (id: string) => void; onUnclip: (id: string) => void;
  onSelect: (c: Coupon) => void; daysLeft: number;
}) {
  const expiring = isExpiringSoon(coupon);
  return (
    <div onClick={() => onSelect(coupon)}
      className="flex items-start gap-3 p-3.5 rounded-2xl border transition-all active:scale-[0.98] cursor-pointer"
      style={{ borderColor: isClipped ? '#2D6A4F40' : '#E5E7EB', background: isClipped ? '#ECFDF508' : 'white' }}>
      {/* Discount badge */}
      <div className="flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white text-center"
        style={{ background: coupon.discountType === 'freebie' ? '#7C3AED' : coupon.discountType === 'bogo' ? '#D97706' : '#1B4332' }}>
        {coupon.discountType === 'fixed' && <span className="text-lg font-bold leading-none">${coupon.discountValue.toFixed(coupon.discountValue % 1 ? 2 : 0)}</span>}
        {coupon.discountType === 'percent' && <span className="text-lg font-bold leading-none">{coupon.discountValue}%</span>}
        {coupon.discountType === 'bogo' && <span className="text-[10px] font-bold leading-tight">BOGO<br />{coupon.discountValue}%</span>}
        {coupon.discountType === 'freebie' && <span className="text-xs font-bold">FREE</span>}
        <span className="text-[9px] mt-0.5 opacity-75">
          {coupon.discountType === 'freebie' ? 'item' : 'OFF'}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">{coupon.productName}</p>
            {coupon.brand && <p className="text-[11px] text-gray-400 font-medium">{coupon.brand}</p>}
          </div>
          <button onClick={(e) => { e.stopPropagation(); isClipped ? onUnclip(coupon.id) : onClip(coupon.id); }}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: isClipped ? '#ECFDF5' : '#F3F4F6' }}>
            {isClipped ? 'Saved' : 'Clip'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{coupon.description}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {coupon.dietaryTags.filter((t) => ['vegan', 'gluten-free', 'keto'].includes(t)).slice(0, 3).map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
              style={{ background: tag === 'vegan' ? '#DCFCE7' : tag === 'gluten-free' ? '#FEF3C7' : '#DBEAFE',
                       color: tag === 'vegan' ? '#166534' : tag === 'gluten-free' ? '#92400E' : '#1E40AF' }}>
              {tag === 'gluten-free' ? 'GF' : tag === 'vegan' ? 'V' : tag.toUpperCase()}
            </span>
          ))}
          {expiring && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-50 text-red-600">
              {daysLeft}d left
            </span>
          )}
          {coupon.source === 'community' && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-purple-600">Community</span>
          )}
          {coupon.minPurchase > 0 && (
            <span className="text-[10px] text-gray-400">Min ${coupon.minPurchase.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Coupon Detail Modal ───
function CouponDetailModal({ coupon, isClipped, onClip, onUnclip, onClose, daysLeft }: {
  coupon: Coupon; isClipped: boolean; onClip: (id: string) => void; onUnclip: (id: string) => void;
  onClose: () => void; daysLeft: number;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-white animate-slide-up" style={{ maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800 font-display">{coupon.productName}</h3>
              {coupon.brand && <p className="text-sm text-gray-400">{coupon.brand}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-sm">✕</button>
          </div>

          {/* Big discount display */}
          <div className="rounded-2xl p-4 text-center text-white mb-4"
            style={{ background: coupon.discountType === 'freebie' ? '#7C3AED' : coupon.discountType === 'bogo' ? '#D97706' : '#1B4332' }}>
            <p className="text-3xl font-bold">{formatDiscount(coupon)}</p>
            <p className="text-xs mt-1 opacity-75">{coupon.description}</p>
          </div>

          {/* Barcode */}
          {coupon.barcode && (
            <div className="p-4 rounded-2xl bg-gray-50 mb-4">
              <p className="text-[10px] uppercase tracking-widest text-center mb-3 font-semibold text-gray-400">Coupon Barcode</p>
              <BarcodeDisplay value={coupon.barcode} height={60} />
            </div>
          )}

          {/* Details */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Expires</span>
              <span className={`font-semibold ${daysLeft <= 3 ? 'text-red-500' : 'text-gray-700'}`}>
                {new Date(coupon.validUntil).toLocaleDateString()} ({daysLeft}d left)
              </span>
            </div>
            {coupon.minPurchase > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Min Purchase</span>
                <span className="font-semibold text-gray-700">${coupon.minPurchase.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Source</span>
              <span className="font-semibold text-gray-700 capitalize">{coupon.source}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Votes</span>
              <span className="font-semibold text-gray-700">👍 {coupon.upvotes} · 👎 {coupon.downvotes}</span>
            </div>
          </div>

          {/* Diet tags */}
          {coupon.dietaryTags.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 mb-1.5">Dietary Info</p>
              <div className="flex flex-wrap gap-1.5">
                {coupon.dietaryTags.map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700">{tag}</span>
                ))}
              </div>
            </div>
          )}
          {coupon.allergens.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 mb-1.5">Contains Allergens</p>
              <div className="flex flex-wrap gap-1.5">
                {coupon.allergens.map((a) => (
                  <span key={a} className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Clip button */}
          <button onClick={() => isClipped ? onUnclip(coupon.id) : onClip(coupon.id)}
            className="w-full py-3.5 rounded-2xl font-semibold text-base transition-all active:scale-[0.98]"
            style={{ background: isClipped ? '#FEE2E2' : '#1B4332', color: isClipped ? '#DC2626' : 'white' }}>
            {isClipped ? '✕ Remove from Clipped' : 'Clip Coupon'}
          </button>
        </div>
      </div>
    </div>
  );
}
