import { useState, useEffect } from 'react';
import { FirestoreProject } from '../types/firestore';
import { getProjects } from '../lib/firestore';
import toast from 'react-hot-toast';

export const useTrendingProjects = () => {
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrendingProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all active projects
      const allProjects = await getProjects();
      
      // Filter only active projects
      const activeProjects = allProjects.filter(project => project.status === 'active');
      
      // Calculate trending score for each project
      const projectsWithTrendingScore = activeProjects.map(project => {
        // Trending algorithm:
        // - Recent likes (weight: 3)
        // - Recent supporters (weight: 2) 
        // - Funding progress (weight: 1)
        // - Recency bonus for projects created in last 30 days (weight: 1)
        
        const likes = project.likeCount || 0;
        const supporters = project.supporters || 0;
        const goal = project.goal || project.fundingGoal || 0;
        const fundingProgress = goal > 0 ? ((project.raised || 0) / goal) * 100 : 0;
        
        // Recency bonus - projects created in last 30 days get bonus
        let daysSinceCreated = 999; // Default to old
        try {
          let createdDate: Date;
          if (project.createdAt && typeof project.createdAt.toDate === 'function') {
            createdDate = project.createdAt.toDate();
          } else if (project.createdAt instanceof Date) {
            createdDate = project.createdAt;
          } else if (typeof project.createdAt === 'number') {
            createdDate = new Date(project.createdAt);
          } else {
            createdDate = new Date(); // Fallback to now
          }
          daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        } catch (error) {
          console.error('Error parsing createdAt date:', error);
        }
        const recencyBonus = daysSinceCreated <= 30 ? 50 : 0;
        
        const trendingScore = (likes * 3) + (supporters * 2) + fundingProgress + recencyBonus;
        
        return {
          ...project,
          trendingScore
        };
      });
      
      // Sort by trending score and take top projects
      const sortedProjects = projectsWithTrendingScore
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, 12); // Get top 12 trending projects
      
      setProjects(sortedProjects);
    } catch (err) {
      console.error('Error fetching trending projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trending projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    refetch: fetchTrendingProjects
  };
};
