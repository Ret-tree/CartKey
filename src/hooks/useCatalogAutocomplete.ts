import { useState, useEffect } from 'react';
import { searchKrogerCatalog, type CatalogProduct } from '../lib/krogerService';

// Debounced autocomplete against Kroger's catalog.
// Returns suggestions, loading state, and a clear() function.
export function useCatalogAutocomplete(query: string, zip: string, debounceMs = 300) {
  const [suggestions, setSuggestions] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const handle = setTimeout(async () => {
      const results = await searchKrogerCatalog(trimmed, zip);
      setSuggestions(results);
      setLoading(false);
    }, debounceMs);

    return () => clearTimeout(handle);
  }, [query, zip, debounceMs]);

  return {
    suggestions,
    loading,
    clear: () => setSuggestions([]),
  };
}
