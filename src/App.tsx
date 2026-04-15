import { useState, useEffect, useMemo } from 'react';
import { useStorage } from './hooks/useStorage';
import { useGeolocation } from './hooks/useGeolocation';
import { STORES, getStore } from './data/stores';
import { DIETARY_TYPES, ALLERGENS } from './data/dietary';
import { MOCK_COUPONS, MOCK_NOTIFICATIONS, filterCouponsByStore, filterCouponsByDiet } from './data/coupons';
import { DIET_EXCLUSIONS } from './data/dietary';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { BarcodeDisplay } from './components/cards/BarcodeDisplay';
import { AddCardModal, CardDetail } from './components/cards/CardModals';
import { CouponBrowser } from './components/coupons/CouponBrowser';
import { WeeklyAdBrowser } from './components/coupons/WeeklyAdBrowser';
import { NotificationCenter, NotificationBell } from './components/coupons/NotificationCenter';
import { ShoppingListManager } from './components/shopping/ShoppingListManager';
import { MealPlanner } from './components/meals/MealPlanner';
import { PantryTracker } from './components/shopping/PantryTracker';
import { BudgetDashboard } from './components/budget/BudgetDashboard';
import { PriceIntelligence } from './components/budget/PriceIntelligence';
import { CheckoutMode } from './components/checkout/CheckoutMode';
import { IconHome, IconList, IconTag, IconWallet, IconUser, IconPlus, IconCalendar, IconBarcode, IconRefresh, IconBell, IconChart, IconLocation } from './components/Icons';
import type { LoyaltyCard, DietaryProfile, AppNotification } from './lib/types';
import type { ShoppingList, PantryItem } from './data/shopping';
import type { BudgetConfig, PurchaseRecord } from './data/budget';
import { DEFAULT_BUDGET, calculateSpendingSummary, formatCurrency, getDaysRemaining, formatPeriodLabel, createPurchaseFromCheckout, ESTIMATED_CATEGORY_PRICES } from './data/budget';
import { downloadBackup, importBackup, getStorageSummary } from './lib/dataExport';
import { getStoreSymbology } from './data/stores';
import type { ThemeMode } from './lib/types';

type TabId = 'home' | 'lists' | 'coupons' | 'budget' | 'profile';

export default function App() {
  // ─── Persisted State ───
  const [cards, setCards, cardsLoaded] = useStorage<LoyaltyCard[]>('ck:cards', []);
  const [profile, setProfile, profileLoaded] = useStorage<DietaryProfile>('ck:profile', { diet: '', allergens: [], customExclusions: '' });
  const [onboarded, setOnboarded, onbLoaded] = useStorage<boolean>('ck:onboarded', false);
  const [clippedIds, setClippedIds, clippedLoaded] = useStorage<string[]>('ck:clipped', []);
  const [notifications, setNotifications, notifsLoaded] = useStorage<AppNotification[]>('ck:notifs', MOCK_NOTIFICATIONS);
  const [shoppingLists, setShoppingLists, listsLoaded] = useStorage<ShoppingList[]>('ck:lists', []);
  const [pantryItems, setPantryItems, pantryLoaded] = useStorage<PantryItem[]>('ck:pantry', []);
  const [budgetConfig, setBudgetConfig, budgetLoaded] = useStorage<BudgetConfig>('ck:budget', DEFAULT_BUDGET);
  const [purchases, setPurchases, purchasesLoaded] = useStorage<PurchaseRecord[]>('ck:purchases', []);
  const [theme, setTheme, themeLoaded] = useStorage<ThemeMode>('ck:theme', 'system');
  const [pendingTrip, setPendingTrip, pendingTripLoaded] = useStorage<{ listId: string; storeName: string; checkedAt: string } | null>('ck:pendingTrip', null);

  // ─── Local State ───
  const [tab, setTab] = useState<TabId>('home');
  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState<LoyaltyCard | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [couponSubTab, setCouponSubTab] = useState<'coupons' | 'ads'>('coupons');
  const [listsSubTab, setListsSubTab] = useState<'lists' | 'meals' | 'pantry'>('lists');
  const [budgetSubTab, setBudgetSubTab] = useState<'budget' | 'prices'>('budget');

  // ─── Geolocation ───
  const geo = useGeolocation();
  const loaded = cardsLoaded && profileLoaded && onbLoaded && clippedLoaded && notifsLoaded && listsLoaded && pantryLoaded && budgetLoaded && purchasesLoaded && themeLoaded && pendingTripLoaded;

  useEffect(() => { if (onboarded && loaded) geo.detect(); }, [onboarded, loaded]);

  // ─── Dark Mode ───
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => root.classList.toggle('dark', e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  // ─── Derived ───
  const nearbyStoreId = geo.nearbyStore?.id ?? null;
  const nearbyStoreInfo = geo.nearbyStore;
  const nearbyCard = nearbyStoreId ? cards.find((c) => c.storeId === nearbyStoreId) : null;
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const storeAvailableCoupons = useMemo(() => {
    if (!nearbyStoreId) return 0;
    let coupons = filterCouponsByStore(MOCK_COUPONS, nearbyStoreId);
    if (profile.diet || profile.allergens.length > 0) {
      coupons = filterCouponsByDiet(coupons, profile.diet, profile.allergens, DIET_EXCLUSIONS);
    }
    return coupons.length;
  }, [nearbyStoreId, profile]);

  // ─── Pending Trip Tracking ───
  useEffect(() => {
    if (!loaded || !nearbyStoreId || !nearbyStoreInfo) return;
    const listWithChecked = shoppingLists.find((l) => l.items.length > 0 && l.items.every((i) => i.checked));
    if (listWithChecked && !pendingTrip) {
      setPendingTrip({ listId: listWithChecked.id, storeName: nearbyStoreInfo.name, checkedAt: new Date().toISOString() });
    }
  }, [shoppingLists, nearbyStoreId]);

  // ─── Handlers ───
  const handleOnboardingComplete = (card: LoyaltyCard | null, diet: string, allergens: string[]) => {
    if (card) setCards((p) => [...p, card]);
    if (diet || allergens.length) setProfile((p) => ({ ...p, diet, allergens }));
    setOnboarded(true);
  };

  const addCard = (card: LoyaltyCard) => { setCards((p) => [...p, card]); setShowAddCard(false); };
  const deleteCard = (id: string) => { setCards((p) => p.filter((c) => c.id !== id)); setSelectedCard(null); };
  const clipCoupon = (id: string) => setClippedIds((p) => p.includes(id) ? p : [...p, id]);
  const unclipCoupon = (id: string) => setClippedIds((p) => p.filter((c) => c !== id));
  const markNotifRead = (id: string) => setNotifications((p) => p.map((n) => n.id === id ? { ...n, read: true } : n));
  const markAllNotifsRead = () => setNotifications((p) => p.map((n) => ({ ...n, read: true })));
  const addPurchase = (p: PurchaseRecord) => setPurchases((prev) => [p, ...prev]);

  // ─── Budget Derived ───
  const budgetSummary = useMemo(() => calculateSpendingSummary(purchases, budgetConfig), [purchases, budgetConfig]);
  const budgetDaysLeft = getDaysRemaining(budgetConfig.period);
  // ─── Loading ───
  if (!loaded) {
    return (
      <div className="app-height flex items-center justify-center bg-warm-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-forest-900 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-forest-900/20">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <path d="M20 4L8 12V28L20 36L32 28V12L20 4Z" stroke="#C9A227" strokeWidth="2" fill="none"/>
              <circle cx="20" cy="18" r="4" fill="#C9A227"/>
              <path d="M20 22V32" stroke="#C9A227" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-forest-900/50">Loading CartKey…</p>
        </div>
      </div>
    );
  }

  // ─── Onboarding ───
  if (!onboarded) {
    return (
      <div className="app-height max-w-md mx-auto font-sans">
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  // ─── Screens ───
  const HomeScreen = () => (
    <div className="flex-1 overflow-y-auto pb-4 scrollbar-hide">
      {/* Location banner */}
      <div className="mx-4 mt-4 p-3.5 rounded-xl flex items-center gap-3 card-surface transition-all" style={{
        borderColor: nearbyStoreId ? nearbyStoreInfo!.color + '30' : undefined,
      }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ background: nearbyStoreId ? nearbyStoreInfo!.color + '12' : '#F4F3ED' }}>
          {nearbyStoreId ? nearbyStoreInfo!.icon : '📍'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: nearbyStoreId ? nearbyStoreInfo!.color : '#9CA396' }}>
            {geo.status === 'detecting' ? 'Detecting…' : nearbyStoreId ? "You're near" : 'No store detected'}
          </p>
          <p className="text-sm font-bold text-forest-900 truncate">
            {nearbyStoreId ? nearbyStoreInfo!.name : 'Open near a store for auto-detect'}
          </p>
          {geo.nearbyLocation && (
            <p className="text-[10px] text-forest-900/60 truncate">{geo.nearbyLocation.address}</p>
          )}
        </div>
        <button onClick={geo.detect} className="w-9 h-9 rounded-lg flex items-center justify-center bg-warm-100 active:scale-90 transition-transform flex-shrink-0 min-h-[36px]"><IconRefresh size={14} className="text-forest-900/55" /></button>
      </div>

      {/* Pending trip prompt */}
      {pendingTrip && (
        <div className="mx-4 mt-3 p-4 rounded-xl border-2 border-brass-200 bg-brass-50 animate-fade-in">
          <p className="text-sm font-bold text-forest-900">Did you finish your trip?</p>
          <p className="text-[11px] text-forest-900/60 mt-0.5">You had checked items at {pendingTrip.storeName}</p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => {
              const list = shoppingLists.find((l) => l.id === pendingTrip.listId);
              if (list && nearbyCard) {
                const checkedItems = list.items.filter((i) => i.checked).map((i) => ({ name: i.name, quantity: i.quantity, category: i.category, matchedCouponIds: i.matchedCouponIds }));
                if (checkedItems.length > 0) {
                  const purchase = createPurchaseFromCheckout(list.name, nearbyCard.storeId, nearbyCard.storeName, checkedItems, ESTIMATED_CATEGORY_PRICES);
                  addPurchase(purchase);
                }
              }
              setPendingTrip(null);
            }} className="flex-1 py-2.5 rounded-lg bg-brass-400 text-forest-900 text-xs font-bold min-h-[40px]">
              Log Trip
            </button>
            <button onClick={() => setPendingTrip(null)} className="flex-1 py-2.5 rounded-lg bg-warm-200 text-forest-900/60 text-xs font-semibold min-h-[40px]">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Active card */}
      {nearbyCard && (
        <div className="mx-4 mt-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-forest-900/60">Ready to scan</p>
            <button onClick={() => setShowCheckout(true)}
              className="px-4 py-2 rounded-lg bg-brass-400 text-forest-900 text-xs font-bold active:scale-[0.95] transition-transform min-h-[36px] shadow-sm shadow-brass-400/30">
              Checkout →
            </button>
          </div>
          <button onClick={() => setSelectedCard(nearbyCard)} className="w-full rounded-xl overflow-hidden text-left shadow-lg shadow-forest-900/10 card-surface">
            <div className="p-4 text-white" style={{ background: `linear-gradient(145deg, ${nearbyCard.color}, ${nearbyCard.color}DD)` }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{nearbyCard.icon}</span>
                <div>
                  <p className="font-display font-bold text-base">{nearbyCard.storeName}</p>
                  <p className="text-xs opacity-70 font-mono tracking-wider">{nearbyCard.cardNumber}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4">
              <BarcodeDisplay value={nearbyCard.cardNumber} height={60} symbology={getStoreSymbology(nearbyCard.storeId) as any} />
              <p className="text-center text-[10px] mt-2 font-medium text-forest-900/55">Tap to enlarge · or use Checkout for full flow</p>
            </div>
          </button>
        </div>
      )}

      {/* Coupons preview */}
      {nearbyStoreId && storeAvailableCoupons > 0 && (
        <div className="mx-4 mt-4 animate-fade-in">
          <button onClick={() => { setTab('coupons'); setCouponSubTab('coupons'); }}
            className="w-full p-4 rounded-2xl border border-forest-500/20 bg-forest-50/30 text-left active:scale-[0.98] transition-transform">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest-600 flex items-center justify-center"><IconTag size={18} className="text-white" /></div>
                <div>
                  <p className="text-sm font-bold text-forest-600">{storeAvailableCoupons} coupons available</p>
                  <p className="text-[11px] text-gray-400">At {nearbyStoreInfo!.name} · diet-filtered</p>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </div>
          </button>
        </div>
      )}

      {/* Budget widget */}
      <button onClick={() => setTab('budget')}
        className="mx-4 mt-4 p-4 rounded-2xl text-left active:scale-[0.98] transition-transform"
        style={{
          background: budgetSummary.percentUsed > 0.9 ? '#FEF2F2' : budgetSummary.percentUsed > 0.75 ? '#FFFBEB' : '#F0FDF4',
          border: `1px solid ${budgetSummary.percentUsed > 0.9 ? '#FECACA' : budgetSummary.percentUsed > 0.75 ? '#FDE68A' : '#BBF7D0'}`,
        }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold" style={{ color: budgetSummary.percentUsed > 0.9 ? '#DC2626' : budgetSummary.percentUsed > 0.75 ? '#D97706' : '#16A34A' }}>
            {formatPeriodLabel(budgetConfig.period)} Budget
          </p>
          <p className="text-[10px] text-gray-400">{budgetDaysLeft}d left</p>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-lg font-bold text-gray-800">{formatCurrency(budgetSummary.remaining)}<span className="text-xs font-normal text-gray-400 ml-1">remaining</span></p>
          <p className="text-xs text-gray-500">{formatCurrency(budgetSummary.totalSpent)} / {formatCurrency(budgetConfig.total)}</p>
        </div>
        <div className="h-2 rounded-full bg-white/60 mt-2 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{
            width: `${Math.min(100, budgetSummary.percentUsed * 100)}%`,
            background: budgetSummary.percentUsed > 0.9 ? '#EF4444' : budgetSummary.percentUsed > 0.75 ? '#F59E0B' : '#22C55E',
          }} />
        </div>
      </button>

      {/* Quick actions */}
      <div className="mx-4 mt-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-forest-900/60 mb-2.5 px-1">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2.5">
          <button onClick={() => { setTab('lists'); setListsSubTab('lists'); }} className="p-4 rounded-xl card-surface text-left active:scale-[0.97] transition-transform min-h-[80px]">
            <div className="w-8 h-8 rounded-lg bg-forest-100 flex items-center justify-center"><IconList size={16} className="text-forest-600" /></div>
            <p className="text-sm font-bold mt-1.5 text-forest-900">Shopping Lists</p>
            <p className="text-[11px] text-forest-900/60">{shoppingLists.length} list{shoppingLists.length !== 1 ? 's' : ''}</p>
          </button>
          <button onClick={() => { setTab('lists'); setListsSubTab('meals'); }} className="p-4 rounded-xl card-surface text-left active:scale-[0.97] transition-transform min-h-[80px]">
            <div className="w-8 h-8 rounded-lg bg-brass-50 flex items-center justify-center"><IconCalendar size={16} className="text-brass-600" /></div>
            <p className="text-sm font-bold mt-1.5 text-forest-900">Meal Planner</p>
            <p className="text-[11px] text-forest-900/60">Plan & generate lists</p>
          </button>
          <button onClick={() => { setTab('coupons'); setCouponSubTab('coupons'); }} className="p-4 rounded-xl card-surface text-left active:scale-[0.97] transition-transform min-h-[80px]">
            <div className="w-8 h-8 rounded-lg bg-forest-100 flex items-center justify-center"><IconTag size={16} className="text-forest-600" /></div>
            <p className="text-sm font-bold mt-1.5 text-forest-900">Coupons</p>
            <p className="text-[11px] text-forest-900/60">{clippedIds.length} clipped</p>
          </button>
          <button onClick={() => setTab('budget')} className="p-4 rounded-xl card-surface text-left active:scale-[0.97] transition-transform min-h-[80px]">
            <div className="w-8 h-8 rounded-lg bg-brass-50 flex items-center justify-center"><IconWallet size={16} className="text-brass-600" /></div>
            <p className="text-sm font-bold mt-1.5 text-forest-900">Budget</p>
            <p className="text-[11px] text-forest-900/60">{formatCurrency(budgetSummary.remaining)} left</p>
          </button>
        </div>
      </div>

      {/* Card carousel */}
      {cards.length > 0 && (
        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-forest-900/60 mb-2.5 px-5">Your Cards</p>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-2" style={{ scrollSnapType: 'x mandatory' }}>
            {cards.map((card) => (
              <button key={card.id} onClick={() => setSelectedCard(card)} className="flex-shrink-0 w-36 rounded-xl overflow-hidden text-left shadow-md shadow-forest-900/5" style={{ scrollSnapAlign: 'start' }}>
                <div className="p-2.5 text-white" style={{ background: card.color }}>
                  <span className="text-base">{card.icon}</span>
                  <p className="text-[11px] font-bold mt-0.5 truncate">{card.storeName}</p>
                </div>
                <div className="bg-white p-2">
                  <BarcodeDisplay value={card.cardNumber} height={28} showText={false} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const CardsScreen = () => (
    <div className="flex-1 overflow-y-auto pb-4 px-4 pt-4 scrollbar-hide">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-forest-600 font-display">My Cards</h2>
          <p className="text-xs text-gray-400">{cards.length} loyalty {cards.length === 1 ? 'card' : 'cards'} saved</p>
        </div>
        <button onClick={() => setShowAddCard(true)} className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl bg-forest-600 active:scale-90 transition-transform">+</button>
      </div>
      {cards.length === 0 ? (
        <div className="text-center py-12 animate-fade-in">
          <div className="text-5xl mb-4">💳</div>
          <p className="text-sm font-semibold text-gray-700">No cards yet</p>
          <p className="text-xs mt-1 text-gray-400">Add your first loyalty card to get started</p>
          <button onClick={() => setShowAddCard(true)} className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-semibold bg-forest-600">Add Card</button>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <button key={card.id} onClick={() => setSelectedCard(card)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98]"
              style={{ borderColor: nearbyStoreId === card.storeId ? card.color + '40' : '#F3F4F6', background: nearbyStoreId === card.storeId ? card.color + '05' : 'white' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl text-white" style={{ background: card.color }}>{card.icon}</div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-bold text-gray-800">{card.storeName}</p>
                <p className="text-xs font-mono truncate text-gray-400">{card.cardNumber}</p>
              </div>
              {nearbyStoreId === card.storeId && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-600">NEARBY</span>}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const CouponsScreen = () => {
    const [storeSelector, setStoreSelector] = useState(false);
    const [selectedStoreId, setSelectedStoreId] = useState<string | null>(nearbyStoreId);
    const activeStoreId = selectedStoreId || nearbyStoreId;
    const activeStore = activeStoreId ? getStore(activeStoreId) : null;

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sub-tabs */}
        <div className="px-4 pt-3">
          <div className="flex gap-1 p-1 rounded-xl bg-gray-100">
            <button onClick={() => setCouponSubTab('coupons')}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: couponSubTab === 'coupons' ? 'white' : 'transparent', color: couponSubTab === 'coupons' ? '#1B4332' : '#6B7280', boxShadow: couponSubTab === 'coupons' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              Coupons
            </button>
            <button onClick={() => setCouponSubTab('ads')}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: couponSubTab === 'ads' ? 'white' : 'transparent', color: couponSubTab === 'ads' ? '#1B4332' : '#6B7280', boxShadow: couponSubTab === 'ads' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              Weekly Ads
            </button>
          </div>

          {/* Store selector for ads */}
          {couponSubTab === 'ads' && (
            <div className="mt-3">
              <button onClick={() => setStoreSelector(!storeSelector)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white w-full text-left">
                {activeStore ? (
                  <>
                    <span>{activeStore.icon}</span>
                    <span className="text-sm font-semibold text-gray-700">{activeStore.name}</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">Select a store...</span>
                )}
                <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {storeSelector && (
                <div className="mt-1 p-2 rounded-xl border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                  {STORES.filter((s) => s.id !== 'other').map((s) => (
                    <button key={s.id} onClick={() => { setSelectedStoreId(s.id); setStoreSelector(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-gray-50 transition-colors">
                      <span>{s.icon}</span>
                      <span className="text-sm text-gray-700">{s.name}</span>
                      {nearbyStoreId === s.id && <span className="ml-auto text-[10px] text-green-500 font-bold">NEARBY</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {couponSubTab === 'coupons' ? (
          <CouponBrowser nearbyStoreId={nearbyStoreId} profile={profile} clippedIds={clippedIds} onClip={clipCoupon} onUnclip={unclipCoupon} />
        ) : activeStoreId && activeStore ? (
          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 scrollbar-hide">
            <WeeklyAdBrowser storeId={activeStoreId} storeName={activeStore.name} storeColor={activeStore.color} profile={profile} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              
              <p className="text-sm text-gray-500">Select a store to view weekly ads</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const ProfileScreen = () => {
    const [localDiet, setLocalDiet] = useState(profile.diet);
    const [localAllergens, setLocalAllergens] = useState(profile.allergens);
    const [localExclusions, setLocalExclusions] = useState(profile.customExclusions || '');
    const [saved, setSaved] = useState(false);
    const toggleA = (id: string) => setLocalAllergens((p) => (p.includes(id) ? p.filter((a) => a !== id) : [...p, id]));
    const save = () => { setProfile({ diet: localDiet, allergens: localAllergens, customExclusions: localExclusions }); setSaved(true); setTimeout(() => setSaved(false), 2000); };

    return (
      <div className="flex-1 overflow-y-auto pb-4 px-4 pt-4 scrollbar-hide">
        <h2 className="text-xl font-bold text-forest-600 font-display">Dietary Profile</h2>
        <p className="text-xs text-gray-400 mb-4">Coupons and weekly ads are filtered to match</p>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Diet Type</p>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {DIETARY_TYPES.map((d) => (
            <button key={d.id} onClick={() => setLocalDiet(d.id === localDiet ? '' : d.id)}
              className="flex flex-col items-center p-2.5 rounded-xl border-2 transition-all"
              style={{ borderColor: localDiet === d.id ? '#2D6A4F' : '#E5E7EB', background: localDiet === d.id ? '#2D6A4F10' : 'white' }}>
              <span className="text-lg">{d.icon}</span>
              <span className="text-[10px] mt-0.5 font-medium text-gray-700">{d.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Allergens</p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {ALLERGENS.map((a) => (
            <button key={a.id} onClick={() => toggleA(a.id)}
              className="flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all"
              style={{ borderColor: localAllergens.includes(a.id) ? '#DC2626' : '#E5E7EB', background: localAllergens.includes(a.id) ? '#FEE2E2' : 'white' }}>
              <span className="text-base">{a.icon}</span>
              <span className="text-xs font-medium text-gray-700">{a.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Custom Exclusions</p>
        <input type="text" placeholder="e.g., nightshades, high-FODMAP" value={localExclusions} onChange={(e) => setLocalExclusions(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 mb-5 outline-none" />
        <button onClick={save} className="w-full py-3.5 rounded-2xl text-white font-semibold text-base active:scale-[0.98] transition-all mb-6"
          style={{ background: saved ? '#059669' : '#1B4332' }}>
          {saved ? '✓ Saved!' : 'Save Preferences'}
        </button>

        {/* Settings section */}
        <p className="text-xs font-semibold uppercase tracking-widest text-forest-900/60 mb-2">Settings</p>
        <div className="space-y-2 mb-4">
          {/* Dark mode toggle */}
          <div className="p-3 rounded-xl card-surface">
            <p className="text-sm font-semibold text-forest-900">Appearance</p>
            <div className="flex gap-1.5 mt-2">
              {(['light', 'system', 'dark'] as const).map((t) => (
                <button key={t} onClick={() => setTheme(t)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all min-h-[36px]"
                  style={{ background: theme === t ? '#1A1F16' : '#F4F3ED', color: theme === t ? '#F5E6B8' : '#5C6356' }}>
                  {t === 'light' ? 'Light' : t === 'dark' ? 'Dark' : 'System'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl card-surface">
            <p className="text-sm font-semibold text-forest-900">Location</p>
            <p className="text-xs mt-0.5 text-forest-900/55">
              {geo.status === 'detected' ? `Near ${nearbyStoreInfo?.name}` : geo.status === 'denied' ? 'Access denied' : geo.status === 'none_nearby' ? 'No stores nearby' : 'Idle'}
            </p>
            <button onClick={geo.detect} className="mt-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-warm-100 text-forest-900/60">Refresh</button>
          </div>

          {/* Data export/import */}
          <div className="p-3 rounded-xl card-surface">
            <p className="text-sm font-semibold text-forest-900">Data & Backup</p>
            <p className="text-xs mt-0.5 text-forest-900/55">{cards.length} cards · {purchases.length} purchases · {shoppingLists.length} lists</p>
            <div className="flex gap-2 mt-2">
              <button onClick={downloadBackup} className="flex-1 py-2 rounded-lg text-xs font-semibold bg-forest-900 text-brass-100 min-h-[36px]">
                Export Backup
              </button>
              <label className="flex-1 py-2 rounded-lg text-xs font-semibold bg-warm-100 text-forest-900/60 text-center cursor-pointer min-h-[36px] flex items-center justify-center">
                Import Backup
                <input type="file" accept=".json" className="hidden" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const result = await importBackup(f);
                  if (result.success) {
                    alert(`Restored ${result.keysRestored} data keys. Reloading…`);
                    window.location.reload();
                  } else {
                    alert(`Import failed: ${result.error}`);
                  }
                  e.target.value = '';
                }} />
              </label>
            </div>
          </div>

          <button onClick={() => setShowAddCard(true)} className="p-3 rounded-xl card-surface text-left w-full">
            <p className="text-sm font-semibold text-forest-900">Loyalty Cards ({cards.length})</p>
            <p className="text-xs mt-0.5 text-forest-900/55">Tap to add a new card</p>
          </button>

          <div className="p-3 rounded-xl card-surface">
            <p className="text-sm font-semibold text-forest-900">About</p>
            <p className="text-xs mt-0.5 text-forest-900/55">CartKey v1.0.0 · MIT License · grocery.blackatlas.tech</p>
          </div>

          <button onClick={() => { if (confirm('Reset all data? This cannot be undone.')) { setCards([]); setProfile({ diet: '', allergens: [], customExclusions: '' }); setClippedIds([]); setNotifications(MOCK_NOTIFICATIONS); setShoppingLists([]); setPantryItems([]); setBudgetConfig(DEFAULT_BUDGET); setPurchases([]); setPendingTrip(null); setTheme('system'); setOnboarded(false); } }}
            className="w-full p-3 rounded-xl border border-red-200 bg-red-50 text-left">
            <p className="text-sm font-semibold text-red-600">Reset All Data</p>
          </button>
        </div>
      </div>
    );
  };

  const ListsScreen = () => {
    const handleGenerateList = (list: ShoppingList) => {
      setShoppingLists((p) => [...p, list]);
      setListsSubTab('lists');
    };

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-3">
          <div className="flex gap-1 p-1 rounded-xl bg-gray-100">
            <button onClick={() => setListsSubTab('lists')} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: listsSubTab === 'lists' ? 'white' : 'transparent', color: listsSubTab === 'lists' ? '#1B4332' : '#6B7280', boxShadow: listsSubTab === 'lists' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              Lists
            </button>
            <button onClick={() => setListsSubTab('meals')} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: listsSubTab === 'meals' ? 'white' : 'transparent', color: listsSubTab === 'meals' ? '#1B4332' : '#6B7280', boxShadow: listsSubTab === 'meals' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              Meals
            </button>
            <button onClick={() => setListsSubTab('pantry')} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: listsSubTab === 'pantry' ? 'white' : 'transparent', color: listsSubTab === 'pantry' ? '#1B4332' : '#6B7280', boxShadow: listsSubTab === 'pantry' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              Pantry
            </button>
          </div>
        </div>
        {listsSubTab === 'lists' && <ShoppingListManager lists={shoppingLists} onUpdateLists={setShoppingLists} clippedIds={clippedIds} onClip={clipCoupon} onFinishTrip={nearbyCard ? () => setShowCheckout(true) : undefined} />}
        {listsSubTab === 'meals' && <MealPlanner pantryItems={pantryItems} onGenerateList={handleGenerateList} />}
        {listsSubTab === 'pantry' && <PantryTracker items={pantryItems} onUpdate={setPantryItems} />}
      </div>
    );
  };

  // ─── Tab Config ───
  const tabIcons: Record<TabId, (p: { size?: number; className?: string }) => JSX.Element> = {
    home: IconHome, lists: IconList, coupons: IconTag, budget: IconWallet, profile: IconUser,
  };
  const tabLabels: Record<TabId, string> = {
    home: 'Home', lists: 'Lists', coupons: 'Coupons', budget: 'Budget', profile: 'Profile',
  };

  return (
    <div className="app-height max-w-md mx-auto flex flex-col font-sans bg-warm-50">
      {/* Header */}
      <div className="relative">
        <div className="flex items-center justify-between px-4 py-3 bg-forest-900 safe-top">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brass-400/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
                <path d="M20 4L8 12V28L20 36L32 28V12L20 4Z" stroke="#C9A227" strokeWidth="2.5" fill="none"/>
                <circle cx="20" cy="18" r="3.5" fill="#C9A227"/>
                <path d="M20 22V32" stroke="#C9A227" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-white font-display font-bold text-lg tracking-tight">CartKey</h1>
          </div>
          <div className="flex items-center gap-2">
            {nearbyStoreId && (
              <span className="px-2.5 py-1 rounded text-[10px] font-semibold text-brass-100 bg-white/10">{nearbyStoreInfo!.name}</span>
            )}
            <NotificationBell count={unreadNotifs} onClick={() => setShowNotifications(true)} />
          </div>
        </div>
        <div className="brass-stripe" />
      </div>

      {/* Screen */}
      {tab === 'home' && <HomeScreen />}
      {tab === 'lists' && <ListsScreen />}
      {tab === 'coupons' && <CouponsScreen />}
      {tab === 'budget' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-2 pb-1">
            <div className="flex gap-1 p-1 rounded-xl bg-gray-100">
              <button onClick={() => setBudgetSubTab('budget')} className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{ background: budgetSubTab === 'budget' ? 'white' : 'transparent', color: budgetSubTab === 'budget' ? '#1B4332' : '#6B7280', boxShadow: budgetSubTab === 'budget' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                Budget
              </button>
              <button onClick={() => setBudgetSubTab('prices')} className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{ background: budgetSubTab === 'prices' ? 'white' : 'transparent', color: budgetSubTab === 'prices' ? '#1B4332' : '#6B7280', boxShadow: budgetSubTab === 'prices' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                Prices & Savings
              </button>
            </div>
          </div>
          {budgetSubTab === 'budget' && <BudgetDashboard budget={budgetConfig} purchases={purchases} onUpdateBudget={setBudgetConfig} onAddPurchase={addPurchase} />}
          {budgetSubTab === 'prices' && <PriceIntelligence purchases={purchases} coupons={MOCK_COUPONS} clippedIds={clippedIds} onClip={clipCoupon} />}
        </div>
      )}
      {tab === 'profile' && <ProfileScreen />}

      {/* Bottom Nav */}
      <div className="border-t border-warm-200 bg-white safe-bottom">
        <div className="flex">
          {(['home', 'lists', 'coupons', 'budget', 'profile'] as TabId[]).map((id) => {
            const active = tab === id;
            const Icon = tabIcons[id];
            return (
              <button key={id} onClick={() => setTab(id)}
                className="flex-1 flex flex-col items-center py-2.5 transition-all min-h-[52px] relative">
                {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-brass-400" />}
                <Icon size={20} className={active ? 'text-forest-900' : 'text-forest-900/40'} />
                <span className={`text-[10px] mt-1 font-semibold ${active ? 'text-forest-900' : 'text-forest-900/40'}`}>{tabLabels[id]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {showAddCard && <AddCardModal onAdd={addCard} onClose={() => setShowAddCard(false)} />}
      {selectedCard && <CardDetail card={selectedCard} onClose={() => setSelectedCard(null)} onDelete={deleteCard} isNearby={nearbyStoreId === selectedCard.storeId} />}
      {showNotifications && <NotificationCenter notifications={notifications} onMarkRead={markNotifRead} onMarkAllRead={markAllNotifsRead} onClose={() => setShowNotifications(false)} />}
      {showCheckout && nearbyCard && (
        <CheckoutMode
          card={nearbyCard}
          clippedIds={clippedIds}
          budgetRemaining={budgetSummary.remaining}
          budgetPeriodLabel={formatPeriodLabel(budgetConfig.period)}
          activeList={shoppingLists.find((l) => l.items.some((i) => i.checked)) || null}
          onComplete={(purchase) => { if (purchase) addPurchase(purchase); setPendingTrip(null); setShowCheckout(false); }}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}
