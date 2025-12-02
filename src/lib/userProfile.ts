import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import {
  EnhancedUser,
  UserStats,
  Achievement,
  UserActivity,
  BackedProject,
  ACHIEVEMENT_DEFINITIONS,
  getUserLevel,
  SocialLinks
} from '../types/user';

// Profile caching
const profileCache = new Map<string, { data: EnhancedUser; timestamp: number }>();
const PROFILE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get enhanced user profile
export const getEnhancedUserProfile = async (userId: string): Promise<EnhancedUser | null> => {
  try {
    // Check cache first
    const cached = profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < PROFILE_CACHE_DURATION) {
      return cached.data;
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();

    // Ensure all required fields exist with defaults
    const enhancedUser: EnhancedUser = {
      id: userDoc.id,
      email: userData.email || '',
      displayName: userData.displayName || '',
      username: userData.username || '',
      profileImage: userData.profileImage || '',
      coverImage: userData.coverImage || '',
      createdAt: userData.createdAt || Timestamp.now(),

      // Enhanced fields with defaults
      bio: userData.bio || '',
      description: userData.description || '',
      location: userData.location || '',
      jobTitle: userData.jobTitle || '',

      socialLinks: userData.socialLinks || {},

      // Onboarding & Profile Completion
      isProfileComplete: userData.isProfileComplete ?? false,
      profileCompletionScore: userData.profileCompletionScore ?? 0,
      onboardingStep: userData.onboardingStep,
      usernameChangedAt: userData.usernameChangedAt,

      isPublic: userData.isPublic ?? true,
      showEmail: userData.showEmail ?? false,
      showStats: userData.showStats ?? true,
      showBackedProjects: userData.showBackedProjects ?? true,
      donateAnonymousByDefault: userData.donateAnonymousByDefault ?? false,

      // Verification
      isEmailVerified: userData.isEmailVerified ?? false,
      isUsernameVerified: userData.isUsernameVerified ?? false,
      verificationBadges: userData.verificationBadges || [],

      // KYC and Creator Verification
      kycStatus: userData.kycStatus || 'not_started',
      kycSubmittedAt: userData.kycSubmittedAt,
      kycApprovedAt: userData.kycApprovedAt,
      kycRejectedAt: userData.kycRejectedAt,
      kycRejectionReason: userData.kycRejectionReason,
      kycDocumentId: userData.kycDocumentId,

      isCreatorVerified: userData.isCreatorVerified ?? false,
      canCreateProjects: userData.canCreateProjects ?? false,
      creatorActivatedAt: userData.creatorActivatedAt,

      stats: userData.stats || {
        projectsCreated: 0,
        projectsBacked: 0,
        totalRaised: 0,
        totalBacked: 0,
        followersCount: 0,
        followingCount: 0,
        successRate: 0,
        averageProjectDuration: 0
      },

      achievements: userData.achievements || [],
      level: userData.level || 1,
      experiencePoints: userData.experiencePoints || 0,

      updatedAt: userData.updatedAt || Timestamp.now(),
      lastActiveAt: userData.lastActiveAt || Timestamp.now()
    };

    // Cache the result
    profileCache.set(userId, { data: enhancedUser, timestamp: Date.now() });

    return enhancedUser;
  } catch (error) {
    console.error('Error fetching enhanced user profile:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<EnhancedUser>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
      lastActiveAt: Timestamp.now()
    };

    await updateDoc(userRef, updateData);

    // Update cache if it exists
    const cached = profileCache.get(userId);
    if (cached) {
      profileCache.set(userId, {
        data: { ...cached.data, ...updates, updatedAt: Timestamp.now() },
        timestamp: Date.now()
      });
    }

    // Log activity
    await logUserActivity(userId, 'profile_updated', { fields: Object.keys(updates) });

    // Check for achievements
    await checkAndUnlockAchievements(userId);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Update social links
export const updateSocialLinks = async (userId: string, socialLinks: SocialLinks): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      socialLinks,
      updatedAt: Timestamp.now()
    });

    // Check for social butterfly achievement
    await checkAndUnlockAchievements(userId);
  } catch (error) {
    console.error('Error updating social links:', error);
    throw error;
  }
};

// Store for preventing concurrent stats updates
const statsUpdatePromises = new Map<string, Promise<UserStats>>();

// Calculate and update user statistics
export const updateUserStats = async (userId: string): Promise<UserStats> => {
  // Check if there's already an ongoing update for this user
  const existingPromise = statsUpdatePromises.get(userId);
  if (existingPromise) {
    return existingPromise;
  }

  const updatePromise = performStatsUpdate(userId);
  statsUpdatePromises.set(userId, updatePromise);

  try {
    const result = await updatePromise;
    return result;
  } finally {
    statsUpdatePromises.delete(userId);
  }
};

// Actual stats update implementation
const performStatsUpdate = async (userId: string): Promise<UserStats> => {
  try {
    // Get projects created by user
    const createdProjectsQuery = query(
      collection(db, 'projects'),
      where('creatorId', '==', userId)
    );
    const createdProjectsSnapshot = await getDocs(createdProjectsQuery);
    const createdProjects = createdProjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    // Get projects backed by user
    const backedProjectsQuery = query(
      collection(db, 'backed-projects'),
      where('userId', '==', userId)
    );
    const backedProjectsSnapshot = await getDocs(backedProjectsQuery);
    const backedProjects = backedProjectsSnapshot.docs.map(doc => doc.data() as BackedProject);

    // Get followers count
    const followersQuery = query(
      collection(db, 'user-follows'),
      where('followedUserId', '==', userId)
    );
    const followersSnapshot = await getDocs(followersQuery);

    // Get following count
    const followingQuery = query(
      collection(db, 'user-follows'),
      where('followerUserId', '==', userId)
    );
    const followingSnapshot = await getDocs(followingQuery);

    // Get projects liked by user
    const likedProjectsQuery = query(
      collection(db, 'likes'),
      where('userId', '==', userId)
    );
    const likedProjectsSnapshot = await getDocs(likedProjectsQuery);

    // Get projects followed by user
    const followedProjectsQuery = query(
      collection(db, 'follows'),
      where('userId', '==', userId)
    );
    const followedProjectsSnapshot = await getDocs(followedProjectsQuery);

    // Calculate statistics
    const totalRaised = createdProjects.reduce((sum, project) => sum + (project.raised || 0), 0);
    const totalBacked = backedProjects.reduce((sum, backing) => sum + backing.amount, 0);
    const successfulProjects = createdProjects.filter(project => project.status === 'completed' && project.raised >= project.goal).length;
    const successRate = createdProjects.length > 0 ? (successfulProjects / createdProjects.length) * 100 : 0;

    const stats: UserStats = {
      projectsCreated: createdProjects.length,
      projectsBacked: backedProjects.length,
      projectsLiked: likedProjectsSnapshot.size,
      projectsFollowed: followedProjectsSnapshot.size,
      totalRaised,
      totalBacked,
      followersCount: followersSnapshot.size,
      followingCount: followingSnapshot.size,
      successRate,
      averageProjectDuration: 30 // TODO: Calculate actual average
    };

    // Update user document with new stats
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      stats,
      updatedAt: Timestamp.now()
    });

    return stats;
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
};

// Get user's backed projects
export const getUserBackedProjects = async (userId: string): Promise<any[]> => {
  try {
    const backedProjectsQuery = query(
      collection(db, 'backed-projects'),
      where('userId', '==', userId),
      orderBy('backedAt', 'desc')
    );

    const snapshot = await getDocs(backedProjectsQuery);
    const backedProjects = [];

    for (const docSnapshot of snapshot.docs) {
      const backingData = docSnapshot.data() as BackedProject;

      // Get project details
      const projectRef = doc(db, 'projects', backingData.projectId);
      const projectDoc = await getDoc(projectRef);

      if (projectDoc.exists()) {
        backedProjects.push({
          ...backingData,
          project: { id: projectDoc.id, ...projectDoc.data() }
        });
      }
    }

    return backedProjects;
  } catch (error) {
    console.error('Error fetching backed projects:', error);
    return [];
  }
};

// Record project backing
/**
 * @deprecated Use processDonation from donationService.ts instead
 */
export const recordProjectBacking = async (
  userId: string,
  projectId: string,
  amount: number,
  rewardTier?: string,
  isAnonymousOverride?: boolean // Per-transaction anonymous choice
): Promise<void> => {
  try {
    // Get user profile to determine anonymous status
    const userProfile = await getEnhancedUserProfile(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    // Import anonymous utilities
    const { shouldDisplayAsAnonymous, getDisplayInfo } = await import('../utils/anonymousUser');

    // Determine if should be anonymous
    const isAnonymous = shouldDisplayAsAnonymous(
      userProfile.isPublic,
      userProfile.donateAnonymousByDefault || false,
      isAnonymousOverride
    );

    // Get display information
    const displayInfo = getDisplayInfo(
      {
        id: userProfile.id,
        displayName: userProfile.displayName,
        profileImage: userProfile.profileImage
      },
      isAnonymous
    );

    const backingId = `${userId}_${projectId}_${Date.now()}`;
    const backingRef = doc(db, 'backed-projects', backingId);

    const backingData: BackedProject = {
      id: backingId,
      userId,
      projectId,
      amount,
      rewardTier,
      backedAt: Timestamp.now(),
      status: 'active',
      anonymous: isAnonymous,
      displayName: displayInfo.displayName,
      displayProfileImage: displayInfo.displayProfileImage
    };

    await setDoc(backingRef, backingData);

    // Update user stats
    await updateUserStats(userId);

    // Log activity (anonymously if needed)
    await logUserActivity(userId, 'project_backed', {
      projectId,
      amount,
      anonymous: isAnonymous
    });

    // Check achievements
    await checkAndUnlockAchievements(userId);
  } catch (error) {
    console.error('Error recording project backing:', error);
    throw error;
  }
};

// Achievement system
export const checkAndUnlockAchievements = async (userId: string): Promise<Achievement[]> => {
  try {
    const user = await getEnhancedUserProfile(userId);
    if (!user) return [];

    const newAchievements: Achievement[] = [];
    const existingAchievementIds = user.achievements.map(a => a.id);

    for (const definition of ACHIEVEMENT_DEFINITIONS) {
      if (existingAchievementIds.includes(definition.id)) continue;

      let shouldUnlock = false;

      switch (definition.criteria.condition) {
        case 'projects_created':
          shouldUnlock = (user.stats.projectsCreated || 0) >= definition.criteria.threshold;
          break;
        case 'amount_raised':
          shouldUnlock = (user.stats.totalRaised || 0) >= definition.criteria.threshold;
          break;
        case 'projects_backed':
          shouldUnlock = (user.stats.projectsBacked || 0) >= definition.criteria.threshold;
          break;
        case 'followers':
          shouldUnlock = (user.stats.followersCount || 0) >= definition.criteria.threshold;
          break;
        case 'social_links':
          const linkCount = Object.values(user.socialLinks).filter(link => link && link.trim()).length;
          shouldUnlock = linkCount >= definition.criteria.threshold;
          break;
      }

      if (shouldUnlock) {
        const achievement: Achievement = {
          id: definition.id,
          type: definition.type,
          title: definition.title,
          description: definition.description,
          icon: definition.icon,
          rarity: definition.rarity,
          experiencePoints: definition.rewards.experiencePoints,
          unlockedAt: Timestamp.now()
        };

        newAchievements.push(achievement);
      }
    }

    if (newAchievements.length > 0) {
      const totalNewXP = newAchievements.reduce((sum, achievement) => sum + achievement.experiencePoints, 0);
      const newTotalXP = user.experiencePoints + totalNewXP;
      const newLevel = getUserLevel(newTotalXP);

      // Update user with new achievements
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        achievements: [...user.achievements, ...newAchievements],
        experiencePoints: newTotalXP,
        level: newLevel,
        updatedAt: Timestamp.now()
      });

      // Log achievement activities
      for (const achievement of newAchievements) {
        await logUserActivity(userId, 'achievement_unlocked', {
          achievementId: achievement.id,
          title: achievement.title,
          experiencePoints: achievement.experiencePoints
        });
      }
    }

    return newAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
};

// User activity logging
export const logUserActivity = async (
  userId: string,
  type: UserActivity['type'],
  data: any
): Promise<void> => {
  try {
    const activityRef = doc(collection(db, 'user-activities'));
    const activity: UserActivity = {
      id: activityRef.id,
      userId,
      type,
      data,
      createdAt: Timestamp.now()
    };

    await setDoc(activityRef, activity);
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
};

// Get user activity feed
export const getUserActivityFeed = async (userId: string, limitCount = 20): Promise<UserActivity[]> => {
  try {
    const activitiesQuery = query(
      collection(db, 'user-activities'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(activitiesQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserActivity));
  } catch (error) {
    console.error('Error fetching user activity feed:', error);
    return [];
  }
};

// User following system
export const followUser = async (followerUserId: string, followedUserId: string): Promise<void> => {
  try {
    const followId = `${followerUserId}_${followedUserId}`;
    const followRef = doc(db, 'user-follows', followId);

    await setDoc(followRef, {
      followerUserId,
      followedUserId,
      createdAt: Timestamp.now()
    });

    // Update both users' stats
    await updateUserStats(followerUserId);
    await updateUserStats(followedUserId);

    // Check achievements for both users
    await checkAndUnlockAchievements(followedUserId);
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
};

export const unfollowUser = async (followerUserId: string, followedUserId: string): Promise<void> => {
  try {
    const followId = `${followerUserId}_${followedUserId}`;
    const followRef = doc(db, 'user-follows', followId);

    // Hard delete the follow document
    await deleteDoc(followRef);

    // Update both users' stats
    await updateUserStats(followerUserId);
    await updateUserStats(followedUserId);
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
};

export const checkUserFollowStatus = async (followerUserId: string, followedUserId: string): Promise<boolean> => {
  try {
    const followId = `${followerUserId}_${followedUserId}`;
    const followRef = doc(db, 'user-follows', followId);
    const followDoc = await getDoc(followRef);

    // Simple existence check since we use hard deletes now
    return followDoc.exists();
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
};

