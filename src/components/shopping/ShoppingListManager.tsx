import { useState, useMemo } from 'react';
import type { ShoppingList, ShoppingItem } from '../../data/shopping';
import { autoCategory, GROCERY_CATEGORIES, UNITS } from '../../data/shopping';
import { generateId } from '../../lib/geo';
import { useCatalogAutocomplete } from '../../hooks/useCatalogAutocomplete';
import { addToKrogerCart } from '../../lib/krogerService';
import { isKrogerFamily, getKrogerChainCode } from '../../data/krogerFamily';

interface Props {
  lists: ShoppingList[];
  onUpdateLists: (lists: ShoppingList[]) => void;
  onFinishTrip?: () => void;
  zipCode?: string;
  krogerConnected?: boolean;
  nearbyStoreId?: string | null;
}

export function ShoppingListManager({ lists, onUpdateLists, onFinishTrip, zipCode = '', krogerConnected = false, nearbyStoreId = null }: Props) {
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

  // ─── Kroger autocomplete ───
  const { suggestions, loading: suggLoading } = useCatalogAutocomplete(newItemText, zipCode);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ─── Send to Kroger state ───
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const addItem = (override?: { name: string; upc?: string; category?: string }) => {
    const text = override?.name || newItemText.trim();
    if (!text || !activeList) return;
    const cat = override?.category || autoCategory(text);
    const item: ShoppingItem = {
      id: generateId(), name: text, quantity: 1, unit: '',
      category: cat, checked: false, dietaryTags: [], matchedCouponIds: [],
      ...(override?.upc ? { krogerUpc: override.upc } : {}),
    };
    updateList({ ...activeList, items: [...activeList.items, item] });
    setNewItemText('');
    setShowSuggestions(false);
  };

  const sendToKroger = async () => {
    if (!activeList || !krogerConnected) return;
    const items = activeList.items
      .filter((i) => !i.checked)
      .map((i) => ({ name: i.name, upc: i.krogerUpc, quantity: i.quantity }));

    if (items.length === 0) {
      setSendResult('No unchecked items to send');
      return;
    }

    setSending(true);
    setSendResult(null);
    const chainCode = nearbyStoreId && isKrogerFamily(nearbyStoreId)
      ? getKrogerChainCode(nearbyStoreId) || 'KROGER'
      : 'KROGER';
    const result = await addToKrogerCart(items, zipCode, chainCode);
    setSending(false);

    if (result.success) {
      setSendResult(`Sent ${result.addedCount} of ${items.length} items to your Kroger cart`);
    } else if (result.addedCount > 0) {
      setSendResult(`Partial: added ${result.addedCount} of ${items.length}. ${result.error || ''}`);
    } else {
      setSendResult(result.error || 'Failed to send to Kroger');
    }
    setTimeout(() => setSendResult(null), 6000);
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

          {/* Add item with Kroger autocomplete */}
          <div className="relative mb-4">
            <div className="flex gap-2">
              <input type="text" placeholder="Add item..." value={newItemText}
                onChange={(e) => { setNewItemText(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                className="flex-1 px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none focus:ring-2 focus:ring-forest-500/20"
                autoComplete="off" />
              <button onClick={() => addItem()} disabled={!newItemText.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-forest-600 disabled:opacity-40">Add</button>
            </div>

            {/* Autocomplete dropdown */}
            {showSuggestions && (suggestions.length > 0 || suggLoading) && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl card-surface shadow-lg z-10 overflow-hidden max-h-72 overflow-y-auto">
                {suggLoading && suggestions.length === 0 && (
                  <p className="px-3 py-2 text-[11px] text-forest-900/55 italic">Searching Kroger…</p>
                )}
                {suggestions.map((s) => (
                  <button key={s.upc} onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addItem({ name: s.productName, upc: s.upc, category: s.category || autoCategory(s.productName) })}
                    className="w-full flex items-center gap-3 p-2.5 hover:bg-warm-100 transition-colors text-left border-b border-warm-200 last:border-b-0">
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt="" className="w-10 h-10 rounded object-contain bg-white flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-warm-100 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-forest-900 truncate">{s.productName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {s.brand && <span className="text-[10px] text-forest-900/55 truncate">{s.brand}</span>}
                        {s.size && <span className="text-[10px] text-forest-900/40">· {s.size}</span>}
                        {s.salePrice && (
                          <span className="text-[10px] font-bold text-green-700 ml-auto">${s.salePrice.toFixed(2)}</span>
                        )}
                        {!s.salePrice && s.regularPrice && (
                          <span className="text-[10px] font-semibold text-forest-900/70 ml-auto">${s.regularPrice.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                <p className="px-3 py-1.5 text-[10px] text-forest-900/40 text-center bg-warm-100/50">Powered by Kroger Catalog</p>
              </div>
            )}
          </div>

          {/* Send to Kroger button */}
          {krogerConnected && activeList && activeList.items.filter((i) => !i.checked).length > 0 && (
            <div className="mb-3">
              <button onClick={sendToKroger} disabled={sending}
                className="w-full py-2.5 rounded-lg bg-forest-900 text-brass-100 text-xs font-semibold disabled:opacity-50 min-h-[40px] flex items-center justify-center gap-2">
                {sending ? (
                  <>Sending to Kroger…</>
                ) : (
                  <>🛒 Send to Kroger Cart ({activeList.items.filter((i) => !i.checked).length} items)</>
                )}
              </button>
              {sendResult && (
                <p className="text-[11px] text-center mt-1.5 text-forest-900/70 animate-fade-in">{sendResult}</p>
              )}
            </div>
          )}

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
