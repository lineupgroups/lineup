import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    MessageSquare,
    RefreshCw,
    Search,
    ChevronDown,
    CheckCircle,
    AlertCircle,
    ExternalLink,
    ArrowUpDown,
    Clock,
    ThumbsUp,
    TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectContext } from '../../hooks/useProjectContext';
import { useCreatorComments } from '../../hooks/useCreatorComments';
import CommentsStatsCard from '../creator/CommentsStatsCard';
import CommentCard from '../creator/CommentCard';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

type FilterStatus = 'all' | 'unreplied' | 'replied';
type SortOption = 'newest' | 'oldest' | 'most_liked';

// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function CreatorCommentsPage() {
    const { user } = useAuth();
    const { selectedProjectId, selectedProject } = useProjectContext();
    const { comments, stats, loading, refetch } = useCreatorComments(user?.uid || '');

    // Filter state
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('newest');
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    // Pagination state
    const [displayCount, setDisplayCount] = useState(10);
    const LOAD_MORE_COUNT = 10;

    // Debounced search query
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // Is filtering by project (from navbar project selector)
    const isFilteringByProject = selectedProject !== null;

    // Sort options
    const sortOptions: { value: SortOption; label: string; icon: React.ElementType }[] = [
        { value: 'newest', label: 'Newest First', icon: Clock },
        { value: 'oldest', label: 'Oldest First', icon: TrendingUp },
        { value: 'most_liked', label: 'Most Liked', icon: ThumbsUp }
    ];

    // Filtered and sorted comments
    const filteredComments = useMemo(() => {
        let result = [...comments];

        // Filter by project (from navbar project selector)
        if (selectedProjectId) {
            result = result.filter(c => c.projectId === selectedProjectId);
        }

        // Filter by status
        if (filterStatus === 'unreplied') {
            result = result.filter(c => !c.hasCreatorReply);
        } else if (filterStatus === 'replied') {
            result = result.filter(c => c.hasCreatorReply);
        }

        // Filter by search (debounced)
        if (debouncedSearchQuery.trim()) {
            const query = debouncedSearchQuery.toLowerCase();
            result = result.filter(c =>
                c.content.toLowerCase().includes(query) ||
                c.userName.toLowerCase().includes(query) ||
                c.projectTitle?.toLowerCase().includes(query)
            );
        }

        // Sort
        result.sort((a, b) => {
            if (sortOption === 'newest') {
                const aTime = a.createdAt?.toDate?.().getTime() || 0;
                const bTime = b.createdAt?.toDate?.().getTime() || 0;
                return bTime - aTime;
            } else if (sortOption === 'oldest') {
                const aTime = a.createdAt?.toDate?.().getTime() || 0;
                const bTime = b.createdAt?.toDate?.().getTime() || 0;
                return aTime - bTime;
            } else if (sortOption === 'most_liked') {
                return (b.likes || 0) - (a.likes || 0);
            }
            return 0;
        });

        return result;
    }, [comments, selectedProjectId, filterStatus, debouncedSearchQuery, sortOption]);

    // Paginated comments
    const paginatedComments = useMemo(() => {
        return filteredComments.slice(0, displayCount);
    }, [filteredComments, displayCount]);

    // Reset display count when filters change
    useEffect(() => {
        setDisplayCount(10);
    }, [selectedProjectId, filterStatus, debouncedSearchQuery, sortOption]);

    // Handle reply submission
    const handleReply = useCallback(async (commentId: string, replyText: string) => {
        if (!replyText.trim() || !user) return;

        try {
            const { createComment } = await import('../../lib/comments');
            const comment = comments.find(c => c.id === commentId);

            if (!comment) return;

            await createComment({
                projectId: comment.projectId,
                userId: user.uid,
                userName: user.displayName || 'Creator',
                userAvatar: user.photoURL || '',
                content: replyText.trim(),
                parentCommentId: commentId,
                isCreatorComment: true,
                isSupporter: false
            });

            toast.success('Reply sent!');
            refetch();
        } catch (err) {
            console.error('Error sending reply:', err);
            toast.error('Failed to send reply');
            throw err;
        }
    }, [user, comments, refetch]);

    // Handle pin comment
    const handlePin = useCallback(async (commentId: string) => {
        try {
            const { toggleCommentPin } = await import('../../lib/comments');
            const comment = comments.find(c => c.id === commentId);
            if (!comment) return;

            await toggleCommentPin(commentId, !comment.isPinned);
            toast.success(comment.isPinned ? 'Comment unpinned!' : 'Comment pinned!');
            refetch();
        } catch (err) {
            console.error('Error pinning comment:', err);
            toast.error('Failed to pin comment');
        }
    }, [comments, refetch]);

    // Handle like comment
    const handleLike = useCallback(async (commentId: string) => {
        if (!user) return;
        try {
            const { toggleCommentLike } = await import('../../lib/comments');
            await toggleCommentLike(commentId, user.uid);
            refetch();
        } catch (err) {
            console.error('Error liking comment:', err);
            toast.error('Failed to like comment');
        }
    }, [user, refetch]);

    // Handle creator heart (like YouTube's feature)
    const handleHeart = useCallback(async (commentId: string, giveHeart: boolean) => {
        try {
            const { toggleCreatorHeart } = await import('../../lib/comments');
            await toggleCreatorHeart(commentId, giveHeart);
            toast.success(giveHeart ? '❤️ Heart given!' : 'Heart removed');
            refetch();
        } catch (err) {
            console.error('Error toggling heart:', err);
            toast.error('Failed to toggle heart');
        }
    }, [refetch]);

    // Handle refresh
    const handleRefresh = () => {
        refetch();
        toast.success('Comments refreshed!');
    };

    // Handle load more
    const handleLoadMore = () => {
        setDisplayCount(prev => prev + LOAD_MORE_COUNT);
    };

    // Get current sort label
    const currentSortLabel = sortOptions.find(s => s.value === sortOption)?.label || 'Sort';

    // Calculate stats for current filter
    const currentStats = useMemo(() => {
        if (!selectedProjectId) return stats;

        // Recalculate stats for selected project only
        const projectComments = comments.filter(c => c.projectId === selectedProjectId);
        const unreplied = projectComments.filter(c => !c.hasCreatorReply).length;
        const replied = projectComments.filter(c => c.hasCreatorReply).length;

        return {
            total: projectComments.length,
            unreplied,
            replied,
            thisWeek: stats.thisWeek, // Keep overall for now
            avgResponseTimeHours: stats.avgResponseTimeHours
        };
    }, [stats, comments, selectedProjectId]);

    if (loading && comments.length === 0) {
        return (
            <div className="min-h-screen bg-brand-black text-brand-white font-sans py-6 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-center py-20">
                    <LoadingSpinner size="lg" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-black text-brand-white font-sans text-brand-white font-sans">
            {/* Header - Full width like Dashboard */}
            <div className="bg-[#111] border-b border-neutral-800">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-brand-white flex items-center gap-3">
                                <MessageSquare className="w-8 h-8 text-orange-500" />
                                Comment Inbox
                            </h1>
                            <p className="text-neutral-400 mt-1">
                                {isFilteringByProject
                                    ? `Showing comments for: ${selectedProject?.title}`
                                    : 'Manage and respond to supporter comments across all projects'
                                }
                            </p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-neutral-700 rounded-2xl hover:bg-brand-black transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content - Full width */}
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
                {/* Stats Card */}
                <CommentsStatsCard stats={currentStats} loading={loading} />

                {/* Filters - Full width */}
                <div className="bg-[#111] rounded-3xl border border-neutral-800 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        {/* Status Tabs */}
                        <div className="flex items-center bg-neutral-900 rounded-2xl p-1">
                            <button
                                onClick={() => setFilterStatus('all')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterStatus === 'all' ? 'bg-[#111] text-brand-white shadow-sm' : 'text-neutral-400 hover:text-brand-white'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilterStatus('unreplied')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${filterStatus === 'unreplied' ? 'bg-[#111] text-red-400 shadow-sm' : 'text-neutral-400 hover:text-brand-white'
                                    }`}
                            >
                                <AlertCircle className="w-3.5 h-3.5" />
                                Unreplied
                                {currentStats.unreplied > 0 && (
                                    <span className="bg-red-100 text-red-400 text-xs font-bold px-1.5 py-0.5 rounded-full">
                                        {currentStats.unreplied}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setFilterStatus('replied')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${filterStatus === 'replied' ? 'bg-[#111] text-green-400 shadow-sm' : 'text-neutral-400 hover:text-brand-white'
                                    }`}
                            >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Replied
                            </button>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSortDropdown(!showSortDropdown)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-brand-black border border-neutral-800 rounded-2xl hover:bg-neutral-900 transition-colors"
                            >
                                <ArrowUpDown className="w-4 h-4 text-neutral-500" />
                                <span className="text-neutral-300">{currentSortLabel}</span>
                                <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showSortDropdown && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
                                    <div className="absolute top-full left-0 mt-2 bg-[#111] border border-neutral-800 rounded-2xl shadow-lg z-20 min-w-[150px]">
                                        {sortOptions.map(option => {
                                            const Icon = option.icon;
                                            return (
                                                <button
                                                    key={option.value}
                                                    onClick={() => { setSortOption(option.value); setShowSortDropdown(false); }}
                                                    className={`w-full text-left px-4 py-2 hover:bg-brand-black flex items-center gap-2 ${sortOption === option.value ? 'bg-brand-orange/10 text-brand-orange' : ''}`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Search - Grows to fill space */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search comments..."
                                className="w-full pl-10 pr-4 py-2.5 border border-neutral-800 rounded-2xl focus:ring-2 focus:ring-brand-acid focus:border-brand-acid"
                            />
                            {searchQuery && debouncedSearchQuery !== searchQuery && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <LoadingSpinner size="sm" />
                                </div>
                            )}
                        </div>

                        {/* Results Info */}
                        {filteredComments.length > 0 && (
                            <span className="text-sm text-neutral-500 whitespace-nowrap">
                                {filteredComments.length} {filteredComments.length === 1 ? 'comment' : 'comments'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Comments List - Full width grid */}
                <div className="space-y-4">
                    {paginatedComments.length === 0 ? (
                        <div className="bg-[#111] rounded-3xl border border-neutral-800 p-12 text-center">
                            {stats.total === 0 ? (
                                // No comments at all
                                <>
                                    <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MessageSquare className="w-8 h-8 text-neutral-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-brand-white mb-2">No Comments Yet</h3>
                                    <p className="text-neutral-400 mb-4">
                                        Comments from your supporters will appear here.<br />
                                        Share your project to get more engagement!
                                    </p>
                                    <Link
                                        to="/dashboard/projects"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange/100 text-white rounded-2xl hover:bg-[#b3e600] transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        View Projects
                                    </Link>
                                </>
                            ) : filterStatus === 'unreplied' && currentStats.unreplied === 0 ? (
                                // All caught up
                                <>
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-brand-white mb-2">All Caught Up! 🎉</h3>
                                    <p className="text-neutral-400">
                                        You've replied to all comments. Great engagement!
                                    </p>
                                </>
                            ) : (
                                // No results for filter
                                <>
                                    <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-neutral-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-brand-white mb-2">No Comments Found</h3>
                                    <p className="text-neutral-400">
                                        {isFilteringByProject
                                            ? `No comments match your search for "${selectedProject?.title}".`
                                            : 'Try adjusting your filters or search query.'
                                        }
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Two column grid on larger screens */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {paginatedComments.map(comment => (
                                    <CommentCard
                                        key={comment.id}
                                        comment={comment}
                                        onReply={handleReply}
                                        onPin={handlePin}
                                        onLike={handleLike}
                                        onHeart={handleHeart}
                                    />
                                ))}
                            </div>

                            {/* Load More Button */}
                            {displayCount < filteredComments.length && (
                                <div className="text-center pt-4">
                                    <button
                                        onClick={handleLoadMore}
                                        className="px-6 py-3 bg-[#111] border border-neutral-700 rounded-2xl text-neutral-300 font-medium hover:bg-brand-black transition-colors"
                                    >
                                        Load More ({filteredComments.length - displayCount} remaining)
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
