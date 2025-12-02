import { FirestoreProject } from './firestore';

// Advanced search parameters
export interface AdvancedSearchParams {
  query?: string;
  categories?: string[];
  states?: string[];
  cities?: string[];
  fundingMin?: number;
  fundingMax?: number;
  daysLeftMin?: number;
  daysLeftMax?: number;
  progressMin?: number;
  progressMax?: number;
  creatorType?: 'verified' | 'first-time' | 'serial' | 'all';
  sortBy?: 'trending' | 'newest' | 'ending-soon' | 'most-funded' | 'least-funded';
  limit?: number;
  nearMe?: {
    enabled: boolean;
    userState?: string;
    userCity?: string;
  };
}

// Search filters for state management
export interface SearchFilters {
  query: string;
  categories: string[];
  states: string[];
  cities: string[];
  fundingRange: {
    min: number;
    max: number;
  };
  timeRemaining: {
    min: number;
    max: number;
  };
  progressRange: {
    min: number;
    max: number;
  };
  creatorType: 'verified' | 'first-time' | 'serial' | 'all';
  sortBy: 'trending' | 'newest' | 'ending-soon' | 'most-funded' | 'least-funded';
  nearMe: {
    enabled: boolean;
    userState?: string;
    userCity?: string;
  };
}

// Search history
export interface SearchHistory {
  id: string;
  query: string;
  filters: Partial<SearchFilters>;
  timestamp: Date;
  resultCount: number;
}

// Search suggestions
export interface SearchSuggestion {
  type: 'project' | 'category' | 'location';
  text: string;
  subtext?: string;
  id?: string;
}

// Saved search
export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: SearchFilters;
  createdAt: Date;
  lastUsed?: Date;
}

// Search results with metadata
export interface SearchResults {
  projects: FirestoreProject[];
  totalCount: number;
  appliedFilters: Partial<SearchFilters>;
  hasMore: boolean;
}

// Default filter values
export const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  categories: [],
  states: [],
  cities: [],
  fundingRange: {
    min: 10000,
    max: 10000000,
  },
  timeRemaining: {
    min: 0,
    max: 365,
  },
  progressRange: {
    min: 0,
    max: 100,
  },
  creatorType: 'all',
  sortBy: 'trending',
  nearMe: {
    enabled: false,
  },
};

// Funding range presets
export const FUNDING_RANGE_PRESETS = [
  { label: '< ₹50K', min: 0, max: 50000 },
  { label: '₹50K - ₹1L', min: 50000, max: 100000 },
  { label: '₹1L - ₹5L', min: 100000, max: 500000 },
  { label: '₹5L - ₹10L', min: 500000, max: 1000000 },
  { label: '> ₹10L', min: 1000000, max: 10000000 },
];

// Time remaining presets
export const TIME_REMAINING_PRESETS = [
  { label: '< 7 days', min: 0, max: 7 },
  { label: '7-30 days', min: 7, max: 30 },
  { label: '> 30 days', min: 30, max: 365 },
];



