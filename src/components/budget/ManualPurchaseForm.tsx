import { useState } from 'react';
import { STORES } from '../../data/stores';
import { generateId } from '../../lib/geo';
import { autoCategory } from '../../data/shopping';
import type { PurchaseRecord, PurchaseItem } from '../../data/budget';
import { BUDGET_CATEGORIES } from '../../data/budget';

interface Props {
  onSubmit: (p: PurchaseRecord) => void;
}

interface DraftItem {
  id: string;
  name: string;
  price: string;
  category: string;
}

export function ManualPurchaseForm({ onSubmit }: Props) {
  const [storeId, setStoreId] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [couponSavings, setCouponSavings] = useState('');

  const addItem = () => {
    if (!newName.trim() || !newPrice) return;
    setItems((p) => [...p, { id: generateId(), name: newName.trim(), price: newPrice, category: autoCategory(newName) }]);
    setNewName('');
    setNewPrice('');
  };

  const removeItem = (id: string) => setItems((p) => p.filter((i) => i.id !== id));

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
  const savingsNum = parseFloat(couponSavings) || 0;
  const total = Math.max(0, subtotal - savingsNum);

  const submit = () => {
    if (!storeId || items.length === 0) return;
    const store = STORES.find((s) => s.id === storeId);
    const purchaseItems: PurchaseItem[] = items.map((i) => ({
      name: i.name, quantity: 1, unitPrice: parseFloat(i.price) || 0,
      totalPrice: parseFloat(i.price) || 0, category: i.category,
      couponApplied: false, couponSavings: 0,
    }));

    const purchase: PurchaseRecord = {
      id: generateId(), date: new Date().toISOString(),
      storeName: store?.name || 'Unknown', storeId,
      items: purchaseItems, subtotal, couponSavings: savingsNum, total,
      source: 'manual',
    };
    onSubmit(purchase);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-700">Log a purchase manually. Receipt scanning comes in a future update.</p>
      </div>

      {/* Store selector */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Store</p>
        <div className="grid grid-cols-4 gap-1.5 overflow-y-auto scrollbar-hide" style={{ maxHeight: '30vh' }}>
          {STORES.filter((s) => s.id !== 'other').map((s) => (
            <button key={s.id} onClick={() => setStoreId(s.id)}
              className="flex flex-col items-center p-1.5 rounded-lg border-2 transition-all"
              style={{ borderColor: storeId === s.id ? s.color : '#E5E7EB', background: storeId === s.id ? `${s.color}10` : 'white' }}>
              <span className="text-sm">{s.icon}</span>
              <span className="text-[9px] font-medium text-gray-600 truncate w-full text-center">{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add items */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Items</p>
        <div className="flex gap-2 mb-2">
          <input type="text" placeholder="Item name" value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            className="flex-1 px-3 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none" />
          <div className="relative w-20">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
            <input type="number" step="0.01" placeholder="0.00" value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              className="w-full pl-5 pr-2 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none font-mono" />
          </div>
          <button onClick={addItem} disabled={!newName.trim() || !newPrice}
            className="px-3 py-2 rounded-xl text-sm font-semibold text-white bg-forest-600 disabled:opacity-40">+</button>
        </div>
        {items.length > 0 && (
          <div className="space-y-1">
            {items.map((item) => {
              const cat = BUDGET_CATEGORIES.find((c) => c.id === item.category);
              return (
                <div key={item.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50">
                  <span className="text-sm">{cat?.icon || '📦'}</span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{item.name}</span>
                  <span className="text-sm font-mono text-gray-600">${parseFloat(item.price).toFixed(2)}</span>
                  <button onClick={() => removeItem(item.id)} className="text-gray-300 text-xs">✕</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Coupon savings */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Coupon Savings (optional)</p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input type="number" step="0.01" placeholder="0.00" value={couponSavings} onChange={(e) => setCouponSavings(e.target.value)}
            className="w-full pl-7 pr-3 py-2.5 rounded-xl text-base border border-gray-200 bg-gray-50 outline-none font-mono" />
        </div>
      </div>

      {/* Total */}
      {items.length > 0 && (
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-mono text-gray-700">${subtotal.toFixed(2)}</span>
          </div>
          {savingsNum > 0 && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-green-500">Coupons</span>
              <span className="font-mono text-green-500">-${savingsNum.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold mt-1.5 pt-1.5 border-t border-gray-200">
            <span className="text-gray-800">Total</span>
            <span className="font-mono text-gray-800">${total.toFixed(2)}</span>
          </div>
        </div>
      )}

      <button onClick={submit} disabled={!storeId || items.length === 0}
        className="w-full py-3.5 rounded-2xl text-white font-semibold text-base bg-forest-600 disabled:opacity-40 active:scale-[0.98] transition-all">
        Log Purchase
      </button>
    </div>
  );
}
