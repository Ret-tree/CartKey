import { useState, useEffect, useCallback } from 'react';
import { BarcodeDisplay } from '../cards/BarcodeDisplay';
import { formatCardDisplay } from '../../lib/cardValidation';
import { formatCurrency, ESTIMATED_CATEGORY_PRICES, createPurchaseFromCheckout } from '../../data/budget';
import { MOCK_COUPONS, formatDiscount, isExpired } from '../../data/coupons';
import { getStore } from '../../data/stores';
import type { LoyaltyCard } from '../../lib/types';
import type { Coupon } from '../../lib/types';
import type { PurchaseRecord, BudgetConfig } from '../../data/budget';
import type { ShoppingList } from '../../data/shopping';

interface Props {
  card: LoyaltyCard;
  clippedIds: string[];
  budgetRemaining: number;
  budgetPeriodLabel: string;
  activeList: ShoppingList | null;
  onComplete: (purchase: PurchaseRecord | null) => void;
  onClose: () => void;
}

type Stage = 'card' | 'coupons' | 'done';

export function CheckoutMode({ card, clippedIds, budgetRemaining, budgetPeriodLabel, activeList, onComplete, onClose }: Props) {
  const [stage, setStage] = useState<Stage>('card');
  const [couponIdx, setCouponIdx] = useState(0);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [logTrip, setLogTrip] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const storeData = getStore(card.storeId);

  // Get active clipped coupons for this store
  const activeCoupons = MOCK_COUPONS.filter(
    (c) => clippedIds.includes(c.id) && !isExpired(c) && c.retailerIds.includes(card.storeId) && c.barcode
  );

  // Screen Wake Lock — keep screen on during checkout
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    (async () => {
      try {
        if ('wakeLock' in navigator) {
          lock = await navigator.wakeLock.request('screen');
          setWakeLock(lock);
        }
      } catch { /* wake lock not available */ }
    })();
    return () => { lock?.release(); };
  }, []);

  // Request max brightness via CSS (works on some mobile browsers)
  useEffect(() => {
    document.documentElement.style.setProperty('--screen-brightness', '1');
    return () => { document.documentElement.style.removeProperty('--screen-brightness'); };
  }, []);

  const nextCoupon = () => {
    if (couponIdx < activeCoupons.length - 1) {
      setCouponIdx(couponIdx + 1);
    } else {
      setStage('done');
    }
  };

  const prevCoupon = () => {
    if (couponIdx > 0) setCouponIdx(couponIdx - 1);
    else setStage('card');
  };

  const handleDone = () => {
    if (logTrip && activeList) {
      const checkedItems = activeList.items
        .filter((i) => i.checked)
        .map((i) => ({ name: i.name, quantity: i.quantity, category: i.category, matchedCouponIds: i.matchedCouponIds }));
      if (checkedItems.length > 0) {
        const purchase = createPurchaseFromCheckout(
          activeList.name, card.storeId, card.storeName, checkedItems, ESTIMATED_CATEGORY_PRICES
        );
        onComplete(purchase);
        return;
      }
    }
    onComplete(null);
  };

  const checkedCount = activeList?.items.filter((i) => i.checked).length ?? 0;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-forest-900" style={{ filter: 'brightness(1.1)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-forest-900">
        <button onClick={onClose} className="text-white/60 text-sm font-medium min-h-[44px] min-w-[44px] flex items-center">
          ← Back
        </button>
        <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest">Checkout</p>
        <div className="min-w-[44px]" />
      </div>

      {/* ── Card Stage ── */}
      {stage === 'card' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 animate-fade-in">
          {/* Store badge */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">{card.icon}</span>
            <div>
              <p className="text-white font-display font-bold text-xl">{card.storeName}</p>
              <p className="text-white/40 text-xs font-mono tracking-wider">{formatCardDisplay(card.cardNumber, card.storeId)}</p>
            </div>
          </div>

          {/* Barcode - large, white background */}
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl shadow-black/30">
            {!showPhone ? (
              <>
                <p className="text-[10px] uppercase tracking-widest text-center mb-4 font-semibold text-forest-900/25">Loyalty Card</p>
                <BarcodeDisplay value={card.cardNumber} height={100} symbology={storeData?.barcodeSymbology} />
              </>
            ) : (
              <>
                <p className="text-[10px] uppercase tracking-widest text-center mb-4 font-semibold text-forest-900/25">Enter on PIN Pad</p>
                <p className="text-4xl font-mono font-bold text-forest-900 text-center tracking-widest py-4">
                  {card.phoneNumber?.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
                </p>
              </>
            )}
          </div>

          {/* Phone toggle */}
          {card.phoneNumber && storeData?.supportsPhone && (
            <button onClick={() => setShowPhone(!showPhone)}
              className="mt-4 px-4 py-2 rounded-full text-xs font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              {showPhone ? 'Show Barcode' : 'Use Phone Number Instead'}
            </button>
          )}

          {/* Budget pill */}
          <div className="mt-6 px-4 py-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <p className="text-white/50 text-xs">
              {budgetPeriodLabel}: <span className="text-brass-400 font-bold">{formatCurrency(budgetRemaining)}</span> remaining
            </p>
          </div>

          {/* Next action */}
          <div className="mt-8 w-full max-w-sm">
            {activeCoupons.length > 0 ? (
              <button onClick={() => setStage('coupons')}
                className="w-full py-4 rounded-xl bg-brass-400 text-forest-900 font-bold text-base active:scale-[0.97] transition-transform">
                Show {activeCoupons.length} Coupon{activeCoupons.length > 1 ? 's' : ''} →
              </button>
            ) : (
              <button onClick={() => setStage('done')}
                className="w-full py-4 rounded-xl bg-brass-400 text-forest-900 font-bold text-base active:scale-[0.97] transition-transform">
                Finish Checkout
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Coupons Stage ── */}
      {stage === 'coupons' && activeCoupons[couponIdx] && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 animate-fade-in">
          {/* Counter */}
          <div className="flex items-center gap-2 mb-4">
            <p className="text-white/40 text-xs font-semibold">
              Coupon {couponIdx + 1} of {activeCoupons.length}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5 mb-6">
            {activeCoupons.map((_, i) => (
              <div key={i} className="h-1.5 rounded-full transition-all duration-200"
                style={{ width: i === couponIdx ? 20 : 6, background: i === couponIdx ? '#C9A227' : 'rgba(255,255,255,0.15)' }} />
            ))}
          </div>

          {/* Coupon card */}
          <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
            {/* Discount banner */}
            <div className="py-3 px-4 text-center" style={{ background: activeCoupons[couponIdx].discountType === 'freebie' ? '#7C3AED' : '#1B4332' }}>
              <p className="text-white font-bold text-lg">{formatDiscount(activeCoupons[couponIdx])}</p>
              <p className="text-white/60 text-xs mt-0.5">{activeCoupons[couponIdx].productName}</p>
            </div>

            {/* Barcode */}
            <div className="p-6">
              <p className="text-[10px] uppercase tracking-widest text-center mb-4 font-semibold text-forest-900/25">Scan Coupon</p>
              <BarcodeDisplay value={activeCoupons[couponIdx].barcode!} height={80} />
              {activeCoupons[couponIdx].description && (
                <p className="text-xs text-center text-forest-900/40 mt-3">{activeCoupons[couponIdx].description}</p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 w-full max-w-sm flex gap-3">
            <button onClick={prevCoupon}
              className="flex-1 py-4 rounded-xl text-white/60 font-semibold text-sm min-h-[52px]" style={{ background: 'rgba(255,255,255,0.08)' }}>
              ← {couponIdx === 0 ? 'Card' : 'Prev'}
            </button>
            <button onClick={nextCoupon}
              className="flex-1 py-4 rounded-xl bg-brass-400 text-forest-900 font-bold text-sm active:scale-[0.97] transition-transform min-h-[52px]">
              {couponIdx === activeCoupons.length - 1 ? 'Done ✓' : 'Next →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Done Stage ── */}
      {stage === 'done' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-brass-400/20 flex items-center justify-center mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C9A227" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h2 className="text-white font-display font-bold text-2xl">All done</h2>
          <p className="text-white/40 text-sm mt-2">
            {activeCoupons.length > 0 ? `Card + ${activeCoupons.length} coupon${activeCoupons.length > 1 ? 's' : ''} presented` : 'Card scanned'}
          </p>

          {/* Log trip option */}
          {activeList && checkedCount > 0 && (
            <div className="mt-8 w-full max-w-sm p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <button onClick={() => setLogTrip(!logTrip)} className="flex items-center gap-3 w-full text-left">
                <div className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: logTrip ? '#C9A227' : 'rgba(255,255,255,0.2)', background: logTrip ? '#C9A227' : 'transparent' }}>
                  {logTrip && <span className="text-forest-900 text-xs font-bold">✓</span>}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Log this trip to budget</p>
                  <p className="text-white/40 text-[11px]">{checkedCount} items from "{activeList.name}" · est. total tracked</p>
                </div>
              </button>
            </div>
          )}

          <div className="mt-8 w-full max-w-sm">
            <button onClick={handleDone}
              className="w-full py-4 rounded-xl bg-brass-400 text-forest-900 font-bold text-base active:scale-[0.97] transition-transform">
              {logTrip && activeList && checkedCount > 0 ? 'Log & Close' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
