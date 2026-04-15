import { useState } from 'react';
import { STORES } from '../../data/stores';
import { DIETARY_TYPES, ALLERGENS } from '../../data/dietary';
import { generateId } from '../../lib/geo';
import { validateCardNumber, getCardRule } from '../../lib/cardValidation';
import type { LoyaltyCard } from '../../lib/types';

interface Props {
  onComplete: (card: LoyaltyCard | null, diet: string, allergens: string[]) => void;
}

export function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [cardStore, setCardStore] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardError, setCardError] = useState<string | null>(null);
  const [diet, setDiet] = useState('');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [storeSearch, setStoreSearch] = useState('');

  const filtered = STORES.filter((s) => s.name.toLowerCase().includes(storeSearch.toLowerCase()));
  const toggleAllergen = (id: string) => setAllergens((p) => (p.includes(id) ? p.filter((a) => a !== id) : [...p, id]));
  const rule = cardStore ? getCardRule(cardStore) : null;

  const handleCardInput = (val: string) => {
    const cleaned = rule?.digitsOnly ? val.replace(/\D/g, '') : val.replace(/[^0-9a-zA-Z]/g, '');
    setCardNumber(cleaned);
    if (cleaned.length > 0) {
      const v = validateCardNumber(cardStore, cleaned);
      setCardError(v.valid ? null : v.error);
    } else {
      setCardError(null);
    }
  };

  const cardIsValid = () => {
    if (!cardStore || !cardNumber) return false;
    return validateCardNumber(cardStore, cardNumber).valid;
  };

  const finish = () => {
    const store = STORES.find((s) => s.id === cardStore);
    let card: LoyaltyCard | null = null;
    if (cardStore && cardNumber) {
      const v = validateCardNumber(cardStore, cardNumber);
      if (v.valid) {
        card = { id: generateId(), storeId: cardStore, storeName: store?.name || '', cardNumber: v.sanitized, color: store?.color || '#6B7280', icon: store?.icon || '🏷️', addedAt: new Date().toISOString() };
      }
    }
    onComplete(card, diet, allergens);
  };

  return (
    <div className="h-full flex flex-col bg-warm-50">
      {/* Progress indicator */}
      {step > 0 && (
        <div className="px-6 pt-4 pb-2">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div key={s} className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{ background: s <= step ? '#C9A227' : '#E8E7DF' }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Welcome ── */}
      {step === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center animate-fade-in">
          {/* Logo mark */}
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-2xl bg-forest-900 flex items-center justify-center shadow-xl shadow-forest-900/20">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M20 4L8 12V28L20 36L32 28V12L20 4Z" stroke="#C9A227" strokeWidth="2" fill="none"/>
                <circle cx="20" cy="18" r="4" fill="#C9A227"/>
                <path d="M20 22V32" stroke="#C9A227" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M20 28H24" stroke="#C9A227" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <h1 className="font-display text-4xl font-bold text-forest-900 tracking-tight">CartKey</h1>
          <div className="brass-stripe w-16 mx-auto mt-3 mb-4 rounded-full" />
          <p className="text-base text-forest-900/50 max-w-[260px] leading-relaxed font-sans">
            One key to every loyalty card, coupon, and grocery deal.
          </p>

          <button onClick={() => setStep(1)}
            className="mt-10 w-full max-w-[280px] py-4 bg-forest-900 text-brass-100 font-semibold rounded-xl text-base tracking-wide active:scale-[0.97] transition-transform shadow-lg shadow-forest-900/20">
            Get Started
          </button>
          <button onClick={finish} className="mt-4 text-sm text-forest-900/30 font-medium">
            Skip — explore on my own
          </button>
        </div>
      )}

      {/* ── Step 1: Add Card ── */}
      {step === 1 && (
        <div className="flex-1 flex flex-col px-6 pt-2 animate-fade-in">
          <p className="text-xs font-semibold text-brass-500 tracking-widest uppercase">Step 1 of 3</p>
          <h2 className="text-2xl font-display font-bold text-forest-900 mt-1">Your first card</h2>
          <p className="text-sm text-forest-900/40 mt-1 mb-4">Select a store, then enter your loyalty number.</p>

          <input type="text" placeholder="Search stores…" value={storeSearch} onChange={(e) => setStoreSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-sm border border-warm-200 bg-white outline-none focus:border-brass-400 transition-colors mb-3 font-sans" />

          <div className="flex-1 overflow-y-auto -mx-1 mb-3 min-h-0 scrollbar-hide">
            <div className="grid grid-cols-3 gap-2 px-1">
              {filtered.map((store) => (
                <button key={store.id} onClick={() => { setCardStore(store.id); setCardNumber(''); setCardError(null); }}
                  className="flex flex-col items-center py-3 px-2 rounded-lg border transition-all min-h-[64px]"
                  style={{
                    borderColor: cardStore === store.id ? store.color : '#E8E7DF',
                    background: cardStore === store.id ? `${store.color}08` : 'white',
                    borderWidth: cardStore === store.id ? 2 : 1,
                  }}>
                  <span className="text-xl leading-none">{store.icon}</span>
                  <span className="text-[11px] mt-1.5 font-semibold text-forest-900/70 leading-tight text-center">{store.name}</span>
                </button>
              ))}
            </div>
          </div>

          {cardStore && rule && (
            <div className="mb-3 animate-fade-in">
              <label className="text-[11px] font-semibold text-forest-900/40 uppercase tracking-wider">Card Number</label>
              <input type="text" placeholder={rule.example} value={cardNumber}
                onChange={(e) => handleCardInput(e.target.value)}
                inputMode={rule.digitsOnly ? 'numeric' : 'text'}
                className={`w-full px-4 py-3.5 rounded-lg text-base border bg-white mt-1 outline-none font-mono tracking-wider transition-colors ${cardError ? 'border-red-300 focus:border-red-400' : 'border-warm-200 focus:border-brass-400'}`}
                maxLength={rule.maxLength} />
              <p className={`text-[11px] mt-1.5 ${cardError ? 'text-red-500' : 'text-forest-900/30'}`}>
                {cardError || rule.hint}
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-auto pb-3">
            <button onClick={() => setStep(0)} className="flex-1 py-3.5 rounded-lg text-sm font-semibold text-forest-900/40 bg-warm-100 min-h-[48px]">Back</button>
            <button onClick={() => setStep(2)} disabled={cardStore !== '' && !cardIsValid() && cardNumber.length > 0}
              className="flex-1 py-3.5 rounded-lg text-sm font-semibold text-brass-100 bg-forest-900 disabled:opacity-30 min-h-[48px] transition-opacity">
              {cardStore ? 'Next' : 'Skip this step'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Dietary ── */}
      {step === 2 && (
        <div className="flex-1 flex flex-col px-6 pt-2 animate-fade-in">
          <p className="text-xs font-semibold text-brass-500 tracking-widest uppercase">Step 2 of 3</p>
          <h2 className="text-2xl font-display font-bold text-forest-900 mt-1">Dietary needs</h2>
          <p className="text-sm text-forest-900/40 mt-1 mb-5">We'll filter coupons and deals to match.</p>

          <p className="text-[11px] font-semibold text-forest-900/50 uppercase tracking-wider mb-2">I eat</p>
          <div className="grid grid-cols-4 gap-2 mb-5">
            {DIETARY_TYPES.map((d) => (
              <button key={d.id} onClick={() => setDiet(d.id === diet ? '' : d.id)}
                className="flex flex-col items-center py-2.5 px-1 rounded-lg border transition-all min-h-[56px]"
                style={{
                  borderColor: diet === d.id ? '#C9A227' : '#E8E7DF',
                  background: diet === d.id ? '#FBF6E6' : 'white',
                  borderWidth: diet === d.id ? 2 : 1,
                }}>
                <span className="text-lg leading-none">{d.icon}</span>
                <span className="text-[10px] mt-1 font-semibold text-forest-900/60">{d.label}</span>
              </button>
            ))}
          </div>

          <p className="text-[11px] font-semibold text-forest-900/50 uppercase tracking-wider mb-2">I avoid</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {ALLERGENS.map((a) => (
              <button key={a.id} onClick={() => toggleAllergen(a.id)}
                className="flex items-center gap-2 py-2.5 px-3 rounded-lg border transition-all min-h-[44px]"
                style={{
                  borderColor: allergens.includes(a.id) ? '#DC2626' : '#E8E7DF',
                  background: allergens.includes(a.id) ? '#FEF2F2' : 'white',
                  borderWidth: allergens.includes(a.id) ? 2 : 1,
                }}>
                <span className="text-base leading-none">{a.icon}</span>
                <span className="text-xs font-semibold text-forest-900/60">{a.label}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-auto pb-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-lg text-sm font-semibold text-forest-900/40 bg-warm-100 min-h-[48px]">Back</button>
            <button onClick={() => setStep(3)} className="flex-1 py-3.5 rounded-lg text-sm font-semibold text-brass-100 bg-forest-900 min-h-[48px]">Next</button>
          </div>
        </div>
      )}

      {/* ── Step 3: Location ── */}
      {step === 3 && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-brass-50 flex items-center justify-center mb-6 border-2 border-brass-200">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A227" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h2 className="text-2xl font-display font-bold text-forest-900">Enable location</h2>
          <p className="text-sm text-forest-900/40 mt-2 max-w-[260px] leading-relaxed">
            CartKey shows the right loyalty card automatically when you arrive at a store.
          </p>

          <button onClick={finish}
            className="mt-10 w-full max-w-[280px] py-4 bg-forest-900 text-brass-100 font-semibold rounded-xl text-base tracking-wide active:scale-[0.97] transition-transform shadow-lg shadow-forest-900/20">
            Enable & Finish
          </button>
          <button onClick={finish} className="mt-4 text-sm text-forest-900/30 font-medium">Not now</button>
        </div>
      )}
    </div>
  );
}
