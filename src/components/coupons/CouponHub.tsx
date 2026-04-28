import { useState, useRef } from 'react';
import { getStoreLinks, getLinkForStore } from '../../data/storeCouponLinks';
import { getStore, STORES } from '../../data/stores';
import { BarcodeDisplay } from '../cards/BarcodeDisplay';
import { generateId } from '../../lib/geo';
import type { LoyaltyCard, ManualCoupon } from '../../lib/types';

interface Props {
  cards: LoyaltyCard[];
  manualCoupons: ManualCoupon[];
  onAddCoupon: (coupon: ManualCoupon) => void;
  onDeleteCoupon: (id: string) => void;
  onMarkUsed: (id: string) => void;
}

export function CouponHub({ cards, manualCoupons, onAddCoupon, onDeleteCoupon, onMarkUsed }: Props) {
  const [subView, setSubView] = useState<'stores' | 'my_coupons' | 'add'>('stores');
  const [newDesc, setNewDesc] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  const [newExpires, setNewExpires] = useState('');
  const [newStoreId, setNewStoreId] = useState(cards[0]?.storeId || '');
  const [expandedCoupon, setExpandedCoupon] = useState<string | null>(null);

  const userStoreIds = [...new Set(cards.map((c) => c.storeId))];
  const storeLinks = getStoreLinks(userStoreIds);
  const allStoreLinks = getStoreLinks(STORES.map((s) => s.id));

  const activeCoupons = manualCoupons.filter((c) => !c.used && (!c.expiresAt || new Date(c.expiresAt) >= new Date()));
  const usedCoupons = manualCoupons.filter((c) => c.used);

  const handleAdd = () => {
    if (!newDesc.trim()) return;
    onAddCoupon({
      id: generateId(),
      storeId: newStoreId,
      description: newDesc.trim(),
      discountAmount: newDiscount.trim() || 'See coupon',
      barcode: newBarcode.trim() || undefined,
      expiresAt: newExpires || undefined,
      addedAt: new Date().toISOString(),
      used: false,
    });
    setNewDesc(''); setNewDiscount(''); setNewBarcode(''); setNewExpires('');
    setSubView('my_coupons');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sub-tabs */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100">
          {([['stores', 'Store Deals'], ['my_coupons', `My Coupons (${activeCoupons.length})`], ['add', '+ Add']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setSubView(id as typeof subView)}
              className="flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all"
              style={{ background: subView === id ? 'white' : 'transparent', color: subView === id ? '#1B4332' : '#6B7280',
                boxShadow: subView === id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide">
        {/* ─── Store Deals Launchers ─── */}
        {subView === 'stores' && (
          <div className="space-y-4 animate-fade-in">
            {/* User's stores first */}
            {storeLinks.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-forest-900/60 mb-2">Your Stores</p>
                <div className="space-y-2">
                  {storeLinks.map((link) => {
                    const store = getStore(link.storeId);
                    return (
                      <a key={link.storeId} href={link.couponUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3.5 rounded-xl card-surface active:scale-[0.98] transition-transform">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: (store?.color || '#6B7280') + '12' }}>
                          {store?.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-forest-900">{link.name}</p>
                          <p className="text-[11px] text-forest-900/55">{link.description}</p>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-forest-900/40 flex-shrink-0">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Other stores */}
            {allStoreLinks.filter((l) => !userStoreIds.includes(l.storeId)).length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-forest-900/60 mb-2">
                  {storeLinks.length > 0 ? 'Other Stores' : 'Store Deal Pages'}
                </p>
                <div className="space-y-2">
                  {allStoreLinks.filter((l) => !userStoreIds.includes(l.storeId)).map((link) => {
                    const store = getStore(link.storeId);
                    return (
                      <a key={link.storeId} href={link.couponUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl card-surface active:scale-[0.98] transition-transform opacity-70">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                          style={{ background: (store?.color || '#6B7280') + '08' }}>
                          {store?.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-forest-900">{link.name}</p>
                          <p className="text-[11px] text-forest-900/55">{link.description}</p>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-forest-900/40 flex-shrink-0">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* API integration teaser */}
            <div className="p-4 rounded-xl border border-brass-200 bg-brass-50/50">
              <p className="text-sm font-bold text-forest-900">Digital Coupons — Coming Soon</p>
              <p className="text-[11px] text-forest-900/55 mt-1 leading-relaxed">
                We're working on direct integrations with Kroger, Target Circle, and Publix to load digital coupons right inside CartKey. For now, tap any store above to manage your coupons on their site.
              </p>
            </div>
          </div>
        )}

        {/* ─── My Coupons (manual tracker) ─── */}
        {subView === 'my_coupons' && (
          <div className="space-y-3 animate-fade-in">
            {activeCoupons.length === 0 && usedCoupons.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm font-bold text-forest-900">No coupons yet</p>
                <p className="text-[11px] text-forest-900/55 mt-1 max-w-[220px] mx-auto leading-relaxed">
                  Add paper coupons, mailer offers, or in-store printouts so they show up during checkout.
                </p>
                <button onClick={() => setSubView('add')} className="mt-4 px-5 py-2.5 rounded-lg bg-forest-900 text-brass-100 text-sm font-semibold">
                  Add a Coupon
                </button>
              </div>
            ) : (
              <>
                {activeCoupons.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-forest-900/60 mb-2">Active ({activeCoupons.length})</p>
                    {activeCoupons.map((coupon) => {
                      const store = getStore(coupon.storeId);
                      const isExpanded = expandedCoupon === coupon.id;
                      return (
                        <div key={coupon.id} className="mb-2 rounded-xl card-surface overflow-hidden">
                          <button onClick={() => setExpandedCoupon(isExpanded ? null : coupon.id)} className="w-full p-3 text-left flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                              style={{ background: (store?.color || '#6B7280') + '12' }}>
                              {store?.icon || '🏷️'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-forest-900 truncate">{coupon.description}</p>
                              <p className="text-[11px] text-forest-900/55">{coupon.discountAmount} · {store?.name || 'Any store'}{coupon.expiresAt ? ` · Exp ${new Date(coupon.expiresAt).toLocaleDateString()}` : ''}</p>
                            </div>
                            <span className="text-forest-900/40 text-xs">{isExpanded ? '▲' : '▼'}</span>
                          </button>

                          {isExpanded && (
                            <div className="px-3 pb-3 animate-fade-in">
                              {coupon.barcode && (
                                <div className="p-3 rounded-lg bg-white border border-warm-200 mb-2">
                                  <p className="text-[10px] uppercase tracking-widest text-center mb-2 font-semibold text-forest-900/50">Scan at Checkout</p>
                                  <BarcodeDisplay value={coupon.barcode} height={60} />
                                </div>
                              )}
                              <div className="flex gap-2">
                                <button onClick={() => onMarkUsed(coupon.id)} className="flex-1 py-2 rounded-lg bg-forest-900 text-brass-100 text-xs font-semibold min-h-[36px]">Mark Used</button>
                                <button onClick={() => onDeleteCoupon(coupon.id)} className="py-2 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-semibold border border-red-200 min-h-[36px]">Delete</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {usedCoupons.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-forest-900/60 mb-2">Used ({usedCoupons.length})</p>
                    {usedCoupons.slice(0, 5).map((coupon) => (
                      <div key={coupon.id} className="mb-2 p-3 rounded-xl card-surface opacity-50 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-forest-900 line-through truncate">{coupon.description}</p>
                          <p className="text-[11px] text-forest-900/55">{coupon.discountAmount}</p>
                        </div>
                        <button onClick={() => onDeleteCoupon(coupon.id)} className="text-[11px] text-red-400">Remove</button>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => setSubView('add')} className="w-full py-3 rounded-lg border border-dashed border-forest-900/20 text-sm font-semibold text-forest-900/55 min-h-[44px]">
                  + Add Another Coupon
                </button>
              </>
            )}
          </div>
        )}

        {/* ─── Add Manual Coupon ─── */}
        {subView === 'add' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <p className="text-sm font-bold text-forest-900 mb-3">Add a Coupon</p>
              <p className="text-[11px] text-forest-900/55 mb-4 leading-relaxed">Enter details from a paper coupon, mailer, or in-store printout. If it has a barcode, enter it below and it will appear in checkout mode.</p>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-forest-900/55 uppercase tracking-wider">Store</label>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {cards.map((card) => {
                  const store = getStore(card.storeId);
                  return (
                    <button key={card.storeId} onClick={() => setNewStoreId(card.storeId)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all min-h-[36px]"
                      style={{ borderColor: newStoreId === card.storeId ? (store?.color || '#333') : '#E8E7DF',
                        background: newStoreId === card.storeId ? (store?.color || '#333') + '08' : 'white',
                        borderWidth: newStoreId === card.storeId ? 2 : 1 }}>
                      <span className="text-sm">{store?.icon}</span>
                      <span className="text-xs font-semibold text-forest-900">{store?.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-forest-900/55 uppercase tracking-wider">Description</label>
              <input type="text" placeholder="e.g., $2 off Tide Pods 42ct" value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 bg-white mt-1.5 outline-none focus:border-brass-400 transition-colors" />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-forest-900/55 uppercase tracking-wider">Discount</label>
              <input type="text" placeholder="e.g., $1.50 off, BOGO, 20% off" value={newDiscount} onChange={(e) => setNewDiscount(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 bg-white mt-1.5 outline-none focus:border-brass-400 transition-colors" />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-forest-900/55 uppercase tracking-wider">Barcode Number <span className="normal-case text-forest-900/40">(optional)</span></label>
              <input type="text" placeholder="Numbers below the barcode" value={newBarcode} onChange={(e) => setNewBarcode(e.target.value)}
                inputMode="numeric"
                className="w-full px-4 py-3 rounded-lg border border-warm-200 bg-white mt-1.5 outline-none focus:border-brass-400 transition-colors font-mono" />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-forest-900/55 uppercase tracking-wider">Expiration Date <span className="normal-case text-forest-900/40">(optional)</span></label>
              <input type="date" value={newExpires} onChange={(e) => setNewExpires(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 bg-white mt-1.5 outline-none focus:border-brass-400 transition-colors" />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setSubView('my_coupons')} className="flex-1 py-3.5 rounded-xl bg-warm-100 text-forest-900/55 font-semibold text-sm min-h-[48px]">Cancel</button>
              <button onClick={handleAdd} disabled={!newDesc.trim()}
                className="flex-1 py-3.5 rounded-xl bg-forest-900 text-brass-100 font-semibold text-sm disabled:opacity-30 transition-opacity min-h-[48px]">Save Coupon</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
