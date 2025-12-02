import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  getEnhancedUserProfile,
  updateUserProfile,
  updateSocialLinks,
  updateUserStats,
  getUserBackedProjects,
  checkAndUnlockAchievements,
  getUserActivityFeed,
  followUser,
  unfollowUser,
  checkUserFollowStatus
} from '../lib/userProfile';
import {
  EnhancedUser,
  SocialLinks,
  Achievement,
  UserActivity,
  BackedProject
} from '../types/user';
import toast from 'react-hot-toast';

// Hook for enhanced user profile
export const useEnhancedUserProfile = (userId?: string) => {
  // Don't default to logged-in user - this causes flickering when switching profiles
  const targetUserId = userId;

  const [profile, setProfile] = useState<EnhancedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // First, update the user stats to ensure they're fresh
        try {
          await updateUserStats(targetUserId);
        } catch (statsError) {
          console.warn('Failed to update user stats, continuing with cached data:', statsError);
          // Don't fail the entire profile load if stats update fails
        }

        // Then fetch the updated profile
        const userProfile = await getEnhancedUserProfile(targetUserId);
        setProfile(userProfile);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [targetUserId]);

  const refreshProfile = async () => {
    if (!targetUserId) return;

    try {
      const userProfile = await getEnhancedUserProfile(targetUserId);
      setProfile(userProfile);
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  return {
    profile,
    isLoading,
    error,
    refreshProfile
  };
};

// Hook for profile editing
export const useProfileEdit = () => {
  const [user] = useAuthState(auth);
  const { refreshUserData } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateProfile = async (updates: Partial<EnhancedUser>) => {
    if (!user) {
      toast.error('You must be signed in to update your profile');
      return;
    }

    try {
      setIsUpdating(true);
      await updateUserProfile(user.uid, updates);

      // Refresh AuthContext user data to update navbar
      await refreshUserData();

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const updateSocials = async (socialLinks: SocialLinks) => {
    if (!user) {
      toast.error('You must be signed in to update social links');
      return;
    }

    try {
      setIsUpdating(true);
      await updateSocialLinks(user.uid, socialLinks);

      // Refresh AuthContext user data to update navbar
      await refreshUserData();

      toast.success('Social links updated successfully');
    } catch (error) {
      console.error('Error updating social links:', error);
      toast.error('Failed to update social links');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const refreshStats = async () => {
    if (!user) return;

    try {
      await updateUserStats(user.uid);
      toast.success('Statistics refreshed');
    } catch (error) {
      console.error('Error refreshing stats:', error);
      toast.error('Failed to refresh statistics');
    }
  };

  return {
    updateProfile,
    updateSocials,
    refreshStats,
    isUpdating
  };
};

// Hook for user's backed projects
export const useBackedProjects = (userId?: string) => {
  const [user] = useAuthState(auth);
  const targetUserId = userId || user?.uid;

  const [backedProjects, setBackedProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBackedProjects = async () => {
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const projects = await getUserBackedProjects(targetUserId);
        setBackedProjects(projects);
      } catch (err) {
        console.error('Error fetching backed projects:', err);
        setError('Failed to load backed projects');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBackedProjects();
  }, [targetUserId]);

  return {
    backedProjects,
    isLoading,
    error
  };
};

// Hook for achievements
export const useUserAchievements = (userId?: string) => {
  const [user] = useAuthState(auth);
  const targetUserId = userId || user?.uid;

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const profile = await getEnhancedUserProfile(targetUserId);
        setAchievements(profile?.achievements || []);
      } catch (err) {
        console.error('Error fetching achievements:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAchievements();
  }, [targetUserId]);

  const checkNewAchievements = async () => {
    if (!targetUserId) return;

    try {
      const newAchievements = await checkAndUnlockAchievements(targetUserId);
      if (newAchievements.length > 0) {
        // Show toast notifications for new achievements
        newAchievements.forEach(achievement => {
          toast.success(`🏆 Achievement Unlocked: ${achievement.title}`, {
            duration: 5000,
            icon: achievement.icon
          });
        });

        // Refresh achievements list
        const profile = await getEnhancedUserProfile(targetUserId);
        setAchievements(profile?.achievements || []);
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  return {
    achievements,
    isLoading,
    checkNewAchievements
  };
};

// Hook for user activity feed
export const useUserActivity = (userId?: string) => {
  const [user] = useAuthState(auth);
  const targetUserId = userId || user?.uid;

  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const userActivities = await getUserActivityFeed(targetUserId);
        setActivities(userActivities);
      } catch (err) {
        console.error('Error fetching user activities:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [targetUserId]);

  return {
    activities,
    isLoading
  };
};

// Hook for user following
export const useUserFollow = (targetUserId: string, onFollowChange?: () => void) => {
  const [user] = useAuthState(auth);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !targetUserId || user.uid === targetUserId) return;

      try {
        const followStatus = await checkUserFollowStatus(user.uid, targetUserId);
        setIsFollowing(followStatus);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
  }, [user, targetUserId]);

  const toggleFollow = async () => {
    if (!user) {
      toast.error('Please sign in to follow users');
      return;
    }

    if (user.uid === targetUserId) {
      toast.error("You can't follow yourself");
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);

      if (isFollowing) {
        await unfollowUser(user.uid, targetUserId);
        setIsFollowing(false);
        toast.success('User unfollowed');
      } else {
        await followUser(user.uid, targetUserId);
        setIsFollowing(true);
        toast.success('User followed');
      }

      // Trigger callback to refresh profile data
      if (onFollowChange) {
        onFollowChange();
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isFollowing,
    toggleFollow,
    isLoading,
    canFollow: user && user.uid !== targetUserId
  };
};

