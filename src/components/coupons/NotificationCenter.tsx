import { useState } from 'react';
import type { AppNotification } from '../../lib/types';

interface Props {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

export function NotificationCenter({ notifications, onMarkRead, onMarkAllRead, onClose }: Props) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const iconForType = (type: string) => {
    switch (type) {
      case 'coupon_new': return '🏷️';
      case 'coupon_expiring': return '⏰';
      case 'weekly_ad': return '📰';
      case 'system': return '🔔';
      default: return '📩';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-white animate-slide-up" style={{ maxHeight: '70vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-forest-600 font-display">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">{unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={onMarkAllRead} className="text-xs font-semibold text-forest-500">Mark all read</button>
              )}
              <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 text-xs">✕</button>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 60px)' }}>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-2">🔕</div>
              <p className="text-sm text-gray-400">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button key={n.id} onClick={() => onMarkRead(n.id)}
                className="w-full flex items-start gap-3 px-4 py-3 border-b border-gray-50 text-left transition-all hover:bg-gray-50"
                style={{ background: n.read ? 'transparent' : '#ECFDF505' }}>
                <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-lg" style={{ background: n.read ? '#F3F4F6' : '#ECFDF5' }}>
                  {iconForType(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm truncate ${n.read ? 'text-gray-600' : 'text-gray-800 font-semibold'}`}>{n.title}</p>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-forest-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Bell button for header
export function NotificationBell({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative w-8 h-8 rounded-full flex items-center justify-center bg-white/15">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
