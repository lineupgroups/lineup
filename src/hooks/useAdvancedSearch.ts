import { useState, useEffect, useCallback } from 'react';
import { FirestoreProject } from '../types/firestore';
import { AdvancedSearchParams } from '../types/search';
import { advancedProjectSearch } from '../lib/search';
import { saveSearchToHistory } from '../lib/searchHistory';

export function useAdvancedSearch(initialParams?: AdvancedSearchParams) {
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<AdvancedSearchParams>(initialParams || {});
  const [totalResults, setTotalResults] = useState(0);

  const search = useCallback(async (searchParams: AdvancedSearchParams) => {
    try {
      setLoading(true);
      setError(null);
      setParams(searchParams);

      const results = await advancedProjectSearch(searchParams);
      setProjects(results);
      setTotalResults(results.length);

      // Save to history if there's a query or filters
      if (searchParams.query || searchParams.categories?.length || searchParams.states?.length) {
        saveSearchToHistory(
          {
            query: searchParams.query || '',
            categories: searchParams.categories || [],
            states: searchParams.states || [],
            cities: searchParams.cities || [],
          },
          results.length
        );
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setProjects([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search for text query
  useEffect(() => {
    if (!params.query && !params.categories?.length && !params.states?.length) {
      return;
    }

    const timeoutId = setTimeout(() => {
      search(params);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [params, search]);

  const updateParams = useCallback((newParams: Partial<AdvancedSearchParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const clearFilters = useCallback(() => {
    setParams({});
    setProjects([]);
    setTotalResults(0);
  }, []);

  return {
    projects,
    loading,
    error,
    params,
    totalResults,
    search,
    updateParams,
    clearFilters,
  };
}



