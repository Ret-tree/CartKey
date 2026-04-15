import { useState, useMemo } from 'react';
import type { BudgetConfig, PurchaseRecord } from '../../data/budget';
import {
  calculateSpendingSummary, calculateSavingsReport, getWeeklySpendingTrend,
  getDaysRemaining, getDaysTotal, formatCurrency, formatPeriodLabel,
  BUDGET_CATEGORIES, DEFAULT_BUDGET,
} from '../../data/budget';
import type { BudgetPeriod } from '../../data/budget';
import { ManualPurchaseForm } from './ManualPurchaseForm';
import { ReceiptScanner } from '../receipts/ReceiptScanner';
import { ReceiptCorrection } from '../receipts/ReceiptCorrection';
import type { ParsedReceipt } from '../../data/receiptParser';

interface Props {
  budget: BudgetConfig;
  purchases: PurchaseRecord[];
  onUpdateBudget: (b: BudgetConfig) => void;
  onAddPurchase: (p: PurchaseRecord) => void;
}

export function BudgetDashboard({ budget, purchases, onUpdateBudget, onAddPurchase }: Props) {
  const [view, setView] = useState<'overview' | 'log' | 'settings'>('overview');
  const [logMode, setLogMode] = useState<'choose' | 'scan' | 'correct' | 'manual'>('choose');
  const [scannedReceipt, setScannedReceipt] = useState<ParsedReceipt | null>(null);

  const summary = useMemo(() => calculateSpendingSummary(purchases, budget), [purchases, budget]);
  const savings = useMemo(() => calculateSavingsReport(purchases, budget), [purchases, budget]);
  const weeklyTrend = useMemo(() => getWeeklySpendingTrend(purchases), [purchases]);
  const daysLeft = getDaysRemaining(budget.period);
  const daysTotal = getDaysTotal(budget.period);
  const dailyBudgetRemaining = daysLeft > 0 ? summary.remaining / daysLeft : 0;

  // Color based on budget usage
  const progressColor = summary.percentUsed > 0.9 ? '#EF4444' : summary.percentUsed > 0.75 ? '#F59E0B' : '#22C55E';
  const maxTrend = Math.max(...weeklyTrend.map((w) => w.amount), 1);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-forest-600 font-display">Budget</h2>
          <span className="text-[10px] font-semibold text-gray-400">{formatPeriodLabel(budget.period)} · {daysLeft}d left</span>
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100">
          {(['overview', 'log', 'settings'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
              style={{ background: view === v ? 'white' : 'transparent', color: view === v ? '#1B4332' : '#6B7280',
                boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {v === 'overview' ? 'Overview' : v === 'log' ? 'Log' : 'Settings'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide">
        {view === 'overview' && (
          <div className="space-y-4 animate-fade-in">
            {/* Main budget gauge */}
            <div className="p-4 rounded-2xl" style={{ background: `${progressColor}08`, border: `1px solid ${progressColor}25` }}>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.totalSpent)}</p>
                  <p className="text-xs text-gray-400">of {formatCurrency(budget.total)} budget</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold" style={{ color: progressColor }}>{formatCurrency(summary.remaining)}</p>
                  <p className="text-[10px] text-gray-400">remaining</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, summary.percentUsed * 100)}%`, background: progressColor }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <p className="text-[10px] text-gray-400">{(summary.percentUsed * 100).toFixed(0)}% used</p>
                <p className="text-[10px] text-gray-400">~{formatCurrency(dailyBudgetRemaining)}/day left</p>
              </div>
            </div>

            {/* Alert banner */}
            {summary.percentUsed >= 0.9 && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs font-semibold text-red-600">⚠️ Budget nearly exhausted</p>
                <p className="text-[10px] text-red-500 mt-0.5">Only {formatCurrency(summary.remaining)} remaining with {daysLeft} days left in the period</p>
              </div>
            )}
            {summary.percentUsed >= 0.75 && summary.percentUsed < 0.9 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs font-semibold text-amber-600">75% of budget used</p>
                <p className="text-[10px] text-amber-500 mt-0.5">{formatCurrency(dailyBudgetRemaining)} per day for the remaining {daysLeft} days</p>
              </div>
            )}

            {/* Weekly trend */}
            <div className="p-4 rounded-2xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-700 mb-3">Weekly Spending</p>
              <div className="flex items-end gap-2 h-24">
                {weeklyTrend.map((week, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-[9px] font-bold text-gray-500">{week.amount > 0 ? formatCurrency(week.amount) : '—'}</p>
                    <div className="w-full rounded-t-lg transition-all" style={{
                      height: `${Math.max(4, (week.amount / maxTrend) * 72)}px`,
                      background: i === weeklyTrend.length - 1 ? '#1B4332' : '#E5E7EB',
                    }} />
                    <p className="text-[9px] text-gray-400">{week.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Category breakdown */}
            {Object.keys(summary.byCategory).length > 0 && (
              <div className="p-4 rounded-2xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-700 mb-3">Spending by Category</p>
                <div className="space-y-2">
                  {BUDGET_CATEGORIES.filter((c) => (summary.byCategory[c.id] || 0) > 0)
                    .sort((a, b) => (summary.byCategory[b.id] || 0) - (summary.byCategory[a.id] || 0))
                    .map((cat) => {
                      const amount = summary.byCategory[cat.id] || 0;
                      const pct = summary.totalSpent > 0 ? amount / summary.totalSpent : 0;
                      const limit = budget.categoryLimits[cat.id];
                      const overLimit = limit && amount > limit;
                      return (
                        <div key={cat.id}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{cat.icon}</span>
                              <span className="text-xs font-medium text-gray-700">{cat.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-800">{formatCurrency(amount)}</span>
                              {overLimit && <span className="text-[9px] font-bold text-red-500">Over limit</span>}
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: overLimit ? '#EF4444' : cat.color }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Savings tracker */}
            <div className="p-4 rounded-2xl border border-green-100 bg-green-50/30">
              <p className="text-xs font-semibold text-green-700 mb-2">Savings This Month</p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xl font-bold text-green-700">{formatCurrency(savings.totalSaved)}</p>
                  <p className="text-[10px] text-green-600">of {formatCurrency(savings.monthlyGoal)} goal</p>
                </div>
                <div className="flex-1">
                  <div className="h-3 rounded-full bg-green-100 overflow-hidden">
                    <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${Math.min(100, savings.goalProgress * 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-green-600 mt-1">{(savings.goalProgress * 100).toFixed(0)}% of goal</p>
                </div>
              </div>
              <div className="flex gap-3 mt-3 pt-3 border-t border-green-200">
                <div className="flex-1">
                  <p className="text-[10px] text-green-600">Coupon savings</p>
                  <p className="text-sm font-bold text-green-700">{formatCurrency(savings.couponSavings)}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-green-600">Est. price savings</p>
                  <p className="text-sm font-bold text-green-700">{formatCurrency(savings.priceOptimization)}</p>
                </div>
              </div>
            </div>

            {/* Recent purchases */}
            {purchases.length > 0 && (
              <div className="p-4 rounded-2xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-700 mb-2">Recent Purchases</p>
                <div className="space-y-2">
                  {purchases.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{p.storeName}</p>
                        <p className="text-[10px] text-gray-400">{new Date(p.date).toLocaleDateString()} · {p.items.length} items</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-800">{formatCurrency(p.total)}</p>
                        {p.couponSavings > 0 && (
                          <p className="text-[10px] text-green-500">Saved {formatCurrency(p.couponSavings)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {purchases.length === 0 && (
              <div className="p-4 rounded-2xl border border-gray-100 text-center">
                <p className="text-sm font-bold text-forest-900/55 mb-2">No data yet</p>
                <p className="text-sm text-gray-500">No purchases logged yet</p>
                <p className="text-xs text-gray-400 mt-1">Scan a receipt or log manually</p>
                <div className="flex gap-2 mt-3 justify-center">
                  <button onClick={() => { setView('log'); setLogMode('scan'); }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-forest-600">📷 Scan Receipt</button>
                  <button onClick={() => { setView('log'); setLogMode('manual'); }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100">✏️ Manual</button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'log' && (
          <div className="animate-fade-in">
            {logMode === 'choose' && (
              <div className="space-y-3">
                <button onClick={() => setLogMode('scan')}
                  className="w-full p-4 rounded-2xl border border-forest-500/20 bg-forest-50/30 text-left active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-forest-600 flex items-center justify-center text-white text-2xl">📷</div>
                    <div>
                      <p className="text-sm font-bold text-forest-600">Scan Receipt</p>
                      <p className="text-[11px] text-gray-400">Take a photo — items are extracted automatically</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => setLogMode('manual')}
                  className="w-full p-4 rounded-2xl border border-gray-200 text-left active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">✏️</div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">Manual Entry</p>
                      <p className="text-[11px] text-gray-400">Type in items and prices by hand</p>
                    </div>
                  </div>
                </button>
              </div>
            )}
            {logMode === 'scan' && (
              <ReceiptScanner
                onScanComplete={(r) => { setScannedReceipt(r); setLogMode('correct'); }}
                onCancel={() => setLogMode('choose')}
              />
            )}
            {logMode === 'correct' && scannedReceipt && (
              <ReceiptCorrection
                receipt={scannedReceipt}
                onSave={(p) => { onAddPurchase(p); setView('overview'); setLogMode('choose'); setScannedReceipt(null); }}
                onRescan={() => { setLogMode('scan'); setScannedReceipt(null); }}
                onCancel={() => { setLogMode('choose'); setScannedReceipt(null); }}
              />
            )}
            {logMode === 'manual' && (
              <>
                <button onClick={() => setLogMode('choose')} className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                  Back
                </button>
                <ManualPurchaseForm onSubmit={(p) => { onAddPurchase(p); setView('overview'); setLogMode('choose'); }} />
              </>
            )}
          </div>
        )}

        {view === 'settings' && (
          <BudgetSettings budget={budget} onSave={onUpdateBudget} />
        )}
      </div>
    </div>
  );
}

// ─── Budget Settings ───
function BudgetSettings({ budget, onSave }: { budget: BudgetConfig; onSave: (b: BudgetConfig) => void }) {
  const [total, setTotal] = useState(budget.total.toString());
  const [period, setPeriod] = useState<BudgetPeriod>(budget.period);
  const [savingsGoal, setSavingsGoal] = useState(budget.savingsGoal.toString());
  const [catLimits, setCatLimits] = useState(budget.categoryLimits);
  const [saved, setSaved] = useState(false);

  const save = () => {
    onSave({
      ...budget,
      total: parseFloat(total) || 0,
      period,
      savingsGoal: parseFloat(savingsGoal) || 0,
      categoryLimits: catLimits,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Budget Amount</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input type="number" value={total} onChange={(e) => setTotal(e.target.value)}
              className="w-full pl-7 pr-3 py-2.5 rounded-xl text-base border border-gray-200 bg-gray-50 outline-none font-mono" />
          </div>
          <select value={period} onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none">
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Monthly Savings Goal</p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input type="number" value={savingsGoal} onChange={(e) => setSavingsGoal(e.target.value)}
            className="w-full pl-7 pr-3 py-2.5 rounded-xl text-base border border-gray-200 bg-gray-50 outline-none font-mono" />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Category Limits (optional)</p>
        <div className="space-y-2">
          {BUDGET_CATEGORIES.slice(0, 8).map((cat) => (
            <div key={cat.id} className="flex items-center gap-2">
              <span className="text-sm w-6">{cat.icon}</span>
              <span className="text-xs text-gray-600 w-16">{cat.label}</span>
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]">$</span>
                <input type="number" placeholder="No limit"
                  value={catLimits[cat.id] || ''}
                  onChange={(e) => setCatLimits((p) => ({ ...p, [cat.id]: parseFloat(e.target.value) || 0 }))}
                  className="w-full pl-5 pr-2 py-1.5 rounded-lg text-xs border border-gray-200 bg-gray-50 outline-none font-mono" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={save} className="w-full py-3.5 rounded-2xl text-white font-semibold text-base active:scale-[0.98] transition-all"
        style={{ background: saved ? '#059669' : '#1B4332' }}>
        {saved ? '✓ Saved!' : 'Save Budget Settings'}
      </button>
    </div>
  );
}
