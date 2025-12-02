/**
 * Recommendation Engine
 * Generates personalized project recommendations for users
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { FirestoreProject } from '../types/firestore';
import { UserPreferences, RecommendationCache } from '../types/behavior';
import {
  getUserPreferences,
  getUserViewHistory,
  getUserInteractionHistory,
  getCategoryEngagement,
  initializeUserPreferences
} from './behaviorTracking';
import {
  calculatePersonalizedScore,
  generateRecommendationReasons,
  scoreCategoryMatch,
  scoreLocationMatch
} from './scoring';
import { extractFromProject, calculateKeywordSimilarity } from './keywords';

const PROJECTS_COLLECTION = 'projects';
const RECOMMENDATIONS_CACHE_COLLECTION = 'recommendation-cache';
const CACHE_DURATION_HOURS = 6;

// ==================== MAIN RECOMMENDATION FUNCTIONS ====================

/**
 * Get "For You" personalized recommendations
 */
export async function getForYouProjects(
  userId: string,
  limitCount = 15
): Promise<Array<FirestoreProject & { score: number; reasons: string[] }>> {
  try {
    // Get user preferences
    let preferences = await getUserPreferences(userId);

    // 🔧 FIX #1: Initialize preferences if they don't exist
    if (!preferences) {
      console.log('🔧 No preferences found, initializing for user:', userId);
      await initializeUserPreferences(userId);
      // Return fallback for this request, next time will be personalized
      return getFallbackProjects(limitCount);
    }

    // Get user history
    const [viewHistory, interactionHistory, categoryEngagement] = await Promise.all([
      getUserViewHistory(userId, 100),
      getUserInteractionHistory(userId, 50),
      getCategoryEngagement(userId)
    ]);

    // Get all approved projects
    const allProjects = await getAllActiveProjects();

    // 🔧 FIX #2: Don't filter out ALL projects - only recent views (last 50)
    // This prevents the "everything is filtered" bug after browsing for hours
    const recentViewIds = new Set(viewHistory.slice(0, 50).map(v => v.projectId));
    const supportedIds = new Set(
      interactionHistory
        .filter(i => i.type === 'support')
        .map(i => i.projectId)
    );

    // First try: Get projects not in recent views and not supported
    let candidateProjects = allProjects.filter(
      p => !recentViewIds.has(p.id) && !supportedIds.has(p.id)
    );

    // 🔧 FIX #3: If we filtered everything out, use all non-supported projects
    if (candidateProjects.length < limitCount) {
      console.log('🔧 Too few candidates after filtering, including older views');
      candidateProjects = allProjects.filter(p => !supportedIds.has(p.id));
    }

    // 🔧 FIX #4: If STILL no candidates, just use all projects
    if (candidateProjects.length === 0) {
      console.log('🔧 No candidates at all, using all projects');
      candidateProjects = allProjects;
    }

    // Score each project
    const scoredProjects = candidateProjects.map(project => {
      const score = calculatePersonalizedScore(
        project,
        preferences,
        interactionHistory.filter(i => i.type === 'support').slice(0, 10),
        viewHistory.slice(0, 20),
        categoryEngagement
      );

      const categoryScore = scoreCategoryMatch(project, preferences, categoryEngagement);
      const locationScore = scoreLocationMatch(project, preferences);
      const keywordScore = 0; // Simplified for now

      const reasons = generateRecommendationReasons(
        project,
        preferences,
        {
          category: categoryScore,
          location: locationScore,
          history: 0,
          keyword: keywordScore
        }
      );

      return {
        ...project,
        score,
        reasons
      };
    });

    // Sort by score and return top N
    scoredProjects.sort((a, b) => b.score - a.score);

    // Apply diversity - ensure variety
    const diverseResults = applyDiversity(scoredProjects, limitCount);

    // 🔧 FIX #5: If diversity filtered too much, fill with top scored
    if (diverseResults.length < limitCount && scoredProjects.length > diverseResults.length) {
      const remaining = scoredProjects.filter(p => !diverseResults.includes(p));
      diverseResults.push(...remaining.slice(0, limitCount - diverseResults.length));
    }

    // 🔧 FIX #6: Final safety - if we have nothing, return fallback
    if (diverseResults.length === 0) {
      console.log('🔧 No diverse results, returning fallback');
      return getFallbackProjects(limitCount);
    }

    return diverseResults;
  } catch (error) {
    console.error('Error getting For You projects:', error);
    return getFallbackProjects(limitCount);
  }
}

/**
 * Get "Near You" location-based recommendations
 */
export async function getNearYouProjects(
  userId: string,
  limitCount = 10
): Promise<FirestoreProject[]> {
  try {
    const preferences = await getUserPreferences(userId);
    if (!preferences || !preferences.preferredLocation.state) {
      return [];
    }

    const userState = preferences.preferredLocation.state;
    const userCity = preferences.preferredLocation.city;

    // Query projects from same state
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where('approvalStatus', '==', 'approved'),
      where('status', '==', 'active'),
      where('location.state', '==', userState),
      orderBy('createdAt', 'desc'),
      limit(limitCount * 2) // Get more to filter
    );

    const snapshot = await getDocs(q);
    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirestoreProject[];

    // Prioritize same city
    const cityProjects = projects.filter(p => p.location?.city === userCity);
    const stateProjects = projects.filter(p => p.location?.city !== userCity);

    const combined = [...cityProjects, ...stateProjects].slice(0, limitCount);

    return combined;
  } catch (error) {
    console.error('Error getting Near You projects:', error);
    return [];
  }
}

/**
 * Get category-based recommendations
 */
export async function getCategoryRecommendations(
  userId: string,
  category: string,
  limitCount = 8
): Promise<FirestoreProject[]> {
  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where('approvalStatus', '==', 'approved'),
      where('status', '==', 'active'),
      where('category', '==', category),
      orderBy('likeCount', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirestoreProject[];
  } catch (error) {
    console.error('Error getting category recommendations:', error);
    return [];
  }
}

/**
 * Get similar projects based on a specific project
 */
export async function getSimilarProjects(
  projectId: string,
  limitCount = 6
): Promise<FirestoreProject[]> {
  try {
    // Get the source project
    const projectDoc = await getDoc(doc(db, PROJECTS_COLLECTION, projectId));
    if (!projectDoc.exists()) return [];

    const sourceProject = {
      id: projectDoc.id,
      ...projectDoc.data()
    } as FirestoreProject;

    // Extract keywords from source project
    const sourceKeywords = extractFromProject(
      sourceProject.title,
      sourceProject.description
    );

    // Get projects in same category
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where('approvalStatus', '==', 'approved'),
      where('status', '==', 'active'),
      where('category', '==', sourceProject.category),
      limit(20)
    );

    const snapshot = await getDocs(q);
    const candidates = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(p => p.id !== projectId) as FirestoreProject[];

    // Score by keyword similarity
    const scored = candidates.map(project => {
      const projectKeywords = extractFromProject(project.title, project.description);
      const similarity = calculateKeywordSimilarity(sourceKeywords, projectKeywords);

      return {
        project,
        score: similarity
      };
    });

    // Sort and return top matches
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limitCount).map(s => s.project);
  } catch (error) {
    console.error('Error getting similar projects:', error);
    return [];
  }
}

/**
 * Get discovery recommendations (new categories)
 */
export async function getDiscoveryProjects(
  userId: string,
  limitCount = 8
): Promise<FirestoreProject[]> {
  try {
    const preferences = await getUserPreferences(userId);
    if (!preferences) {
      return getRandomProjects(limitCount);
    }

    const favoriteCategories = new Set(preferences.favoriteCategories);

    // Get projects from categories user hasn't explored
    const allProjects = await getAllActiveProjects();
    const unexploredProjects = allProjects.filter(
      p => !favoriteCategories.has(p.category)
    );

    // Shuffle and return
    return shuffleArray(unexploredProjects).slice(0, limitCount);
  } catch (error) {
    console.error('Error getting discovery projects:', error);
    return [];
  }
}


/**
 * Get almost funded projects (80-99%)
 */
export async function getAlmostFundedProjects(
  userId: string,
  limitCount = 6
): Promise<FirestoreProject[]> {
  try {
    const preferences = await getUserPreferences(userId);
    const allProjects = await getAllActiveProjects();

    // Filter for 80-99% funded
    const almostFunded = allProjects.filter(p => {
      const goal = p.fundingGoal || p.goal || 0; // 🔧 FIX: Handle undefined
      if (goal === 0) return false;
      const progress = (p.raised / goal) * 100;
      return progress >= 80 && progress < 100;
    });

    // Prioritize user's favorite categories
    if (preferences && preferences.favoriteCategories.length > 0) {
      const favoriteCategories = new Set(preferences.favoriteCategories);
      const favorites = almostFunded.filter(p => favoriteCategories.has(p.category));
      const others = almostFunded.filter(p => !favoriteCategories.has(p.category));

      return [...favorites, ...others].slice(0, limitCount);
    }

    // Sort by percentage (closest to goal first)
    almostFunded.sort((a, b) => {
      const goalA = a.fundingGoal || a.goal || 1; // 🔧 FIX: Handle undefined
      const goalB = b.fundingGoal || b.goal || 1;
      const progressA = (a.raised / goalA) * 100;
      const progressB = (b.raised / goalB) * 100;
      return progressB - progressA;
    });

    return almostFunded.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting almost funded projects:', error);
    return [];
  }
}

/**
 * Get fresh launches (last 7 days)
 */
export async function getFreshLaunchesProjects(
  userId: string,
  limitCount = 6
): Promise<FirestoreProject[]> {
  try {
    const sevenDaysAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where('approvalStatus', '==', 'approved'),
      where('status', '==', 'active'),
      where('createdAt', '>=', sevenDaysAgo),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirestoreProject[];
  } catch (error) {
    console.error('Error getting fresh launches:', error);
    return [];
  }
}

// ==================== CACHING ====================

/**
 * Get cached recommendations
 */
export async function getCachedRecommendations(userId: string): Promise<RecommendationCache | null> {
  try {
    const cacheDoc = await getDoc(doc(db, RECOMMENDATIONS_CACHE_COLLECTION, userId));
    if (!cacheDoc.exists()) return null;

    const cache = cacheDoc.data() as RecommendationCache;

    // Check if cache is expired
    const now = Timestamp.now();
    if (cache.expiresAt.toMillis() < now.toMillis()) {
      return null;
    }

    return cache;
  } catch (error) {
    console.error('Error getting cached recommendations:', error);
    return null;
  }
}

/**
 * Save recommendations to cache
 */
export async function cacheRecommendations(
  userId: string,
  recommendations: Partial<RecommendationCache>
): Promise<void> {
  try {
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(now.toMillis() + CACHE_DURATION_HOURS * 60 * 60 * 1000);

    await setDoc(doc(db, RECOMMENDATIONS_CACHE_COLLECTION, userId), {
      userId,
      ...recommendations,
      cachedAt: now,
      expiresAt
    });
  } catch (error) {
    console.error('Error caching recommendations:', error);
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get all active approved projects
 */
async function getAllActiveProjects(): Promise<FirestoreProject[]> {
  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where('approvalStatus', '==', 'approved'),
      where('status', '==', 'active'),
      limit(200) // Reasonable limit for performance
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirestoreProject[];
  } catch (error) {
    console.error('Error getting all active projects:', error);
    return [];
  }
}

/**
 * Get fallback projects for new users
 */
async function getFallbackProjects(limitCount: number): Promise<Array<FirestoreProject & { score: number; reasons: string[] }>> {
  try {
    // 🔧 FIX: Try multiple strategies in order of preference

    // Strategy 1: Try getting popular projects (requires index)
    try {
      const q = query(
        collection(db, PROJECTS_COLLECTION),
        where('approvalStatus', '==', 'approved'),
        where('status', '==', 'active'),
        orderBy('likeCount', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          score: 50,
          reasons: ['Popular on Lineup']
        })) as Array<FirestoreProject & { score: number; reasons: string[] }>;
      }
    } catch (indexError) {
      console.log('🔧 Fallback: likeCount index not available, trying alternative');
    }

    // Strategy 2: Get recent projects (requires createdAt index)
    try {
      const q = query(
        collection(db, PROJECTS_COLLECTION),
        where('approvalStatus', '==', 'approved'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          score: 50,
          reasons: ['Recently launched']
        })) as Array<FirestoreProject & { score: number; reasons: string[] }>;
      }
    } catch (indexError) {
      console.log('🔧 Fallback: createdAt index not available, trying basic query');
    }

    // Strategy 3: Basic query without ordering (always works)
    const basicQuery = query(
      collection(db, PROJECTS_COLLECTION),
      where('approvalStatus', '==', 'approved'),
      where('status', '==', 'active'),
      limit(limitCount)
    );

    const snapshot = await getDocs(basicQuery);
    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      score: 50,
      reasons: ['Recommended']
    })) as Array<FirestoreProject & { score: number; reasons: string[] }>;

    if (projects.length > 0) {
      return projects;
    }

    // Strategy 4: Last resort - get ANY active projects
    const lastResortQuery = query(
      collection(db, PROJECTS_COLLECTION),
      where('status', '==', 'active'),
      limit(limitCount)
    );

    const lastSnapshot = await getDocs(lastResortQuery);
    return lastSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      score: 50,
      reasons: ['Discover']
    })) as Array<FirestoreProject & { score: number; reasons: string[] }>;

  } catch (error) {
    console.error('❌ All fallback strategies failed:', error);
    return []; // Only return empty if DB is completely inaccessible
  }
}

/**
 * Get random projects
 */
async function getRandomProjects(limitCount: number): Promise<FirestoreProject[]> {
  const allProjects = await getAllActiveProjects();
  return shuffleArray(allProjects).slice(0, limitCount);
}

/**
 * Apply diversity to recommendations
 */
function applyDiversity<T extends { category: string }>(items: T[], count: number): T[] {
  const result: T[] = [];
  const categoryCounts = new Map<string, number>();

  for (const item of items) {
    if (result.length >= count) break;

    const categoryCount = categoryCounts.get(item.category) || 0;

    // Limit to 3 projects per category in results
    if (categoryCount < 3) {
      result.push(item);
      categoryCounts.set(item.category, categoryCount + 1);
    }
  }

  // If we don't have enough, add remaining items
  if (result.length < count) {
    for (const item of items) {
      if (result.length >= count) break;
      if (!result.includes(item)) {
        result.push(item);
      }
    }
  }

  return result;
}

/**
 * Shuffle array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}


