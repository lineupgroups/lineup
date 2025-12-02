import { useEffect } from 'react';
import { processScheduledLaunches } from '../lib/scheduledLaunches';

/**
 * Hook to periodically check and process scheduled project launches
 * This runs in the background and automatically launches projects when their time comes
 */
export const useScheduledLaunches = () => {
  useEffect(() => {
    // Process scheduled launches immediately on mount
    processScheduledLaunches();
    
    // Set up interval to check every 5 minutes
    const interval = setInterval(() => {
      processScheduledLaunches();
    }, 5 * 60 * 1000); // 5 minutes
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);
};

export default useScheduledLaunches;

