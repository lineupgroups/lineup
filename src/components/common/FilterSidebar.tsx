import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X, MapPin } from 'lucide-react';
import { SearchFilters, FUNDING_RANGE_PRESETS, TIME_REMAINING_PRESETS } from '../../types/search';
import { PROJECT_CATEGORIES } from '../../config/categories';
import { INDIAN_STATES } from '../../data/locations';

interface FilterSidebarProps {
  filters: Partial<SearchFilters>;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onClearAll: () => void;
  className?: string;
}

export default function FilterSidebar({ filters, onFiltersChange, onClearAll, className = '' }: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    location: true,
    funding: true,
    time: true,
    progress: false,
    creatorType: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCategoryToggle = (categoryValue: string) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(categoryValue)
      ? currentCategories.filter(c => c !== categoryValue)
      : [...currentCategories, categoryValue];
    
    onFiltersChange({ categories: newCategories });
  };

  const handleStateToggle = (state: string) => {
    const currentStates = filters.states || [];
    const newStates = currentStates.includes(state)
      ? currentStates.filter(s => s !== state)
      : [...currentStates, state];
    
    onFiltersChange({ states: newStates, cities: [] }); // Clear cities when states change
  };

  const handleCitySelect = (city: string) => {
    const currentCities = filters.cities || [];
    const newCities = currentCities.includes(city)
      ? currentCities.filter(c => c !== city)
      : [...currentCities, city];
    
    onFiltersChange({ cities: newCities });
  };

  const handleFundingRangeChange = (min: number, max: number) => {
    onFiltersChange({
      fundingRange: { min, max },
    });
  };

  const handleTimeRemainingChange = (min: number, max: number) => {
    onFiltersChange({
      timeRemaining: { min, max },
    });
  };

  const handleNearMeToggle = () => {
    onFiltersChange({
      nearMe: {
        enabled: !filters.nearMe?.enabled,
        userState: filters.nearMe?.userState,
        userCity: filters.nearMe?.userCity,
      },
    });
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount}`;
  };

  const activeFilterCount = 
    (filters.categories?.length || 0) +
    (filters.states?.length || 0) +
    (filters.cities?.length || 0) +
    (filters.nearMe?.enabled ? 1 : 0);

  // Get cities for selected states
  const availableCities = filters.states?.length
    ? INDIAN_STATES
        .filter(state => filters.states!.includes(state.name))
        .flatMap(state => state.cities)
        .sort()
    : [];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {activeFilterCount > 0 && (
          <button
            onClick={onClearAll}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        {/* Categories */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('categories')}
            className="w-full p-4 flex justify-between items-center hover:bg-gray-50"
          >
            <span className="font-medium text-gray-900">📂 Categories</span>
            {expandedSections.categories ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {expandedSections.categories && (
            <div className="px-4 pb-4 space-y-2">
              {PROJECT_CATEGORIES.map(category => (
                <label
                  key={category.value}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filters.categories?.includes(category.value) || false}
                    onChange={() => handleCategoryToggle(category.value)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">
                    {category.icon} {category.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Location */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('location')}
            className="w-full p-4 flex justify-between items-center hover:bg-gray-50"
          >
            <span className="font-medium text-gray-900">📍 Location</span>
            {expandedSections.location ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {expandedSections.location && (
            <div className="px-4 pb-4 space-y-3">
              {/* Near Me Toggle */}
              <label className="flex items-center space-x-2 p-2 bg-orange-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.nearMe?.enabled || false}
                  onChange={handleNearMeToggle}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <MapPin className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Near Me</span>
              </label>

              {/* State Selection */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">States</label>
                <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded p-2">
                  {INDIAN_STATES.map(state => (
                    <label
                      key={state.name}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={filters.states?.includes(state.name) || false}
                        onChange={() => handleStateToggle(state.name)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-gray-700">{state.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* City Selection (only if states selected) */}
              {availableCities.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Cities</label>
                  <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded p-2">
                    {availableCities.map(city => (
                      <label
                        key={city}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={filters.cities?.includes(city) || false}
                          onChange={() => handleCitySelect(city)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-gray-700">{city}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Funding Range */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('funding')}
            className="w-full p-4 flex justify-between items-center hover:bg-gray-50"
          >
            <span className="font-medium text-gray-900">💰 Funding Goal</span>
            {expandedSections.funding ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {expandedSections.funding && (
            <div className="px-4 pb-4 space-y-2">
              {FUNDING_RANGE_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => handleFundingRangeChange(preset.min, preset.max)}
                  className={`w-full text-left px-3 py-2 rounded text-sm ${
                    filters.fundingRange?.min === preset.min && filters.fundingRange?.max === preset.max
                      ? 'bg-orange-100 text-orange-900 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              {filters.fundingRange && (
                <div className="text-xs text-gray-600 mt-2 pt-2 border-t">
                  Range: {formatCurrency(filters.fundingRange.min)} - {formatCurrency(filters.fundingRange.max)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Time Remaining */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('time')}
            className="w-full p-4 flex justify-between items-center hover:bg-gray-50"
          >
            <span className="font-medium text-gray-900">⏰ Time Remaining</span>
            {expandedSections.time ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {expandedSections.time && (
            <div className="px-4 pb-4 space-y-2">
              {TIME_REMAINING_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => handleTimeRemainingChange(preset.min, preset.max)}
                  className={`w-full text-left px-3 py-2 rounded text-sm ${
                    filters.timeRemaining?.min === preset.min && filters.timeRemaining?.max === preset.max
                      ? 'bg-orange-100 text-orange-900 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort By */}
        <div className="p-4">
          <label className="text-sm font-medium text-gray-900 mb-2 block">Sort By</label>
          <select
            value={filters.sortBy || 'trending'}
            onChange={(e) => onFiltersChange({ sortBy: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
          >
            <option value="trending">Trending</option>
            <option value="newest">Newest First</option>
            <option value="ending-soon">Ending Soon</option>
            <option value="most-funded">Most Funded</option>
            <option value="least-funded">Need Support</option>
          </select>
        </div>
      </div>
    </div>
  );
}





