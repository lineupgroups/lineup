import { SearchHistory, SearchFilters } from '../types/search';

const STORAGE_KEY = 'lineup_search_history';
const MAX_HISTORY_ITEMS = 20;

// Save search to history
export function saveSearchToHistory(
  filters: Partial<SearchFilters>,
  resultCount: number
): void {
  try {
    const history = getSearchHistory();
    
    const newEntry: SearchHistory = {
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      query: filters.query || '',
      filters,
      timestamp: new Date(),
      resultCount,
    };

    // Add to beginning of array
    history.unshift(newEntry);

    // Keep only last MAX_HISTORY_ITEMS
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Error saving search history:', error);
  }
}

// Get search history
export function getSearchHistory(): SearchHistory[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored);
    
    // Convert timestamp strings back to Date objects
    return history.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }));
  } catch (error) {
    console.error('Error getting search history:', error);
    return [];
  }
}

// Remove a specific search from history
export function removeSearchFromHistory(id: string): void {
  try {
    const history = getSearchHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing search from history:', error);
  }
}

// Clear all search history
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
}

// Get recent search queries (just the text)
export function getRecentSearchQueries(limit: number = 5): string[] {
  const history = getSearchHistory();
  return history
    .filter(item => item.query.trim())
    .map(item => item.query)
    .slice(0, limit);
}



