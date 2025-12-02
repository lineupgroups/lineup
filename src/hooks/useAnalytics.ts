import { useState, useEffect, useCallback } from 'react';
import {
  getProjectAnalytics,
  getAggregatedAnalytics,
  getGeographicBreakdown
} from '../lib/analytics';
import { FirestoreProjectAnalytics } from '../types/firestore';

export const useAnalytics = (projectId: string, days: number = 30) => {
  const [analytics, setAnalytics] = useState<{
    totalViews: number;
    totalUniqueVisitors: number;
    totalSupporters: number;
    totalAmountRaised: number;
    totalShares: number;
    totalLikes: number;
    totalFollows: number;
    totalComments: number;
    cityBreakdown: { [city: string]: number };
    stateBreakdown: { [state: string]: number };
    deviceBreakdown: { mobile: number; desktop: number; tablet: number };
    dailyData: FirestoreProjectAnalytics[];
  } | null>(null);
  
  const [geographicData, setGeographicData] = useState<{
    cities: { name: string; count: number; percentage: number }[];
    states: { name: string; count: number; percentage: number }[];
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [aggregated, geographic] = await Promise.all([
        getAggregatedAnalytics(projectId, days),
        getGeographicBreakdown(projectId)
      ]);
      
      setAnalytics(aggregated);
      setGeographicData(geographic);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [projectId, days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    geographicData,
    loading,
    error,
    refetch: fetchAnalytics
  };
};
