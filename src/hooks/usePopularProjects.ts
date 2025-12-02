import { useState, useEffect } from 'react';
import { FirestoreProject } from '../types/firestore';
import { getProjects } from '../lib/firestore';

export const usePopularProjects = () => {
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPopularProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allProjects = await getProjects();
      const activeProjects = allProjects.filter(project => project.status === 'active');
      
      // Sort by popularity: supporters + likes
      const sortedProjects = activeProjects
        .sort((a, b) => {
          const aPopularity = (a.supporters || 0) + (a.likeCount || 0);
          const bPopularity = (b.supporters || 0) + (b.likeCount || 0);
          return bPopularity - aPopularity;
        })
        .slice(0, 8);
      
      setProjects(sortedProjects);
    } catch (err) {
      console.error('Error fetching popular projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch popular projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopularProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    refetch: fetchPopularProjects
  };
};
