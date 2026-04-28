import { useState, useMemo } from 'react';
import type { ShoppingList, ShoppingItem } from '../../data/shopping';
import { autoCategory, GROCERY_CATEGORIES, UNITS } from '../../data/shopping';
import { generateId } from '../../lib/geo';

interface Props {
  lists: ShoppingList[];
  onUpdateLists: (lists: ShoppingList[]) => void;
  onFinishTrip?: () => void;
}

export function ShoppingListManager({ lists, onUpdateLists, onFinishTrip }: Props) {
  const [activeListId, setActiveListId] = useState<string | null>(lists[0]?.id ?? null);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newItemText, setNewItemText] = useState('');

  const activeList = lists.find((l) => l.id === activeListId);

  const createList = () => {
    if (!newListName.trim()) return;
    const list: ShoppingList = { id: generateId(), name: newListName.trim(), items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    onUpdateLists([...lists, list]);
    setActiveListId(list.id);
    setNewListName('');
    setShowNewList(false);
  };

  const deleteList = (id: string) => {
    const updated = lists.filter((l) => l.id !== id);
    onUpdateLists(updated);
    if (activeListId === id) setActiveListId(updated[0]?.id ?? null);
  };

  const addItem = () => {
    if (!newItemText.trim() || !activeList) return;
    const cat = autoCategory(newItemText);
    const item: ShoppingItem = {
      id: generateId(), name: newItemText.trim(), quantity: 1, unit: '',
      category: cat, checked: false, dietaryTags: [], matchedCouponIds: [],
    };
    updateList({ ...activeList, items: [...activeList.items, item] });
    setNewItemText('');
  };

  const updateList = (list: ShoppingList) => {
    onUpdateLists(lists.map((l) => (l.id === list.id ? { ...list, updatedAt: new Date().toISOString() } : l)));
  };

  const toggleItem = (itemId: string) => {
    if (!activeList) return;
    updateList({ ...activeList, items: activeList.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)) });
  };

  const removeItem = (itemId: string) => {
    if (!activeList) return;
    updateList({ ...activeList, items: activeList.items.filter((i) => i.id !== itemId) });
  };

  const updateItemQty = (itemId: string, qty: number) => {
    if (!activeList) return;
    updateList({ ...activeList, items: activeList.items.map((i) => (i.id === itemId ? { ...i, quantity: Math.max(1, qty) } : i)) });
  };

  // Group items by category
  const grouped = useMemo(() => {
    if (!activeList) return {};
    const g: Record<string, ShoppingItem[]> = {};
    for (const item of activeList.items) {
      (g[item.category] ??= []).push(item);
    }
    return g;
  }, [activeList]);

  const uncheckedCount = activeList?.items.filter((i) => !i.checked).length ?? 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* List selector */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-forest-600 font-display">Shopping Lists</h2>
          <button onClick={() => setShowNewList(true)} className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm bg-forest-600">+</button>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
          {lists.map((l) => (
            <button key={l.id} onClick={() => setActiveListId(l.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
              style={{ background: activeListId === l.id ? '#1B4332' : '#F3F4F6', color: activeListId === l.id ? 'white' : '#6B7280' }}>
              {l.name} ({l.items.filter((i) => !i.checked).length})
            </button>
          ))}
        </div>
      </div>

      {/* Active list */}
      {activeList ? (
        <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide">
          {/* Stats bar */}
          <div className="flex items-center gap-3 mb-3 text-[11px]">
            <span className="text-gray-400">{uncheckedCount} items left</span>
          </div>

          {/* Add item */}
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="Add item..." value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none focus:ring-2 focus:ring-forest-500/20" />
            <button onClick={addItem} disabled={!newItemText.trim()}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-forest-600 disabled:opacity-40">Add</button>
          </div>

          {/* Items grouped by category */}
          {Object.keys(grouped).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-sm text-gray-500">List is empty</p>
              <p className="text-xs text-gray-400 mt-1">Type an item above or generate from a meal plan</p>
            </div>
          ) : (
            Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => (
              <div key={cat} className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1 capitalize">{cat}</p>
                <div className="space-y-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 rounded-xl transition-all"
                      style={{ background: item.checked ? '#F9FAFB' : 'white' }}>
                      <button onClick={() => toggleItem(item.id)}
                        className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ borderColor: item.checked ? '#10B981' : '#D1D5DB', background: item.checked ? '#10B981' : 'transparent' }}>
                        {item.checked && <span className="text-white text-xs">✓</span>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateItemQty(item.id, item.quantity - 1)} className="w-6 h-6 rounded text-xs text-gray-400 bg-gray-100">−</button>
                        <span className="text-xs font-mono w-5 text-center text-gray-600">{item.quantity}</span>
                        <button onClick={() => updateItemQty(item.id, item.quantity + 1)} className="w-6 h-6 rounded text-xs text-gray-400 bg-gray-100">+</button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-gray-400 text-sm">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Finish trip prompt */}
          {activeList && activeList.items.length > 0 && uncheckedCount === 0 && onFinishTrip && (
            <div className="mt-4 p-4 rounded-xl border-2 border-brass-200 bg-brass-50 animate-fade-in">
              <p className="text-sm font-bold text-forest-900">All items checked!</p>
              <p className="text-[11px] text-forest-900/60 mt-0.5">Ready to check out? We'll log this trip to your budget.</p>
              <button onClick={onFinishTrip}
                className="mt-3 w-full py-3 rounded-lg bg-brass-400 text-forest-900 font-bold text-sm active:scale-[0.97] transition-transform">
                Start Checkout →
              </button>
            </div>
          )}

          {/* Delete list */}
          <button onClick={() => { if (confirm(`Delete "${activeList.name}"?`)) deleteList(activeList.id); }}
            className="mt-4 text-xs text-red-400 underline">Delete this list</button>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            
            <p className="text-sm text-gray-500">Create your first shopping list</p>
            <button onClick={() => setShowNewList(true)} className="mt-3 px-6 py-2 rounded-xl text-white text-sm font-semibold bg-forest-600">New List</button>
          </div>
        </div>
      )}

      {/* New list modal */}
      {showNewList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={() => setShowNewList(false)}>
          <div className="w-full max-w-xs rounded-2xl bg-white p-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-forest-600 font-display mb-3">New Shopping List</h3>
            <input type="text" placeholder="List name..." value={newListName} onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createList()}
              className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 mb-3 outline-none" autoFocus />
            <div className="flex gap-2">
              <button onClick={() => setShowNewList(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 bg-gray-100">Cancel</button>
              <button onClick={createList} disabled={!newListName.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-forest-600 disabled:opacity-40">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
