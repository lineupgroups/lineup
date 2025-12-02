import { useState, useCallback } from 'react';
import { FirestoreProject } from '../types/firestore';
import { searchProjectsByLocation, getNearbyProjects } from '../lib/search';

export function useLocationSearch() {
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchByLocation = useCallback(async (state?: string, city?: string) => {
    try {
      setLoading(true);
      setError(null);
      const results = await searchProjectsByLocation(state, city);
      setProjects(results);
    } catch (err) {
      console.error('Location search error:', err);
      setError(err instanceof Error ? err.message : 'Location search failed');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchNearby = useCallback(async (userState: string, userCity?: string) => {
    try {
      setLoading(true);
      setError(null);
      const results = await getNearbyProjects(userState, userCity);
      setProjects(results);
    } catch (err) {
      console.error('Nearby search error:', err);
      setError(err instanceof Error ? err.message : 'Nearby search failed');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    projects,
    loading,
    error,
    searchByLocation,
    searchNearby,
  };
}





