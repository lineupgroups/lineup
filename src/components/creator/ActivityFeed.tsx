import { memo, useCallback, useMemo } from 'react';
import { Users, MessageSquare, Heart, Calendar, Edit3, Trophy, DollarSign, Rocket, RefreshCw, AlertCircle } from 'lucide-react';
import { useRecentActivity, Activity } from '../../hooks/useRecentActivity';
import { useProjectContext } from '../../hooks/useProjectContext';
import LoadingSpinner from '../common/LoadingSpinner';
import VirtualizedList from '../common/VirtualizedList';
import { Link } from 'react-router-dom';

interface ActivityFeedProps {
    creatorId: string;
    limit?: number;
    onRetry?: () => void;
}

// Memoized activity item component
const ActivityItem = memo(({
    activity,
    showProjectLabel
}: {
    activity: Activity;
    showProjectLabel: boolean;
}) => {
    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'pledge':
            case 'donation':
                return { Icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100', emoji: '💰' };
            case 'anonymous_pledge':
                return { Icon: Users, color: 'text-gray-600', bg: 'bg-gray-100', emoji: '🕶️' };
            case 'comment':
                return { Icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100', emoji: '💬' };
            case 'like':
                return { Icon: Heart, color: 'text-red-600', bg: 'bg-red-100', emoji: '❤️' };
            case 'milestone':
                return { Icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-100', emoji: '🎉' };
            case 'update':
                return { Icon: Edit3, color: 'text-orange-600', bg: 'bg-orange-100', emoji: '✏️' };
            case 'project_approved':
                return { Icon: Rocket, color: 'text-green-600', bg: 'bg-green-100', emoji: '✅' };
            case 'project_rejected':
                return { Icon: Rocket, color: 'text-red-600', bg: 'bg-red-100', emoji: '❌' };
            case 'payout':
                return { Icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100', emoji: '💳' };
            case 'follower':
                return { Icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', emoji: '👤' };
            default:
                return { Icon: Calendar, color: 'text-gray-600', bg: 'bg-gray-100', emoji: '📋' };
        }
    };

    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    };

    // SECURITY FIX: Sanitize description to remove user IDs
    const sanitizeDescription = (description: string) => {
        // Remove any potential user ID patterns (UUID-like or Firebase ID patterns)
        return description
            .replace(/\b[a-zA-Z0-9]{20,}\b/g, '') // Remove long alphanumeric strings
            .replace(/\s{2,}/g, ' ') // Clean up multiple spaces
            .trim();
    };

    const { Icon, color, bg, emoji } = getActivityIcon(activity.type);

    return (
        <div
            className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
        >
            <div className={`p-2 ${bg} rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium">
                    <span className="mr-1">{emoji}</span>
                    {activity.title}
                </p>
                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                    {sanitizeDescription(activity.description)}
                </p>
                {showProjectLabel && activity.projectTitle && (
                    <p className="text-xs text-gray-500 mt-1">
                        on <span className="font-medium text-orange-600">{activity.projectTitle}</span>
                    </p>
                )}
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">
                {formatTimeAgo(activity.createdAt)}
            </span>
        </div>
    );
});

ActivityItem.displayName = 'ActivityItem';

/**
 * Activity Feed with Project Context
 * Features:
 * - Memoized items for performance
 * - Virtualization for lists > 15 items
 * - Error retry functionality
 * - User ID sanitization for security
 */
function ActivityFeed({ creatorId, limit = 10, onRetry }: ActivityFeedProps) {
    const { activities, loading, error } = useRecentActivity(creatorId, limit);
    const { selectedProjectId, selectedProject } = useProjectContext();

    // Filter activities based on selected project
    const filteredActivities = useMemo(() => {
        if (!selectedProjectId) return activities;
        return activities.filter(a => a.projectId === selectedProjectId);
    }, [activities, selectedProjectId]);

    // Render function for virtualized list
    const renderActivity = useCallback((activity: Activity) => (
        <ActivityItem
            activity={activity}
            showProjectLabel={!selectedProjectId && !!activity.projectTitle}
        />
    ), [selectedProjectId]);

    // Key extractor for virtualized list
    const keyExtractor = useCallback((activity: Activity) => activity.id, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-red-600 mb-3">{error}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                )}
            </div>
        );
    }

    if (filteredActivities.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📭</div>
                <p className="text-gray-600">No activity yet</p>
                <p className="text-sm text-gray-500 mt-1">
                    {selectedProject
                        ? `No activity for "${selectedProject.title}" yet`
                        : 'Create your first project to start seeing activity here!'
                    }
                </p>
                {!selectedProject && (
                    <Link
                        to="/dashboard/projects/create"
                        className="inline-block mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                    >
                        Create Project →
                    </Link>
                )}
            </div>
        );
    }

    // Use virtualization for large lists
    return (
        <VirtualizedList
            items={filteredActivities}
            renderItem={renderActivity}
            keyExtractor={keyExtractor}
            itemHeight={76}
            maxVisibleItems={15}
            expandThreshold={15}
            className="space-y-2"
            emptyState={null}
        />
    );
}

export default memo(ActivityFeed);
