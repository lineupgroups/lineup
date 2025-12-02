import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import { FirestoreProject } from '../types/firestore';
import { AdvancedSearchParams, SearchSuggestion } from '../types/search';

const PROJECTS_COLLECTION = 'projects';

// Advanced project search with multiple filters
export async function advancedProjectSearch(
  params: AdvancedSearchParams
): Promise<FirestoreProject[]> {
  try {
    const constraints: QueryConstraint[] = [
      where('status', '==', 'active'),
      where('approvalStatus', '==', 'approved'),
    ];

    // Add category filter if provided
    if (params.categories && params.categories.length > 0) {
      // Firestore 'in' operator supports up to 10 values
      if (params.categories.length <= 10) {
        constraints.push(where('category', 'in', params.categories));
      }
    }

    // Add limit
    const limitCount = params.limit || 50;
    constraints.push(firestoreLimit(limitCount));

    // Create query
    const projectsQuery = query(collection(db, PROJECTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(projectsQuery);

    let projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as FirestoreProject[];

    // Client-side filtering for complex criteria
    projects = applyClientSideFilters(projects, params);

    // Apply sorting
    projects = applySorting(projects, params.sortBy || 'trending');

    return projects;
  } catch (error) {
    console.error('Error in advanced search:', error);
    throw error;
  }
}

// Client-side filtering for criteria that can't be done in Firestore
function applyClientSideFilters(
  projects: FirestoreProject[],
  params: AdvancedSearchParams
): FirestoreProject[] {
  let filtered = [...projects];

  // Text search
  if (params.query && params.query.trim()) {
    const searchTerm = params.query.toLowerCase().trim();
    filtered = filtered.filter(project =>
      project.title.toLowerCase().includes(searchTerm) ||
      project.tagline.toLowerCase().includes(searchTerm) ||
      project.description.toLowerCase().includes(searchTerm)
    );
  }

  // Location filters
  if (params.states && params.states.length > 0) {
    filtered = filtered.filter(project => {
      const projectState = typeof project.location === 'string'
        ? project.location
        : project.location?.state || '';
      return params.states!.some(state =>
        projectState.toLowerCase().includes(state.toLowerCase())
      );
    });
  }

  if (params.cities && params.cities.length > 0) {
    filtered = filtered.filter(project => {
      const projectCity = typeof project.location === 'string'
        ? project.location
        : project.location?.city || '';
      return params.cities!.some(city =>
        projectCity.toLowerCase().includes(city.toLowerCase())
      );
    });
  }

  // Near me filter
  if (params.nearMe?.enabled && params.nearMe.userState) {
    filtered = filtered.filter(project => {
      const projectState = typeof project.location === 'string'
        ? project.location
        : project.location?.state || '';
      
      // First priority: same city
      if (params.nearMe?.userCity) {
        const projectCity = typeof project.location === 'string'
          ? project.location
          : project.location?.city || '';
        if (projectCity.toLowerCase().includes(params.nearMe.userCity.toLowerCase())) {
          return true;
        }
      }
      
      // Second priority: same state
      return projectState.toLowerCase().includes(params.nearMe.userState.toLowerCase());
    });
  }

  // Funding range
  if (params.fundingMin !== undefined || params.fundingMax !== undefined) {
    const min = params.fundingMin || 0;
    const max = params.fundingMax || Infinity;
    filtered = filtered.filter(project => project.goal >= min && project.goal <= max);
  }

  // Days left range
  if (params.daysLeftMin !== undefined || params.daysLeftMax !== undefined) {
    const min = params.daysLeftMin || 0;
    const max = params.daysLeftMax || Infinity;
    filtered = filtered.filter(project => project.daysLeft >= min && project.daysLeft <= max);
  }

  // Progress range
  if (params.progressMin !== undefined || params.progressMax !== undefined) {
    const min = params.progressMin || 0;
    const max = params.progressMax || 100;
    filtered = filtered.filter(project => {
      const progress = project.goal > 0 ? (project.raised / project.goal) * 100 : 0;
      return progress >= min && progress <= max;
    });
  }

  // Creator type filter (if you have creator verification data)
  // This would require additional user data lookup - simplified for now
  // if (params.creatorType && params.creatorType !== 'all') {
  //   // Implementation depends on your user verification system
  // }

  // If categories were more than 10, filter client-side
  if (params.categories && params.categories.length > 10) {
    filtered = filtered.filter(project =>
      params.categories!.includes(project.category)
    );
  }

  return filtered;
}

// Apply sorting to results
function applySorting(
  projects: FirestoreProject[],
  sortBy: string
): FirestoreProject[] {
  const sorted = [...projects];

  switch (sortBy) {
    case 'trending':
      return sorted.sort((a, b) => {
        const aScore = (a.likeCount || 0) + (a.supporters * 2) + (a.viewCount || 0) / 10;
        const bScore = (b.likeCount || 0) + (b.supporters * 2) + (b.viewCount || 0) / 10;
        return bScore - aScore;
      });

    case 'newest':
      return sorted.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

    case 'ending-soon':
      return sorted.sort((a, b) => a.daysLeft - b.daysLeft);

    case 'most-funded':
      return sorted.sort((a, b) => {
        const aProgress = a.goal > 0 ? (a.raised / a.goal) * 100 : 0;
        const bProgress = b.goal > 0 ? (b.raised / b.goal) * 100 : 0;
        return bProgress - aProgress;
      });

    case 'least-funded':
      return sorted.sort((a, b) => {
        const aProgress = a.goal > 0 ? (a.raised / a.goal) * 100 : 0;
        const bProgress = b.goal > 0 ? (b.raised / b.goal) * 100 : 0;
        return aProgress - bProgress;
      });

    default:
      return sorted;
  }
}

// Search projects by location
export async function searchProjectsByLocation(
  state?: string,
  city?: string,
  limitCount: number = 50
): Promise<FirestoreProject[]> {
  try {
    const constraints: QueryConstraint[] = [
      where('status', '==', 'active'),
      where('approvalStatus', '==', 'approved'),
      firestoreLimit(limitCount),
    ];

    const projectsQuery = query(collection(db, PROJECTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(projectsQuery);

    let projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as FirestoreProject[];

    // Filter by location client-side
    if (state) {
      projects = projects.filter(project => {
        const projectState = typeof project.location === 'string'
          ? project.location
          : project.location?.state || '';
        return projectState.toLowerCase().includes(state.toLowerCase());
      });
    }

    if (city) {
      projects = projects.filter(project => {
        const projectCity = typeof project.location === 'string'
          ? project.location
          : project.location?.city || '';
        return projectCity.toLowerCase().includes(city.toLowerCase());
      });
    }

    return projects;
  } catch (error) {
    console.error('Error searching by location:', error);
    throw error;
  }
}

// Get nearby projects (same city/state as user)
export async function getNearbyProjects(
  userState: string,
  userCity?: string,
  limitCount: number = 20
): Promise<FirestoreProject[]> {
  try {
    const constraints: QueryConstraint[] = [
      where('status', '==', 'active'),
      where('approvalStatus', '==', 'approved'),
      firestoreLimit(100), // Get more to filter client-side
    ];

    const projectsQuery = query(collection(db, PROJECTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(projectsQuery);

    let projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as FirestoreProject[];

    // Prioritize same city, then same state
    const sameCity: FirestoreProject[] = [];
    const sameState: FirestoreProject[] = [];

    projects.forEach(project => {
      const projectState = typeof project.location === 'string'
        ? project.location
        : project.location?.state || '';
      const projectCity = typeof project.location === 'string'
        ? project.location
        : project.location?.city || '';

      if (userCity && projectCity.toLowerCase().includes(userCity.toLowerCase())) {
        sameCity.push(project);
      } else if (projectState.toLowerCase().includes(userState.toLowerCase())) {
        sameState.push(project);
      }
    });

    // Combine and limit
    const nearby = [...sameCity, ...sameState].slice(0, limitCount);
    return nearby;
  } catch (error) {
    console.error('Error getting nearby projects:', error);
    throw error;
  }
}

// Get search suggestions for autocomplete
export async function getSearchSuggestions(
  searchQuery: string,
  limitCount: number = 5
): Promise<SearchSuggestion[]> {
  if (!searchQuery.trim()) return [];

  try {
    const constraints: QueryConstraint[] = [
      where('status', '==', 'active'),
      where('approvalStatus', '==', 'approved'),
      firestoreLimit(20),
    ];

    const projectsQuery = query(collection(db, PROJECTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(projectsQuery);

    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as FirestoreProject[];

    const searchTerm = searchQuery.toLowerCase();
    const suggestions: SearchSuggestion[] = [];

    // Find matching projects
    projects.forEach(project => {
      if (
        project.title.toLowerCase().includes(searchTerm) ||
        project.tagline.toLowerCase().includes(searchTerm)
      ) {
        suggestions.push({
          type: 'project',
          text: project.title,
          subtext: project.tagline,
          id: project.id,
        });
      }
    });

    // Limit and return
    return suggestions.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
}

// Get trending searches (mock for now - would track in analytics)
export function getTrendingSearches(): string[] {
  return [
    'education',
    'solar energy',
    'clean water',
    'technology',
    'healthcare',
    'women empowerment',
  ];
}



