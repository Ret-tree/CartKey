import { useState, useMemo } from 'react';
import type { PurchaseRecord } from '../../data/budget';
import { formatCurrency } from '../../data/budget';
import {
  type PriceMatchOpportunity, getPriceMatchPolicy, calculateSummary,
  isWithinRefundWindow, daysRemaining,
} from '../../data/priceMatch';
import { checkKrogerPrices } from '../../lib/krogerService';
import { getStore } from '../../data/stores';
import { isKrogerFamily, getKrogerChainCode, KROGER_FAMILY } from '../../data/krogerFamily';
import { generateId } from '../../lib/geo';

interface Props {
  purchases: PurchaseRecord[];
  opportunities: PriceMatchOpportunity[];
  onAddOpportunity: (op: PriceMatchOpportunity) => void;
  onUpdateOpportunity: (id: string, patch: Partial<PriceMatchOpportunity>) => void;
  onDeleteOpportunity: (id: string) => void;
  zipCode: string;
  onSetZip: (zip: string) => void;
}

export function PriceMatchDashboard({ purchases, opportunities, onAddOpportunity, onUpdateOpportunity, onDeleteOpportunity, zipCode, onSetZip }: Props) {
  const [view, setView] = useState<'pending' | 'scan' | 'manual'>('pending');
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [scanResults, setScanResults] = useState<string[]>([]);

  // Manual entry state
  const [manualPurchaseId, setManualPurchaseId] = useState('');
  const [manualItemName, setManualItemName] = useState('');
  const [manualPaid, setManualPaid] = useState('');
  const [manualNow, setManualNow] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  const summary = useMemo(() => calculateSummary(opportunities), [opportunities]);

  // Filter purchases eligible for scanning (any Kroger-family store within its 14-day window)
  const krogerFamilyPurchases = useMemo(() => {
    return purchases.filter((p) => isKrogerFamily(p.storeId) && isWithinRefundWindow(p.date, p.storeId));
  }, [purchases]);

  // Group eligible receipts by store for the user-facing summary
  const eligibleByStore = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of krogerFamilyPurchases) {
      map.set(p.storeId, (map.get(p.storeId) || 0) + 1);
    }
    return map;
  }, [krogerFamilyPurchases]);

  // Manual entry: get current purchase to attach to
  const manualPurchase = manualPurchaseId ? purchases.find((p) => p.id === manualPurchaseId) : null;

  const runKrogerScan = async () => {
    if (!zipCode || !/^\d{5}$/.test(zipCode)) {
      alert('Please set your zip code first to enable Kroger-family price checks.');
      return;
    }
    if (krogerFamilyPurchases.length === 0) {
      alert('No Kroger-family receipts (Kroger, Harris Teeter, Fred Meyer, Ralphs, etc.) within the refund window.');
      return;
    }

    setScanning(true);
    setScanResults([]);
    let foundCount = 0;
    let totalSavings = 0;

    for (const purchase of krogerFamilyPurchases) {
      const store = getStore(purchase.storeId);
      const chainCode = getKrogerChainCode(purchase.storeId);
      if (!chainCode) continue;

      setScanProgress(`Checking ${purchase.items.length} items from ${store?.name || purchase.storeName} (${new Date(purchase.date).toLocaleDateString()})…`);
      const items = purchase.items.map((i) => ({ name: i.name }));
      const results = await checkKrogerPrices(items, zipCode, chainCode);

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const item = purchase.items[i];
        if (!result.matched) continue;

        const currentPrice = result.salePrice ?? result.regularPrice ?? 0;
        if (currentPrice <= 0) continue;

        const paidPerUnit = item.unitPrice;
        if (currentPrice < paidPerUnit - 0.05) {
          const refund = (paidPerUnit - currentPrice) * item.quantity;
          if (refund < 0.25) continue;

          const alreadyExists = opportunities.some(
            (op) => op.purchaseId === purchase.id && op.itemName === item.name && op.status === 'pending'
          );
          if (alreadyExists) continue;

          const op: PriceMatchOpportunity = {
            id: generateId(),
            purchaseId: purchase.id,
            itemName: item.name,
            storeId: purchase.storeId,
            storeName: purchase.storeName,
            pricePaid: paidPerUnit,
            currentPrice,
            potentialRefund: refund,
            purchaseDate: purchase.date,
            detectedAt: new Date().toISOString(),
            source: 'api',
            withinWindow: true,
            status: 'pending',
            notes: result.productName ? `Matched: ${result.productName}` : undefined,
          };
          onAddOpportunity(op);
          foundCount++;
          totalSavings += refund;
        }
      }
    }

    setScanProgress('');
    setScanResults([
      foundCount > 0
        ? `Found ${foundCount} price drop${foundCount > 1 ? 's' : ''} totaling ${formatCurrency(totalSavings)} in potential refunds`
        : 'No price drops detected. All items still at the price you paid or higher.',
    ]);
    setScanning(false);
  };

  const submitManual = () => {
    const paid = parseFloat(manualPaid);
    const now = parseFloat(manualNow);
    if (!manualPurchase || !manualItemName.trim() || isNaN(paid) || isNaN(now) || now >= paid) {
      alert('Please fill in all fields. The current price must be lower than what you paid.');
      return;
    }
    const op: PriceMatchOpportunity = {
      id: generateId(),
      purchaseId: manualPurchase.id,
      itemName: manualItemName.trim(),
      storeId: manualPurchase.storeId,
      storeName: manualPurchase.storeName,
      pricePaid: paid,
      currentPrice: now,
      potentialRefund: paid - now,
      purchaseDate: manualPurchase.date,
      detectedAt: new Date().toISOString(),
      source: 'manual',
      withinWindow: isWithinRefundWindow(manualPurchase.date, manualPurchase.storeId),
      status: 'pending',
      notes: manualNotes.trim() || undefined,
    };
    onAddOpportunity(op);
    setManualPurchaseId(''); setManualItemName(''); setManualPaid(''); setManualNow(''); setManualNotes('');
    setView('pending');
  };

  const pendingOps = opportunities.filter((o) => o.status === 'pending');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 pt-3 pb-2">
        <h2 className="text-xl font-bold text-forest-900 font-display mb-1">Price Match</h2>
        <p className="text-[11px] text-forest-900/55 mb-3">Get refunds for price drops on items you already bought</p>

        <div className="flex gap-1 p-1 rounded-xl bg-gray-100">
          <button onClick={() => setView('pending')} className="flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: view === 'pending' ? 'white' : 'transparent', color: view === 'pending' ? '#1B4332' : '#6B7280',
              boxShadow: view === 'pending' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            Pending ({pendingOps.length})
          </button>
          <button onClick={() => setView('scan')} className="flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: view === 'scan' ? 'white' : 'transparent', color: view === 'scan' ? '#1B4332' : '#6B7280',
              boxShadow: view === 'scan' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            Auto Scan
          </button>
          <button onClick={() => setView('manual')} className="flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: view === 'manual' ? 'white' : 'transparent', color: view === 'manual' ? '#1B4332' : '#6B7280',
              boxShadow: view === 'manual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            + Manual
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide">
        {/* ─── Summary Card ─── */}
        {summary.totalOpportunities > 0 && (
          <div className="p-4 rounded-xl bg-brass-50 border border-brass-200 mb-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-brass-600 mb-1">Total Potential Refunds</p>
            <p className="text-2xl font-display font-bold text-forest-900">{formatCurrency(summary.pendingRefund)}</p>
            <p className="text-[11px] text-forest-900/55 mt-0.5">
              {summary.pendingCount} pending claim{summary.pendingCount !== 1 ? 's' : ''}{summary.expiredCount > 0 ? ` · ${summary.expiredCount} expired` : ''}
            </p>
          </div>
        )}

        {/* ─── Pending Opportunities ─── */}
        {view === 'pending' && (
          <div className="space-y-3 animate-fade-in">
            {pendingOps.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm font-bold text-forest-900">No pending price matches</p>
                <p className="text-[11px] text-forest-900/55 mt-1 max-w-[260px] mx-auto leading-relaxed">
                  Run an auto scan on your recent Kroger receipts, or manually log a price drop you spotted.
                </p>
              </div>
            ) : (
              pendingOps.map((op) => {
                const policy = getPriceMatchPolicy(op.storeId);
                const days = daysRemaining(op.purchaseDate, op.storeId);
                const store = getStore(op.storeId);
                return (
                  <div key={op.id} className="rounded-xl card-surface overflow-hidden">
                    <div className="p-3.5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: (store?.color || '#666') + '12' }}>{store?.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-forest-900 truncate">{op.itemName}</p>
                          <p className="text-[11px] text-forest-900/55">{op.storeName} · purchased {new Date(op.purchaseDate).toLocaleDateString()}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-forest-900/55 line-through">{formatCurrency(op.pricePaid)}</span>
                            <span className="text-xs font-semibold text-green-700">→ {formatCurrency(op.currentPrice)}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-bold text-brass-600">+{formatCurrency(op.potentialRefund)}</p>
                          {op.withinWindow ? (
                            <p className="text-[10px] text-forest-900/55">{days}d to claim</p>
                          ) : (
                            <p className="text-[10px] text-red-500">Window expired</p>
                          )}
                        </div>
                      </div>

                      {op.notes && <p className="text-[11px] text-forest-900/55 mt-2 italic">{op.notes}</p>}
                    </div>

                    <div className="px-3.5 py-2.5 bg-warm-100 border-t border-warm-200">
                      <p className="text-[11px] text-forest-900/60 mb-2">{policy.notes}</p>
                      <div className="flex gap-2">
                        {policy.policyUrl && (
                          <a href={policy.policyUrl} target="_blank" rel="noopener noreferrer"
                            className="flex-1 py-2 rounded-lg bg-forest-900 text-brass-100 text-[11px] font-semibold text-center min-h-[36px] flex items-center justify-center">
                            View Policy →
                          </a>
                        )}
                        <button onClick={() => onUpdateOpportunity(op.id, { status: 'claimed' })}
                          className="flex-1 py-2 rounded-lg bg-brass-400 text-forest-900 text-[11px] font-bold min-h-[36px]">
                          Mark Claimed
                        </button>
                        <button onClick={() => onDeleteOpportunity(op.id)}
                          className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-[11px] font-semibold border border-red-200 min-h-[36px]">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ─── Auto Scan (Kroger Family) ─── */}
        {view === 'scan' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-xl card-surface">
              <p className="text-sm font-bold text-forest-900 mb-1">Auto Scan with Kroger API</p>
              <p className="text-[11px] text-forest-900/55 leading-relaxed">
                Compare your recent Kroger-family receipts against current shelf prices. Works for Kroger, Harris Teeter, Fred Meyer, Ralphs, King Soopers, Fry's, Smith's, QFC, Mariano's, Pick 'n Save, Dillons, and City Market.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-forest-900/55 uppercase tracking-wider">Your Zip Code</label>
              <input type="text" placeholder="22554" value={zipCode} onChange={(e) => onSetZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                inputMode="numeric"
                className="w-full px-4 py-3 rounded-lg border border-warm-200 bg-white mt-1.5 outline-none focus:border-brass-400 transition-colors font-mono"
                maxLength={5} />
              <p className="text-[11px] text-forest-900/55 mt-1">Used to find your nearest store of each chain.</p>
            </div>

            <div className="p-3 rounded-xl bg-warm-100">
              <p className="text-[11px] font-semibold text-forest-900/55 uppercase tracking-wider mb-1">Eligible Receipts</p>
              <p className="text-sm font-bold text-forest-900">{krogerFamilyPurchases.length} receipt{krogerFamilyPurchases.length !== 1 ? 's' : ''}</p>
              {eligibleByStore.size > 0 ? (
                <div className="mt-2 space-y-1">
                  {Array.from(eligibleByStore.entries()).map(([storeId, count]) => {
                    const store = getStore(storeId);
                    return (
                      <p key={storeId} className="text-[11px] text-forest-900/60">
                        <span className="mr-1">{store?.icon}</span>{store?.name}: {count}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-forest-900/55 mt-0.5">Within the 14-day refund window</p>
              )}
            </div>

            <button onClick={runKrogerScan} disabled={scanning || krogerFamilyPurchases.length === 0 || !zipCode}
              className="w-full py-3.5 rounded-xl bg-forest-900 text-brass-100 font-semibold text-base disabled:opacity-40 transition-opacity min-h-[52px]">
              {scanning ? 'Scanning…' : 'Run Price Check'}
            </button>

            {scanProgress && <p className="text-[11px] text-forest-900/55 text-center animate-pulse">{scanProgress}</p>}

            {scanResults.length > 0 && (
              <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                {scanResults.map((r, i) => <p key={i} className="text-sm font-semibold text-green-700">{r}</p>)}
              </div>
            )}

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-[11px] font-semibold text-amber-700 mb-1">Other Stores</p>
              <p className="text-[11px] text-forest-900/60 leading-relaxed">
                Auto Scan works for the {KROGER_FAMILY.length} Kroger-family banners listed above. For other stores, use the Manual tab to enter a price drop you spotted in a weekly ad or on the store's website.
              </p>
            </div>
          </div>
        )}

        {/* ─── Manual Entry ─── */}
        {view === 'manual' && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-[11px] text-forest-900/55 leading-relaxed">
              Saw an item you bought now advertised at a lower price? Log it here and CartKey will track the potential refund.
            </p>

            <div>
              <label className="text-[11px] font-semibold text-forest-900/55 uppercase tracking-wider">Receipt</label>
              <select value={manualPurchaseId} onChange={(e) => setManualPurchaseId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 bg-white mt-1.5 outline-none focus:border-brass-400">
                <option value="">Select a receipt…</option>
                {purchases.slice(0, 30).map((p) => (
                  <option key={p.id} value={p.id}>
                    {new Date(p.date).toLocaleDateString()} · {p.storeName} · {formatCurrency(p.total)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-forest-900/55 uppercase tracking-wider">Item Name</label>
              <input type="text" placeholder="e.g., Tide Pods 42ct" value={manualItemName} onChange={(e) => setManualItemName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 bg-white mt-1.5 outline-none focus:border-brass-400" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-forest-900/55 uppercase tracking-wider">Price Paid</label>
                <input type="text" placeholder="4.99" value={manualPaid} onChange={(e) => setManualPaid(e.target.value)}
                  inputMode="decimal"
                  className="w-full px-4 py-3 rounded-lg border border-warm-200 bg-white mt-1.5 outline-none focus:border-brass-400 font-mono" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-forest-900/55 uppercase tracking-wider">Current Price</label>
                <input type="text" placeholder="3.49" value={manualNow} onChange={(e) => setManualNow(e.target.value)}
                  inputMode="decimal"
                  className="w-full px-4 py-3 rounded-lg border border-warm-200 bg-white mt-1.5 outline-none focus:border-brass-400 font-mono" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-forest-900/55 uppercase tracking-wider">Where You Saw It <span className="normal-case text-forest-900/40">(optional)</span></label>
              <input type="text" placeholder="e.g., this week's circular, store website" value={manualNotes} onChange={(e) => setManualNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 bg-white mt-1.5 outline-none focus:border-brass-400" />
            </div>

            {manualPaid && manualNow && parseFloat(manualPaid) > parseFloat(manualNow) && (
              <div className="p-3 rounded-xl bg-brass-50 border border-brass-200">
                <p className="text-[11px] font-semibold text-brass-700">Potential Refund</p>
                <p className="text-2xl font-display font-bold text-forest-900">{formatCurrency(parseFloat(manualPaid) - parseFloat(manualNow))}</p>
              </div>
            )}

            <button onClick={submitManual}
              disabled={!manualPurchaseId || !manualItemName.trim() || !manualPaid || !manualNow || parseFloat(manualNow) >= parseFloat(manualPaid)}
              className="w-full py-3.5 rounded-xl bg-forest-900 text-brass-100 font-semibold text-base disabled:opacity-30 min-h-[52px]">
              Save Price Match
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
