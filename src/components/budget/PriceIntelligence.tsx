import { useState, useMemo } from 'react';
import type { PurchaseRecord } from '../../data/budget';
import { formatCurrency } from '../../data/budget';
import type { Coupon } from '../../lib/types';
import {
  buildPriceHistory, getTopProducts, getPriceAlerts, detectMissedSavings,
  generateRecommendations, getMonthlyHistory, calculateUnitPrice,
  type ProductPriceHistory, type MissedSaving, type ProductRecommendation,
} from '../../data/priceIntelligence';

interface Props {
  purchases: PurchaseRecord[];
  coupons: Coupon[];
  clippedIds: string[];
  onClip: (id: string) => void;
}

export function PriceIntelligence({ purchases, coupons, clippedIds, onClip }: Props) {
  const [subView, setSubView] = useState<'prices' | 'savings' | 'insights'>('savings');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const priceHistory = useMemo(() => buildPriceHistory(purchases), [purchases]);
  const topProducts = useMemo(() => getTopProducts(priceHistory, 12), [priceHistory]);
  const priceAlerts = useMemo(() => getPriceAlerts(priceHistory), [priceHistory]);
  const missedSavings = useMemo(() => detectMissedSavings(purchases, coupons, clippedIds), [purchases, coupons, clippedIds]);
  const recommendations = useMemo(() => generateRecommendations(purchases, coupons, clippedIds), [purchases, coupons, clippedIds]);
  const monthlyHistory = useMemo(() => getMonthlyHistory(purchases), [purchases]);

  const totalMissed = missedSavings.reduce((s, m) => s + m.couponDiscount, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 pt-3 pb-2">
        <h2 className="text-xl font-bold text-forest-600 font-display mb-3">Price Intelligence</h2>
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100">
          {([['savings', 'Savings'], ['prices', 'Prices'], ['insights', 'Trends']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setSubView(id)}
              className="flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all"
              style={{ background: subView === id ? 'white' : 'transparent', color: subView === id ? '#1B4332' : '#6B7280',
                boxShadow: subView === id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide">
        {/* ─── Savings View ─── */}
        {subView === 'savings' && (
          <div className="space-y-4 animate-fade-in">
            {/* Missed savings */}
            {missedSavings.length > 0 ? (
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-amber-700">Missed Savings</p>
                  <p className="text-sm font-bold text-amber-700">{formatCurrency(totalMissed)}</p>
                </div>
                <p className="text-[10px] text-amber-600 mb-3">Coupons were available for items you bought recently</p>
                <div className="space-y-2">
                  {missedSavings.slice(0, 5).map((ms, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-white">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{ms.itemName}</p>
                        <p className="text-[10px] text-gray-400">{ms.storeName} · {new Date(ms.purchaseDate).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs font-bold text-amber-600">-{formatCurrency(ms.couponDiscount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-green-200 bg-green-50/50 text-center">
                
                <p className="text-sm font-semibold text-green-700 mt-1">No missed savings!</p>
                <p className="text-[10px] text-green-600 mt-0.5">You're catching all available coupons</p>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Recommended For You</p>
                <div className="space-y-2">
                  {recommendations.map((rec) => {
                    const isClipped = clippedIds.includes(rec.couponId);
                    return (
                      <div key={rec.couponId} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{rec.productName}</p>
                          <p className="text-[10px] text-gray-400">{rec.brand} · {rec.reason}</p>
                          <p className="text-xs font-bold text-forest-600 mt-0.5">{rec.discount}</p>
                        </div>
                        <button onClick={() => onClip(rec.couponId)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                          style={{ background: isClipped ? '#F3F4F6' : '#ECFDF5', color: isClipped ? '#9CA3AF' : '#059669' }}>
                          {isClipped ? 'Saved' : 'Clip'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {purchases.length === 0 && recommendations.length === 0 && (
              <div className="text-center py-8">
                
                <p className="text-sm text-gray-500 mt-2">Log some purchases to see personalized savings tips</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Price History View ─── */}
        {subView === 'prices' && (
          <div className="space-y-4 animate-fade-in">
            {/* Price alerts */}
            {priceAlerts.length > 0 && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs font-semibold text-red-600 mb-1">Price Increases Detected</p>
                {priceAlerts.slice(0, 3).map((a) => (
                  <p key={a.productName} className="text-[10px] text-red-500">
                    {a.productName}: +{a.changePercent.toFixed(0)}% since first purchase
                  </p>
                ))}
              </div>
            )}

            {topProducts.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Your Products</p>
                <div className="space-y-2">
                  {topProducts.map((product) => {
                    const isExpanded = expandedProduct === product.productName;
                    return (
                      <div key={product.productName} className="rounded-2xl border border-gray-100 overflow-hidden">
                        <button onClick={() => setExpandedProduct(isExpanded ? null : product.productName)}
                          className="w-full flex items-center gap-3 p-3 text-left">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{product.productName}</p>
                            <p className="text-[10px] text-gray-400">{product.pricePoints.length} purchase{product.pricePoints.length > 1 ? 's' : ''} · Best at {product.lowestStore}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-gray-800">{formatCurrency(product.averagePrice)}</p>
                            <div className="flex items-center gap-1 justify-end">
                              {product.priceDirection === 'up' && <span className="text-[10px] text-red-500">▲ {product.changePercent.toFixed(0)}%</span>}
                              {product.priceDirection === 'down' && <span className="text-[10px] text-green-500">▼ {Math.abs(product.changePercent).toFixed(0)}%</span>}
                              {product.priceDirection === 'stable' && <span className="text-[10px] text-gray-400">━ stable</span>}
                            </div>
                          </div>
                        </button>

                        {isExpanded && product.pricePoints.length > 0 && (
                          <div className="px-3 pb-3 animate-fade-in">
                            {/* SVG mini chart */}
                            <PriceChart points={product.pricePoints.map((p) => ({ date: p.date, price: p.price }))} />
                            <div className="flex gap-3 mt-2 text-[10px]">
                              <span className="text-gray-400">Low: <span className="font-bold text-green-600">{formatCurrency(product.lowestPrice)}</span></span>
                              <span className="text-gray-400">High: <span className="font-bold text-red-500">{formatCurrency(product.highestPrice)}</span></span>
                              <span className="text-gray-400">Avg: <span className="font-bold text-gray-700">{formatCurrency(product.averagePrice)}</span></span>
                            </div>
                            {/* Unit price for each purchase */}
                            <div className="mt-2 space-y-1">
                              {product.pricePoints.map((pp, i) => {
                                const item = purchases.flatMap((p) => p.items).find((it) => it.name.toLowerCase().trim() === product.productName.toLowerCase().trim() && purchases.find((p) => p.date === pp.date));
                                const up = item ? calculateUnitPrice(item) : null;
                                return (
                                  <div key={i} className="flex items-center justify-between text-[10px]">
                                    <span className="text-gray-400">{new Date(pp.date).toLocaleDateString()} · {pp.storeName}</span>
                                    <div className="flex gap-2">
                                      <span className="font-mono text-gray-700">{formatCurrency(pp.price)}</span>
                                      {up && up.displayUnit !== '/ea' && (
                                        <span className="font-mono text-forest-600">{up.displayPrice}</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                
                <p className="text-sm text-gray-500 mt-2">Price history builds as you log purchases</p>
                <p className="text-xs text-gray-400 mt-1">Scan receipts or log manually to start tracking</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Monthly Trends View ─── */}
        {subView === 'insights' && (
          <div className="space-y-4 animate-fade-in">
            {/* Monthly spending chart */}
            <div className="p-4 rounded-2xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-700 mb-3">Monthly Spending (6 months)</p>
              <MonthlyChart data={monthlyHistory} />
            </div>

            {/* Monthly savings chart */}
            <div className="p-4 rounded-2xl border border-green-100 bg-green-50/30">
              <p className="text-xs font-semibold text-green-700 mb-3">Monthly Coupon Savings</p>
              <div className="flex items-end gap-2 h-20">
                {monthlyHistory.map((m, i) => {
                  const maxSav = Math.max(...monthlyHistory.map((x) => x.couponSavings), 1);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <p className="text-[9px] font-bold text-green-600">{m.couponSavings > 0 ? formatCurrency(m.couponSavings) : '—'}</p>
                      <div className="w-full rounded-t-lg" style={{
                        height: `${Math.max(4, (m.couponSavings / maxSav) * 52)}px`,
                        background: i === monthlyHistory.length - 1 ? '#22C55E' : '#BBF7D0',
                      }} />
                      <p className="text-[9px] text-green-600">{m.month}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category spending breakdown across all time */}
            <div className="p-4 rounded-2xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-700 mb-3">All-Time Category Spending</p>
              <CategoryBreakdown purchases={purchases} />
            </div>

            {purchases.length === 0 && (
              <div className="text-center py-8">
                
                <p className="text-sm text-gray-500 mt-2">Trends appear after logging purchases</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SVG Price Chart ───
function PriceChart({ points }: { points: { date: string; price: number }[] }) {
  if (points.length < 2) {
    return <div className="h-12 flex items-center justify-center text-[10px] text-gray-400">Need 2+ data points for chart</div>;
  }

  const W = 280, H = 60, PAD = 8;
  const prices = points.map((p) => p.price);
  const minP = Math.min(...prices) * 0.95;
  const maxP = Math.max(...prices) * 1.05;
  const rangeP = maxP - minP || 1;

  const pts = points.map((p, i) => ({
    x: PAD + (i / (points.length - 1)) * (W - PAD * 2),
    y: PAD + (1 - (p.price - minP) / rangeP) * (H - PAD * 2),
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 60 }}>
      <defs>
        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#priceGrad)" />
      <path d={pathD} fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke="#2D6A4F" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

// ─── Monthly Bar Chart ───
function MonthlyChart({ data }: { data: { month: string; totalSpent: number }[] }) {
  const maxSpent = Math.max(...data.map((d) => d.totalSpent), 1);

  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((m, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <p className="text-[9px] font-bold text-gray-500">{m.totalSpent > 0 ? formatCurrency(m.totalSpent) : '—'}</p>
          <div className="w-full rounded-t-lg transition-all" style={{
            height: `${Math.max(4, (m.totalSpent / maxSpent) * 72)}px`,
            background: i === data.length - 1 ? '#1B4332' : '#E5E7EB',
          }} />
          <p className="text-[9px] text-gray-400">{m.month}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Category Breakdown ───
function CategoryBreakdown({ purchases }: { purchases: PurchaseRecord[] }) {
  const cats = new Map<string, number>();
  for (const p of purchases) for (const item of p.items) cats.set(item.category, (cats.get(item.category) || 0) + item.totalPrice);

  const sorted = Array.from(cats.entries()).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, v]) => s + v, 0) || 1;

  const CAT_COLORS: Record<string, string> = { produce: '#22C55E', dairy: '#3B82F6', meat: '#EF4444', bakery: '#F59E0B', snacks: '#A855F7', beverages: '#06B6D4', frozen: '#6366F1', household: '#78716C', personal: '#EC4899', other: '#9CA3AF' };
  const CAT_ICONS: Record<string, string> = { produce: '🥬', dairy: '🥛', meat: '🥩', bakery: '🍞', snacks: '🍿', beverages: '🥤', frozen: '🧊', household: '🏠', personal: '🧴', other: '📦' };

  if (sorted.length === 0) return <p className="text-xs text-gray-400 text-center py-4">No data yet</p>;

  return (
    <div className="space-y-2">
      {sorted.slice(0, 8).map(([cat, amount]) => (
        <div key={cat}>
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{CAT_ICONS[cat] || '📦'}</span>
              <span className="text-xs font-medium text-gray-700 capitalize">{cat}</span>
            </div>
            <span className="text-xs font-bold text-gray-800">{formatCurrency(amount)} <span className="text-[9px] font-normal text-gray-400">({(amount / total * 100).toFixed(0)}%)</span></span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(amount / total) * 100}%`, background: CAT_COLORS[cat] || '#9CA3AF' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
