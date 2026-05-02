import { useState, useEffect, useMemo } from 'react';
import {
    MessageSquare, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp,
    Heart, Edit3, MoreVertical, Trash2, SortAsc, Send, Zap, MessageCircle
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

        if (diffMins < 1) return 'NOW';
        if (diffMins < 60) return `${diffMins}M`;
        if (diffHours < 24) return `${diffHours}H`;
        if (diffDays < 7) return `${diffDays}D`;
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }).toUpperCase();
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
        <div className="flex gap-4 mt-6 bg-white/[0.02] border border-white/5 p-4 rounded-[1.5rem]">
            <img
                src={(user as any)?.profileImage || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=f97316&color=fff`}
                alt=""
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-white/10"
            />
            <div className="flex-1">
                <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="INITIATE REPLY..."
                    className="w-full px-0 py-2 border-b border-white/10 focus:border-brand-acid text-xs font-bold focus:outline-none bg-transparent transition-colors text-brand-white placeholder-neutral-600"
                    autoFocus
                />
                <div className="flex justify-end gap-3 mt-4">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2 text-[9px] font-black italic uppercase tracking-widest text-neutral-500 hover:text-brand-white transition-colors"
                    >
                        ABORT
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={isSubmitting || !replyContent.trim()}
                        className="px-6 py-2 text-[9px] font-black italic uppercase tracking-widest text-brand-black bg-brand-acid hover:bg-[#b3e600] rounded-xl transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? 'ENCRYPTING...' : 'DISPATCH'}
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

    // Sort comments
    const sortedComments = useMemo(() => {
        const sorted = [...topLevelComments];
        switch (sortOrder) {
            case 'oldest':
                return sorted.sort((a, b) => convertTimestamp(a.createdAt).getTime() - convertTimestamp(b.createdAt).getTime());
            case 'popular':
                return sorted.sort((a, b) => ((b.likes || 0) + (getReplies(b.id).length * 2)) - ((a.likes || 0) + (getReplies(a.id).length * 2)));
            case 'newest':
            default:
                return sorted.sort((a, b) => convertTimestamp(b.createdAt).getTime() - convertTimestamp(a.createdAt).getTime());
        }
    }, [topLevelComments, sortOrder, getReplies]);

    // Refresh interval
    useEffect(() => {
        if (!isExpanded) return;
        const interval = setInterval(() => refetch(), 60000);
        return () => clearInterval(interval);
    }, [isExpanded, refetch]);

    const toggleRepliesVisibility = (commentId: string) => {
        setExpandedReplies(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) newSet.delete(commentId);
            else newSet.add(commentId);
            return newSet;
        });
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newComment.trim()) return;
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
            setExpandedReplies(prev => new Set(prev).add(parentId));
        } catch (error) {
            console.error('Error posting reply:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openReplyForm = (parentId: string, mentionUser?: string) => {
        setReplyingToParentId(parentId);
        setReplyContent(mentionUser ? `@${mentionUser.replace(/\s+/g, '')} ` : '');
        setExpandedReplies(prev => new Set(prev).add(parentId));
    };

    const handleSaveEdit = async (commentId: string) => {
        if (!editContent.trim()) return;
        try {
            await updateComment(commentId, editContent.trim());
            setEditingCommentId(null);
            setEditContent('');
        } catch (error) { console.error('Error saving edit:', error); }
    };

    const displayCommentCount = (comments.length > 0 || loading) ? comments.length : initialCommentCount;

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
            toast.success('Comment terminated');
        } catch (error) {
            console.error('Failed to delete:', error);
            toast.error('Termination failed');
        } finally {
            setIsDeleting(false);
        }
    };

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
            <div key={comment.id} className={`${isReply ? 'ml-12 md:ml-16' : ''}`}>
                <div className="flex gap-4 py-6 group">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        {comment.userAvatar ? (
                            <img src={comment.userAvatar} alt="" className={`${isReply ? 'w-8 h-8' : 'w-12 h-12'} rounded-full object-cover ring-2 ring-white/10`} />
                        ) : (
                            <div className={`${isReply ? 'w-8 h-8' : 'w-12 h-12'} bg-white/5 border border-white/10 rounded-full flex items-center justify-center`}>
                                <span className={`${isReply ? 'text-[10px]' : 'text-xs'} font-black text-neutral-400`}>{comment.userName.charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                        {comment.isCreatorComment && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-acid rounded-full border-2 border-[#111] flex items-center justify-center"><Zap className="w-2 h-2 text-brand-black" /></div>}
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Meta */}
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className={`font-black italic uppercase tracking-tight ${isReply ? 'text-xs' : 'text-sm'} text-brand-white`}>
                                @{comment.userName.replace(/\s+/g, '').toUpperCase()}
                            </span>
                            {comment.isCreatorComment && (
                                <span className="px-2 py-0.5 bg-brand-acid/10 text-brand-acid text-[8px] font-black uppercase tracking-widest rounded-md border border-brand-acid/20">
                                    CORE TEAM
                                </span>
                            )}
                            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                                {formatTimeAgo(comment.createdAt)}
                            </span>
                        </div>

                        {/* Content */}
                        {isEditing ? (
                            <div className="mt-4 bg-white/5 p-4 rounded-2xl border border-brand-acid/20">
                                <input
                                    type="text"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full px-0 py-1 border-b border-brand-acid text-sm focus:outline-none bg-transparent text-brand-white"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-3 mt-4">
                                    <button onClick={() => setEditingCommentId(null)} className="px-4 py-1.5 text-[9px] font-black italic uppercase text-neutral-500">ABORT</button>
                                    <button onClick={() => handleSaveEdit(comment.id)} className="px-4 py-1.5 text-[9px] font-black italic uppercase text-brand-black bg-brand-acid rounded-lg">COMMIT</button>
                                </div>
                            </div>
                        ) : (
                            <p className={`${isReply ? 'text-xs' : 'text-sm'} text-neutral-400 font-medium leading-relaxed`}>
                                {comment.content}
                            </p>
                        )}

                        {/* Actions */}
                        {!isEditing && (
                            <div className="flex items-center gap-6 mt-4">
                                <button
                                    onClick={() => likeComment(comment.id, user?.uid || '')}
                                    className={`flex items-center gap-2 group/like transition-all ${isLiked ? 'text-brand-acid' : 'text-neutral-500 hover:text-brand-white'}`}
                                >
                                    <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''} group-hover/like:scale-110`} />
                                    <span className="text-[10px] font-black">{comment.likes || 0}</span>
                                </button>

                                {user && (
                                    <button
                                        onClick={() => openReplyForm(isReply && parentId ? parentId : comment.id, isReply ? comment.userName : undefined)}
                                        className="text-[10px] font-black italic uppercase tracking-widest text-neutral-500 hover:text-brand-acid transition-colors"
                                    >
                                        REPLY
                                    </button>
                                )}

                                {isCreator && !comment.isCreatorComment && (
                                    <button
                                        onClick={() => toggleHeart(comment.id, !hasHeart, comment.userId, user?.displayName || 'Creator')}
                                        className={`flex items-center gap-2 transition-all ${hasHeart ? 'text-brand-orange' : 'text-neutral-500 hover:text-brand-orange'}`}
                                    >
                                        <Heart className={`w-3.5 h-3.5 ${hasHeart ? 'fill-current' : ''}`} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Replies Toggle */}
                        {!isReply && replies.length > 0 && (
                            <button
                                onClick={() => toggleRepliesVisibility(comment.id)}
                                className="flex items-center gap-3 mt-6 text-[9px] font-black italic uppercase tracking-[0.2em] text-brand-acid group/replies"
                            >
                                <div className="h-px w-8 bg-brand-acid/20 group-hover/replies:w-12 transition-all"></div>
                                {isRepliesExpanded ? `CLOSE ${replies.length} DEBATES` : `VIEW ${replies.length} DEBATES`}
                                {isRepliesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                        )}
                    </div>

                    {/* Menu */}
                    {(isOwn || isCreator) && !isEditing && (
                        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(isMenuOpen ? null : comment.id); }} className="p-2 hover:bg-white/5 rounded-xl">
                                <MoreVertical className="w-4 h-4 text-neutral-500" />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 top-10 w-44 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl py-2 z-20 overflow-hidden">
                                    {isOwn && (
                                        <button onClick={() => { setEditingCommentId(comment.id); setEditContent(comment.content); setMenuOpenId(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black italic uppercase text-neutral-300 hover:bg-brand-acid hover:text-brand-black">
                                            <Edit3 className="w-3.5 h-3.5" /> MODULATE
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(comment.id)} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black italic uppercase text-red-500 hover:bg-red-500 hover:text-white">
                                        <Trash2 className="w-3.5 h-3.5" /> TERMINATE
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Replies Thread */}
                {!isReply && isRepliesExpanded && replies.length > 0 && (
                    <div className="border-l border-white/5 ml-6 pl-4 space-y-2">
                        {replies.map(reply => renderComment(reply, true, comment.id))}
                    </div>
                )}

                {/* Reply Input */}
                {!isReply && replyingToParentId === comment.id && (
                    <div className="ml-12 md:ml-16 pb-6">
                        <ReplyForm
                            user={user}
                            replyContent={replyContent}
                            setReplyContent={setReplyContent}
                            onSubmit={() => handleSubmitReply(comment.id)}
                            onCancel={() => { setReplyingToParentId(null); setReplyContent(''); }}
                            isSubmitting={isSubmitting}
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="relative px-10 pt-10 pb-4">
            {/* Toggle Comments Trigger - FIXED POSITIONING */}
            <div className={isExpanded ? "mb-10" : "mb-6"}>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`
                        flex items-center gap-4 px-8 py-4 rounded-[1.5rem] border transition-all duration-500 group/trigger
                        ${isExpanded 
                            ? 'bg-brand-acid text-brand-black border-brand-acid shadow-[0_0_30px_rgba(204,255,0,0.2)]' 
                            : 'bg-white/5 border-white/10 text-neutral-300 hover:border-brand-acid/40 hover:text-brand-acid'}
                    `}
                >
                    <MessageCircle className={`w-5 h-5 ${isExpanded ? 'text-brand-black' : 'text-brand-acid'}`} />
                    <span className="text-[11px] font-black italic uppercase tracking-[0.2em]">
                        {displayCommentCount === 0 ? 'NO DEBATE INITIALIZED' : `${displayCommentCount} ACTIVE DEBATES`}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 group-hover/trigger:translate-y-1 transition-transform" />}
                </button>
            </div>

            {/* Content Area */}
            {isExpanded && (
                <div className={`mt-8 animate-in fade-in slide-in-from-top-4 duration-500`}>
                    {/* Primary Input */}
                    {user ? (
                        <div className="flex gap-6 mb-12 bg-white/[0.02] border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group/input">
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-acid/5 rounded-full blur-3xl group-hover/input:bg-brand-acid/10 transition-colors"></div>
                            
                            <img
                                src={(user as any).profileImage || user.photoURL || ''}
                                alt=""
                                className="w-14 h-14 rounded-full object-cover ring-2 ring-brand-acid/20 flex-shrink-0"
                            />
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onFocus={() => setIsFocused(true)}
                                    placeholder="INITIATE BROADCAST TO THE CORE..."
                                    className="w-full px-0 py-4 border-b border-white/10 focus:border-brand-acid text-sm font-bold focus:outline-none bg-transparent transition-all text-brand-white placeholder-neutral-600"
                                    disabled={isSubmitting}
                                />
                                {(isFocused || newComment) && (
                                    <div className="flex justify-end gap-6 mt-8 animate-in fade-in zoom-in-95">
                                        <button
                                            onClick={() => { setNewComment(''); setIsFocused(false); }}
                                            className="text-[10px] font-black italic uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
                                        >
                                            ABORT BROADCAST
                                        </button>
                                        <button
                                            onClick={handleSubmitComment}
                                            disabled={isSubmitting || !newComment.trim()}
                                            className="px-10 py-3.5 text-[10px] font-black italic uppercase tracking-widest text-brand-black bg-brand-acid hover:bg-[#b3e600] rounded-2xl transition-all shadow-xl hover:shadow-brand-acid/20 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'ENCRYPTING...' : 'DISPATCH'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] text-center mb-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">SIGN IN TO ACCESS CORE DEBATE PROTOCOLS</p>
                        </div>
                    )}

                    {/* Stats & Sort */}
                    {topLevelComments.length > 0 && (
                        <div className="flex items-center justify-between mb-10 px-4">
                            <div className="flex items-center gap-3">
                                <div className="h-px w-10 bg-brand-acid"></div>
                                <span className="text-[11px] font-black italic uppercase tracking-[0.2em] text-brand-white">DISPATCH LOG</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <SortAsc className="w-4 h-4 text-brand-acid" />
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'popular')}
                                    className="bg-transparent text-[10px] font-black uppercase tracking-widest text-neutral-400 focus:text-brand-white outline-none cursor-pointer"
                                >
                                    <option value="newest" className="bg-[#0A0A0A]">NEWEST FIRST</option>
                                    <option value="oldest" className="bg-[#0A0A0A]">OLDEST FIRST</option>
                                    <option value="popular" className="bg-[#0A0A0A]">POPULARITY</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Stream */}
                    {loading ? (
                        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                    ) : topLevelComments.length === 0 ? (
                        <div className="text-center py-24 bg-white/[0.01] border border-white/5 rounded-[3rem]">
                            <MessageCircle className="w-12 h-12 text-neutral-800 mx-auto mb-6" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-600">NO ACTIVE DEBATE PROTOCOLS FOUND</p>
                        </div>
                    ) : (
                        <div className="space-y-6 px-2">
                            {sortedComments.map((comment) => renderComment(comment))}
                        </div>
                    )}
                </div>
            )}

            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => { setDeleteModalOpen(false); setPendingDeleteId(null); }}
                onConfirm={handleConfirmDelete}
                title="TERMINATE DEBATE"
                message="ARE YOU SURE YOU WANT TO PERMANENTLY TERMINATE THIS COMMENT PROTOCOL?"
                confirmText="TERMINATE"
                cancelText="ABORT"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
