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

  const detect = useCallback((forceFresh = false) => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, status: 'unsupported' }));
      return;
    }
    setState((s) => ({ ...s, status: 'detecting' }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const location = findNearestLocation(latitude, longitude, 4000);
        const store = location ? getStore(location.chainId) || null : null;

        setState({
          status: location ? 'detected' : 'none_nearby',
          nearbyStore: store,
          nearbyLocation: location,
          distance: null,
          coords: { lat: latitude, lng: longitude },
        });
      },
      (err) => {
        // PERMISSION_DENIED=1, POSITION_UNAVAILABLE=2, TIMEOUT=3
        if (err.code === 1) {
          setState((s) => ({ ...s, status: 'denied' }));
        } else {
          setState((s) => ({ ...s, status: 'none_nearby' }));
        }
      },
      // forceFresh=true bypasses the browser's cached location for explicit Refresh taps
      { enableHighAccuracy: true, timeout: 15000, maximumAge: forceFresh ? 0 : 60000 }
    );
  }, []);

  return { ...state, detect };
}
