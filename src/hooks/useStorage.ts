import { useState, useEffect, useCallback } from 'react';

export function useStorage<T>(key: string, defaultValue: T): [T, (v: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored));
    } catch {
      // ignore parse errors
    }
    setLoaded(true);
  }, [key]);

  const persist = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue;
        try {
          localStorage.setItem(key, JSON.stringify(v));
        } catch (e) {
          console.error('Storage error:', e);
        }
        return v;
      });
    },
    [key]
  );

  return [value, persist, loaded];
}
