import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import {
  likeProject,
  unlikeProject,
  followProject,
  unfollowProject,
  checkUserLikedProject,
  checkUserFollowedProject,
  getProjectInteractionCounts,
  getUserLikedProjects,
  getUserFollowedProjects,
  InteractionCounts
} from '../lib/interactions';
import { trackProjectInteraction } from '../lib/analytics';
import { FirestoreProject } from '../types/firestore';
import { toast } from 'react-hot-toast';

// Hook for project likes
export const useProjectLikes = (projectId: string) => {
  const [user] = useAuthState(auth);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has liked the project
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user || !projectId) return;

      try {
        const liked = await checkUserLikedProject(user.uid, projectId);
        setIsLiked(liked);

        const counts = await getProjectInteractionCounts(projectId);
        setLikeCount(counts.likes);
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };

    checkLikeStatus();
  }, [user, projectId]);

  const toggleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like projects');
      return;
    }

    if (isLoading) return;

    // Store original state for rollback
    const originalIsLiked = isLiked;
    const originalLikeCount = likeCount;

    setIsLoading(true);

    try {
      if (isLiked) {
        // Optimistic update
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));

        await unlikeProject(user.uid, projectId);
        toast.success('Project unliked');
      } else {
        // Optimistic update
        setIsLiked(true);
        setLikeCount(prev => prev + 1);

        await likeProject(user.uid, projectId);
        // Track for analytics dashboard
        trackProjectInteraction(projectId, 'likes');
        toast.success('Project liked!');
      }
    } catch (error) {
      // Rollback optimistic updates on error
      setIsLiked(originalIsLiked);
      setLikeCount(originalLikeCount);

      console.error('Error toggling like:', error);
      toast.error('Failed to update like status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLiked,
    likeCount,
    toggleLike,
    isLoading
  };
};

// Hook for project follows
export const useProjectFollows = (projectId: string) => {
  const [user] = useAuthState(auth);
  const [isFollowed, setIsFollowed] = useState(false);
  const [followCount, setFollowCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has followed the project
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !projectId) return;

      try {
        const followed = await checkUserFollowedProject(user.uid, projectId);
        setIsFollowed(followed);

        const counts = await getProjectInteractionCounts(projectId);
        setFollowCount(counts.follows);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
  }, [user, projectId]);

  const toggleFollow = async () => {
    if (!user) {
      toast.error('Please sign in to follow projects');
      return;
    }

    if (isLoading) return;

    // Store original state for rollback
    const originalIsFollowed = isFollowed;
    const originalFollowCount = followCount;

    setIsLoading(true);

    try {
      if (isFollowed) {
        // Optimistic update
        setIsFollowed(false);
        setFollowCount(prev => Math.max(0, prev - 1));

        await unfollowProject(user.uid, projectId);
        toast.success('Project unfollowed');
      } else {
        // Optimistic update
        setIsFollowed(true);
        setFollowCount(prev => prev + 1);

        await followProject(user.uid, projectId);
        // Track for analytics dashboard
        trackProjectInteraction(projectId, 'follows');
        toast.success('Following project for updates!');
      }
    } catch (error) {
      // Rollback optimistic updates on error
      setIsFollowed(originalIsFollowed);
      setFollowCount(originalFollowCount);

      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isFollowed,
    followCount,
    toggleFollow,
    isLoading
  };
};

// Hook for user's interactions
export const useUserInteractions = (userId?: string) => {
  const [likedProjects, setLikedProjects] = useState<FirestoreProject[]>([]);
  const [followedProjects, setFollowedProjects] = useState<FirestoreProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInteractions = async () => {
      if (!userId) return;

      setIsLoading(true);
      setError(null);

      try {
        const [liked, followed] = await Promise.all([
          getUserLikedProjects(userId),
          getUserFollowedProjects(userId)
        ]);

        setLikedProjects(liked);
        setFollowedProjects(followed);
      } catch (error) {
        console.error('Error fetching user interactions:', error);
        setError('Failed to load user interactions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInteractions();
  }, [userId]);

  const refreshInteractions = async () => {
    if (!userId) return;

    try {
      const [liked, followed] = await Promise.all([
        getUserLikedProjects(userId),
        getUserFollowedProjects(userId)
      ]);

      setLikedProjects(liked);
      setFollowedProjects(followed);
    } catch (error) {
      console.error('Error refreshing interactions:', error);
    }
  };

  return {
    likedProjects,
    followedProjects,
    isLoading,
    error,
    refreshInteractions
  };
};

// Hook for interaction counts only (lightweight)
export const useInteractionCounts = (projectId: string) => {
  const [counts, setCounts] = useState<InteractionCounts>({ likes: 0, follows: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!projectId) return;

      try {
        const interactionCounts = await getProjectInteractionCounts(projectId);
        setCounts(interactionCounts);
      } catch (error) {
        console.error('Error fetching interaction counts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, [projectId]);

  return { counts, isLoading };
};
