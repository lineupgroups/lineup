import React, { useState, useEffect } from 'react';
import {
  MessageSquare, ThumbsUp, ThumbsDown, Pin, Trash2, Edit3, AlertCircle,
  Lock, ChevronDown, ChevronUp, Heart, MoreVertical
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useComments } from '../../hooks/useComments';
import { convertTimestamp } from '../../lib/firestore';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

interface CommentsSectionProps {
  projectId: string;
  creatorId: string;
  creatorAvatar?: string;
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
    <div className="flex gap-3 mt-3 mb-2">
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
          className="w-full px-0 py-1 border-b border-gray-300 focus:border-gray-900 text-sm focus:outline-none bg-transparent transition-colors"
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting || !replyContent.trim()}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Posting...' : 'Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Single Comment Component
interface CommentItemProps {
  comment: any;
  creatorId: string;
  creatorAvatar?: string;
  user: any;
  isCreator: boolean;
  canComment: boolean;
  onOpenReply: (parentId: string, mentionUser?: string) => void;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onLike: (commentId: string) => Promise<void>;
  onPin: (commentId: string, isPinned: boolean) => Promise<void>;
  onHeart?: (commentId: string, hasHeart: boolean) => Promise<void>;
  isReply?: boolean;
  parentId?: string;
}

function CommentItem({
  comment,
  creatorId,
  creatorAvatar,
  user,
  isCreator,
  canComment,
  onOpenReply,
  onEdit,
  onDelete,
  onLike,
  onPin,
  onHeart,
  isReply = false,
  parentId
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwnComment = user?.uid === comment.userId;
  const isCommentCreator = comment.userId === creatorId;
  const isLiked = comment.likedBy?.includes(user?.uid || '');
  const hasHeart = comment.creatorHeart || false;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setMenuOpen(false);
    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuOpen]);

  const handleSubmitEdit = async () => {
    if (!editContent.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    try {
      await onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  const handleDelete = () => {
    setMenuOpen(false);
    if (window.confirm('Delete this comment?')) {
      onDelete(comment.id);
    }
  };

  const handlePin = () => {
    setMenuOpen(false);
    onPin(comment.id, !comment.isPinned);
  };

  const handleHeart = async () => {
    if (onHeart) {
      await onHeart(comment.id, hasHeart);
    }
  };

  const handleReplyClick = () => {
    if (isReply && parentId) {
      // Reply to a reply - opens form in parent with @mention
      onOpenReply(parentId, comment.userName);
    } else {
      // Reply to top-level comment
      onOpenReply(comment.id);
    }
  };

  return (
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
          <span className={`font-medium ${isReply ? 'text-xs' : 'text-sm'} text-gray-900`}>
            @{comment.userName.replace(/\s+/g, '')}
          </span>
          {isCommentCreator && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
              Creator
            </span>
          )}
          {comment.isSupporter && !isCommentCreator && (
            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
              Supporter
            </span>
          )}
          <span className="text-xs text-gray-500">
            {formatTimeAgo(comment.createdAt)}
          </span>
          {comment.updatedAt && (
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
              className="w-full px-0 py-1 border-b-2 border-blue-500 text-sm focus:outline-none bg-transparent"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEdit}
                disabled={!editContent.trim()}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className={`${isReply ? 'text-xs' : 'text-sm'} text-gray-800 mt-1 whitespace-pre-wrap`}>
            {comment.content}
          </p>
        )}

        {/* Actions Row */}
        {!isEditing && (
          <div className="flex items-center gap-1 mt-2">
            {/* Like Button */}
            <button
              onClick={() => onLike(comment.id)}
              disabled={!user}
              className={`flex items-center gap-1 p-1.5 rounded-full hover:bg-gray-100 transition-colors ${isLiked ? 'text-blue-600' : 'text-gray-600'
                }`}
            >
              <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            {(comment.likes || 0) > 0 && (
              <span className="text-xs text-gray-600 mr-1">{comment.likes}</span>
            )}

            {/* Dislike Button (visual only) */}
            <button className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
              <ThumbsDown className="w-4 h-4" />
            </button>

            {/* Reply Button */}
            {user && (canComment || isCreator) && (
              <button
                onClick={handleReplyClick}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-full transition-colors ml-2"
              >
                Reply
              </button>
            )}

            {/* Heart Button (Creator only, not on own comments) */}
            {isCreator && !isCommentCreator && onHeart && (
              <button
                onClick={handleHeart}
                className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ml-1 ${hasHeart ? 'text-red-500' : 'text-gray-600'
                  }`}
                title={hasHeart ? 'Remove heart' : 'Give heart'}
              >
                <Heart className={`w-4 h-4 ${hasHeart ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Three-dot Menu */}
      {(isOwnComment || isCreator) && !isEditing && (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              {isOwnComment && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setIsEditing(true);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
              )}
              {isCreator && !isOwnComment && !isReply && (
                <button
                  onClick={handlePin}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Pin className="w-4 h-4" />
                  {comment.isPinned ? 'Unpin' : 'Pin'}
                </button>
              )}
              {(isOwnComment || isCreator) && (
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CommentsSection({ projectId, creatorId, creatorAvatar }: CommentsSectionProps) {
  const { user } = useAuth();
  const {
    comments,
    loading,
    commentCount,
    canComment,
    addComment,
    editComment,
    removeComment,
    likeComment,
    pinComment,
    heartComment
  } = useComments(projectId, user?.uid);

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Single reply state - only ONE reply form open at a time
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const isCreator = user?.uid === creatorId;

  // Separate top-level comments and replies
  const topLevelComments = comments.filter(c => !c.parentCommentId);
  const getReplies = (parentId: string) =>
    comments.filter(c => c.parentCommentId === parentId);

  // Sort: pinned first, then by date
  const sortedComments = [...topLevelComments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const handleOpenReply = (parentId: string, mentionUser?: string) => {
    setReplyingToId(parentId);
    setReplyContent(mentionUser ? `@${mentionUser.replace(/\s+/g, '')} ` : '');
    // Auto-expand replies when opening reply form
    setExpandedReplies(prev => new Set(prev).add(parentId));
  };

  const handleCancelReply = () => {
    setReplyingToId(null);
    setReplyContent('');
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
        projectId,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userAvatar: (user as any).profileImage || user.photoURL || '',
        content: newComment.trim(),
        isCreatorComment: isCreator,
        isSupporter: canComment
      });
      setNewComment('');
      setIsFocused(false);
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!user || !replyContent.trim() || !replyingToId) return;

    try {
      setIsSubmitting(true);
      await addComment({
        projectId,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userAvatar: (user as any).profileImage || user.photoURL || '',
        content: replyContent.trim(),
        isCreatorComment: isCreator,
        parentCommentId: replyingToId,
        isSupporter: canComment
      });
      setReplyContent('');
      setReplyingToId(null);
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      toast.error('Please sign in to like comments');
      return;
    }
    await likeComment(commentId, user.uid);
  };

  const handlePin = async (commentId: string, isPinned: boolean) => {
    await pinComment(commentId, isPinned);
  };

  const handleHeart = async (commentId: string, hasHeart: boolean) => {
    if (heartComment) {
      await heartComment(commentId, !hasHeart);
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
        // Close reply form if collapsing
        if (replyingToId === commentId) {
          setReplyingToId(null);
          setReplyContent('');
        }
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-gray-900">
          {commentCount === 0
            ? 'Comments'
            : `${commentCount.toLocaleString()} ${commentCount === 1 ? 'Comment' : 'Comments'}`
          }
        </h3>
      </div>

      {/* Comment Form */}
      {user ? (
        canComment || isCreator ? (
          <div className="flex gap-3">
            <img
              src={(user as any).profileImage || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=f97316&color=fff`}
              alt=""
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onFocus={() => setIsFocused(true)}
                placeholder="Add a comment..."
                className="w-full px-0 py-2 border-b border-gray-300 focus:border-gray-900 text-sm focus:outline-none bg-transparent transition-colors"
                disabled={isSubmitting}
              />
              {(isFocused || newComment) && (
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => {
                      setNewComment('');
                      setIsFocused(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitComment}
                    disabled={isSubmitting || !newComment.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Posting...' : 'Comment'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <Lock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-amber-900 mb-1">
              Supporters Only
            </h4>
            <p className="text-sm text-amber-700">
              Only people who have donated to this project can post comments.
            </p>
          </div>
        )
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-gray-900 mb-1">
            Sign In to Comment
          </h4>
          <p className="text-sm text-gray-600">
            Please sign in to join the conversation.
          </p>
        </div>
      )}

      {/* Comments List */}
      {sortedComments.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-gray-900 mb-1">No comments yet</h4>
          <p className="text-sm text-gray-500">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {sortedComments.map((comment) => {
            const replies = getReplies(comment.id);
            const isExpanded = expandedReplies.has(comment.id);
            const isReplyingHere = replyingToId === comment.id;

            return (
              <div key={comment.id}>
                {/* Pinned Badge */}
                {comment.isPinned && (
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1 ml-12 pt-2">
                    <Pin className="w-3 h-3" />
                    <span>Pinned by creator</span>
                  </div>
                )}

                <CommentItem
                  comment={comment}
                  creatorId={creatorId}
                  creatorAvatar={creatorAvatar}
                  user={user}
                  isCreator={isCreator}
                  canComment={canComment}
                  onOpenReply={handleOpenReply}
                  onEdit={editComment}
                  onDelete={removeComment}
                  onLike={handleLike}
                  onPin={handlePin}
                  onHeart={handleHeart}
                />

                {/* Show/Hide Replies Toggle */}
                {replies.length > 0 && (
                  <button
                    onClick={() => toggleReplies(comment.id)}
                    className="flex items-center gap-1 ml-12 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    {isExpanded ? (
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

                {/* Replies and Reply Form */}
                {(isExpanded || isReplyingHere) && (
                  <div className="border-l-2 border-gray-100 ml-5 pl-7">
                    {/* Replies */}
                    {isExpanded && replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        creatorId={creatorId}
                        creatorAvatar={creatorAvatar}
                        user={user}
                        isCreator={isCreator}
                        canComment={canComment}
                        onOpenReply={handleOpenReply}
                        onEdit={editComment}
                        onDelete={removeComment}
                        onLike={handleLike}
                        onPin={handlePin}
                        onHeart={handleHeart}
                        isReply={true}
                        parentId={comment.id}
                      />
                    ))}

                    {/* Reply Form */}
                    {isReplyingHere && (
                      <ReplyForm
                        user={user}
                        replyContent={replyContent}
                        setReplyContent={setReplyContent}
                        onSubmit={handleSubmitReply}
                        onCancel={handleCancelReply}
                        isSubmitting={isSubmitting}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
