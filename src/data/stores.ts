import type { Store } from '../lib/types';

export const STORES: Store[] = [
  // ─── Symbology notes ───
  // code128: Standard for most US grocery loyalty cards (numeric/alphanumeric)
  // qrcode: Modern app-based loyalty programs (Walmart+, Lidl Plus, Whole Foods/Prime)

  { id: 'kroger', name: 'Kroger', color: '#0062A0', icon: '🛒', barcodeSymbology: 'code128', supportsPhone: true },
  { id: 'safeway', name: 'Safeway', color: '#E21A2C', icon: '🏪', barcodeSymbology: 'code128', supportsPhone: true },
  { id: 'walmart', name: 'Walmart', color: '#0071CE', icon: '🏬', barcodeSymbology: 'qrcode', supportsPhone: false },
  { id: 'target', name: 'Target', color: '#CC0000', icon: '🎯', barcodeSymbology: 'code128', supportsPhone: true },
  { id: 'costco', name: 'Costco', color: '#E31837', icon: '📦', barcodeSymbology: 'code128', supportsPhone: false },
  { id: 'traderjoes', name: "Trader Joe's", color: '#C8102E', icon: '🌻', barcodeSymbology: 'code128', supportsPhone: false },
  { id: 'wholefds', name: 'Whole Foods', color: '#00674B', icon: '🥬', barcodeSymbology: 'qrcode', supportsPhone: true },
  { id: 'aldi', name: 'Aldi', color: '#00457C', icon: '🛍️', barcodeSymbology: 'qrcode', supportsPhone: false },
  { id: 'publix', name: 'Publix', color: '#3B8427', icon: '🥑', barcodeSymbology: 'code128', supportsPhone: true },
  { id: 'heb', name: 'H-E-B', color: '#EE2E24', icon: '🌮', barcodeSymbology: 'code128', supportsPhone: true },
  { id: 'wegmans', name: 'Wegmans', color: '#004B8D', icon: '🍎', barcodeSymbology: 'code128', supportsPhone: true },
  { id: 'harristeeter', name: 'Harris Teeter', color: '#E31837', icon: '🍒', barcodeSymbology: 'code128', supportsPhone: true },
  { id: 'foodlion', name: 'Food Lion', color: '#5B2C82', icon: '🦁', barcodeSymbology: 'code128', supportsPhone: true },
  { id: 'giantfood', name: 'Giant Food', color: '#FF6600', icon: '🧡', barcodeSymbology: 'code128', supportsPhone: true },
  { id: 'lidl', name: 'Lidl', color: '#0050AA', icon: '💛', barcodeSymbology: 'qrcode', supportsPhone: false },

  // ─── New additions ───
  { id: 'sprouts', name: 'Sprouts', color: '#5B8C3E', icon: '🌱', barcodeSymbology: 'code128', supportsPhone: true },
  { id: 'lowesfoods', name: 'Lowes Foods', color: '#D32F2F', icon: '🏡', barcodeSymbology: 'code128', supportsPhone: true },
  { id: 'stopshop', name: 'Stop & Shop', color: '#E4002B', icon: '🛑', barcodeSymbology: 'code128', supportsPhone: true },
  { id: 'hannaford', name: 'Hannaford', color: '#005DA9', icon: '🌲', barcodeSymbology: 'code128', supportsPhone: true },
  { id: 'hyvee', name: 'Hy-Vee', color: '#E2231A', icon: '🌽', barcodeSymbology: 'code128', supportsPhone: true },
  { id: 'meijer', name: 'Meijer', color: '#003DA5', icon: '🏷️', barcodeSymbology: 'code128', supportsPhone: true },
  { id: 'shoprite', name: 'ShopRite', color: '#E32726', icon: '🍎', barcodeSymbology: 'code128', supportsPhone: true },
  { id: 'albertsons', name: 'Albertsons', color: '#0072CE', icon: '🅰️', barcodeSymbology: 'code128', supportsPhone: true },
  { id: 'winndixie', name: 'Winn-Dixie', color: '#E03A3E', icon: '🌴', barcodeSymbology: 'code128', supportsPhone: true },

  { id: 'other', name: 'Other Store', color: '#6B7280', icon: '🏷️', barcodeSymbology: 'code128', supportsPhone: false },
];

export function getStore(id: string): Store | undefined {
  return STORES.find((s) => s.id === id);
}

export function getStoreSymbology(storeId: string): string {
  return getStore(storeId)?.barcodeSymbology || 'code128';
}
