import { useState, useEffect } from 'react';
import { SearchSuggestion } from '../types/search';
import { getSearchSuggestions, getTrendingSearches } from '../lib/search';
import { getRecentSearchQueries } from '../lib/searchHistory';

export function useSearchSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load recent and trending searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearchQueries(5));
    setTrendingSearches(getTrendingSearches());
  }, []);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const results = await getSearchSuggestions(query, 5);
        setSuggestions(results);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return {
    suggestions,
    recentSearches,
    trendingSearches,
    loading,
  };
}




