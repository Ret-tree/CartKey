import { useState, useMemo } from 'react';
import type { PantryItem } from '../../data/shopping';
import { autoCategory, GROCERY_CATEGORIES } from '../../data/shopping';
import { generateId } from '../../lib/geo';

interface Props {
  items: PantryItem[];
  onUpdate: (items: PantryItem[]) => void;
}

export function PantryTracker({ items, onUpdate }: Props) {
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newUnit, setNewUnit] = useState('');

  const addItem = () => {
    if (!newName.trim()) return;
    const item: PantryItem = {
      id: generateId(), name: newName.trim(),
      quantity: parseFloat(newQty) || 1, unit: newUnit,
      category: autoCategory(newName), addedAt: new Date().toISOString(),
    };
    onUpdate([...items, item]);
    setNewName(''); setNewQty('1'); setNewUnit('');
  };

  const removeItem = (id: string) => onUpdate(items.filter((i) => i.id !== id));

  const updateQty = (id: string, delta: number) => {
    onUpdate(items.map((i) => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter((i) => i.quantity > 0));
  };

  const grouped = useMemo(() => {
    const g: Record<string, PantryItem[]> = {};
    for (const item of items) (g[item.category] ??= []).push(item);
    return g;
  }, [items]);

  const expiringSoon = items.filter((i) => {
    if (!i.expiresAt) return false;
    const diff = new Date(i.expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 3 * 86400000;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 pt-3 pb-2">
        <h2 className="text-xl font-bold text-forest-600 font-display">Pantry</h2>
        <p className="text-xs text-gray-400 mb-3">{items.length} items on hand</p>
        
        {expiringSoon.length > 0 && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 mb-3">
            <p className="text-[10px] font-semibold text-amber-700">{expiringSoon.length} item{expiringSoon.length > 1 ? 's' : ''} expiring soon</p>
            <p className="text-[10px] text-amber-600">{expiringSoon.map((i) => i.name).join(', ')}</p>
          </div>
        )}

        {/* Add item */}
        <div className="flex gap-2 mb-3">
          <input type="text" placeholder="Item name..." value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            className="flex-1 px-3 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none" />
          <input type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)}
            className="w-14 px-2 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none text-center" min="1" />
          <button onClick={addItem} disabled={!newName.trim()}
            className="px-3 py-2 rounded-xl text-sm font-semibold text-white bg-forest-600 disabled:opacity-40">+</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide">
        {items.length === 0 ? (
          <div className="text-center py-12">
            
            <p className="text-sm text-gray-500">Pantry is empty</p>
            <p className="text-xs text-gray-400 mt-1">Add items you have on hand to avoid buying duplicates</p>
          </div>
        ) : (
          Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, catItems]) => (
            <div key={cat} className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1 capitalize">{cat}</p>
              <div className="space-y-1">
                {catItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-xl bg-white">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{item.name}</p>
                      {item.expiresAt && (
                        <p className="text-[10px] text-amber-500">Expires {new Date(item.expiresAt).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded text-xs text-gray-400 bg-gray-100">−</button>
                      <span className="text-xs font-mono w-6 text-center text-gray-600">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded text-xs text-gray-400 bg-gray-100">+</button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-gray-400 text-sm">✕</button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
