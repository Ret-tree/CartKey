import type { Store } from './types';

export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestStore(
  lat: number,
  lng: number,
  stores: Store[],
  maxDistance = 500
): { store: Store; distance: number } | null {
  let closest: Store | null = null;
  let minDist = Infinity;

  for (const store of stores) {
    if (store.lat == null || store.lng == null) continue;
    const d = getDistance(lat, lng, store.lat, store.lng);
    if (d < minDist) {
      minDist = d;
      closest = store;
    }
  }

  if (closest && minDist <= maxDistance) {
    return { store: closest, distance: minDist };
  }
  return null;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
