import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Filter, X } from 'lucide-react';
import { useAdvancedSearch } from '../../hooks/useAdvancedSearch';
import { SearchFilters } from '../../types/search';
import SearchAutocomplete from '../common/SearchAutocomplete';
import FilterSidebar from '../common/FilterSidebar';
import ActiveFilters from '../common/ActiveFilters';
import { FirestoreProject } from '../../types/firestore';

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Parse filters from URL
  const parseFiltersFromURL = (): Partial<SearchFilters> => {
    const filters: Partial<SearchFilters> = {};

    const query = searchParams.get('q');
    if (query) filters.query = query;

    const categories = searchParams.get('categories');
    if (categories) filters.categories = categories.split(',');

    const states = searchParams.get('states');
    if (states) filters.states = states.split(',');

    const cities = searchParams.get('cities');
    if (cities) filters.cities = cities.split(',');

    const sort = searchParams.get('sort');
    if (sort) filters.sortBy = sort as any;

    const nearMe = searchParams.get('nearMe');
    if (nearMe === 'true') filters.nearMe = { enabled: true };

    return filters;
  };

  const initialFilters = parseFiltersFromURL();
  const { projects, loading, error, params, totalResults, updateParams, clearFilters } = useAdvancedSearch({
    ...initialFilters,
    limit: 50,
  });

  // Update URL when filters change
  const updateURL = (newFilters: Partial<SearchFilters>) => {
    const params = new URLSearchParams();

    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.categories?.length) params.set('categories', newFilters.categories.join(','));
    if (newFilters.states?.length) params.set('states', newFilters.states.join(','));
    if (newFilters.cities?.length) params.set('cities', newFilters.cities.join(','));
    if (newFilters.sortBy) params.set('sort', newFilters.sortBy);
    if (newFilters.nearMe?.enabled) params.set('nearMe', 'true');

    setSearchParams(params);
  };

  const handleFiltersChange = (newFilters: Partial<SearchFilters>) => {
    const updated = { ...params, ...newFilters };
    updateParams(newFilters);
    updateURL(updated);
  };

  const handleSearch = (query: string) => {
    const updated = { ...params, query };
    updateParams({ query });
    updateURL(updated);
  };

  const handleRemoveFilter = (filterType: string, value?: string) => {
    const updated = { ...params };

    switch (filterType) {
      case 'category':
        updated.categories = params.categories?.filter(c => c !== value);
        break;
      case 'state':
        updated.states = params.states?.filter(s => s !== value);
        break;
      case 'city':
        updated.cities = params.cities?.filter(c => c !== value);
        break;
      case 'funding':
        delete updated.fundingRange;
        break;
      case 'time':
        delete updated.timeRemaining;
        break;
      case 'nearMe':
        updated.nearMe = { enabled: false };
        break;
    }

    updateParams(updated);
    updateURL(updated);
  };

  const handleClearAll = () => {
    clearFilters();
    setSearchParams({});
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressPercentage = (project: FirestoreProject) => {
    return project.goal > 0 ? Math.min((project.raised / project.goal) * 100, 100) : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Projects</h1>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <SearchAutocomplete
              onSearch={handleSearch}
              placeholder="Search for projects..."
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Filters */}
        {(params.categories?.length || params.states?.length || params.cities?.length) && (
          <div className="mb-6">
            <ActiveFilters
              filters={params}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleClearAll}
            />
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Desktop */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0">
            <div className="sticky top-4">
              <FilterSidebar
                filters={params}
                onFiltersChange={handleFiltersChange}
                onClearAll={handleClearAll}
              />
            </div>
          </div>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden fixed bottom-4 right-4 z-30 flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-full shadow-lg hover:bg-orange-700"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
            {(params.categories?.length || 0) + (params.states?.length || 0) > 0 && (
              <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold">
                {(params.categories?.length || 0) + (params.states?.length || 0)}
              </span>
            )}
          </button>

          {/* Mobile Filter Drawer */}
          {showMobileFilters && (
            <div className="lg:hidden fixed inset-0 z-40">
              <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={() => setShowMobileFilters(false)}
              />
              <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl overflow-y-auto">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <FilterSidebar
                  filters={params}
                  onFiltersChange={handleFiltersChange}
                  onClearAll={handleClearAll}
                />
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {loading ? 'Searching...' : `${totalResults} projects found`}
              </h2>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                    <div className="h-48 bg-gray-200 rounded mb-4" />
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && projects.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No projects found matching your search criteria.</p>
                <button
                  onClick={handleClearAll}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Results Grid */}
            {!loading && projects.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map(project => (
                  <div
                    key={project.id}
                    onClick={() => handleProjectClick(project.id)}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="relative h-48">
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                      {project.daysLeft <= 7 && (
                        <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                          Ending Soon
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {project.tagline}
                      </p>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full transition-all"
                            style={{ width: `${getProgressPercentage(project)}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <div className="font-semibold text-gray-900">{formatCurrency(project.raised)}</div>
                          <div className="text-gray-500">raised of {formatCurrency(project.goal)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">{project.daysLeft}</div>
                          <div className="text-gray-500">days left</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}





