import React, { useState, useEffect } from 'react';
import { Loader, RefreshCw } from 'lucide-react';
import { getUserActivities, getProjectActivities, ActivityFeedResult } from '../../lib/activityService';
import ActivityItem from './ActivityItem';

interface ActivityFeedProps {
    userId: string;
    mode: 'user' | 'creator';  // 'user' for profile, 'creator' for dashboard
    className?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ userId, mode, className = '' }) => {
    const [feedData, setFeedData] = useState<ActivityFeedResult>({
        activities: [],
        lastDoc: null,
        hasMore: false
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Load initial activities
    useEffect(() => {
        loadActivities(true);
    }, [userId, mode]);

    const loadActivities = async (reset: boolean = false) => {
        if (reset) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const result = mode === 'creator'
                ? await getProjectActivities(userId, 20, reset ? null : feedData.lastDoc)
                : await getUserActivities(userId, 20, reset ? null : feedData.lastDoc);

            if (reset) {
                setFeedData(result);
            } else {
                setFeedData({
                    activities: [...feedData.activities, ...result.activities],
                    lastDoc: result.lastDoc,
                    hasMore: result.hasMore
                });
            }
        } catch (error) {
            console.error('Error loading activities:', error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    const handleRefresh = () => {
        loadActivities(true);
    };

    const handleLoadMore = () => {
        if (feedData.hasMore && !isLoadingMore) {
            loadActivities(false);
        }
    };

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center py-12 ${className}`}>
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (feedData.activities.length === 0) {
        return (
            <div className={`text-center py-12 ${className}`}>
                <div className="text-gray-400 text-5xl mb-3">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {mode === 'creator' ? 'No Activity Yet' : 'No Activity Yet'}
                </h3>
                <p className="text-sm text-gray-600">
                    {mode === 'creator'
                        ? 'Activity from your projects will appear here'
                        : 'Your activity across the platform will appear here'
                    }
                </p>
            </div>
        );
    }

    return (
        <div className={className}>
            {/* Refresh Button */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Recent Activity</h3>
                <button
                    onClick={handleRefresh}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Activity List */}
            <div className="space-y-3">
                {feedData.activities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                ))}
            </div>

            {/* Load More Button */}
            {feedData.hasMore && (
                <div className="mt-4 text-center">
                    <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isLoadingMore ? (
                            <div className="flex items-center gap-2">
                                <Loader className="w-4 h-4 animate-spin" />
                                <span>Loading...</span>
                            </div>
                        ) : (
                            'Load More'
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ActivityFeed;
