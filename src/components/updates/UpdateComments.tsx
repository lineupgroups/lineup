import { useState, useEffect, useMemo } from 'react';
import {
    MessageSquare, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp,
    Heart, Edit3, MoreVertical, Trash2, SortAsc
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUpdateComments } from '../../hooks/useUpdateComments';
import { convertTimestamp } from '../../lib/firestore';
import { FirestoreUpdateComment } from '../../types/firestore';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmModal from '../common/ConfirmModal';
import toast from 'react-hot-toast';

interface UpdateCommentsProps {
    updateId: string;
    projectId: string;
    creatorId: string;
    initialCommentCount: number;
    creatorAvatar?: string;
    isCreatorView?: boolean;
    showBorder?: boolean;
    projectTitle?: string;
    updateTitle?: string;
}

// Helper function for time ago format
const formatTimeAgo = (timestamp: any) => {
    try {
        const date = convertTimestamp(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
        if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
        return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
    } catch {
        return '';
    }
};

// Reply form component
interface ReplyFormProps {
    user: any;
    replyContent: string;
    setReplyContent: (content: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

function ReplyForm({ user, replyContent, setReplyContent, onSubmit, onCancel, isSubmitting }: ReplyFormProps) {
    return (
        <div className="flex gap-3 mt-3">
            <img
                src={(user as any)?.profileImage || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=f97316&color=fff`}
                alt=""
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1">
                <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Add a reply..."
                    className="w-full px-0 py-1 border-b border-white/10 focus:border-brand-acid text-sm focus:outline-none bg-transparent transition-colors text-brand-white"
                    autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                    <button
                        onClick={onCancel}
                        className="px-3 py-1.5 text-sm font-medium text-neutral-400 hover:bg-white/5 rounded-full transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={isSubmitting || !replyContent.trim()}
                        className="px-4 py-1.5 text-sm font-black italic uppercase tracking-wider text-brand-black bg-brand-acid hover:bg-[#b3e600] rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Posting...' : 'Reply'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function UpdateComments({
    updateId,
    projectId,
    creatorId,
    initialCommentCount,
    creatorAvatar,
    isCreatorView = false,
    showBorder = true,
    projectTitle,
    updateTitle
}: UpdateCommentsProps) {
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(isCreatorView);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [heartingCommentId, setHeartingCommentId] = useState<string | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [replyingToParentId, setReplyingToParentId] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Delete confirmation modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Comment sorting
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'popular'>('newest');

    const {
        comments,
        topLevelComments,
        getReplies,
        loading,
        addComment,
        updateComment,
        likeComment,
        removeComment,
        toggleHeart,
        refetch
    } = useUpdateComments(updateId, projectId, {
        creatorId,
        creatorName: user?.displayName || 'Creator',
        projectTitle,
        updateTitle
    });

    const isCreator = user?.uid === creatorId;

    // Sort comments based on selected order
    const sortedComments = useMemo(() => {
        const sorted = [...topLevelComments];
        switch (sortOrder) {
            case 'oldest':
                return sorted.sort((a, b) =>
                    convertTimestamp(a.createdAt).getTime() - convertTimestamp(b.createdAt).getTime()
                );
            case 'popular':
                return sorted.sort((a, b) =>
                    ((b.likes || 0) + (getReplies(b.id).length * 2)) -
                    ((a.likes || 0) + (getReplies(a.id).length * 2))
                );
            case 'newest':
            default:
                return sorted.sort((a, b) =>
                    convertTimestamp(b.createdAt).getTime() - convertTimestamp(a.createdAt).getTime()
                );
        }
    }, [topLevelComments, sortOrder, getReplies]);

    // Auto-refresh every 30 seconds when expanded
    useEffect(() => {
        if (!isExpanded) return;
        const interval = setInterval(() => {
            refetch();
        }, 30000);
        return () => clearInterval(interval);
    }, [isExpanded, refetch]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setMenuOpenId(null);
        if (menuOpenId) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [menuOpenId]);

    const toggleRepliesVisibility = (commentId: string) => {
        setExpandedReplies(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error('Please sign in to comment');
            return;
        }
        if (!newComment.trim()) return;

        try {
            setIsSubmitting(true);
            await addComment({
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userAvatar: (user as any).profileImage || user.photoURL || '',
                content: newComment.trim(),
                isCreatorComment: isCreator
            });
            setNewComment('');
            setIsFocused(false);
        } catch (error) {
            console.error('Error posting comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitReply = async (parentId: string) => {
        if (!user || !replyContent.trim()) return;

        try {
            setIsSubmitting(true);
            await addComment({
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userAvatar: (user as any).profileImage || user.photoURL || '',
                content: replyContent.trim(),
                isCreatorComment: isCreator,
                parentCommentId: parentId
            });
            setReplyContent('');
            setReplyingToParentId(null);
            // Auto-expand replies for this comment
            setExpandedReplies(prev => new Set(prev).add(parentId));
        } catch (error) {
            console.error('Error posting reply:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openReplyForm = (parentId: string, mentionUser?: string) => {
        setReplyingToParentId(parentId);
        if (mentionUser) {
            setReplyContent(`@${mentionUser.replace(/\s+/g, '')} `);
        } else {
            setReplyContent('');
        }
        // Auto-expand replies when opening reply form
        setExpandedReplies(prev => new Set(prev).add(parentId));
    };

    const handleStartEdit = (comment: FirestoreUpdateComment) => {
        setEditingCommentId(comment.id);
        setEditContent(comment.content);
        setMenuOpenId(null);
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditContent('');
    };

    const handleSaveEdit = async (commentId: string) => {
        if (!editContent.trim()) return;
        try {
            await updateComment(commentId, editContent.trim());
            setEditingCommentId(null);
            setEditContent('');
        } catch (error) {
            console.error('Error saving edit:', error);
        }
    };

    const handleLike = async (commentId: string) => {
        if (!user) {
            toast.error('Please sign in to like comments');
            return;
        }
        await likeComment(commentId, user.uid);
    };

    const handleDelete = (commentId: string) => {
        setMenuOpenId(null);
        setPendingDeleteId(commentId);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!pendingDeleteId) return;
        try {
            setIsDeleting(true);
            await removeComment(pendingDeleteId);
            setDeleteModalOpen(false);
            setPendingDeleteId(null);
        } catch (error) {
            console.error('Failed to delete:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleHeart = async (comment: FirestoreUpdateComment) => {
        if (!isCreator) return;
        const hasHeart = comment.creatorHeart || false;

        try {
            setHeartingCommentId(comment.id);
            await toggleHeart(
                comment.id,
                !hasHeart,
                comment.userId,
                user?.displayName || 'Creator'
            );
        } catch (error) {
            console.error('Error toggling heart:', error);
        } finally {
            setHeartingCommentId(null);
        }
    };

    const displayCommentCount = comments.length > 0 ? comments.length : initialCommentCount;

    // Render a single comment
    const renderComment = (comment: FirestoreUpdateComment, isReply = false, parentId?: string) => {
        const isOwn = user?.uid === comment.userId;
        const isLiked = comment.likedBy?.includes(user?.uid || '');
        const hasHeart = comment.creatorHeart || false;
        const isHearting = heartingCommentId === comment.id;
        const isEditing = editingCommentId === comment.id;
        const isMenuOpen = menuOpenId === comment.id;
        const replies = getReplies(comment.id);
        const isRepliesExpanded = expandedReplies.has(comment.id);

        return (
            <div key={comment.id} className={`${isReply ? 'ml-12' : ''}`}>
                <div className="flex gap-3 py-2 group">
                    {/* Avatar */}
                    {comment.userAvatar ? (
                        <img
                            src={comment.userAvatar}
                            alt={comment.userName}
                            className={`${isReply ? 'w-6 h-6' : 'w-10 h-10'} rounded-full object-cover flex-shrink-0`}
                        />
                    ) : (
                        <div className={`${isReply ? 'w-6 h-6' : 'w-10 h-10'} bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center flex-shrink-0`}>
                            <span className={`${isReply ? 'text-xs' : 'text-sm'} font-medium text-white`}>
                                {comment.userName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        {/* Username & Time */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium ${isReply ? 'text-xs' : 'text-sm'} text-brand-white`}>
                                @{comment.userName.replace(/\s+/g, '')}
                            </span>
                            {comment.isCreatorComment && (
                                <span className="px-2 py-0.5 bg-brand-acid text-brand-black text-[10px] font-black uppercase tracking-wider rounded-full">
                                    Creator
                                </span>
                            )}
                            <span className="text-xs text-neutral-500">
                                {formatTimeAgo(comment.createdAt)}
                            </span>
                            {comment.isEdited && (
                                <span className="text-xs text-gray-400">(edited)</span>
                            )}

                            {/* Creator Heart Badge */}
                            {hasHeart && creatorAvatar && (
                                <div className="flex items-center gap-1 ml-1" title="Loved by creator">
                                    <div className="relative">
                                        <img
                                            src={creatorAvatar}
                                            alt="Creator"
                                            className="w-4 h-4 rounded-full object-cover border border-white"
                                        />
                                        <Heart className="w-2 h-2 text-red-500 fill-red-500 absolute -bottom-0.5 -right-0.5" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Content or Edit Form */}
                        {isEditing ? (
                            <div className="mt-2">
                                <input
                                    type="text"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full px-0 py-1 border-b-2 border-brand-acid text-sm focus:outline-none bg-transparent text-brand-white"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        onClick={handleCancelEdit}
                                        className="px-3 py-1.5 text-sm font-medium text-neutral-400 hover:bg-white/5 rounded-full transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleSaveEdit(comment.id)}
                                        disabled={!editContent.trim()}
                                        className="px-4 py-1.5 text-sm font-black italic uppercase tracking-wider text-brand-black bg-brand-acid hover:bg-[#b3e600] rounded-full transition-all disabled:opacity-50"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className={`${isReply ? 'text-xs' : 'text-sm'} text-neutral-300 mt-1 whitespace-pre-wrap`}>
                                {comment.content}
                            </p>
                        )}

                        {/* Actions Row */}
                        {!isEditing && (
                            <div className="flex items-center gap-1 mt-2">
                                {/* Like Button */}
                                <button
                                    onClick={() => handleLike(comment.id)}
                                    disabled={!user}
                                    className={`flex items-center gap-1 p-1.5 rounded-full hover:bg-white/10 transition-colors ${isLiked ? 'text-brand-acid' : 'text-neutral-500'
                                        }`}
                                >
                                    <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                                </button>
                                {comment.likes > 0 && (
                                    <span className="text-xs text-neutral-500 mr-1">{comment.likes}</span>
                                )}

                                {/* Dislike Button (visual only) */}
                                <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-neutral-500">
                                    <ThumbsDown className="w-4 h-4" />
                                </button>

                                {/* Reply Button */}
                                {user && (
                                    <button
                                        onClick={() => {
                                            if (isReply && parentId) {
                                                // Reply to a reply - open form in parent with @mention
                                                openReplyForm(parentId, comment.userName);
                                            } else {
                                                // Reply to top-level comment
                                                openReplyForm(comment.id);
                                            }
                                        }}
                                        className="px-3 py-1.5 text-xs font-black italic uppercase tracking-wider text-neutral-400 hover:text-brand-acid hover:bg-brand-acid/10 rounded-full transition-all ml-2"
                                    >
                                        Reply
                                    </button>
                                )}

                                {/* Heart Button (Creator only, not on own comments) */}
                                {isCreator && !comment.isCreatorComment && (
                                    <button
                                        onClick={() => handleHeart(comment)}
                                        disabled={isHearting}
                                        className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ml-1 ${hasHeart ? 'text-brand-orange' : 'text-neutral-500'
                                            }`}
                                        title={hasHeart ? 'Remove heart' : 'Give heart'}
                                    >
                                        {isHearting ? (
                                            <LoadingSpinner size="sm" />
                                        ) : (
                                            <Heart className={`w-4 h-4 ${hasHeart ? 'fill-current' : ''}`} />
                                        )}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Show/Hide Replies Toggle */}
                        {!isReply && replies.length > 0 && (
                            <button
                                onClick={() => toggleRepliesVisibility(comment.id)}
                                className="flex items-center gap-1 mt-2 px-3 py-1.5 text-xs font-black italic uppercase tracking-wider text-brand-acid hover:bg-brand-acid/10 rounded-full transition-all"
                            >
                                {isRepliesExpanded ? (
                                    <>
                                        <ChevronUp className="w-4 h-4" />
                                        Hide {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4" />
                                        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Three-dot Menu */}
                    {(isOwn || isCreator) && !isEditing && (
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpenId(isMenuOpen ? null : comment.id);
                                }}
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 top-8 w-36 bg-[#111] rounded-2xl shadow-2xl border border-white/10 py-1 z-20">
                                    {isOwn && (
                                        <button
                                            onClick={() => handleStartEdit(comment)}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Edit
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-brand-orange hover:bg-brand-orange/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Render Replies */}
                {!isReply && isRepliesExpanded && replies.length > 0 && (
                    <div className="border-l-2 border-gray-100 ml-5">
                        {replies.map(reply => renderComment(reply, true, comment.id))}
                    </div>
                )}

                {/* Reply Form - shown inside the thread */}
                {!isReply && replyingToParentId === comment.id && (
                    <div className={`${replies.length > 0 && isRepliesExpanded ? 'ml-12' : 'border-l-2 border-gray-100 ml-5 pl-7'} pb-2`}>
                        <ReplyForm
                            user={user}
                            replyContent={replyContent}
                            setReplyContent={setReplyContent}
                            onSubmit={() => handleSubmitReply(comment.id)}
                            onCancel={() => {
                                setReplyingToParentId(null);
                                setReplyContent('');
                            }}
                            isSubmitting={isSubmitting}
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`${showBorder ? 'mt-4 pt-4 border-t border-gray-200' : ''}`}>
            {/* Toggle Comments Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm font-black italic uppercase tracking-wider text-neutral-300 hover:text-brand-acid transition-colors"
            >
                <MessageSquare className="w-5 h-5 text-brand-acid" />
                <span>
                    {displayCommentCount === 0
                        ? 'Comments'
                        : `${displayCommentCount.toLocaleString()} ${displayCommentCount === 1 ? 'Comment' : 'Comments'}`
                    }
                </span>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Expanded Comments Section */}
            {isExpanded && (
                <div className={`mt-6 ${isCreatorView ? 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 -mx-2' : ''}`}>
                    {/* Comment Input - YouTube style */}
                    {user ? (
                        <div className="flex gap-4 mb-8">
                            <img
                                src={(user as any).profileImage || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=f97316&color=fff`}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-white/10"
                            />
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onFocus={() => setIsFocused(true)}
                                    placeholder="Add a comment..."
                                    className="w-full px-0 py-2 border-b border-white/10 focus:border-brand-acid text-sm focus:outline-none bg-transparent transition-colors text-brand-white placeholder-neutral-600"
                                    disabled={isSubmitting}
                                />
                                {(isFocused || newComment) && (
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button
                                            onClick={() => {
                                                setNewComment('');
                                                setIsFocused(false);
                                            }}
                                            className="px-5 py-2 text-sm font-medium text-neutral-400 hover:bg-white/5 rounded-full transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmitComment}
                                            disabled={isSubmitting || !newComment.trim()}
                                            className="px-6 py-2 text-sm font-black italic uppercase tracking-wider text-brand-black bg-brand-acid hover:bg-[#b3e600] rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(204,255,0,0.2)]"
                                        >
                                            {isSubmitting ? 'Posting...' : 'Comment'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-500 mb-4 ml-1">Sign in to comment</p>
                    )}

                    {/* Comments List */}
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <LoadingSpinner size="md" />
                        </div>
                    ) : topLevelComments.length === 0 ? (
                        <div className="text-center py-8">
                            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No comments yet</p>
                            <p className="text-xs text-gray-400 mt-1">Be the first to comment!</p>
                        </div>
                    ) : (
                        <>
                            {/* Sort Controls */}
                            {topLevelComments.length > 3 && (
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                                    <span className="text-sm font-black italic uppercase tracking-wider text-neutral-500">
                                        {topLevelComments.length} {topLevelComments.length === 1 ? 'comment' : 'comments'}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <SortAsc className="w-4 h-4 text-brand-acid" />
                                        <select
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'popular')}
                                            className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-acid focus:border-brand-acid bg-neutral-900 text-brand-white"
                                        >
                                            <option value="newest">Newest First</option>
                                            <option value="oldest">Oldest First</option>
                                            <option value="popular">Most Popular</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-4">
                                {sortedComments.map((comment) => renderComment(comment))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Delete Comment Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setPendingDeleteId(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Delete Comment"
                message="Are you sure you want to delete this comment? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
