/**
 * Hook for accessing personalized recommendations
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getForYouProjects,
  getNearYouProjects,
  getCategoryRecommendations,
  getSimilarProjects,
  getDiscoveryProjects,
  getAlmostFundedProjects,
  getFreshLaunchesProjects,
  getCachedRecommendations,
  cacheRecommendations
} from '../lib/recommendations';
import { FirestoreProject } from '../types/firestore';

export function useRecommendations() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [forYou, setForYou] = useState<Array<FirestoreProject & { score: number; reasons: string[] }>>([]);
  const [nearYou, setNearYou] = useState<FirestoreProject[]>([]);
  const [discovery, setDiscovery] = useState<FirestoreProject[]>([]);
  const [almostFunded, setAlmostFunded] = useState<FirestoreProject[]>([]);
  const [freshLaunches, setFreshLaunches] = useState<FirestoreProject[]>([]);

  useEffect(() => {
    if (user) {
      loadRecommendations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Try to get cached recommendations first
      const cached = await getCachedRecommendations(user.uid);
      
      if (cached) {
        // Use cached data temporarily while fetching fresh data
        // This will be implemented when we have the full system
      }

      // Fetch all recommendations in parallel
      const [
        forYouData,
        nearYouData,
        discoveryData,
        almostFundedData,
        freshLaunchesData
      ] = await Promise.all([
        getForYouProjects(user.uid, 15),
        getNearYouProjects(user.uid, 10),
        getDiscoveryProjects(user.uid, 8),
        getAlmostFundedProjects(user.uid, 6),
        getFreshLaunchesProjects(user.uid, 6)
      ]);

      setForYou(forYouData);
      setNearYou(nearYouData);
      setDiscovery(discoveryData);
      setAlmostFunded(almostFundedData);
      setFreshLaunches(freshLaunchesData);

      // Cache the results
      await cacheRecommendations(user.uid, {
        forYou: forYouData.map(p => p.id),
        nearYou: nearYouData.map(p => p.id),
        discovery: discoveryData.map(p => p.id),
        almostFunded: almostFundedData.map(p => p.id),
        freshLaunches: freshLaunchesData.map(p => p.id)
      });

    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    forYou,
    nearYou,
    discovery,
    almostFunded,
    freshLaunches,
    refresh: loadRecommendations
  };
}

export function useCategoryRecommendations(category: string) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && category) {
      loadProjects();
    }
  }, [user, category]);

  const loadProjects = async () => {
    if (!user) return;

    try {
      const data = await getCategoryRecommendations(user.uid, category, 8);
      setProjects(data);
    } catch (error) {
      console.error('Error loading category recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  return { projects, loading };
}

export function useSimilarProjects(projectId: string) {
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadProjects();
    }
  }, [projectId]);

  const loadProjects = async () => {
    try {
      const data = await getSimilarProjects(projectId, 6);
      setProjects(data);
    } catch (error) {
      console.error('Error loading similar projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return { projects, loading };
}


