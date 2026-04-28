import { useState, useEffect, useCallback } from 'react';
import {
  getKrogerConnectionStatus, fetchKrogerProfile,
  startKrogerConnection, disconnectKroger, type KrogerProfile,
} from '../../lib/krogerService';
import { BarcodeDisplay } from '../cards/BarcodeDisplay';
import { isKrogerFamily } from '../../data/krogerFamily';
import { getStore } from '../../data/stores';

interface Props {
  // The current "context chain" — derived from the user's nearby store or
  // their saved loyalty cards. Determines what banner name to show in the UI.
  contextStoreId?: string | null;
}

export function KrogerConnectionCard({ contextStoreId = null }: Props) {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [profile, setProfile] = useState<KrogerProfile | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Decide which banner to feature in the UI. Defaults to Kroger but uses the
  // user's contextual chain (Harris Teeter, Fred Meyer, etc.) when known.
  const featuredStore = contextStoreId && isKrogerFamily(contextStoreId)
    ? getStore(contextStoreId)
    : getStore('kroger');
  const featuredName = featuredStore?.name || 'Kroger';
  const featuredIcon = featuredStore?.icon || '🛒';

  const refresh = useCallback(async () => {
    setLoading(true);
    const status = await getKrogerConnectionStatus();
    setConnected(status.connected);
    if (status.connected) {
      const p = await fetchKrogerProfile();
      setProfile(p);
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, []);

  // Detect successful connection from URL param after redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('kroger_connected') === '1') {
      setShowSuccess(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('kroger_connected');
      window.history.replaceState({}, '', url.toString());
      setTimeout(() => setShowSuccess(false), 4000);
    }
    refresh();
  }, [refresh]);

  const handleDisconnect = async () => {
    if (!confirm(`Disconnect your ${featuredName} account? You can reconnect anytime.`)) return;
    await disconnectKroger();
    await refresh();
  };

  if (loading) {
    return (
      <div className="p-4 rounded-xl card-surface">
        <p className="text-sm text-forest-900/55 text-center">Checking account connection…</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showSuccess && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 animate-fade-in">
          <p className="text-sm font-semibold text-green-700">{featuredName} account connected!</p>
        </div>
      )}

      {!connected ? (
        <div className="p-4 rounded-xl card-surface">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-forest-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">{featuredIcon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-forest-900">Connect your {featuredName} account</p>
              <p className="text-[11px] text-forest-900/55 mt-0.5 leading-relaxed">
                Sign in once to enable Auto Scan price match, smart product autocomplete, and Send to Cart for {featuredName} and other Kroger-family stores (Harris Teeter, Fred Meyer, Ralphs, King Soopers, and more).
              </p>
            </div>
          </div>

          <button
            onClick={() => startKrogerConnection('/?tab=profile')}
            className="mt-3.5 w-full py-3 rounded-lg bg-forest-900 text-brass-100 font-semibold text-sm min-h-[44px]"
          >
            Connect {featuredName} Account
          </button>
          <p className="text-[10px] text-forest-900/40 mt-2 text-center leading-relaxed">
            You'll be redirected to {featuredName === 'Harris Teeter' ? 'Harris Teeter (powered by Kroger)' : featuredName} to sign in. CartKey only stores tokens needed to read your account.
          </p>
        </div>
      ) : (
        <div className="rounded-xl card-surface overflow-hidden">
          <div className="p-4 bg-forest-900 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brass-400 font-semibold">Connected</p>
                <p className="text-base font-display font-bold mt-0.5">{featuredName} Account</p>
              </div>
              <span className="text-2xl">{featuredIcon}</span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {profile?.loyaltyId ? (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-forest-900/55 font-semibold mb-2">
                  {featuredName === 'Harris Teeter' ? 'VIC Card' : 'Plus Card'}
                </p>
                <div className="bg-white p-3 rounded-lg border border-warm-200">
                  <BarcodeDisplay value={profile.loyaltyId} height={50} />
                </div>
                <p className="text-[11px] text-forest-900/55 font-mono text-center mt-1.5">{profile.loyaltyId}</p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-[11px] font-semibold text-amber-700 mb-1">Loyalty card not exposed by API</p>
                <p className="text-[11px] text-forest-900/60 leading-relaxed">
                  Kroger's public API doesn't return loyalty card numbers for all account types — particularly accounts that primarily use {featuredName === 'Harris Teeter' ? 'Harris Teeter' : 'a non-Kroger banner'}. Your account is connected and other features (Send to Cart, Auto Scan) work normally. Add your card manually from the home screen for in-store checkout.
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-warm-200">
              <button
                onClick={handleDisconnect}
                className="text-xs text-red-500 underline"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
