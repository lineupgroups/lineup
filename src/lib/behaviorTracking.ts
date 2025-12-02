/**
 * User Behavior Tracking System
 * Tracks user views, interactions, and builds preference profiles
 */

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import {
  ProjectView,
  ProjectInteraction,
  UserPreferences,
  CategoryEngagement
} from '../types/behavior';
import { extractFromProject, buildUserKeywordProfile } from './keywords';

// Collection names
const USER_BEHAVIOR_COLLECTION = 'user-behavior';
const USER_PREFERENCES_COLLECTION = 'user-preferences';

// ==================== PROJECT VIEW TRACKING ====================

/**
 * Log a project view
 */
export async function logProjectView(
  userId: string,
  projectId: string,
  projectData: {
    title: string;
    description: string;
    category: string;
    location?: { city: string; state: string };
  },
  viewData: {
    viewDuration: number;
    scrollDepth: number;
    clickedCTA: boolean;
    clickedSupport: boolean;
    clickedShare: boolean;
  }
): Promise<void> {
  try {
    // Extract keywords from project
    const keywords = extractFromProject(projectData.title, projectData.description);

    // Detect device type
    const deviceType = getDeviceType();

    const viewRecord: Omit<ProjectView, 'id'> = {
      userId,
      projectId,
      projectTitle: projectData.title,
      category: projectData.category,
      keywords,
      viewedAt: serverTimestamp() as Timestamp,
      viewDuration: viewData.viewDuration,
      location: projectData.location || { city: '', state: '' },
      deviceType,
      scrollDepth: viewData.scrollDepth,
      clickedCTA: viewData.clickedCTA,
      clickedSupport: viewData.clickedSupport,
      clickedShare: viewData.clickedShare
    };

    // Save to Firestore
    await addDoc(
      collection(db, USER_BEHAVIOR_COLLECTION, userId, 'views'),
      viewRecord
    );

    // Update user preferences in background
    await updateUserPreferencesAfterView(userId, projectData.category, keywords, viewData.viewDuration);

  } catch (error) {
    console.error('Error logging project view:', error);
    // Don't throw - tracking failures shouldn't break user experience
  }
}

/**
 * Log a project interaction
 */
export async function logProjectInteraction(
  userId: string,
  projectId: string,
  interactionType: ProjectInteraction['type'],
  projectData: {
    title?: string;
    category: string;
  },
  metadata?: ProjectInteraction['metadata']
): Promise<void> {
  try {
    const keywords = projectData.title ? extractFromProject(projectData.title, '') : [];

    const interaction: Omit<ProjectInteraction, 'id'> = {
      userId,
      projectId,
      projectTitle: projectData.title,
      type: interactionType,
      interactedAt: serverTimestamp() as Timestamp,
      category: projectData.category,
      keywords,
      metadata
    };

    await addDoc(
      collection(db, USER_BEHAVIOR_COLLECTION, userId, 'interactions'),
      interaction
    );

    // Update user preferences
    await updateUserPreferencesAfterInteraction(userId, projectData.category, interactionType, metadata);

  } catch (error) {
    console.error('Error logging project interaction:', error);
  }
}

// ==================== USER PREFERENCES ====================

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const docRef = doc(db, USER_PREFERENCES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = { userId, ...docSnap.data() } as UserPreferences;
      console.log('📖 LOADED USER PREFERENCES:', {
        userId,
        hasLocation: !!(data.preferredLocation?.city && data.preferredLocation?.state),
        hasCategories: data.favoriteCategories && data.favoriteCategories.length >= 3,
        location: data.preferredLocation,
        categories: data.favoriteCategories,
        fullData: data
      });
      return data;
    }

    console.log('📖 NO USER PREFERENCES FOUND for userId:', userId);
    return null;
  } catch (error) {
    console.error('❌ Error getting user preferences:', error);
    return null;
  }
}

/**
 * Initialize user preferences for new users
 */
export async function initializeUserPreferences(
  userId: string,
  initialData?: {
    location?: { city: string; state: string };
    favoriteCategories?: string[];
  }
): Promise<void> {
  try {
    console.log('🔧 INITIALIZING USER PREFERENCES:', { userId, initialData });
    
    // Check if preferences already exist
    const docRef = doc(db, USER_PREFERENCES_COLLECTION, userId);
    const existingDoc = await getDoc(docRef);
    
    if (existingDoc.exists()) {
      console.log('📋 Preferences already exist, merging with new data');
      // Merge with existing data
      await setDoc(docRef, {
        favoriteCategories: initialData?.favoriteCategories || existingDoc.data().favoriteCategories || [],
        preferredLocation: initialData?.location || existingDoc.data().preferredLocation || { city: '', state: '' },
        updatedAt: serverTimestamp()
      }, { merge: true });
    } else {
      console.log('📋 Creating new preferences document');
      // Create new document
      const preferences: Omit<UserPreferences, 'userId'> = {
        favoriteCategories: initialData?.favoriteCategories || [],
        preferredLocation: initialData?.location || { city: '', state: '' },
        keywords: [],
        avgSupportAmount: 0,
        lastActive: serverTimestamp() as Timestamp,
        engagementScore: 0,
        personalityType: 'casual',
        totalProjectsViewed: 0,
        totalProjectsSupported: 0,
        totalInteractions: 0,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      await setDoc(docRef, preferences);
    }
    
    console.log('✅ User preferences initialized/updated');
  } catch (error) {
    console.error('❌ Error initializing user preferences:', error);
  }
}

/**
 * Update user preferences after a view
 */
async function updateUserPreferencesAfterView(
  userId: string,
  category: string,
  keywords: string[],
  viewDuration: number
): Promise<void> {
  try {
    const prefsRef = doc(db, USER_PREFERENCES_COLLECTION, userId);
    const prefsSnap = await getDoc(prefsRef);

    if (!prefsSnap.exists()) {
      // Initialize if doesn't exist
      await initializeUserPreferences(userId);
      return;
    }

    const currentPrefs = prefsSnap.data() as Omit<UserPreferences, 'userId'>;

    // Update favorite categories (add if not present)
    const favoriteCategories = currentPrefs.favoriteCategories || [];
    if (!favoriteCategories.includes(category) && favoriteCategories.length < 10) {
      favoriteCategories.push(category);
    }

    // Update keywords (merge and keep top 30)
    const currentKeywords = currentPrefs.keywords || [];
    const mergedKeywords = [...new Set([...currentKeywords, ...keywords])].slice(0, 30);

    // Calculate engagement score boost based on view duration
    const engagementBoost = calculateEngagementBoost(viewDuration);
    const newEngagementScore = Math.min(100, (currentPrefs.engagementScore || 0) + engagementBoost);

    // Update personality type based on behavior
    const totalViews = (currentPrefs.totalProjectsViewed || 0) + 1;
    const totalSupports = currentPrefs.totalProjectsSupported || 0;
    const personalityType = determinePersonalityType(totalViews, totalSupports);

    await updateDoc(prefsRef, {
      favoriteCategories,
      keywords: mergedKeywords,
      engagementScore: newEngagementScore,
      personalityType,
      totalProjectsViewed: totalViews,
      totalInteractions: (currentPrefs.totalInteractions || 0) + 1,
      lastActive: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating preferences after view:', error);
  }
}

/**
 * Update user preferences after an interaction
 */
async function updateUserPreferencesAfterInteraction(
  userId: string,
  category: string,
  interactionType: ProjectInteraction['type'],
  metadata?: ProjectInteraction['metadata']
): Promise<void> {
  try {
    const prefsRef = doc(db, USER_PREFERENCES_COLLECTION, userId);
    const prefsSnap = await getDoc(prefsRef);

    if (!prefsSnap.exists()) return;

    const currentPrefs = prefsSnap.data() as Omit<UserPreferences, 'userId'>;
    const updates: any = {
      lastActive: serverTimestamp(),
      updatedAt: serverTimestamp(),
      totalInteractions: (currentPrefs.totalInteractions || 0) + 1
    };

    // If support interaction, update support-related fields
    if (interactionType === 'support' && metadata?.supportAmount) {
      const totalSupports = (currentPrefs.totalProjectsSupported || 0) + 1;
      const currentAvg = currentPrefs.avgSupportAmount || 0;
      const newAvg = (currentAvg * (totalSupports - 1) + metadata.supportAmount) / totalSupports;

      updates.totalProjectsSupported = totalSupports;
      updates.avgSupportAmount = Math.round(newAvg);
      updates.engagementScore = Math.min(100, (currentPrefs.engagementScore || 0) + 10);
    }

    // Boost engagement for meaningful interactions
    if (['like', 'follow', 'share', 'comment'].includes(interactionType)) {
      updates.engagementScore = Math.min(100, (currentPrefs.engagementScore || 0) + 2);
    }

    await updateDoc(prefsRef, updates);
  } catch (error) {
    console.error('Error updating preferences after interaction:', error);
  }
}

/**
 * Update user location preference
 */
export async function updateUserLocation(
  userId: string,
  location: { city: string; state: string }
): Promise<void> {
  try {
    const prefsRef = doc(db, USER_PREFERENCES_COLLECTION, userId);
    await setDoc(prefsRef, {
      preferredLocation: location,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user location:', error);
  }
}

/**
 * Set user's favorite categories (from onboarding)
 */
export async function setUserFavoriteCategories(
  userId: string,
  categories: string[]
): Promise<void> {
  try {
    const prefsRef = doc(db, USER_PREFERENCES_COLLECTION, userId);
    await setDoc(prefsRef, {
      favoriteCategories: categories,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error setting favorite categories:', error);
  }
}

// ==================== ANALYTICS & CALCULATIONS ====================

/**
 * Get user's view history
 */
export async function getUserViewHistory(
  userId: string,
  limitCount = 50
): Promise<ProjectView[]> {
  try {
    const q = query(
      collection(db, USER_BEHAVIOR_COLLECTION, userId, 'views'),
      orderBy('viewedAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ProjectView[];
  } catch (error) {
    console.error('Error getting view history:', error);
    return [];
  }
}

/**
 * Get user's interaction history
 */
export async function getUserInteractionHistory(
  userId: string,
  limitCount = 50
): Promise<ProjectInteraction[]> {
  try {
    const q = query(
      collection(db, USER_BEHAVIOR_COLLECTION, userId, 'interactions'),
      orderBy('interactedAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ProjectInteraction[];
  } catch (error) {
    console.error('Error getting interaction history:', error);
    return [];
  }
}

/**
 * Calculate engagement boost from view duration
 */
function calculateEngagementBoost(viewDuration: number): number {
  if (viewDuration < 10) return -1; // Negative for quick exits
  if (viewDuration < 60) return 0; // Neutral for normal views
  if (viewDuration < 180) return 1; // Small boost for engaged views
  return 2; // Good boost for deep engagement
}

/**
 * Determine personality type based on behavior
 */
function determinePersonalityType(
  totalViews: number,
  totalSupports: number
): UserPreferences['personalityType'] {
  const supportRate = totalViews > 0 ? totalSupports / totalViews : 0;

  if (totalViews < 5) return 'casual';
  if (supportRate > 0.3) return 'supporter';
  if (totalViews > 50) return 'explorer';
  return 'browser';
}

/**
 * Get device type
 */
function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Get category engagement for user
 */
export async function getCategoryEngagement(userId: string): Promise<CategoryEngagement[]> {
  try {
    // Get all views
    const views = await getUserViewHistory(userId, 200);
    
    // Get all interactions
    const interactions = await getUserInteractionHistory(userId, 100);

    // Group by category
    const categoryMap = new Map<string, CategoryEngagement>();

    views.forEach(view => {
      const existing = categoryMap.get(view.category) || {
        category: view.category,
        viewCount: 0,
        supportCount: 0,
        timeSpent: 0,
        lastEngaged: view.viewedAt,
        score: 0
      };

      existing.viewCount++;
      existing.timeSpent += view.viewDuration;
      categoryMap.set(view.category, existing);
    });

    interactions.forEach(interaction => {
      if (interaction.type === 'support') {
        const existing = categoryMap.get(interaction.category);
        if (existing) {
          existing.supportCount++;
          categoryMap.set(interaction.category, existing);
        }
      }
    });

    // Calculate scores
    const engagements = Array.from(categoryMap.values());
    engagements.forEach(eng => {
      eng.score = (
        eng.viewCount * 1 +
        eng.supportCount * 10 +
        (eng.timeSpent / 60) * 0.5 // time in minutes
      );
    });

    // Sort by score
    return engagements.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error getting category engagement:', error);
    return [];
  }
}

/**
 * Clear user behavior data (privacy feature)
 */
export async function clearUserBehaviorData(userId: string): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Delete all views
    const viewsQuery = query(collection(db, USER_BEHAVIOR_COLLECTION, userId, 'views'));
    const viewsSnapshot = await getDocs(viewsQuery);
    viewsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete all interactions
    const interactionsQuery = query(collection(db, USER_BEHAVIOR_COLLECTION, userId, 'interactions'));
    const interactionsSnapshot = await getDocs(interactionsQuery);
    interactionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Reset preferences
    const prefsRef = doc(db, USER_PREFERENCES_COLLECTION, userId);
    batch.update(prefsRef, {
      keywords: [],
      totalProjectsViewed: 0,
      totalInteractions: 0,
      updatedAt: serverTimestamp()
    });

    await batch.commit();
  } catch (error) {
    console.error('Error clearing behavior data:', error);
    throw error;
  }
}


