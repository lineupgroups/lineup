import React from 'react';
import { X } from 'lucide-react';
import { SearchFilters } from '../../types/search';
import { PROJECT_CATEGORIES } from '../../config/categories';

interface ActiveFiltersProps {
  filters: Partial<SearchFilters>;
  onRemoveFilter: (filterType: string, value?: string) => void;
  onClearAll: () => void;
  className?: string;
}

export default function ActiveFilters({ filters, onRemoveFilter, onClearAll, className = '' }: ActiveFiltersProps) {
  const activeFilters: Array<{ type: string; label: string; value?: string }> = [];

  // Add category filters
  if (filters.categories && filters.categories.length > 0) {
    filters.categories.forEach(cat => {
      const category = PROJECT_CATEGORIES.find(c => c.value === cat);
      activeFilters.push({
        type: 'category',
        label: category?.label || cat,
        value: cat,
      });
    });
  }

  // Add state filters
  if (filters.states && filters.states.length > 0) {
    filters.states.forEach(state => {
      activeFilters.push({
        type: 'state',
        label: state,
        value: state,
      });
    });
  }

  // Add city filters
  if (filters.cities && filters.cities.length > 0) {
    filters.cities.forEach(city => {
      activeFilters.push({
        type: 'city',
        label: city,
        value: city,
      });
    });
  }

  // Add funding range filter
  if (filters.fundingRange && (filters.fundingRange.min > 10000 || filters.fundingRange.max < 10000000)) {
    const formatAmount = (amount: number) => {
      if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
      if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
      if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
      return `₹${amount}`;
    };
    
    activeFilters.push({
      type: 'funding',
      label: `${formatAmount(filters.fundingRange.min)} - ${formatAmount(filters.fundingRange.max)}`,
    });
  }

  // Add time remaining filter
  if (filters.timeRemaining && (filters.timeRemaining.min > 0 || filters.timeRemaining.max < 365)) {
    const { min, max } = filters.timeRemaining;
    let label = '';
    if (max <= 7) label = '< 7 days';
    else if (min >= 30) label = '> 30 days';
    else if (min >= 7 && max <= 30) label = '7-30 days';
    else label = `${min}-${max} days`;
    
    activeFilters.push({
      type: 'time',
      label,
    });
  }

  // Add Near Me filter
  if (filters.nearMe?.enabled) {
    activeFilters.push({
      type: 'nearMe',
      label: 'Near Me',
    });
  }

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600 font-medium">
        Active Filters ({activeFilters.length}):
      </span>
      
      {activeFilters.map((filter, index) => (
        <button
          key={`${filter.type}-${filter.value || index}`}
          onClick={() => onRemoveFilter(filter.type, filter.value)}
          className="inline-flex items-center space-x-1 px-3 py-1 bg-orange-100 text-orange-900 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors"
        >
          <span>{filter.label}</span>
          <X className="w-3 h-3" />
        </button>
      ))}
      
      {activeFilters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}





