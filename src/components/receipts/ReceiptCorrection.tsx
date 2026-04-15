import { useState } from 'react';
import type { ParsedReceipt, ParsedLineItem } from '../../data/receiptParser';
import { parsedItemsToPurchaseItems } from '../../data/receiptParser';
import { BUDGET_CATEGORIES, formatCurrency } from '../../data/budget';
import { autoCategory } from '../../data/shopping';
import { generateId } from '../../lib/geo';
import type { PurchaseRecord } from '../../data/budget';

interface Props {
  receipt: ParsedReceipt;
  onSave: (purchase: PurchaseRecord) => void;
  onRescan: () => void;
  onCancel: () => void;
}

export function ReceiptCorrection({ receipt, onSave, onRescan, onCancel }: Props) {
  const [storeName, setStoreName] = useState(receipt.storeName);
  const [storeId, setStoreId] = useState(receipt.storeId);
  const [date, setDate] = useState(receipt.date);
  const [items, setItems] = useState<ParsedLineItem[]>(receipt.items);
  const [couponSavings, setCouponSavings] = useState(receipt.couponSavings);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPrice, setAddPrice] = useState('');

  const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
  const total = Math.max(0, subtotal - couponSavings);
  const confidencePct = (receipt.confidence * 100).toFixed(0);

  const updateItem = (idx: number, updates: Partial<ParsedLineItem>) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, ...updates } : item));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  };

  const addItem = () => {
    if (!addName.trim() || !addPrice) return;
    const price = parseFloat(addPrice);
    const newItem: ParsedLineItem = {
      name: addName.trim(), quantity: 1, unitPrice: price, totalPrice: price,
      category: autoCategory(addName), isCoupon: false, raw: `[manual] ${addName} $${price.toFixed(2)}`,
    };
    setItems((prev) => [...prev, newItem]);
    setAddName(''); setAddPrice('');
  };

  const save = () => {
    const purchaseItems = parsedItemsToPurchaseItems(items);
    const purchase: PurchaseRecord = {
      id: generateId(),
      date: new Date(date + 'T12:00:00').toISOString(),
      storeName, storeId,
      items: purchaseItems,
      subtotal,
      couponSavings,
      total,
      source: 'receipt_scan',
    };
    onSave(purchase);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Confidence banner */}
      <div className="p-3 rounded-xl flex items-center gap-3" style={{
        background: receipt.confidence > 0.8 ? '#F0FDF4' : receipt.confidence > 0.6 ? '#FFFBEB' : '#FEF2F2',
        border: `1px solid ${receipt.confidence > 0.8 ? '#BBF7D0' : receipt.confidence > 0.6 ? '#FDE68A' : '#FECACA'}`,
      }}>
        <span className="text-lg">{receipt.confidence > 0.8 ? '✅' : receipt.confidence > 0.6 ? '⚠️' : '❌'}</span>
        <div className="flex-1">
          <p className="text-xs font-semibold" style={{
            color: receipt.confidence > 0.8 ? '#16A34A' : receipt.confidence > 0.6 ? '#D97706' : '#DC2626',
          }}>
            {confidencePct}% confidence
          </p>
          <p className="text-[10px] text-gray-500">
            {receipt.confidence > 0.8 ? 'High quality scan — review items below' : 'Some items may need correction'}
          </p>
        </div>
        <button onClick={onRescan} className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-white border border-gray-200 text-gray-600">Rescan</button>
      </div>

      {/* Store & date */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Store</label>
          <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none mt-0.5" />
        </div>
        <div className="w-36">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none mt-0.5" />
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-700">{items.length} Items Detected</p>
          <button onClick={() => setShowRaw(!showRaw)} className="text-[10px] text-gray-400 underline">
            {showRaw ? 'Hide' : 'Show'} raw text
          </button>
        </div>

        <div className="space-y-1.5">
          {items.map((item, idx) => {
            const cat = BUDGET_CATEGORIES.find((c) => c.id === item.category);
            const isEditing = editingIdx === idx;
            return (
              <div key={idx} className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-white" onClick={() => setEditingIdx(isEditing ? null : idx)}>
                  <span className="text-sm">{cat?.icon || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{item.name}</p>
                    {showRaw && <p className="text-[9px] text-gray-400 font-mono truncate">{item.raw}</p>}
                  </div>
                  {item.quantity > 1 && <span className="text-[10px] text-gray-400">×{item.quantity}</span>}
                  <span className="text-sm font-mono font-semibold text-gray-800">{formatCurrency(item.totalPrice)}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeItem(idx); }}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-400 text-xs">✕</button>
                </div>

                {isEditing && (
                  <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 space-y-2 animate-fade-in">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[9px] text-gray-400">Name</label>
                        <input type="text" value={item.name}
                          onChange={(e) => updateItem(idx, { name: e.target.value, category: autoCategory(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded-lg text-xs border border-gray-200 outline-none" />
                      </div>
                      <div className="w-16">
                        <label className="text-[9px] text-gray-400">Qty</label>
                        <input type="number" value={item.quantity} min={1}
                          onChange={(e) => {
                            const q = parseInt(e.target.value) || 1;
                            updateItem(idx, { quantity: q, totalPrice: q * item.unitPrice });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg text-xs border border-gray-200 outline-none text-center" />
                      </div>
                      <div className="w-20">
                        <label className="text-[9px] text-gray-400">Price</label>
                        <input type="number" step="0.01" value={item.totalPrice.toFixed(2)}
                          onChange={(e) => updateItem(idx, { totalPrice: parseFloat(e.target.value) || 0, unitPrice: (parseFloat(e.target.value) || 0) / item.quantity })}
                          className="w-full px-2 py-1.5 rounded-lg text-xs border border-gray-200 outline-none font-mono" />
                      </div>
                    </div>
                    {item.weight && <p className="text-[10px] text-gray-400">Weight: {item.weight}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add missing item */}
        <div className="flex gap-2 mt-3">
          <input type="text" placeholder="Add missing item..." value={addName}
            onChange={(e) => setAddName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()}
            className="flex-1 px-3 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none" />
          <div className="relative w-20">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
            <input type="number" step="0.01" placeholder="0.00" value={addPrice}
              onChange={(e) => setAddPrice(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()}
              className="w-full pl-5 pr-2 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none font-mono" />
          </div>
          <button onClick={addItem} disabled={!addName.trim() || !addPrice}
            className="px-3 py-2 rounded-xl text-sm font-semibold text-white bg-forest-600 disabled:opacity-40">+</button>
        </div>
      </div>

      {/* Coupon savings */}
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Coupon Savings Detected</label>
        <div className="relative mt-0.5">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 text-sm">$</span>
          <input type="number" step="0.01" value={couponSavings.toFixed(2)}
            onChange={(e) => setCouponSavings(parseFloat(e.target.value) || 0)}
            className="w-full pl-7 pr-3 py-2.5 rounded-xl text-base border border-green-200 bg-green-50 outline-none font-mono text-green-700" />
        </div>
      </div>

      {/* Total summary */}
      <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal ({items.length} items)</span>
          <span className="font-mono text-gray-700">{formatCurrency(subtotal)}</span>
        </div>
        {couponSavings > 0 && (
          <div className="flex justify-between text-sm mt-1">
            <span className="text-green-500">Coupons</span>
            <span className="font-mono text-green-500">-{formatCurrency(couponSavings)}</span>
          </div>
        )}
        {receipt.tax !== null && (
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-400">Tax</span>
            <span className="font-mono text-gray-400">{formatCurrency(receipt.tax)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-gray-200">
          <span className="text-gray-800">Total</span>
          <span className="font-mono text-gray-800">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Actions */}
      <button onClick={save} disabled={items.length === 0}
        className="w-full py-3.5 rounded-2xl text-white font-semibold text-base bg-forest-600 disabled:opacity-40 active:scale-[0.98] transition-all">
        Save Purchase
      </button>
      <button onClick={onCancel} className="w-full py-2 text-sm text-gray-400 underline">Discard</button>
    </div>
  );
}
