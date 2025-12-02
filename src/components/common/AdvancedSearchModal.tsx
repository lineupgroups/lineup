import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import SearchAutocomplete from './SearchAutocomplete';
import FilterSidebar from './FilterSidebar';
import { SearchFilters } from '../../types/search';
import { useNavigate } from 'react-router-dom';

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilters?: Partial<SearchFilters>;
}

export default function AdvancedSearchModal({ isOpen, onClose, initialFilters }: AdvancedSearchModalProps) {
  const navigate = useNavigate();
  const [filters, setFilters] = React.useState<Partial<SearchFilters>>(initialFilters || {});

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSearch = (query: string) => {
    // Navigate to search results page with filters
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.categories?.length) params.set('categories', filters.categories.join(','));
    if (filters.states?.length) params.set('states', filters.states.join(','));
    if (filters.cities?.length) params.set('cities', filters.cities.join(','));
    if (filters.sortBy) params.set('sort', filters.sortBy);
    if (filters.nearMe?.enabled) params.set('nearMe', 'true');

    navigate(`/search?${params.toString()}`);
    onClose();
  };

  const handleFiltersChange = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearAll = () => {
    setFilters({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center p-4 md:p-8">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl my-8">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Search Projects</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <SearchAutocomplete
                onSearch={handleSearch}
                onClose={onClose}
                placeholder="Search for projects..."
                autoFocus
              />
            </div>

            {/* Filters */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <FilterSidebar
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onClearAll={handleClearAll}
                />
              </div>

              <div className="md:col-span-2">
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-600 mb-4">
                    Type your search query and apply filters to find projects
                  </p>
                  <button
                    onClick={() => {
                      if (filters.query || filters.categories?.length || filters.states?.length) {
                        handleSearch(filters.query || '');
                      }
                    }}
                    className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Use <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Ctrl</kbd> + <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">K</kbd> to open search anytime
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}





