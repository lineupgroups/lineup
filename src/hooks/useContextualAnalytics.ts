import { useMemo } from 'react';
import { useProjectContext } from './useProjectContext';
import { useAnalytics } from './useAnalytics';

/**
 * A contextual hook that returns analytics for the selected project.
 * If a specific project is selected, returns analytics for that project.
 * If "All Projects" is selected, returns analytics for the first active project
 * (aggregated analytics across projects would require a different implementation).
 */
export function useContextualAnalytics(timeRangeDays: number = 30) {
    const { selectedProjectId, selectedProject, projects } = useProjectContext();

    // Determine which project ID to use for analytics
    const analyticsProjectId = useMemo(() => {
        if (selectedProjectId) {
            return selectedProjectId;
        }
        // If no project selected, use first active project
        const firstActive = projects.find(p => p.status === 'active');
        return firstActive?.id || projects[0]?.id || '';
    }, [selectedProjectId, projects]);

    const { analytics, loading, error } = useAnalytics(analyticsProjectId, timeRangeDays);

    const isFiltered = selectedProjectId !== null;

    // Project-specific metrics with sensible defaults
    const metrics = useMemo(() => {
        if (!analytics) {
            return {
                totalViews: 0,
                totalShares: 0,
                totalLikes: 0,
                conversionRate: 0,
                avgTimeOnPage: 0,
                bounceRate: 0
            };
        }

        return {
            totalViews: analytics.totalViews || 0,
            totalShares: analytics.totalShares || 0,
            totalLikes: analytics.totalLikes || 0,
            conversionRate: analytics.conversionRate || 0,
            avgTimeOnPage: analytics.avgTimeOnPage || 0,
            bounceRate: analytics.bounceRate || 0
        };
    }, [analytics]);

    return {
        analytics,
        metrics,
        loading,
        error,
        isFiltered,
        selectedProjectId,
        selectedProject,
        analyticsProjectId
    };
}

export default useContextualAnalytics;
