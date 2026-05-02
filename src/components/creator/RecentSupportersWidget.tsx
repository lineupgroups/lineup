import { memo, useCallback, useMemo } from 'react';
import { useRecentSupporters, Donation } from '../../hooks/useRecentSupporters';
import { useProjectContext } from '../../hooks/useProjectContext';
import LoadingSpinner from '../common/LoadingSpinner';
import VirtualizedList from '../common/VirtualizedList';
import { Link } from 'react-router-dom';
import { Users, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';

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
        <div className="flex items-center space-x-4 p-4 bg-neutral-900/50 rounded-2xl hover:bg-neutral-900 transition-all duration-300 border border-transparent hover:border-neutral-800 group">
            {/* Avatar */}
            <div className="flex-shrink-0 relative">
                {donation.userAvatar && !donation.anonymous ? (
                    <img
                        src={donation.userAvatar}
                        alt={displayName}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-neutral-800 group-hover:ring-brand-orange transition-all duration-300"
                    />
                ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-extrabold ring-2 ring-neutral-800 group-hover:ring-brand-orange transition-all duration-300 ${donation.anonymous
                            ? 'bg-neutral-800 text-neutral-500'
                            : 'bg-brand-orange text-brand-black'
                        }`}>
                        {donation.anonymous ? '🕶️' : getInitials(displayName)}
                    </div>
                )}
                {/* Status Indicator Dot */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-brand-acid rounded-full border-2 border-[#111]"></div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-base font-bold text-brand-white truncate group-hover:text-brand-orange transition-colors">
                        {displayName}
                    </p>
                    <span className="text-sm font-extrabold text-brand-acid tracking-tight">
                        {formatCurrency(donation.amount)}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-neutral-500">
                            {donation.anonymous ? 'Anonymous donation' : 'Backed your project'}
                        </p>
                    <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest flex-shrink-0">
                        {formatTimeAgo(donation.backedAt)}
                    </span>
                </div>
            </div>
        </div>
    );
});

SupporterItem.displayName = 'SupporterItem';

/**
 * Recent Supporters Widget with Project Context (Dark Brand UI)
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

    if (filteredSupporters.length === 0) {
        return (
            <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4">
                    <Users className="w-7 h-7 text-neutral-500" />
                </div>
                <p className="text-brand-white font-bold text-lg">No supporters yet</p>
                <p className="text-sm text-neutral-400 mt-2 max-w-[250px] mx-auto">
                    Your supporters will appear here when they back your projects
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

    return (
        <div className="flex flex-col h-full">
            {/* Virtualized list for performance */}
            <div className="flex-grow">
                <VirtualizedList
                    items={filteredSupporters}
                    renderItem={renderSupporter}
                    keyExtractor={keyExtractor}
                    itemHeight={80}
                    maxVisibleItems={15}
                    expandThreshold={15}
                    className="space-y-3 pr-2 custom-scrollbar"
                    emptyState={null}
                />
            </div>

            {/* View all link */}
            <div className="mt-6 pt-4 border-t border-neutral-800">
                <Link
                    to="/dashboard/backers"
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-brand-orange hover:text-brand-black hover:bg-brand-orange rounded-xl transition-all duration-300"
                >
                    View all backers
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}

export default memo(RecentSupportersWidget);
