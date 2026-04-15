import { useState, useCallback } from 'react';
import { findNearestLocation } from '../data/storeLocations';
import { getStore } from '../data/stores';
import type { Store } from '../lib/types';
import type { StoreLocation } from '../data/storeLocations';

export type LocationStatus = 'idle' | 'detecting' | 'detected' | 'none_nearby' | 'denied' | 'unsupported';

export interface GeoState {
  status: LocationStatus;
  nearbyStore: Store | null;
  nearbyLocation: StoreLocation | null;
  distance: number | null;
  coords: { lat: number; lng: number } | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    status: 'idle',
    nearbyStore: null,
    nearbyLocation: null,
    distance: null,
    coords: null,
  });

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, status: 'unsupported' }));
      return;
    }
    setState((s) => ({ ...s, status: 'detecting' }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const location = findNearestLocation(latitude, longitude, 1000);
        const store = location ? getStore(location.chainId) || null : null;

        setState({
          status: location ? 'detected' : 'none_nearby',
          nearbyStore: store,
          nearbyLocation: location,
          distance: null,
          coords: { lat: latitude, lng: longitude },
        });
      },
      () => {
        setState((s) => ({ ...s, status: 'denied' }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { ...state, detect };
}
