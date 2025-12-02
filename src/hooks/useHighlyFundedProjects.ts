import { useState, useEffect } from 'react';
import { FirestoreProject } from '../types/firestore';
import { getProjects } from '../lib/firestore';

export const useHighlyFundedProjects = () => {
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHighlyFundedProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allProjects = await getProjects();
      const activeProjects = allProjects.filter(project => project.status === 'active');
      
      // Sort by funding percentage
      const sortedProjects = activeProjects
        .sort((a, b) => {
          const aPercentage = (a.raised / a.goal) * 100;
          const bPercentage = (b.raised / b.goal) * 100;
          return bPercentage - aPercentage;
        })
        .slice(0, 6);
      
      setProjects(sortedProjects);
    } catch (err) {
      console.error('Error fetching highly funded projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch highly funded projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHighlyFundedProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    refetch: fetchHighlyFundedProjects
  };
};
