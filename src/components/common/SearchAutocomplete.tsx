import React, { useState, useRef, useEffect } from 'react';
import { Search, Clock, TrendingUp, X, Loader } from 'lucide-react';
import { useSearchSuggestions } from '../../hooks/useSearchSuggestions';
import { useNavigate } from 'react-router-dom';

interface SearchAutocompleteProps {
  onSearch: (query: string) => void;
  onClose?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export default function SearchAutocomplete({
  onSearch,
  onClose,
  placeholder = 'Search projects...',
  autoFocus = false,
  className = '',
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { suggestions, recentSearches, trendingSearches, loading } = useSearchSuggestions(query);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (text: string, projectId?: string) => {
    if (projectId) {
      // Navigate to project detail
      navigate(`/project/${projectId}`);
      onClose?.();
    } else {
      // Use as search query
      setQuery(text);
      onSearch(text);
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    const allSuggestions = [...suggestions, ...recentSearches.map(s => ({ type: 'recent' as const, text: s }))];

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < allSuggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const selected = allSuggestions[selectedIndex];
      if ('id' in selected && selected.id) {
        navigate(`/project/${selected.id}`);
        onClose?.();
      } else {
        setQuery(selected.text);
        onSearch(selected.text);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      onClose?.();
    }
  };

  const showSuggestionsPanel = showSuggestions && (
    suggestions.length > 0 ||
    recentSearches.length > 0 ||
    trendingSearches.length > 0
  );

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          {loading && (
            <Loader className="absolute right-10 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
          )}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestionsPanel && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setShowSuggestions(false)}
          />
          
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {/* Project Suggestions */}
            {suggestions.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Projects
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id || index}
                    onClick={() => handleSuggestionClick(suggestion.text, suggestion.id)}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                      selectedIndex === index ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{suggestion.text}</div>
                    {suggestion.subtext && (
                      <div className="text-xs text-gray-500 truncate">{suggestion.subtext}</div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && query.length === 0 && (
              <div className="py-2 border-t border-gray-100">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Recent</span>
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 ${
                      selectedIndex === suggestions.length + index ? 'bg-gray-50' : ''
                    }`}
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Trending Searches */}
            {trendingSearches.length > 0 && query.length === 0 && (
              <div className="py-2 border-t border-gray-100">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Trending</span>
                </div>
                {trendingSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-700">{search}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}





