import { useState } from 'react';
import { STORES } from '../../data/stores';
import { generateId } from '../../lib/geo';
import { validateCardNumber, getCardRule, formatCardDisplay, maskCardNumber } from '../../lib/cardValidation';
import { BarcodeDisplay } from './BarcodeDisplay';
import type { LoyaltyCard } from '../../lib/types';

// ─── Add Card Modal ───
interface AddProps { onAdd: (card: LoyaltyCard) => void; onClose: () => void; }

export function AddCardModal({ onAdd, onClose }: AddProps) {
  const [store, setStore] = useState('');
  const [number, setNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');
  const filtered = STORES.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  const rule = store ? getCardRule(store) : null;
  const storeData = store ? STORES.find((s) => s.id === store) : null;

  const handleInput = (val: string) => {
    const cleaned = rule?.digitsOnly ? val.replace(/\D/g, '') : val.replace(/[^0-9a-zA-Z]/g, '');
    setNumber(cleaned);
    if (cleaned.length > 0) {
      const v = validateCardNumber(store, cleaned);
      setError(v.valid ? null : v.error);
    } else {
      setError(null);
    }
  };

  const canSubmit = () => {
    if (!store || (store === 'other' && !customName.trim())) return false;
    return validateCardNumber(store, number).valid;
  };

  const submit = () => {
    const v = validateCardNumber(store, number);
    if (!v.valid) return;
    const s = STORES.find((x) => x.id === store);
    onAdd({
      id: generateId(), storeId: store,
      storeName: store === 'other' ? customName.trim() : s?.name || '',
      cardNumber: v.sanitized, phoneNumber: phone.replace(/\D/g, '') || undefined,
      color: s?.color || '#6B7280', icon: s?.icon || '🏷️',
      addedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest-900/60" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl bg-warm-50 animate-slide-up relative"
        style={{ maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="brass-stripe" />
        <div className="p-5 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-bold text-forest-900">Add Loyalty Card</h3>
            <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center bg-warm-200 text-forest-900/55 text-sm min-h-[36px]">✕</button>
          </div>

          <input type="text" placeholder="Search stores…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-sm border border-warm-200 bg-white mb-3 outline-none focus:border-brass-400 transition-colors" />

          <div className="grid grid-cols-4 gap-2 mb-4 overflow-y-auto scrollbar-hide" style={{ maxHeight: '40vh' }}>
            {filtered.map((s) => (
              <button key={s.id} onClick={() => { setStore(s.id); setNumber(''); setError(null); if (s.id !== 'other') setCustomName(''); }}
                className="flex flex-col items-center py-2.5 px-1 rounded-lg border transition-all min-h-[56px]"
                style={{ borderColor: store === s.id ? s.color : '#E8E7DF', background: store === s.id ? `${s.color}08` : 'white', borderWidth: store === s.id ? 2 : 1 }}>
                <span className="text-lg leading-none">{s.icon}</span>
                <span className="text-[10px] mt-1 font-semibold text-forest-900/60 truncate w-full text-center">{s.name}</span>
              </button>
            ))}
          </div>

          {store === 'other' && (
            <input type="text" placeholder="Store name" value={customName} onChange={(e) => setCustomName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm border border-warm-200 bg-white mb-3 outline-none focus:border-brass-400" />
          )}

          {store && rule && (
            <div className="mb-4 animate-fade-in">
              <label className="text-[11px] font-semibold text-forest-900/55 uppercase tracking-wider">Card Number</label>
              <input type="text" placeholder={rule.example} value={number}
                onChange={(e) => handleInput(e.target.value)}
                inputMode={rule.digitsOnly ? 'numeric' : 'text'}
                className={`w-full px-4 py-3.5 rounded-lg text-base border bg-white mt-1 outline-none font-mono tracking-wider transition-colors ${error ? 'border-red-300' : 'border-warm-200 focus:border-brass-400'}`}
                maxLength={rule.maxLength} />
              <p className={`text-[11px] mt-1.5 ${error ? 'text-red-500' : 'text-forest-900/60'}`}>
                {error || rule.hint}
              </p>
            </div>
          )}

          {store && storeData?.supportsPhone && (
            <div className="mb-4 animate-fade-in">
              <label className="text-[11px] font-semibold text-forest-900/55 uppercase tracking-wider">Phone Number <span className="normal-case text-forest-900/55">(optional — for PIN pad lookup)</span></label>
              <input type="tel" placeholder="(555) 123-4567" value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                className="w-full px-4 py-3.5 rounded-lg text-base border border-warm-200 bg-white mt-1 outline-none font-mono tracking-wider focus:border-brass-400 transition-colors"
                maxLength={14} />
            </div>
          )}

          <button onClick={submit} disabled={!canSubmit()}
            className="w-full py-4 rounded-xl font-semibold text-base bg-forest-900 text-brass-100 disabled:opacity-25 transition-opacity min-h-[52px]">
            Add Card
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card Detail Modal ───
interface DetailProps { card: LoyaltyCard; onClose: () => void; onDelete: (id: string) => void; isNearby: boolean; }

export function CardDetail({ card, onClose, onDelete, isNearby }: DetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const storeData = STORES.find((s) => s.id === card.storeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-forest-900/60" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-warm-50 shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Card header */}
        <div className="p-5 text-center text-white relative" style={{ background: `linear-gradient(145deg, ${card.color}, ${card.color}DD)` }}>
          {isNearby && (
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm">
              Nearby
            </span>
          )}
          <span className="text-3xl">{card.icon}</span>
          <h3 className="text-xl font-display font-bold mt-2">{card.storeName}</h3>
          <p className="text-sm mt-1 opacity-70 font-mono tracking-widest">{formatCardDisplay(card.cardNumber, card.storeId)}</p>
        </div>

        {/* Barcode */}
        <div className="p-5">
          <div className="p-4 rounded-xl bg-white border border-warm-200">
            <p className="text-[10px] uppercase tracking-widest text-center mb-3 font-semibold text-forest-900/60">Scan at checkout</p>
            <BarcodeDisplay value={card.cardNumber} height={70} symbology={storeData?.barcodeSymbology} />
          </div>

          {/* Phone number */}
          {card.phoneNumber && storeData?.supportsPhone && (
            <div className="mt-3 p-3 rounded-xl bg-warm-100 border border-warm-200">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-forest-900/60 mb-1">PIN Pad Lookup</p>
              <p className="text-lg font-mono font-bold text-forest-900 tracking-wider text-center">
                {card.phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
              </p>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button className="flex-1 py-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 bg-warm-100 text-forest-900/60 min-h-[44px]">
              Add to Wallet
            </button>
          </div>

          <div className="flex gap-2 mt-2">
            <button onClick={onClose} className="flex-1 py-3.5 rounded-lg text-sm font-semibold bg-forest-900 text-brass-100 min-h-[48px]">Done</button>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} className="py-3.5 px-4 rounded-lg text-sm bg-red-50 text-red-500 border border-red-200 min-h-[48px]">Delete</button>
            ) : (
              <button onClick={() => onDelete(card.id)} className="py-3.5 px-4 rounded-lg text-xs font-bold bg-red-600 text-white min-h-[48px]">Confirm</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
