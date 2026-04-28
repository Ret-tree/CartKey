import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Check for updates every hour while the app is open
      if (registration) {
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('Service worker registration failed:', error);
    },
  });

  useEffect(() => {
    if (needRefresh) setShowPrompt(true);
  }, [needRefresh]);

  if (!showPrompt) return null;

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setNeedRefresh(false);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-[70] animate-fade-in">
      <div className="rounded-xl bg-forest-900 text-white p-4 shadow-2xl shadow-forest-900/40 border border-brass-400/30">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-brass-400/20 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A227" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0115.36-6.36L21 8" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">New version available</p>
            <p className="text-[11px] text-white/60 mt-0.5">Reload to get the latest features and fixes.</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={handleDismiss} className="flex-1 py-2 rounded-lg text-xs font-semibold text-white/60" style={{ background: 'rgba(255,255,255,0.08)' }}>
            Later
          </button>
          <button onClick={handleUpdate} className="flex-1 py-2 rounded-lg bg-brass-400 text-forest-900 text-xs font-bold">
            Reload Now
          </button>
        </div>
      </div>
    </div>
  );
}
