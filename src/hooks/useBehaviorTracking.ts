/**
 * React Hook for User Behavior Tracking
 * Provides easy-to-use functions for tracking user behavior
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  logProjectView,
  logProjectInteraction,
  getUserPreferences,
  getUserViewHistory,
  getUserInteractionHistory
} from '../lib/behaviorTracking';
import { UserPreferences, ProjectView, ProjectInteraction } from '../types/behavior';

export function useBehaviorTracking() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user preferences
  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      setPreferences(null);
      setLoading(false);
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    
    try {
      const prefs = await getUserPreferences(user.uid);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackView = useCallback(async (
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
  ) => {
    if (!user) return;

    try {
      await logProjectView(user.uid, projectId, projectData, viewData);
      // Reload preferences to get updated data
      await loadPreferences();
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }, [user]);

  const trackInteraction = useCallback(async (
    projectId: string,
    interactionType: ProjectInteraction['type'],
    projectData: {
      title?: string;
      category: string;
    },
    metadata?: ProjectInteraction['metadata']
  ) => {
    if (!user) return;

    try {
      await logProjectInteraction(user.uid, projectId, interactionType, projectData, metadata);
      // Reload preferences
      await loadPreferences();
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }, [user]);

  return {
    preferences,
    loading,
    trackView,
    trackInteraction,
    refreshPreferences: loadPreferences
  };
}

/**
 * Hook for tracking project view with automatic timing
 */
export function useProjectViewTracking(
  projectId: string,
  projectData: {
    title: string;
    description: string;
    category: string;
    location?: { city: string; state: string };
  } | null
) {
  const { user } = useAuth();
  const { trackView } = useBehaviorTracking();
  
  const startTimeRef = useRef<number>(Date.now());
  const scrollDepthRef = useRef<number>(0);
  const clickedCTARef = useRef<boolean>(false);
  const clickedSupportRef = useRef<boolean>(false);
  const clickedShareRef = useRef<boolean>(false);
  const trackedRef = useRef<boolean>(false);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollPercentage = ((scrollTop + windowHeight) / documentHeight) * 100;
      
      scrollDepthRef.current = Math.max(scrollDepthRef.current, Math.min(100, scrollPercentage));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track view on unmount
  useEffect(() => {
    return () => {
      if (trackedRef.current || !user || !projectData || !projectId) return;
      
      const viewDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      // Only track if user stayed for at least 3 seconds
      if (viewDuration >= 3) {
        trackedRef.current = true;
        trackView(projectId, projectData, {
          viewDuration,
          scrollDepth: Math.round(scrollDepthRef.current),
          clickedCTA: clickedCTARef.current,
          clickedSupport: clickedSupportRef.current,
          clickedShare: clickedShareRef.current
        });
      }
    };
  }, [projectId, projectData, user, trackView]);

  const markCTAClicked = useCallback(() => {
    clickedCTARef.current = true;
  }, []);

  const markSupportClicked = useCallback(() => {
    clickedSupportRef.current = true;
  }, []);

  const markShareClicked = useCallback(() => {
    clickedShareRef.current = true;
  }, []);

  return {
    markCTAClicked,
    markSupportClicked,
    markShareClicked
  };
}

/**
 * Hook to get user's viewing history
 */
export function useViewHistory(limitCount = 50) {
  const { user } = useAuth();
  const [views, setViews] = useState<ProjectView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setViews([]);
      setLoading(false);
    }
  }, [user, limitCount]);

  const loadHistory = async () => {
    if (!user) return;
    
    try {
      const history = await getUserViewHistory(user.uid, limitCount);
      setViews(history);
    } catch (error) {
      console.error('Error loading view history:', error);
    } finally {
      setLoading(false);
    }
  };

  return { views, loading, refresh: loadHistory };
}

/**
 * Hook to get user's interaction history
 */
export function useInteractionHistory(limitCount = 50) {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<ProjectInteraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setInteractions([]);
      setLoading(false);
    }
  }, [user, limitCount]);

  const loadHistory = async () => {
    if (!user) return;
    
    try {
      const history = await getUserInteractionHistory(user.uid, limitCount);
      setInteractions(history);
    } catch (error) {
      console.error('Error loading interaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  return { interactions, loading, refresh: loadHistory };
}


