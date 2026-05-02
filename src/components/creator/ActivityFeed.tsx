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
                return { Icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20', emoji: '💰' };
            case 'anonymous_pledge':
                return { Icon: Users, color: 'text-neutral-400', bg: 'bg-neutral-800 border border-neutral-700', emoji: '🕶️' };
            case 'comment':
                return { Icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10 border border-blue-500/20', emoji: '💬' };
            case 'like':
                return { Icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10 border border-pink-500/20', emoji: '❤️' };
            case 'milestone':
                return { Icon: Trophy, color: 'text-brand-acid', bg: 'bg-brand-acid/10 border border-brand-acid/20', emoji: '🎉' };
            case 'update':
                return { Icon: Edit3, color: 'text-brand-orange', bg: 'bg-brand-orange/10 border border-brand-orange/20', emoji: '✏️' };
            case 'project_approved':
                return { Icon: Rocket, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20', emoji: '✅' };
            case 'project_rejected':
                return { Icon: Rocket, color: 'text-red-400', bg: 'bg-red-500/10 border border-red-500/20', emoji: '❌' };
            case 'payout':
                return { Icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20', emoji: '💳' };
            case 'follower':
                return { Icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/10 border border-sky-500/20', emoji: '👤' };
            default:
                return { Icon: Calendar, color: 'text-neutral-400', bg: 'bg-neutral-800 border border-neutral-700', emoji: '📋' };
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
            className="flex items-start space-x-4 p-4 bg-neutral-900/50 rounded-2xl hover:bg-neutral-900 transition-all duration-300 cursor-pointer border border-transparent hover:border-neutral-800 group"
        >
            <div className={`p-2.5 ${bg} rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm`}>
                <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-brand-white font-bold tracking-wide">
                    <span className="mr-2 text-base">{emoji}</span>
                    {activity.title}
                </p>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2 font-medium">
                    {sanitizeDescription(activity.description)}
                </p>

            </div>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex-shrink-0 bg-neutral-900 px-2 py-1 rounded-md border border-neutral-800 group-hover:bg-[#111]">
                {formatTimeAgo(activity.createdAt)}
            </span>
        </div>
    );
});

ActivityItem.displayName = 'ActivityItem';

/**
 * Activity Feed with Project Context (Dark Brand UI)
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
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-red-400 font-bold mb-4">{error}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-red-500 text-brand-black rounded-xl text-sm font-bold hover:bg-red-400 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)]"
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
            <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 text-2xl">
                    📭
                </div>
                <p className="text-brand-white font-bold text-lg">No activity yet</p>
                <p className="text-sm text-neutral-400 mt-2 max-w-[250px] mx-auto">
                    Activity for your projects will appear here.
                </p>
                {!selectedProject && (
                    <Link
                        to="/dashboard/projects/create"
                        className="inline-block mt-6 px-6 py-2.5 bg-brand-acid text-brand-black rounded-xl text-sm font-bold hover:bg-[#b3e600] transition-colors shadow-[0_0_15px_rgba(204,255,0,0.2)]"
                    >
                        Create Project →
                    </Link>
                )}
            </div>
        );
    }

    // Use virtualization for large lists
    return (
        <div className="h-full w-full">
            <VirtualizedList
                items={filteredActivities}
                renderItem={renderActivity}
                keyExtractor={keyExtractor}
                itemHeight={88}
                maxVisibleItems={15}
                expandThreshold={15}
                className="space-y-3 pr-2 custom-scrollbar"
                emptyState={null}
            />
        </div>
    );
}

export default memo(ActivityFeed);
