import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, Pin, Trash2, Edit3, AlertCircle, Send, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useComments } from '../../hooks/useComments';
import { convertTimestamp } from '../../lib/firestore';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

interface CommentsSectionProps {
  projectId: string;
  creatorId: string;
}

export default function CommentsSection({ projectId, creatorId }: CommentsSectionProps) {
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
    pinComment
  } = useComments(projectId, user?.uid);

  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const isCreator = user?.uid === creatorId;

  const handleSubmitComment = async (e: React.FormEvent, parentCommentId?: string) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }

    const content = parentCommentId ? newComment : newComment;
    if (!content.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      setIsSubmitting(true);
      await addComment({
        projectId,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userAvatar: user.photoURL || '',
        content: content.trim(),
        isCreatorComment: isCreator,
        parentCommentId
      });
      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editingContent.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      await editComment(commentId, editingContent.trim());
      setEditingCommentId(null);
      setEditingContent('');
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await removeComment(commentId);
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      toast.error('Please sign in to like comments');
      return;
    }

    try {
      await likeComment(commentId, user.uid);
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handlePin = async (commentId: string, isPinned: boolean) => {
    try {
      await pinComment(commentId, !isPinned);
    } catch (error) {
      console.error('Error pinning comment:', error);
    }
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-6 h-6 text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            Comments ({commentCount})
          </h3>
        </div>
      </div>

      {/* Comment Form */}
      {user ? (
        canComment || isCreator ? (
          <form onSubmit={(e) => handleSubmitComment(e)} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-start space-x-3">
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=f97316&color=fff`}
                alt={user.displayName || 'User'}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  disabled={isSubmitting}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-500">
                    {newComment.length}/500 characters
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <LoadingSpinner size="sm" color="text-white" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <Lock className="w-12 h-12 text-amber-600 mx-auto mb-3" />
            <h4 className="text-lg font-semibold text-amber-900 mb-2">
              Supporters Only
            </h4>
            <p className="text-amber-700">
              Only people who have donated to this project can post comments.
            </p>
          </div>
        )
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h4 className="text-lg font-semibold text-blue-900 mb-2">
            Sign In to Comment
          </h4>
          <p className="text-blue-700">
            Please sign in to join the conversation.
          </p>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No comments yet</h4>
          <p className="text-gray-600">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const isOwnComment = user?.uid === comment.userId;
            const isCommentCreator = comment.userId === creatorId;
            const isEditing = editingCommentId === comment.id;
            const isLiked = comment.likedBy?.includes(user?.uid || '');

            return (
              <div
                key={comment.id}
                className={`bg-white rounded-xl p-6 border ${
                  comment.isPinned ? 'border-orange-500 border-2' : 'border-gray-200'
                }`}
              >
                {/* Pinned Badge */}
                {comment.isPinned && (
                  <div className="flex items-center space-x-2 text-orange-600 text-sm font-medium mb-3">
                    <Pin className="w-4 h-4" />
                    <span>Pinned Comment</span>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <img
                    src={comment.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userName)}&background=f97316&color=fff`}
                    alt={comment.userName}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    {/* User Info */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {comment.userName}
                      </span>
                      {isCommentCreator && (
                        <span className="px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-medium rounded-full">
                          Creator
                        </span>
                      )}
                      {comment.isSupporter && !isCommentCreator && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Supporter
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {convertTimestamp(comment.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      {comment.updatedAt && (
                        <span className="text-xs text-gray-400">(edited)</span>
                      )}
                    </div>

                    {/* Comment Content */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditComment(comment.id)}
                            className="px-3 py-1 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingContent('');
                            }}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}

                    {/* Actions */}
                    {!isEditing && (
                      <div className="flex items-center space-x-4 mt-3">
                        <button
                          onClick={() => handleLike(comment.id)}
                          disabled={!user}
                          className={`flex items-center space-x-1 text-sm transition-colors ${
                            isLiked
                              ? 'text-red-600 font-medium'
                              : 'text-gray-600 hover:text-red-600'
                          }`}
                        >
                          <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                          <span>{comment.likes || 0}</span>
                        </button>

                        {isOwnComment && !comment.isDeleted && (
                          <>
                            <button
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditingContent(comment.content);
                              }}
                              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-orange-600 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </>
                        )}

                        {isCreator && !isOwnComment && (
                          <button
                            onClick={() => handlePin(comment.id, comment.isPinned)}
                            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-orange-600 transition-colors"
                          >
                            <Pin className="w-4 h-4" />
                            <span>{comment.isPinned ? 'Unpin' : 'Pin'}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
