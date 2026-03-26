import { memo, useCallback, useMemo } from 'react';
import { useRecentSupporters, Donation } from '../../hooks/useRecentSupporters';
import { useProjectContext } from '../../hooks/useProjectContext';
import LoadingSpinner from '../common/LoadingSpinner';
import VirtualizedList from '../common/VirtualizedList';
import { Link } from 'react-router-dom';
import { Users, RefreshCw, AlertCircle } from 'lucide-react';

interface RecentSupportersWidgetProps {
    creatorId: string;
    limit?: number;
    onRetry?: () => void;
}

// Memoized supporter item component
const SupporterItem = memo(({
    donation,
    showProjectLabel
}: {
    donation: Donation;
    showProjectLabel: boolean;
}) => {
    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    };

    const formatCurrency = (amount: number) => {
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    // Get initials from name for avatar fallback
    const getInitials = (name: string) => {
        if (!name || name === 'Anonymous') return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const displayName = donation.anonymous ? 'Anonymous Supporter' : donation.userName;

    return (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
            {/* Avatar */}
            <div className="flex-shrink-0">
                {donation.userAvatar && !donation.anonymous ? (
                    <img
                        src={donation.userAvatar}
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
                    />
                ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${donation.anonymous
                            ? 'bg-gray-200 text-gray-500'
                            : 'bg-gradient-to-br from-orange-400 to-red-500 text-white'
                        }`}>
                        {donation.anonymous ? '🕶️' : getInitials(displayName)}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                        {displayName}
                    </p>
                    <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(donation.amount)}
                    </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                    {showProjectLabel && donation.projectTitle ? (
                        <p className="text-xs text-gray-500 truncate">
                            backed <span className="font-medium text-orange-600">{donation.projectTitle}</span>
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500">
                            {donation.anonymous ? 'Anonymous donation' : 'Backed your project'}
                        </p>
                    )}
                    <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatTimeAgo(donation.backedAt)}
                    </span>
                </div>
            </div>
        </div>
    );
});

SupporterItem.displayName = 'SupporterItem';

/**
 * Recent Supporters Widget with Project Context
 * Features:
 * - Memoized items for performance
 * - Virtualization for lists > 15 items
 * - Error retry functionality
 * - Proper handling of anonymous donors
 */
function RecentSupportersWidget({ creatorId, limit = 10, onRetry }: RecentSupportersWidgetProps) {
    const { supporters, loading, error } = useRecentSupporters(creatorId, limit);
    const { selectedProjectId, selectedProject } = useProjectContext();

    // Filter supporters based on selected project
    const filteredSupporters = useMemo(() => {
        if (!selectedProjectId) return supporters;
        return supporters.filter(s => s.projectId === selectedProjectId);
    }, [supporters, selectedProjectId]);

    // Render function for virtualized list
    const renderSupporter = useCallback((donation: Donation) => (
        <SupporterItem
            donation={donation}
            showProjectLabel={!selectedProjectId}
        />
    ), [selectedProjectId]);

    // Key extractor for virtualized list
    const keyExtractor = useCallback((donation: Donation) => donation.id, []);

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

    if (filteredSupporters.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-600">No supporters yet</p>
                <p className="text-sm text-gray-500 mt-1">
                    {selectedProject
                        ? `"${selectedProject.title}" hasn't received any donations yet`
                        : 'Your supporters will appear here when they back your projects'
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

    return (
        <div>
            {/* Virtualized list for performance */}
            <VirtualizedList
                items={filteredSupporters}
                renderItem={renderSupporter}
                keyExtractor={keyExtractor}
                itemHeight={68}
                maxVisibleItems={15}
                expandThreshold={15}
                className="space-y-2"
                emptyState={null}
            />

            {/* View all link */}
            <Link
                to="/dashboard/backers"
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
            >
                View all backers →
            </Link>
        </div>
    );
}

export default memo(RecentSupportersWidget);
