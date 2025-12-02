# 🔍 Advanced Search & Filters Implementation Plan

## Overview
This document outlines the implementation plan for:
1. **Advanced Search** - Autocomplete, search history, filters
2. **Location-Based Discovery** - State/city filtering, "Near Me", map view
3. **Advanced Filters** - Funding range, time remaining, progress %, multiple sorts

---

## 📊 Current State Analysis

### What Exists:
- ✅ Basic search in `src/lib/firestore.ts` (`searchProjects` function)
- ✅ Basic category filter on Homepage/SmartHomepage
- ✅ Search implementation in `src/hooks/useProjects.ts` (`useProjectSearch`)
- ✅ Location data (state/city) in project creation
- ✅ Sort by trending/newest on homepage

### What's Missing:
- ❌ Autocomplete/suggestions
- ❌ Advanced filters UI
- ❌ Location-based filtering
- ❌ Search history
- ❌ Funding range filters
- ❌ Multiple filter combinations
- ❌ Filter persistence in URL
- ❌ "Near me" functionality

---

## 🎯 Implementation Strategy

### Where to Implement:

#### 1. **Primary Location: Enhanced Homepage/Discover Page**
**File**: `src/components/SmartHomepage.tsx` (main discover page)
- Add advanced search bar with autocomplete
- Add filter sidebar/panel
- Add location-based filters
- Keep existing personalization features

#### 2. **New Component: Advanced Search Modal**
**File**: `src/components/common/AdvancedSearchModal.tsx` (NEW)
- Full-screen search experience
- Triggered from navbar search button
- All filters in one place
- Search suggestions and history

#### 3. **New Component: Filter Sidebar**
**File**: `src/components/common/FilterSidebar.tsx` (NEW)
- Category filters (enhanced)
- Location filters (state/city)
- Funding range slider
- Time remaining filter
- Progress percentage filter
- Sort options

#### 4. **New Component: Search Results Page**
**File**: `src/components/pages/SearchResultsPage.tsx` (NEW)
- Dedicated `/search` route
- URL parameters for all filters
- Sharable search URLs
- Save search functionality

#### 5. **Backend Enhancements**
**Files to Update**:
- `src/lib/firestore.ts` - Enhanced search functions
- `src/hooks/useProjects.ts` - Advanced filter hooks
- `src/hooks/useSearch.ts` (NEW) - Search-specific hook

---

## 🏗️ Architecture Design

### 1. URL Structure (Shareable Searches)
```
/search?q=solar&category=technology&state=Tamil+Nadu&city=Chennai&funding=10000-100000&timeLeft=7-30&progress=0-50&sort=trending
```

### 2. Filter State Management
```typescript
interface SearchFilters {
  query: string;
  categories: string[];  // Multiple categories
  states: string[];      // Multiple states
  cities: string[];      // Multiple cities
  fundingRange: {
    min: number;
    max: number;
  };
  timeRemaining: {
    min: number;  // days
    max: number;
  };
  progressRange: {
    min: number;  // percentage
    max: number;
  };
  creatorType?: 'verified' | 'first-time' | 'serial' | 'all';
  sortBy: 'trending' | 'newest' | 'ending-soon' | 'most-funded' | 'least-funded';
  nearMe?: {
    enabled: boolean;
    radius: number; // km (if implementing geo-distance)
  };
}
```

### 3. Search History Storage
```typescript
interface SearchHistory {
  id: string;
  query: string;
  filters: SearchFilters;
  timestamp: Date;
  resultCount: number;
}
// Store in localStorage (max 20 recent searches)
```

---

## 📝 Detailed Implementation Steps

### PHASE 1: Backend & Search Logic (Week 1)

#### Step 1.1: Enhanced Search Function
**File**: `src/lib/search.ts` (NEW)

```typescript
// New comprehensive search function
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
  sortBy?: 'trending' | 'newest' | 'ending-soon' | 'most-funded';
  limit?: number;
}

export async function advancedProjectSearch(
  params: AdvancedSearchParams
): Promise<FirestoreProject[]> {
  // Implementation with Firestore composite queries
  // Note: May require Firestore indexes
}
```

**Key Features**:
- Full-text search across title, tagline, description
- Multiple filter combinations
- Efficient Firestore queries
- Caching for performance

#### Step 1.2: Location-Based Search
**File**: `src/lib/search.ts`

```typescript
export async function searchProjectsByLocation(
  state?: string,
  city?: string,
  limit: number = 50
): Promise<FirestoreProject[]> {
  // Search by state and/or city
}

export async function getNearbyProjects(
  userState: string,
  userCity: string,
  limit: number = 20
): Promise<FirestoreProject[]> {
  // Get projects from same city first, then state
}
```

#### Step 1.3: Search Suggestions/Autocomplete
**File**: `src/lib/search.ts`

```typescript
export async function getSearchSuggestions(
  query: string,
  limit: number = 5
): Promise<string[]> {
  // Return matching project titles, categories, locations
}

export async function getTrendingSearches(): Promise<string[]> {
  // Return popular searches (can cache this)
}
```

#### Step 1.4: Custom Hook
**File**: `src/hooks/useAdvancedSearch.ts` (NEW)

```typescript
export function useAdvancedSearch(params: AdvancedSearchParams) {
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  
  // Debounced search
  // Filter combination logic
  // Caching for performance
  
  return { projects, loading, error, totalResults };
}
```

### PHASE 2: UI Components (Week 2)

#### Step 2.1: Advanced Search Modal
**File**: `src/components/common/AdvancedSearchModal.tsx` (NEW)

**Features**:
- Full-screen overlay
- Search bar with autocomplete
- Quick filters (categories, location)
- Recent searches
- Trending searches
- Clear all filters
- Save search (optional)

**Trigger Points**:
- Navbar search button click
- Keyboard shortcut (Ctrl/Cmd + K)
- Mobile search icon

#### Step 2.2: Filter Sidebar
**File**: `src/components/common/FilterSidebar.tsx` (NEW)

**Sections**:
1. **Categories** - Checkboxes with icons
2. **Location**
   - State dropdown (multi-select)
   - City dropdown (filtered by state)
   - "Near Me" toggle
3. **Funding Range** - Slider (₹10K - ₹10Cr)
4. **Time Remaining** - Checkboxes (< 7 days, 7-30 days, > 30 days)
5. **Progress** - Slider (0-100%)
6. **Creator Type** - Radio buttons
7. **Sort By** - Dropdown

**Features**:
- Collapsible sections
- Clear individual filters
- Clear all button
- Active filter count badge
- Mobile-friendly (drawer on mobile)

#### Step 2.3: Search Results Page
**File**: `src/components/pages/SearchResultsPage.tsx` (NEW)
**Route**: `/search`

**Layout**:
```
+------------------------------------------+
| Search Bar + Active Filters              |
+------------------------------------------+
|            |                             |
|  Filter    |   Search Results Grid       |
|  Sidebar   |   (Project Cards)           |
|  (Desktop) |                             |
|            |   - X results found         |
|            |   - Sort dropdown           |
|            |   - Load more / Pagination  |
|            |                             |
+------------------------------------------+
```

**Mobile Layout**:
- Filter button opens drawer
- Filters slide from bottom
- Search bar always visible

#### Step 2.4: Autocomplete Dropdown
**File**: `src/components/common/SearchAutocomplete.tsx` (NEW)

**Features**:
- Debounced suggestions (300ms)
- Show matching projects
- Show matching locations
- Show recent searches
- Keyboard navigation (arrow keys, enter, escape)
- Clear search
- Loading state

#### Step 2.5: Location Picker Component
**File**: `src/components/common/LocationPicker.tsx` (NEW)

**Features**:
- State multi-select dropdown
- City multi-select (filtered by selected states)
- "Near Me" button (uses user's profile location)
- Clear selection
- Selected badges

### PHASE 3: Integration (Week 3)

#### Step 3.1: Update Navbar
**File**: `src/components/Navbar.tsx`

**Changes**:
- Make search button functional
- Open AdvancedSearchModal on click
- Add keyboard shortcut (Ctrl/Cmd + K)
- Show search icon with badge if filters active

#### Step 3.2: Update SmartHomepage
**File**: `src/components/SmartHomepage.tsx`

**Changes**:
- Add FilterSidebar component
- Connect to useAdvancedSearch hook
- Update URL params when filters change
- Read URL params on load
- Show active filters as removable chips
- Add "Clear all filters" button

#### Step 3.3: Add Search Results Route
**File**: `src/router/AppRouter.tsx`

```typescript
// Add new route
<Route path="/search" element={<SearchResultsPage />} />
```

#### Step 3.4: Update Project Cards
**File**: `src/components/common/ProjectCard.tsx`

**Add badges**:
- "Near You" badge (if within user's state)
- "Ending Soon" badge (< 7 days)
- "Verified Creator" badge
- Progress percentage visual

### PHASE 4: Enhanced Features (Week 4)

#### Step 4.1: Search History
**File**: `src/lib/searchHistory.ts` (NEW)

```typescript
export function saveSearchToHistory(filters: SearchFilters, resultCount: number): void;
export function getSearchHistory(): SearchHistory[];
export function clearSearchHistory(): void;
export function removeSearchFromHistory(id: string): void;
```

**Storage**: localStorage (max 20 searches)

#### Step 4.2: Saved Searches
**File**: `src/lib/savedSearches.ts` (NEW)

```typescript
export async function saveSearch(userId: string, name: string, filters: SearchFilters): Promise<void>;
export async function getSavedSearches(userId: string): Promise<SavedSearch[]>;
export async function deleteSavedSearch(searchId: string): Promise<void>;
```

**Collection**: `user-saved-searches` in Firestore

#### Step 4.3: Near Me Feature
**Implementation**:
- Use user's profile location (city/state)
- Show projects from same city first
- Then same state
- Add distance badge
- Optional: Expand to nearby states

#### Step 4.4: Map View (Optional - Advanced)
**File**: `src/components/pages/MapSearchView.tsx` (NEW)

**Features**:
- India map with project markers
- Click state to filter
- Hover to see project count
- Switch between list/map view

**Library**: React Simple Maps or Google Maps API

---

## 🎨 UI/UX Design Specifications

### Filter Sidebar (Desktop)
```
┌─────────────────────────────┐
│ FILTERS            Clear All│
├─────────────────────────────┤
│ 📂 Categories         [v]   │
│ ☑ Technology               │
│ ☐ Education                │
│ ☑ Social Impact            │
│ + 8 more                   │
├─────────────────────────────┤
│ 📍 Location          [v]   │
│ State: [Tamil Nadu    v]   │
│ City:  [Chennai       v]   │
│ ☐ Near Me                  │
├─────────────────────────────┤
│ 💰 Funding Goal      [v]   │
│ ₹10K ─────●──── ₹10Cr      │
│ ₹50,000 - ₹5,00,000        │
├─────────────────────────────┤
│ ⏰ Time Remaining    [v]   │
│ ☐ < 7 days (Urgent)        │
│ ☑ 7-30 days                │
│ ☐ > 30 days                │
├─────────────────────────────┤
│ 📊 Progress          [v]   │
│ 0% ──●────────── 100%      │
│ 0% - 50%                   │
├─────────────────────────────┤
│ ✓ Creator Type       [v]   │
│ ⦿ All Creators             │
│ ○ Verified Only            │
│ ○ First-time Creators      │
└─────────────────────────────┘
```

### Search Bar with Autocomplete
```
┌────────────────────────────────────────┐
│ 🔍 Search projects...            [X]   │
└────────────────────────────────────────┘
┌────────────────────────────────────────┐
│ 📱 Solar Panel Project - Chennai       │
│ 🌍 Clean Water Initiative - Mumbai     │
│ 📚 Education for All - Delhi           │
├────────────────────────────────────────┤
│ 🔥 Trending: "education", "solar"      │
│ 🕒 Recent: "tech startup", "ngo"       │
└────────────────────────────────────────┘
```

### Active Filters Display
```
Active Filters (3):
[Technology ×] [Tamil Nadu ×] [₹50K-₹5L ×] [Clear all]
```

---

## 🔧 Technical Implementation Details

### Firestore Indexes Required

```
Collection: projects
Composite Indexes:
1. status (asc) + approvalStatus (asc) + category (asc) + createdAt (desc)
2. status (asc) + approvalStatus (asc) + location.state (asc) + createdAt (desc)
3. status (asc) + approvalStatus (asc) + location.city (asc) + createdAt (desc)
4. status (asc) + approvalStatus (asc) + goal (asc) + createdAt (desc)
5. status (asc) + approvalStatus (asc) + daysLeft (asc) + createdAt (desc)
```

**Note**: Firebase will prompt you to create these automatically when queries fail.

### Query Optimization

**Challenge**: Firestore limitations
- Can't do full-text search natively
- Range queries on multiple fields limited
- Composite index required for complex queries

**Solutions**:
1. **Client-side filtering** for some filters (progress %, funding range after initial query)
2. **Algolia** for advanced search (optional, paid)
3. **Query batching** - Multiple queries combined client-side
4. **Caching** - Cache results for 5 minutes

### Performance Considerations

1. **Debouncing**: 300ms for search input
2. **Pagination**: Load 20 projects at a time
3. **Lazy Loading**: Load filters only when sidebar opens
4. **Memoization**: Cache filter computations
5. **Virtual Scrolling**: For large result sets (react-window)

---

## 📁 File Structure

### New Files to Create:
```
src/
├── components/
│   ├── common/
│   │   ├── AdvancedSearchModal.tsx         (NEW)
│   │   ├── FilterSidebar.tsx               (NEW)
│   │   ├── SearchAutocomplete.tsx          (NEW)
│   │   ├── LocationPicker.tsx              (NEW)
│   │   ├── FundingRangeSlider.tsx          (NEW)
│   │   └── ActiveFilters.tsx               (NEW)
│   └── pages/
│       ├── SearchResultsPage.tsx           (NEW)
│       └── MapSearchView.tsx               (NEW - Optional)
├── hooks/
│   ├── useAdvancedSearch.ts                (NEW)
│   ├── useSearchSuggestions.ts             (NEW)
│   ├── useSearchHistory.ts                 (NEW)
│   └── useLocationSearch.ts                (NEW)
├── lib/
│   ├── search.ts                           (NEW)
│   ├── searchHistory.ts                    (NEW)
│   └── savedSearches.ts                    (NEW)
└── types/
    └── search.ts                           (NEW)
```

### Files to Update:
```
src/
├── components/
│   ├── Navbar.tsx                          (UPDATE)
│   ├── SmartHomepage.tsx                   (UPDATE)
│   └── common/
│       └── ProjectCard.tsx                 (UPDATE - add badges)
├── router/
│   └── AppRouter.tsx                       (UPDATE - add route)
├── lib/
│   └── firestore.ts                        (UPDATE - enhance queries)
└── hooks/
    └── useProjects.ts                      (UPDATE - add filters)
```

---

## 🧪 Testing Strategy

### Unit Tests:
- Search function with various filters
- Filter combination logic
- URL parameter parsing
- Search history storage

### Integration Tests:
- Filter sidebar interactions
- Autocomplete behavior
- Search results update
- URL sync with filters

### User Testing:
- Search flow from navbar
- Filter combinations
- Mobile filter drawer
- "Near me" functionality

---

## 📱 Mobile Considerations

### Filter Drawer (Mobile)
- Full-screen overlay
- Slide up from bottom
- "Apply Filters" button
- Show active filter count in button
- Easy to dismiss

### Search Experience
- Sticky search bar
- Bottom sheet for filters
- Touch-friendly sliders
- Larger tap targets

---

## 🚀 Implementation Timeline

### Week 1: Backend & Logic
- Day 1-2: Create search.ts with advanced search
- Day 3-4: Add location-based search functions
- Day 5: Create useAdvancedSearch hook
- Day 6-7: Add autocomplete and suggestions

### Week 2: UI Components
- Day 1-2: Build FilterSidebar component
- Day 3: Create AdvancedSearchModal
- Day 4: Build SearchAutocomplete
- Day 5: Create LocationPicker
- Day 6-7: Build SearchResultsPage

### Week 3: Integration
- Day 1-2: Update Navbar with search modal
- Day 3-4: Integrate filters into SmartHomepage
- Day 5: Add URL parameter sync
- Day 6-7: Add route and test navigation

### Week 4: Polish & Enhancement
- Day 1-2: Add search history
- Day 3-4: Implement "Near Me" feature
- Day 5: Add active filter display
- Day 6-7: Testing and bug fixes

**Total Duration**: 4 weeks (1 developer full-time)

---

## 💰 Estimated Effort

- **Development**: 120-140 hours
- **Testing**: 20 hours
- **Bug Fixes**: 10 hours
- **Total**: ~150-170 hours

**Team**: 1 Senior Frontend Developer

---

## 🎯 Success Metrics

### KPIs to Track:
1. Search usage increase (% users using search)
2. Filter usage (which filters most used)
3. Search-to-project-view conversion
4. Search success rate (% searches with results)
5. Average filters per search
6. Location-based search usage
7. "Near Me" feature usage

---

## ⚠️ Challenges & Solutions

### Challenge 1: Firestore Query Limitations
**Problem**: Can't combine multiple range queries
**Solution**: Fetch broader dataset, filter client-side for some criteria

### Challenge 2: Full-Text Search
**Problem**: Firestore doesn't support full-text search
**Solution**: Basic implementation with title/description includes, or integrate Algolia

### Challenge 3: Performance with Many Filters
**Problem**: Complex queries may be slow
**Solution**: Implement caching, pagination, lazy loading

### Challenge 4: Mobile Filter UX
**Problem**: Many filters on small screen
**Solution**: Prioritize important filters, use bottom drawer

---

## 🔄 Future Enhancements (Post-MVP)

1. **Saved Searches** - Save filter combinations
2. **Search Alerts** - Notify when new projects match filters
3. **Map View** - Visual geographic discovery
4. **AI-Powered Search** - Natural language queries
5. **Voice Search** - "Hey Lineup, find tech projects in Chennai"
6. **Image Search** - Upload image to find similar projects
7. **Advanced Analytics** - Track what users search for

---

## 📋 Approval Checklist

Before starting implementation, please confirm:

- [ ] Approve overall architecture
- [ ] Approve UI/UX design (filter sidebar, search modal)
- [ ] Confirm priority features (which to implement first)
- [ ] Approve file structure
- [ ] Confirm timeline (4 weeks acceptable?)
- [ ] Any specific requirements or changes?

---

## 🎬 Ready to Start!

Once you approve, I will:
1. Start with Phase 1 (Backend & Search Logic)
2. Create the search.ts file with advanced search functions
3. Build location-based search
4. Create custom hooks
5. Proceed through all phases systematically

**Let me know if you approve this plan or if you want any changes!**

---

**Document Version**: 1.0  
**Last Updated**: October 14, 2025  
**Status**: Awaiting Approval

