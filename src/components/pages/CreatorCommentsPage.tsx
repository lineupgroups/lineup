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
import PageTitle from '../common/PageTitle';
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
        <div className="min-h-screen bg-brand-black text-brand-white font-sans py-8">
            {/* Dynamic Page Title */}
            <PageTitle title="Comments" description="Manage dialogues with your supporters" />

            <div className="w-full px-4 sm:px-6 lg:px-8">
                {/* Header - Broadcast/Dialogue Mode Style */}
                <div className="mb-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-4 bg-brand-orange/10 rounded-3xl border border-brand-orange/20 shadow-[0_0_20px_rgba(255,91,0,0.1)]">
                                    <MessageSquare className="w-8 h-8 text-brand-orange" />
                                </div>
                                <span className="px-4 py-1.5 bg-brand-acid/10 text-brand-acid text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-brand-acid/20">
                                    Dialogue Mode
                                </span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-brand-white tracking-tighter italic uppercase leading-none">
                                Comment <span className="text-brand-acid">Inbox</span>
                            </h1>
                            <p className="text-lg sm:text-xl text-neutral-400 font-medium mt-4 max-w-2xl leading-relaxed">
                                {isFilteringByProject
                                    ? <>Managing interaction for <span className="text-brand-white font-black italic">"{selectedProject?.title}"</span></>
                                    : 'Forge deeper connections and build trust through direct supporter interaction.'
                                }
                            </p>
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-brand-white rounded-2xl font-black italic uppercase tracking-wider hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50 group mb-2"
                        >
                            <RefreshCw className={`w-5 h-5 text-brand-acid ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            <span>Refresh Inbox</span>
                        </button>
                    </div>
                </div>
                {/* Stats Card */}
                <CommentsStatsCard stats={currentStats} loading={loading} />

                {/* Filters - Glassmorphism */}
                <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6 mb-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-acid/5 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center relative z-10">
                        {/* Status Tabs */}
                        <div className="flex items-center bg-brand-black/50 border border-white/5 rounded-2xl p-1.5">
                            <button
                                onClick={() => setFilterStatus('all')}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black italic uppercase tracking-widest transition-all ${filterStatus === 'all' ? 'bg-brand-acid text-brand-black shadow-lg' : 'text-neutral-500 hover:text-brand-white'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilterStatus('unreplied')}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black italic uppercase tracking-widest transition-all flex items-center gap-2 ${filterStatus === 'unreplied' ? 'bg-brand-orange text-brand-white shadow-lg' : 'text-neutral-500 hover:text-brand-white'
                                    }`}
                            >
                                <AlertCircle className="w-4 h-4" />
                                Unreplied
                                {currentStats.unreplied > 0 && (
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${filterStatus === 'unreplied' ? 'bg-brand-white text-brand-orange' : 'bg-brand-orange text-brand-white'}`}>
                                        {currentStats.unreplied}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setFilterStatus('replied')}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black italic uppercase tracking-widest transition-all flex items-center gap-2 ${filterStatus === 'replied' ? 'bg-brand-acid text-brand-black shadow-lg' : 'text-neutral-500 hover:text-brand-white'
                                    }`}
                            >
                                <CheckCircle className="w-4 h-4" />
                                Replied
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                            {/* Sort Dropdown */}
                            <div className="relative w-full sm:w-auto">
                                <button
                                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                                    className="w-full sm:w-auto flex items-center justify-between gap-4 px-6 py-3 bg-brand-black/50 border border-white/10 rounded-2xl hover:border-brand-acid transition-all group/sort"
                                >
                                    <div className="flex items-center gap-3">
                                        <ArrowUpDown className="w-4 h-4 text-brand-acid" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-neutral-300">{currentSortLabel}</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showSortDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
                                        <div className="absolute top-full left-0 mt-3 w-48 bg-brand-black border border-white/10 rounded-2xl shadow-2xl z-20 py-2 overflow-hidden">
                                            {sortOptions.map(option => {
                                                const Icon = option.icon;
                                                return (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => { setSortOption(option.value); setShowSortDropdown(false); }}
                                                        className={`w-full text-left px-5 py-3 hover:bg-white/5 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-colors ${sortOption === option.value ? 'text-brand-acid' : 'text-neutral-400'}`}
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

                            {/* Search */}
                            <div className="relative flex-1 w-full lg:min-w-[400px]">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search broadcasts..."
                                    className="w-full pl-14 pr-6 py-3.5 bg-brand-black/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-acid focus:border-brand-acid text-brand-white placeholder-neutral-600 transition-all font-medium"
                                />
                                {searchQuery && debouncedSearchQuery !== searchQuery && (
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                        <LoadingSpinner size="sm" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Results Info */}
                        {filteredComments.length > 0 && (
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 whitespace-nowrap ml-auto">
                                <span className="text-brand-acid">{filteredComments.length}</span> Results
                            </span>
                        )}
                    </div>
                </div>

                {/* Comments List - Full width grid */}
                <div className="space-y-4">
                    {paginatedComments.length === 0 ? (
                        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-20 text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-brand-acid/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            {stats.total === 0 ? (
                                // No comments at all
                                <div className="relative z-10">
                                    <div className="w-24 h-24 bg-brand-acid/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-brand-acid/20">
                                        <MessageSquare className="w-10 h-10 text-brand-acid" />
                                    </div>
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white mb-4">
                                        Inbox <span className="text-brand-acid">Zero</span>
                                    </h3>
                                    <p className="text-lg text-neutral-500 max-w-md mx-auto font-medium mb-8">
                                        Your dialogue hasn't started yet. Share your updates to spark conversations with your circle.
                                    </p>
                                    <Link
                                        to="/dashboard/projects"
                                        className="inline-flex items-center gap-3 px-8 py-4 bg-brand-orange text-brand-white rounded-2xl font-black italic uppercase tracking-widest text-xs hover:bg-orange-600 transition-all shadow-[0_0_20px_rgba(255,91,0,0.2)]"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Expand Outreach
                                    </Link>
                                </div>
                            ) : filterStatus === 'unreplied' && currentStats.unreplied === 0 ? (
                                // All caught up
                                <div className="relative z-10">
                                    <div className="w-24 h-24 bg-brand-acid/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-brand-acid/20 shadow-[0_0_20px_rgba(204,255,0,0.1)]">
                                        <CheckCircle className="w-10 h-10 text-brand-acid" />
                                    </div>
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white mb-4">
                                        Peak <span className="text-brand-acid">Engagement</span>
                                    </h3>
                                    <p className="text-lg text-neutral-500 max-w-md mx-auto font-medium">
                                        You've closed the loop on all supporter dialogues. Your response rate is elite.
                                    </p>
                                </div>
                            ) : (
                                // No results for filter
                                <div className="relative z-10">
                                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                                        <Search className="w-10 h-10 text-neutral-500" />
                                    </div>
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white mb-4">
                                        Search <span className="text-neutral-500">Silent</span>
                                    </h3>
                                    <p className="text-lg text-neutral-500 max-w-md mx-auto font-medium">
                                        {isFilteringByProject
                                            ? `No dialogues matching your search for this project.`
                                            : 'No results found for your current filter parameters.'
                                        }
                                    </p>
                                </div>
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
                                 <div className="text-center pt-8">
                                     <button
                                         onClick={handleLoadMore}
                                         className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black italic uppercase tracking-[0.2em] text-brand-acid hover:bg-brand-acid hover:text-brand-black transition-all active:scale-95 shadow-xl"
                                     >
                                         Sync More Dialogue ({filteredComments.length - displayCount})
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
