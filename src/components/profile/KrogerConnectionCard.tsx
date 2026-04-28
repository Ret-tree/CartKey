import { useState, useEffect, useCallback } from 'react';
import {
  getKrogerConnectionStatus, fetchKrogerProfile,
  startKrogerConnection, disconnectKroger, type KrogerProfile,
} from '../../lib/krogerService';
import { BarcodeDisplay } from '../cards/BarcodeDisplay';

export function KrogerConnectionCard() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [profile, setProfile] = useState<KrogerProfile | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

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
      // Strip the query param without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete('kroger_connected');
      window.history.replaceState({}, '', url.toString());
      setTimeout(() => setShowSuccess(false), 4000);
    }
    refresh();
  }, [refresh]);

  const handleDisconnect = async () => {
    if (!confirm('Disconnect your Kroger account? You can reconnect anytime.')) return;
    await disconnectKroger();
    await refresh();
  };

  if (loading) {
    return (
      <div className="p-4 rounded-xl card-surface">
        <p className="text-sm text-forest-900/55 text-center">Checking Kroger connection…</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showSuccess && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 animate-fade-in">
          <p className="text-sm font-semibold text-green-700">Kroger account connected!</p>
        </div>
      )}

      {!connected ? (
        <div className="p-4 rounded-xl card-surface">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-forest-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🛒</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-forest-900">Connect your Kroger account</p>
              <p className="text-[11px] text-forest-900/55 mt-0.5 leading-relaxed">
                Sync your loyalty card barcode automatically and unlock per-account features. Works for Kroger, Harris Teeter, Fred Meyer, Ralphs, and 8 other Kroger-family banners.
              </p>
            </div>
          </div>

          <button
            onClick={() => startKrogerConnection('/?tab=profile')}
            className="mt-3.5 w-full py-3 rounded-lg bg-forest-900 text-brass-100 font-semibold text-sm min-h-[44px]"
          >
            Connect Kroger Account
          </button>
          <p className="text-[10px] text-forest-900/40 mt-2 text-center leading-relaxed">
            You'll be redirected to Kroger to authorize. CartKey only stores tokens needed to read your account.
          </p>
        </div>
      ) : (
        <div className="rounded-xl card-surface overflow-hidden">
          <div className="p-4 bg-forest-900 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brass-400 font-semibold">Connected</p>
                <p className="text-base font-display font-bold mt-0.5">Kroger Account</p>
              </div>
              <span className="text-2xl">🛒</span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {profile?.loyaltyId ? (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-forest-900/55 font-semibold mb-2">Plus Card</p>
                <div className="bg-white p-3 rounded-lg border border-warm-200">
                  <BarcodeDisplay value={profile.loyaltyId} height={50} />
                </div>
                <p className="text-[11px] text-forest-900/55 font-mono text-center mt-1.5">{profile.loyaltyId}</p>
              </div>
            ) : (
              <p className="text-[11px] text-forest-900/55 italic">No loyalty card on this Kroger account yet.</p>
            )}

            <div className="pt-2 border-t border-warm-200">
              <button
                onClick={handleDisconnect}
                className="text-xs text-red-500 underline"
              >
                Disconnect Kroger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
